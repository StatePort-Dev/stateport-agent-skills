import { readInstalled } from './install.mjs';
import { readUpdatePolicy, setUpdatePolicy, hex } from './update-policy.mjs';
import { updateStatus, checkForUpdates, retryQuarantine } from './updates.mjs';

/** Shared transparent-bootstrap and verified installed-launcher CLI surface. */
export async function updateControl(cache, trust, args, running) {
  const [action = 'status', ...extra] = args;
  if (action === 'status' && !extra.length) return updateStatus(cache, running);
  if (action === 'check' && !extra.length) return checkForUpdates(cache, trust, { force: true });
  if (action === 'retry' && extra.length === 1 && hex(extra[0])) return retryQuarantine(cache, extra[0]);
  if (action === 'auto' && extra.length === 1 && extra[0] === '--consent') return setUpdatePolicy(cache, { mode: 'auto', consent: true });
  if (action === 'notify' && (!extra.length || (extra.length === 1 && extra[0] === '--release-pin'))) return setUpdatePolicy(cache, { mode: 'notify', releasePin: extra[0] === '--release-pin' });
  if (action === 'pin' && extra.length === 1 && hex(extra[0])) {
    const runtime = await readInstalled(cache, extra[0]);
    return setUpdatePolicy(cache, { mode: 'pinned', pin: { version: runtime.productVersion, digest: runtime.digest } });
  }
  if (action === 'channel' && extra.length === 2 && ['stable', 'beta', 'rc'].includes(extra[0]) && extra[1] === '--confirm') {
    const policy = await readUpdatePolicy(cache);
    if (trust.status === 'published' && !trust.channels?.[extra[0]] && trust.channel !== extra[0]) throw Error('UPDATE_CHANNEL_UNAVAILABLE');
    return setUpdatePolicy(cache, { mode: policy.mode, channel: extra[0], pin: policy.pin });
  }
  throw Error('INVALID_ARGUMENTS');
}
