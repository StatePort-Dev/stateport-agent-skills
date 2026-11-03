import { spawn } from 'node:child_process';
import { withInstallTransaction, readCurrent, readInstalled, readPrevious } from './install.mjs';
import { readJson, readUpdatePolicy, checkDue, compatibleGeneration, hex } from './update-policy.mjs';
import { download, verifyChannelEnvelope, installReleaseDocument, compareVersions } from './release.mjs';

const empty = () => ({ schemaVersion: 'agent-update-state/1', checkedAt: null, water: {}, available: null, pending: null, quarantine: [], hold: null });
async function stateFor(cache) {
  const state = await readJson(cache, 'update-state.json', empty());
  if (state.schemaVersion !== 'agent-update-state/1' || Object.keys(state).sort().join(',') !== 'available,checkedAt,hold,pending,quarantine,schemaVersion,water'
    || (state.checkedAt !== null && (!Number.isSafeInteger(state.checkedAt) || state.checkedAt < 0))
    || !state.water || typeof state.water !== 'object' || Array.isArray(state.water)
    || !Array.isArray(state.quarantine) || state.quarantine.length > 32 || !state.quarantine.every(hex)
    || (state.hold !== null && (typeof state.hold !== 'string' || !/^UPDATE_[A-Z_]{1,64}$/.test(state.hold)))) throw Error('UPDATE_STATE_INVALID');
  for (const [channel, water] of Object.entries(state.water)) {
    if (!['stable', 'beta', 'rc'].includes(channel) || !water || !Number.isSafeInteger(water.sequence) || water.sequence < 1
      || !hex(water.releaseDigest) || typeof water.version !== 'string' || (water.notifiedDigest !== undefined && !hex(water.notifiedDigest))) throw Error('UPDATE_STATE_INVALID');
  }
  return state;
}
function channelTrust(trust, policy) {
  if (trust.status !== 'published') throw Error('UPDATE_NOT_CONFIGURED');
  const url = trust.channels?.[policy.channel] ?? (trust.channel === policy.channel ? trust.url : undefined);
  if (!url) throw Error('UPDATE_CHANNEL_UNAVAILABLE');
  return { ...trust, channel: policy.channel, url };
}
function assetFor(document, browserPreference) {
  const platform = document.assets.find(asset => asset.platform === process.platform && asset.arch === process.arch);
  if (!platform) throw Error('UPDATE_INCOMPATIBLE');
  return browserPreference === 'pinned' ? platform.browserFallback : platform;
}
function quarantined(state, digest) { return state.quarantine.includes(digest); }
function quarantine(state, digest) {
  state.quarantine = [...state.quarantine.filter(value => value !== digest), digest].slice(-32);
  state.pending = null; state.hold = 'UPDATE_QUARANTINED';
}
const safeReasons = new Set(['UPDATE_INCOMPATIBLE', 'UPDATE_QUARANTINED', 'UPDATE_INTEGRATION_HELD', 'UPDATE_NOT_CONFIGURED', 'UPDATE_CHANNEL_UNAVAILABLE', 'UPDATE_BROWSER_CONFIRMATION_REQUIRED']);
const reason = error => safeReasons.has(error?.message) ? error.message : 'UPDATE_CHECK_FAILED';

/** Only a verified runtime can reach this child. No shell, Cards, vault writes,
 * Capture, entitlement activation or user operation; stderr is never projected. */
