import { checkForUpdates } from './updates.mjs';
const abort = new AbortController();
let started = false;
const maximum = setTimeout(() => { abort.abort(); process.exit(0); }, 131_000);
maximum.unref();
process.once('disconnect', () => { abort.abort(); process.exit(0); });
process.on('message', async message => {
  if (message?.operation === 'abort') { abort.abort(); return; }
  if (started || message?.operation !== 'check' || !process.connected) return;
  started = true;
  try { await checkForUpdates(message.cache, message.trust, { signal: abort.signal }); }
  finally { clearTimeout(maximum); if (process.connected) process.disconnect(); }
});
