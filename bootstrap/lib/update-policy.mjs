import { validGeneration } from './generation.mjs';
export { validGeneration, knownGeneration } from './generation.mjs';
import { join } from 'node:path';
import { bytes, withInstallTransaction } from './install.mjs';

export const UPDATE_TTL_MS = 86_400_000;
export const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const version = value => typeof value === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?$/.test(value);
export async function readJson(cache, name, fallback) {
  try { return JSON.parse((await bytes(join(cache, name), 131072)).toString('utf8')); }
  catch (error) { if (error?.code === 'ENOENT') return structuredClone(fallback); throw Error('UPDATE_STATE_INVALID'); }
}
export async function readUpdatePolicy(cache) {
  const policy = await readJson(cache, 'update-policy.json', { schemaVersion: 'agent-update-policy/1', mode: 'notify', channel: 'stable', consent: false, pin: null });
  if (policy.schemaVersion !== 'agent-update-policy/1' || !['auto', 'notify', 'pinned'].includes(policy.mode)
    || !['stable', 'beta', 'rc'].includes(policy.channel) || typeof policy.consent !== 'boolean'
    || (policy.mode === 'auto' && !policy.consent)
    || (policy.mode === 'pinned' ? !policy.pin || !hex(policy.pin.digest) || !version(policy.pin.version) : policy.pin !== null)
    || Object.keys(policy).sort().join(',') !== 'channel,consent,mode,pin,schemaVersion') throw Error('UPDATE_POLICY_INVALID');
  return policy;
}
export async function setUpdatePolicy(cache, change) {
  return withInstallTransaction(cache, async transaction => {
    const before = await readUpdatePolicy(cache);
    if (before.mode === 'pinned' && change.mode !== 'pinned' && change.releasePin !== true) throw Error('PIN_RELEASE_REQUIRED');
    if (!['auto', 'notify', 'pinned'].includes(change.mode)) throw Error('UPDATE_POLICY_INVALID');
    if (change.mode === 'auto' && change.consent !== true && !before.consent) throw Error('UPDATE_CONSENT_REQUIRED');
    const policy = { schemaVersion: before.schemaVersion, mode: change.mode, channel: change.channel ?? before.channel,
      consent: change.mode === 'auto' ? true : before.consent, pin: change.mode === 'pinned' ? change.pin : null };
    if (!['stable', 'beta', 'rc'].includes(policy.channel) || (policy.pin !== null && (!policy.pin || !hex(policy.pin.digest) || !version(policy.pin.version)))) throw Error('UPDATE_POLICY_INVALID');
    if (policy.pin) {
      const installed = await transaction.installed(policy.pin.digest);
      if (installed.productVersion !== policy.pin.version) throw Error('UPDATE_PIN_INVALID');
    }
    await transaction.write('update-policy.json', policy);
    // Pending bytes remain cached; a policy change never kills an active process.
    return policy;
  });
}
export function checkDue(state, now = Date.now()) {
  if (!Number.isSafeInteger(now) || now < 0) return false;
  if (!Number.isSafeInteger(state.checkedAt) || state.checkedAt < 0) return true;
  if (state.checkedAt > now + UPDATE_TTL_MS) return true; // rebase once under the shared lock
  return now - state.checkedAt >= UPDATE_TTL_MS;
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
/** Unknown contracts, different instructions or schemas require explicit setup/restart. */
export function compatibleGeneration(running, candidate, host) {
  if (!validGeneration(running, host) || !validGeneration(candidate, host)) return 'UPDATE_INCOMPATIBLE';
  return JSON.stringify(canonical(running)) === JSON.stringify(canonical(candidate)) ? null : 'UPDATE_INCOMPATIBLE';
}
