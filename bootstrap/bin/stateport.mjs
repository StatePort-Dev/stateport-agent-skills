#!/usr/bin/env node
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { installCandidate, readCurrent, withInstallTransaction } from '../lib/install.mjs';
import { installPublishedRelease } from '../lib/release.mjs';
import { readUpdatePolicy, setUpdatePolicy } from '../lib/update-policy.mjs';
import { updateStatus, checkForUpdates, selectSessionRuntime, rollbackGeneration } from '../lib/updates.mjs';
import { updateControl } from '../lib/controls.mjs';
import { ensureLauncher } from '../lib/launcher.mjs';

function cacheRoot() {
  const configured = process.platform === 'win32' ? process.env.LOCALAPPDATA : process.platform === 'linux' ? process.env.XDG_DATA_HOME : undefined;
  const base = configured && isAbsolute(configured) ? configured
    : process.platform === 'win32' ? join(homedir(), 'AppData', 'Local')
      : process.platform === 'darwin' ? join(homedir(), 'Library', 'Caches') : join(homedir(), '.local', 'share');
  return join(base, 'StatePort', 'agent-runtime');
}
const write = value => process.stdout.write(JSON.stringify(value) + '\n');
async function run(runtime, args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runtime.entry, ...args], { stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', windowsHide: true });
    let output = ''; let size = 0;
    child.stdout?.on('data', chunk => { size += chunk.length; if (size > 1024 * 1024) child.kill(); else output += chunk; });
    // No captured native/backend error strings enter bootstrap diagnostics.
    child.stderr?.resume();
    child.once('error', () => reject(Error('RUNTIME_UNAVAILABLE')));
    child.once('close', code => {
      if (code !== 0) { reject(Error('RUNTIME_FAILED')); return; }
      if (!capture) { resolve(undefined); return; }
      try { resolve(JSON.parse(output)); } catch { reject(Error('RUNTIME_REPLY_INVALID')); }
    });
  });
}
async function main() {
  if (Number(process.versions.node.split('.')[0]) !== 24) throw Error('NODE_24_LTS_CANDIDATE_REQUIRED');
  if (!((process.platform === 'linux' || process.platform === 'win32') && process.arch === 'x64') && !(process.platform === 'darwin' && process.arch === 'arm64')) throw Error('PLATFORM_UNSUPPORTED');
  const args = process.argv.slice(2);
  const commands = new Set(['install', 'update', 'updates', 'repair-launcher', 'rollback', 'uninstall', 'browser-install', 'doctor', 'open', 'access', 'mcp', 'task-session', 'task-start', 'task-call', 'task-tools', 'task-close']);
  const command = commands.has(args[0]) ? args.shift() : 'install';
  const cache = cacheRoot();
  const trust = JSON.parse(await readFile(new URL('../update-release.json', import.meta.url), 'utf8'));
  if (command === 'repair-launcher') {
    if (args.length !== 1 || args[0] !== '--confirm') throw Error('INVALID_ARGUMENTS');
    const runtime = await readCurrent(cache);
    if (runtime?.generation?.launcher !== 1) throw Error('LAUNCHER_REPAIR_UNSUPPORTED');
    write({ status: 'launcher_repaired', launcher: await ensureLauncher(cache, trust, { repair: true }), userData: 'preserved', editedLoader: 'backed_up_if_changed' }); return;
  }
  if (command === 'updates') { write(await updateControl(cache, trust, args)); return; }
  if (['doctor', 'open', 'access', 'mcp', 'task-session', 'task-start', 'task-call', 'task-tools', 'task-close'].includes(command)) {
    const runtime = await readCurrent(cache); if (!runtime) throw Error('RUNTIME_NOT_INSTALLED');
    if (runtime.generation) {
      // Stable loader performs safe next-session resolution. Read-only and
      // existing task-call/close commands never trigger update checks.
      const loader = join(cache, 'launcher', 'main.cjs');
      await run({ entry: loader }, [command, ...args]); return;
    }
    await run(runtime, [command, ...args]); return;
  }
  if (command === 'uninstall') {
    if (args.length) throw Error('INVALID_ARGUMENTS');
    await withInstallTransaction(cache, async transaction => {
      const runtime = await transaction.current();
      if (runtime) {
        const setup = await run(runtime, ['remove-agent-setup'], true);
        if (setup.status !== 'removed') { write({ status: 'conflict', setup, userData: 'preserved' }); process.exitCode = 1; return; }
      }
      write(await transaction.uninstall());
    }); return;
  }
  if (command === 'rollback') {
    if (args.length) throw Error('INVALID_ARGUMENTS');
    const policy = await readUpdatePolicy(cache);
    if (policy.mode === 'pinned') throw Error('PIN_RELEASE_REQUIRED');
    const runtime = await rollbackGeneration(cache);
    write({ status: 'rolled_back', runtime: runtime.productVersion, setup: await run(runtime, ['setup'], true), hostDiscovered: 'unverified' }); return;
  }
  let source, manifestSha256, agent, offline = false, confirmDownload, consentUpdates = false;
  while (args.length) {
    const option = args.shift();
    if (option === '--offline' && !offline) { offline = true; continue; }
    if (option === '--consent-updates' && !consentUpdates) { consentUpdates = true; continue; }
    const value = args.shift();
    if (!value) throw Error('INVALID_ARGUMENTS');
    if (option === '--candidate-dir' && !source) source = value;
    else if (option === '--manifest-sha256' && !manifestSha256) manifestSha256 = value;
    else if (option === '--agent' && !agent && ['codex', 'claude', 'cursor'].includes(value)) agent = value;
    else if (option === '--confirm-download' && !confirmDownload && /^[a-f0-9]{64}$/.test(value)) confirmDownload = value;
    else throw Error('INVALID_ARGUMENTS');
  }
  if ((source && !manifestSha256) || (!source && manifestSha256) || (source && offline)) throw Error('INVALID_ARGUMENTS');
  let runtime;
  const policy = await readUpdatePolicy(cache);
  if (policy.mode === 'pinned' && (command === 'update' || command === 'browser-install' || (manifestSha256 && manifestSha256 !== policy.pin.digest))) throw Error('PIN_RELEASE_REQUIRED');
  if (command === 'update' && !source && !offline && trust.status === 'published') {
    const outcome = await checkForUpdates(cache, trust, { force: true, manual: true, confirmDownload });
    const selected = await selectSessionRuntime(cache, trust, { manual: true });
    write({ status: 'update_checked', outcome, selected: { version: selected.productVersion, digest: selected.digest }, updates: await updateStatus(cache) }); return;
  }
  if (offline) {
    runtime = await readCurrent(cache); if (!runtime) throw Error('OFFLINE_CACHE_UNAVAILABLE');
  } else if (!source) {
    const release = JSON.parse(await readFile(new URL('../release.json', import.meta.url), 'utf8'));
    if (release.status === 'unpublished') throw Error('PUBLIC_RUNTIME_RELEASE_UNPUBLISHED');
    const current = await readCurrent(cache);
    runtime = await installPublishedRelease(release, cache, fetch, { browserPreference: command === 'browser-install' || current?.browserPreference === 'pinned' ? 'pinned' : 'system', confirmDownload, onDownload: info => write({ status: 'downloading_verified_release', ...info }) });
    if (runtime.status === 'browser_download_required') { write(runtime); return; }
  }
  write({ status: 'installing_candidate', permissions: ['copy verified runtime to user-owned versioned cache', 'configure unchanged owned agent skills/MCP'], trial: 'not_started' });
  runtime ??= await installCandidate({ source, cache, manifestSha256 });
  // Persist a quiet Notify default; repeat setup never changes existing policy.
  if (consentUpdates) await setUpdatePolicy(cache, { mode: 'auto', consent: true });
  else {
    const { atomicJson } = await import('../lib/install.mjs');
    await withInstallTransaction(cache, async () => atomicJson(cache, 'update-policy.json', await readUpdatePolicy(cache)));
  }
  const launcher = runtime.generation ? await ensureLauncher(cache, trust) : undefined;
  const doctor = await run(runtime, ['doctor'], true);
  const setup = await run(runtime, agent ? ['setup', '--agent', agent] : ['setup'], true);
  write({ status: 'candidate_installed', version: runtime.productVersion, unchanged: runtime.unchanged, doctor, setup,
    cache: offline ? 'verified_offline' : 'verified', hostDiscovered: 'unverified', updates: { mode: (await readUpdatePolicy(cache)).mode, delivery: 'candidate', launcher }, currentTask: {
      command: process.execPath, args: [launcher ?? runtime.entry, 'task-session'], selection: 'verified_at_new_session_start', protocol: 'agent-task-session/1',
      version: runtime.productVersion, digest: runtime.digest, generation: runtime.generation,
      input: 'The installed version below is an offer; the ready frame binds the selected runtime at new-session start. Keep this host execution session and stdin open. First JSON line has project, scope, optional deadlineMs. Example for an originally authorized fix task: {"project":"/absolute/original/project","scope":{"userRequestedTask":true,"intent":"fix_verify","sourceOrigins":["http://127.0.0.1:3000"],"frontendOrigins":["http://127.0.0.1:3001"],"stateCardIds":[]},"deadlineMs":600000}. Replace project/origins/Card IDs from the original user task; installation grants no scope. Then JSON lines: operation tools; operation call with requestId/name/arguments; operation close.',
      permissions: 'Use normal host approval for this exact runtime command when required. Installation does not grant browser, project or task permissions.',
    }, published: false });
}
void main().catch(error => {
  const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : 'INSTALL_FAILED';
  write({ status: 'blocked', code, nodePrerequisite: code.startsWith('NODE_') ? 'https://nodejs.org/en/download' : undefined });
  process.exitCode = 1;
});
