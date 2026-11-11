import { validGeneration } from './update-policy.mjs';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { selectSessionRuntime, quarantineStartup } from './updates.mjs';
import { updateControl } from './controls.mjs';

/** A task-session or stdio MCP selects exactly once. Its runtime child and every
 * worker retain that immutable path. There is no post-operation retry/fallback. */
export async function launchSession({ cache, runtime, trust, args }) {
  const [command = 'doctor'] = args;
  if (command === 'updates') {
    process.stdout.write(JSON.stringify(await updateControl(cache, trust, args.slice(1), runtime)) + '\n'); return;
  }
  const newSession = ['mcp', 'task-session', 'task-start', 'open'].includes(command);
  const selected = newSession ? await selectSessionRuntime(cache, trust) : runtime;
  if (!validGeneration(selected.generation)) throw Error('RUNTIME_NODE_UNSUPPORTED');
  const child = fork(selected.entry, args, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'], windowsHide: true });
  let ready = !newSession;
  let job;
  const stopJob = () => {
    if (!job || job.exitCode !== null) return;
    job.send?.({ operation: 'abort' }, () => {});
    const timer = setTimeout(() => { if (job.exitCode === null) job.kill(); }, 1000); timer.unref();
  };
  const startJob = () => {
    if (!newSession || trust.status !== 'published' || job) return;
    // Trusted runtime-owned implementation, finite IPC owner and hard ceiling.
    job = fork(fileURLToPath(new URL('update-job.mjs', import.meta.url)), [], { stdio: ['ignore', 'ignore', 'ignore', 'ipc'], windowsHide: true });
    job.on('error', () => {});
    job.on('message', message => {
      if (message?.protocol === 'agent-update-notice/1' && typeof message.version === 'string'
        && /^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(message.version) && /^[a-f0-9]{64}$/.test(message.digest)) {
        process.stderr.write(`StatePort ${message.version} available. Check updates status.\n`);
      }
    });
    job.send({ operation: 'check', cache, trust });
    const maximum = setTimeout(stopJob, 131_000); maximum.unref();
    job.once('exit', () => clearTimeout(maximum));
  };
  child.on('message', message => {
    if (message?.protocol === 'agent-launch-ready/1') ready = true;
    if (message?.protocol === 'agent-update-use/1') startJob();
  });
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'];
  const handlers = signals.map(signal => {
    const handler = () => { stopJob(); try { child.kill(signal); } catch { child.kill(); } };
    process.on(signal, handler); return [signal, handler];
  });
  await new Promise(resolve => {
    child.once('error', () => { process.exitCode = 1; resolve(); });
    child.once('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); resolve(); });
  });
  stopJob();
  for (const [signal, handler] of handlers) process.off(signal, handler);
  if (job?.connected) job.disconnect();
  if (!ready && selected.digest !== runtime.digest) await quarantineStartup(cache, selected.digest, runtime).catch(() => {});
}
