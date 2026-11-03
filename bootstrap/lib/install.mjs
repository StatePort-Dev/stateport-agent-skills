import { constants } from 'node:fs';
import { lstat, mkdir, open, readdir, readlink, rename, rm, writeFile, symlink } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { dirname, isAbsolute, join, parse, relative, resolve } from 'node:path';
import { validArchivePath, validateBundleLinks } from './archive.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const maximumPayloadBytes = 512 * 1024 * 1024;
const missing = error => error?.code === 'ENOENT';

export async function safePath(path) {
  const absolute = resolve(path), root = parse(absolute).root;
  let cursor = root;
  for (const part of relative(root, absolute).split(/[\\/]/)) {
    if (!part) continue; cursor = join(cursor, part);
    try { const stat = await lstat(cursor); if (stat.isSymbolicLink()) throw Error('UNSAFE_PATH'); }
    catch (error) { if (missing(error)) break; throw error; }
  }
}
export async function directory(path) {
  await safePath(path); await mkdir(path, { recursive: true, mode: 0o700 }); await safePath(path);
  if (!(await lstat(path)).isDirectory()) throw Error('UNSAFE_PATH');
}
export async function bytes(path, maximumBytes) {
  await safePath(path);
  const before = await lstat(path);
  if (!before.isFile() || before.isSymbolicLink() || before.size > maximumBytes) throw Error('UNSAFE_PATH');
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.dev !== before.dev || stat.ino !== before.ino || stat.size > maximumBytes) throw Error('UNSAFE_PATH');
    const value = await handle.readFile();
    if (value.length > maximumBytes) throw Error('PAYLOAD_SIZE');
    return value;
  } finally { await handle.close(); }
}
function manifest(value) {
  if (!value || !['agent-runtime-candidate/1.0.0','agent-runtime-candidate/1.1.0','agent-runtime-candidate/1.2.0'].includes(value.schemaVersion) || value.entry !== 'main.cjs' || value.nodeCandidate !== '24.x' || typeof value.productVersion !== 'string' || !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(value.productVersion)) throw Error('MANIFEST_INVALID');
  if (value.schemaVersion === 'agent-runtime-candidate/1.2.0' && value.archiveFormat !== 'ustar+pax-path/1') throw Error('MANIFEST_INVALID');
  if (value.platform !== process.platform || value.arch !== process.arch) throw Error('PLATFORM_MISMATCH');
  if (!Array.isArray(value.files) || value.files.length < 1 || value.files.length > 4096) throw Error('MANIFEST_INVALID');
  const names = new Set(); let total = 0;
  for (const file of value.files) {
    if (!validArchivePath(file.path, value.schemaVersion === 'agent-runtime-candidate/1.2.0' ? 1024 : 255) || file.path === 'candidate.json') throw Error('MANIFEST_PATH');
    if (file.executable !== undefined && typeof file.executable !== 'boolean') throw Error('MANIFEST_INVALID');
    const lower = file.path.toLowerCase();
    if (names.has(lower)) throw Error('MANIFEST_PATH'); names.add(lower);
    if (file.kind === 'symlink') {
      if (value.schemaVersion === 'agent-runtime-candidate/1.0.0' || process.platform === 'win32') throw Error('BUNDLE_LINK_UNSUPPORTED');
      continue;
    }
    if (file.kind !== undefined) throw Error('MANIFEST_INVALID');
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0 || !hex(file.sha256)) throw Error('MANIFEST_INVALID');
    total += file.bytes; if (!Number.isSafeInteger(total) || total > maximumPayloadBytes) throw Error('PAYLOAD_SIZE');
  }
  if (!names.has('main.cjs')) throw Error('MANIFEST_INVALID');
  validateBundleLinks(value.files);
  return value;
}
async function loadManifest(source, expectedDigest) {
  if (!hex(expectedDigest)) throw Error('MANIFEST_INTEGRITY');
  const raw = await bytes(join(source, 'candidate.json'), 1024 * 1024);
  if (digest(raw) !== expectedDigest) throw Error('MANIFEST_INTEGRITY');
  return { raw, value: manifest(JSON.parse(raw.toString('utf8'))) };
}
async function verifyPayload(root, value) {
  for (const file of value.files) {
    if (file.kind === 'symlink') {
      const path = join(root, file.path); await safePath(dirname(path));
      if (!(await lstat(path)).isSymbolicLink() || await readlink(path) !== file.target) throw Error('PAYLOAD_INTEGRITY');
      continue;
    }
    const data = await bytes(join(root, file.path), file.bytes);
    if (data.length !== file.bytes || digest(data) !== file.sha256) throw Error('PAYLOAD_INTEGRITY');
  }
  const expected = new Set(['candidate.json', ...value.files.map(file => file.path)]);
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isSymbolicLink()) {
        const name = relative(root, child).split('\\').join('/');
        if (!value.files.some(file => file.path === name && file.kind === 'symlink') || !expected.delete(name)) throw Error('UNSAFE_PATH');
        continue;
      }
      if (entry.isDirectory()) await walk(child);
      else if (!entry.isFile() || !expected.delete(relative(root, child).split('\\').join('/'))) throw Error('PAYLOAD_CONFLICT');
    }
  }
  await walk(root); if (expected.size) throw Error('PAYLOAD_INTEGRITY');
}
async function withLock(cache, work) {
  if (!isAbsolute(cache)) throw Error('UNSAFE_PATH');
  await directory(cache);
  const lock = join(cache, '.install.lock');
  await safePath(lock);
  try { await mkdir(lock, { mode: 0o700 }); } catch { throw Error('INSTALL_BUSY_OR_RECOVERY_REQUIRED'); }
  try { return await work(); }
  finally { await safePath(lock); await rm(lock, { recursive: true }); }
}
async function pointer(cache) {
  let raw;
  try { raw = await bytes(join(cache, 'current.json'), 4096); } catch (error) { if (missing(error)) return undefined; throw error; }
  const value = JSON.parse(raw.toString('utf8'));
  if (value.schemaVersion !== 'agent-install-pointer/1' || !hex(value.current) || (value.previous !== null && !hex(value.previous)) || Object.keys(value).sort().join(',') !== 'current,previous,schemaVersion') throw Error('INSTALL_CONFLICT');
  return { value, raw };
}
async function switchPointer(cache, value, before) {
  const current = await pointer(cache);
  if (current?.raw.toString('utf8') !== before?.raw.toString('utf8')) throw Error('INSTALL_CONFLICT');
  const temporary = join(cache, `.current-${randomBytes(16).toString('hex')}`);
  try {
    await writeFile(temporary, JSON.stringify(value) + '\n', { mode: 0o600, flag: 'wx', flush: true });
    await safePath(join(cache, 'current.json')); await rename(temporary, join(cache, 'current.json')); await syncDirectory(cache);
  }
  finally { await safePath(temporary); await rm(temporary, { force: true }); }
}
// Directory sync is meaningful on supported POSIX filesystems. Windows does not
// expose directory fsync through this API; flushed files + rename still retain
// immutable payloads. Native crash/power-loss qualification stays independent.
async function syncDirectory(path) {
  if (process.platform === 'win32') return;
  const handle = await open(path, constants.O_RDONLY);
  try { await handle.sync(); } finally { await handle.close(); }
}
async function syncTree(root) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory()) await syncTree(join(root, entry.name));
  }
  await syncDirectory(root);
}
export async function atomicJson(cache, name, value) {
  if (!/^[a-z][a-z0-9-]*\.json$/.test(name)) throw Error('UNSAFE_PATH');
  await directory(cache);
  const target = join(cache, name), temporary = join(cache, `.write-${randomBytes(16).toString('hex')}`);
  await safePath(target);
  try {
    await writeFile(temporary, JSON.stringify(value) + '\n', { mode: 0o600, flag: 'wx', flush: true });
    await safePath(target); await rename(temporary, target); await syncDirectory(cache);
  } finally { await safePath(temporary); await rm(temporary, { force: true }); }
}
export async function readInstalled(cache, manifestSha256) {
  if (!hex(manifestSha256)) throw Error('MANIFEST_INTEGRITY');
  const runtimeRoot = join(cache, 'versions', manifestSha256);
  const loaded = await loadManifest(runtimeRoot, manifestSha256);
  await verifyPayload(runtimeRoot, loaded.value);
  return { digest: manifestSha256, runtimeRoot, entry: join(runtimeRoot, 'main.cjs'), productVersion: loaded.value.productVersion, browserPreference: loaded.value.browserPreference ?? 'system', generation: loaded.value.generation };
}
export async function readCurrent(cache) {
  const current = await pointer(cache); if (!current) return undefined;
  return readInstalled(cache, current.value.current);
}
async function stageVerified({ source, cache, manifestSha256 }) {
  source = resolve(source);
  const loaded = await loadManifest(source, manifestSha256);
  await verifyPayload(source, loaded.value);
  const versions = join(cache, 'versions'); await directory(versions);
  const destination = join(versions, manifestSha256);
  let exists = true;
  try { await lstat(destination); } catch (error) { if (missing(error)) exists = false; else throw error; }
  if (exists) { const saved = await loadManifest(destination, manifestSha256); await verifyPayload(destination, saved.value); }
  else {
    const stage = join(versions, `.stage-${randomBytes(16).toString('hex')}`); await directory(stage);
    try {
      for (const file of loaded.value.files.filter(file => file.kind !== 'symlink')) {
        const data = await bytes(join(source, file.path), file.bytes);
        if (data.length !== file.bytes || digest(data) !== file.sha256) throw Error('PAYLOAD_INTEGRITY');
        const target = join(stage, file.path); await directory(dirname(target));
        await writeFile(target, data, { flag: 'wx', mode: file.executable ? 0o700 : 0o600, flush: true });
      }
      for (const file of loaded.value.files.filter(file => file.kind === 'symlink')) {
        const target = join(stage, file.path); await directory(dirname(target)); await symlink(file.target, target);
      }
      await writeFile(join(stage, 'candidate.json'), loaded.raw, { flag: 'wx', mode: 0o600, flush: true });
      await verifyPayload(stage, loaded.value); await syncTree(stage);
      await safePath(destination); await rename(stage, destination); await syncDirectory(versions);
    } finally { await safePath(stage); await rm(stage, { recursive: true, force: true }); }
  }
  return readInstalled(cache, manifestSha256);
}
async function activateVerified(cache, manifestSha256) {
  const installed = await readInstalled(cache, manifestSha256), before = await pointer(cache);
  if (before?.value.current === manifestSha256) return { ...installed, unchanged: true };
  await switchPointer(cache, { schemaVersion: 'agent-install-pointer/1', current: manifestSha256, previous: before?.value.current ?? null }, before);
  return { ...installed, unchanged: false };
}
/** The sole mutation lock. The callback may stage/activate without reentrant locks. */
export async function withInstallTransaction(cache, work) {
  return withLock(cache, () => work({
    stage: options => stageVerified({ ...options, cache }),
    activate: manifestSha256 => activateVerified(cache, manifestSha256),
    current: () => readCurrent(cache),
    installed: manifestSha256 => readInstalled(cache, manifestSha256),
    previous: async () => { const current = await pointer(cache); return current?.value.previous ? readInstalled(cache, current.value.previous) : undefined; },
    uninstall: () => uninstallVerified(cache),
    write: (name, value) => atomicJson(cache, name, value),
  }));
}
export async function stageCandidate(options) {
  return withInstallTransaction(options.cache, transaction => transaction.stage(options));
}
export async function activateCandidate(cache, manifestSha256) {
  return withInstallTransaction(cache, transaction => transaction.activate(manifestSha256));
}
export async function installCandidate(options) {
  return withInstallTransaction(options.cache, async transaction => {
    await transaction.stage(options);
    return transaction.activate(options.manifestSha256);
  });
}
export async function rollback(cache) {
  return withLock(cache, async () => {
    const before = await pointer(cache);
    if (!before?.value.previous) throw Error('ROLLBACK_UNAVAILABLE');
    const loaded = await loadManifest(join(cache, 'versions', before.value.previous), before.value.previous);
    await verifyPayload(join(cache, 'versions', before.value.previous), loaded.value);
    await switchPointer(cache, { schemaVersion: 'agent-install-pointer/1', current: before.value.previous, previous: before.value.current }, before);
    return readCurrent(cache);
  });
}
export async function uninstallPointer(cache) {
  return withLock(cache, () => uninstallVerified(cache));
}
async function uninstallVerified(cache) {
  const current = await readCurrent(cache);
  if (current) { await rm(join(cache, 'current.json')); await syncDirectory(cache); }
  // Exact runtime versions are retained: active processes and rollback never lose their code.
  return { status: 'uninstalled', retainedRuntimeCache: true, userData: 'preserved' };
}