export async function readiness(runtime, { integration = false, signal } = {}) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [runtime.entry, 'update-readiness'], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'], signal });
    let text = '', size = 0, finished = false;
    const finish = result => { if (!finished) { finished = true; clearTimeout(timer); resolve(result); } };
    const timer = setTimeout(() => { child.kill(); finish(false); }, 10_000);
    child.stdout.on('data', chunk => { size += chunk.length; if (size > 65536) { child.kill(); finish(false); } else text += chunk; });
    child.on('error', () => finish(false));
    child.on('close', code => {
      try {
        const reply = JSON.parse(text);
        finish(code === 0 && reply.status === 'ready' && reply.version === runtime.productVersion && reply.execution === 'allowed'
          && compatibleGeneration(runtime.generation, reply.generation) === null
          && (!integration || reply.integration === 'unchanged'));
      } catch { finish(false); }
    });
  });
}
export async function updateStatus(cache, running) {
  const current = await readCurrent(cache), policy = await readUpdatePolicy(cache), state = await stateFor(cache);
  const previous = await readPrevious(cache).catch(() => undefined);
  const summary = runtime => runtime ? { version: runtime.productVersion, digest: runtime.digest } : null;
  const advertised = value => value && typeof value.version === 'string' && hex(value.digest) ? { version: value.version, digest: value.digest } : null;
  return { schemaVersion: 'agent-update-status/1', running: summary(running), selected: summary(current), previous: summary(previous), mode: policy.mode, channel: policy.channel,
    pin: policy.pin, checkedAt: state.checkedAt === null ? null : new Date(state.checkedAt).toISOString(), available: advertised(state.available),
    pending: advertised(state.pending), hold: policy.mode === 'pinned' ? 'UPDATE_PINNED' : state.hold,
    applies: state.pending ? 'next_eligible_session' : null };
}
/** One finite, shared, opportunistic transaction; errors never gate current work. */
export async function checkForUpdates(cache, trust, options = {}) {
  if (trust.status !== 'published') return { status: 'not_configured' };
  try {
    return await withInstallTransaction(cache, async transaction => {
      const policy = await readUpdatePolicy(cache), state = await stateFor(cache);
      if (policy.mode === 'pinned') return { status: 'pinned' };
      const now = options.now ?? Date.now();
      if (!options.force && !checkDue(state, now)) return { status: 'throttled' };
      const current = await transaction.current();
      if (!current) return { status: 'not_installed' };
      const config = channelTrust(trust, policy);
      state.checkedAt = now; state.hold = null;
      // Persist attempt before any network: failure/crash does not create a storm.
      await transaction.write('update-state.json', state);
      let notice;
      try {
        const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(130_000)]) : AbortSignal.timeout(130_000);
        const envelope = JSON.parse((await download(config.url, 2 * 1024 * 1024, options.fetcher ?? fetch, { signal, timeoutMs: 5_000 })).toString('utf8'));
        const verified = verifyChannelEnvelope(envelope, config, state.water[policy.channel]);
        const document = verified.document, asset = assetFor(document, current.browserPreference);
        // A channel never replaces an installed version with different bytes.
        const order = compareVersions(document.version, current.productVersion);
        if (order < 0 || (order === 0 && asset.manifestSha256 !== current.digest)) throw Error('UPDATE_INCOMPATIBLE');
        state.water[policy.channel] = { ...state.water[policy.channel], sequence: document.sequence, version: document.version, releaseDigest: verified.digest };
        state.available = { version: document.version, digest: asset.manifestSha256 };
        if (policy.mode === 'notify' && order > 0 && state.water[policy.channel].notifiedDigest !== asset.manifestSha256) {
          notice = { version: document.version, digest: asset.manifestSha256 };
          // Optional inert high-water metadata; older readers ignore it. No
          // new execution/trust authority is derived from notification state.
          state.water[policy.channel].notifiedDigest = asset.manifestSha256;
        }
        if (order === 0) { state.available = null; state.pending = null; }
        else if (quarantined(state, asset.manifestSha256)) state.hold = 'UPDATE_QUARANTINED';
        else if (compatibleGeneration(current.generation, asset.generation)) state.hold = 'UPDATE_INCOMPATIBLE';
        else if (policy.mode === 'auto' || options.manual === true) {
          if (current.browserPreference === 'pinned' && options.confirmDownload !== asset.sha256) throw Error('UPDATE_BROWSER_CONFIRMATION_REQUIRED');
          let candidate;
          try { candidate = await transaction.installed(asset.manifestSha256); }
          catch (error) {
            if (error?.code !== 'ENOENT') throw error; // edited cache is never repaired silently
            candidate = await installReleaseDocument(document, cache, options.fetcher ?? fetch, {
              browserPreference: current.browserPreference, confirmDownload: options.confirmDownload, generation: asset.generation,
              signal, install: transaction.stage,
            });
          }
          if (candidate.productVersion !== document.version || compatibleGeneration(candidate.generation, asset.generation)) throw Error('UPDATE_INCOMPATIBLE');
          if (!(await (options.readiness ?? readiness)(candidate, { signal }))) quarantine(state, candidate.digest);
          else state.pending = { version: candidate.productVersion, digest: candidate.digest, envelope };
        }
      } catch (error) { state.hold = reason(error); }
      await transaction.write('update-state.json', state);
      return { status: state.pending ? 'pending_next_session' : state.hold ? 'held' : 'checked', ...(notice ? { notice } : {}) };
    });
  } catch { return { status: 'unavailable' }; }
}
/** Resolves once, before a new task/MCP process. Calls already inside a task
 * never use this function. A failed candidate never causes action replay. */
