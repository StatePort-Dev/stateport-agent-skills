import { readFile, writeFile, rename, rm, mkdir, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { bytes, directory, safePath, withInstallTransaction } from './install.mjs';

const loader = `// StatePort loader contract 1. Repair explicitly through the official bootstrap.
(async () => {
  const { join } = require('node:path');
  const { pathToFileURL } = require('node:url');
  const { readCurrent, bytes } = await import('./lib/install.mjs');
  const cache = join(__dirname, '..');
  const runtime = await readCurrent(cache);
  if (!runtime) throw Error('RUNTIME_NOT_INSTALLED');
  if (!runtime.generation || runtime.generation.launcher !== 1) throw Error('LAUNCHER_REPAIR_REQUIRED');
  const trust = JSON.parse((await bytes(join(__dirname, 'release.json'), 65536)).toString('utf8'));
  const { launchSession } = await import(pathToFileURL(join(runtime.runtimeRoot, 'distribution', 'session.mjs')).href);
  await launchSession({ cache, runtime, trust, args: process.argv.slice(2) });
})().catch(() => { process.stderr.write('STATEPORT_LAUNCHER_UNAVAILABLE\\n'); process.exitCode = 1; });
`;
/** Install once from trusted bootstrap bytes. Future generation updates never
 * rewrite this loader/npm cache; changed loader/key requires explicit repair. */
export async function ensureLauncher(cache, trust, { repair = false } = {}) {
  return withInstallTransaction(cache, async () => {
    const target = join(cache, 'launcher'); await safePath(target);
    const expected = new Map([['main.cjs', Buffer.from(loader)], ['release.json', Buffer.from(JSON.stringify(trust) + '\n')]]);
    for (const name of ['install.mjs', 'archive.mjs']) expected.set(`lib/${name}`, await readFile(new URL(name, import.meta.url)));
    try {
      for (const [name, value] of expected) if (!(await bytes(join(target, name), value.length)).equals(value)) throw Error('LAUNCHER_REPAIR_REQUIRED');
      return join(target, 'main.cjs');
    } catch (error) { if (!repair && error?.code !== 'ENOENT') throw Error('LAUNCHER_REPAIR_REQUIRED'); }
    // A partially existing/foreign loader is a conflict, not a repair request.
    let backup;
    try {
      const existing = await lstat(target);
      if (!repair || !existing.isDirectory() || existing.isSymbolicLink()) throw Error('LAUNCHER_REPAIR_REQUIRED');
      backup = join(cache, `.launcher-backup-${randomBytes(16).toString('hex')}`);
    } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    const stage = join(cache, `.launcher-${randomBytes(16).toString('hex')}`); await directory(stage);
    try {
      for (const [name, value] of expected) {
        const path = join(stage, name); await mkdir(join(path, '..'), { recursive: true, mode: 0o700 });
        await writeFile(path, value, { mode: 0o600, flag: 'wx', flush: true });
      }
      await safePath(target);
      if (backup) await rename(target, backup);
      await rename(stage, target);
    } catch (error) {
      if (backup) {
        try { await lstat(target); } catch (missing) { if (missing?.code === 'ENOENT') await rename(backup, target); }
      }
      throw error;
    } finally { await rm(stage, { recursive: true, force: true }); }
    return join(target, 'main.cjs');
  });
}