export async function selectSessionRuntime(cache, trust, options = {}) {
  const before = await readCurrent(cache);
  if (!before) throw Error('RUNTIME_NOT_INSTALLED');
  try {
    return await withInstallTransaction(cache, async transaction => {
      const current = await transaction.current(), policy = await readUpdatePolicy(cache), state = await stateFor(cache);
      if (policy.mode === 'pinned') {
        const pinned = await transaction.installed(policy.pin.digest);
        if (pinned.productVersion !== policy.pin.version || compatibleGeneration(current.generation, pinned.generation)) throw Error('UPDATE_INCOMPATIBLE');
        if (!(await (options.readiness ?? readiness)(pinned))) throw Error('UPDATE_INCOMPATIBLE');
        return pinned;
      }
      if ((policy.mode !== 'auto' && options.manual !== true) || !state.pending) return current;
      const pending = state.pending;
      try {
        const config = channelTrust(trust, policy), verified = verifyChannelEnvelope(pending.envelope, config, state.water[policy.channel]);
        const asset = assetFor(verified.document, current.browserPreference);
        if (pending.digest !== asset.manifestSha256 || pending.version !== verified.document.version || quarantined(state, pending.digest)
          || compareVersions(pending.version, current.productVersion) <= 0 || compatibleGeneration(current.generation, asset.generation)) throw Error('UPDATE_INCOMPATIBLE');
        const candidate = await transaction.installed(pending.digest);
        if (compatibleGeneration(candidate.generation, asset.generation)) throw Error('UPDATE_INCOMPATIBLE');
        if (!(await (options.ownership ?? (runtime => readiness(runtime, { integration: true })))(current))) {
          state.hold = 'UPDATE_INTEGRATION_HELD'; await transaction.write('update-state.json', state); return current;
        }
        if (!(await (options.readiness ?? readiness)(candidate))) {
          quarantine(state, candidate.digest); await transaction.write('update-state.json', state); return current;
        }
        const selected = await transaction.activate(candidate.digest);
        state.pending = null; state.hold = null;
        await transaction.write('update-state.json', state);
        return selected;
      } catch {
        if (hex(pending.digest)) quarantine(state, pending.digest);
        else state.hold = 'UPDATE_CHECK_FAILED';
        await transaction.write('update-state.json', state);
        return current;
      }
    });
  } catch {
    // An explicit exact pin cannot silently execute different bytes, even if
    // its preflight or the shared lock is unavailable. Read-only recovery stays.
    const policy = await readUpdatePolicy(cache).catch(() => undefined);
    if (policy?.mode === 'pinned' && policy.pin.digest !== before.digest) throw Error('UPDATE_PIN_UNAVAILABLE');
    return before; // other unknown lock/cache/policy never gates installed recovery
  }
}
export async function retryQuarantine(cache, digest) {
  if (!hex(digest)) throw Error('INVALID_ARGUMENTS');
  return withInstallTransaction(cache, async transaction => {
    const state = await stateFor(cache);
    state.quarantine = state.quarantine.filter(value => value !== digest); state.hold = null;
    await transaction.write('update-state.json', state);
    return { status: 'retry_allowed', digest };
  });
}
export async function rollbackGeneration(cache, options = {}) {
  return withInstallTransaction(cache, async transaction => {
    const current = await transaction.current(), previous = await transaction.previous();
    if (!current || !previous) throw Error('ROLLBACK_UNAVAILABLE');
    if (compatibleGeneration(current.generation, previous.generation)) throw Error('UPDATE_INCOMPATIBLE');
    if (!(await (options.readiness ?? readiness)(previous))) throw Error('UPDATE_ROLLBACK_UNAVAILABLE');
    const state = await stateFor(cache);
    const selected = await transaction.activate(previous.digest);
    state.pending = null; state.hold = 'UPDATE_ROLLED_BACK';
    await transaction.write('update-state.json', state);
    return selected;
  });
}
/** Restore code for future sessions only. Never replays this process's request. */
export async function quarantineStartup(cache, digest, previous, options = {}) {
  return withInstallTransaction(cache, async transaction => {
    const state = await stateFor(cache), current = await transaction.current();
    quarantine(state, digest);
    if (current?.digest === digest && previous && previous.digest !== digest) {
      const saved = await transaction.installed(previous.digest);
      if (!compatibleGeneration(current.generation, saved.generation) && await (options.readiness ?? readiness)(saved)) await transaction.activate(saved.digest);
    }
    await transaction.write('update-state.json', state);
  });
}
