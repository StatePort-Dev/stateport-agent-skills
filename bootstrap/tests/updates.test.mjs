import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { updateFixture } from './update-fixture.mjs';
import { setUpdatePolicy } from '../lib/update-policy.mjs';
import { readCurrent } from '../lib/install.mjs';
import { checkForUpdates, selectSessionRuntime, updateStatus, retryQuarantine, quarantineStartup, rollbackGeneration } from '../lib/updates.mjs';

test('Notify checks metadata only; Auto stages B while A binding holds and selects B only at a new session', () => updateFixture(async f => {
  const options = { fetcher: f.fetcher, now: 1_800_000_000_000, readiness: async () => true, ownership: async () => true };
  await checkForUpdates(f.cache, f.trust, options);
  assert.equal(f.requests.length, 1);
  assert.equal((await readCurrent(f.cache)).digest, f.installed.digest);
  assert.equal((await updateStatus(f.cache)).available.version, '1.0.0-rc.4');
  await setUpdatePolicy(f.cache, { mode: 'auto', consent: true });
  await checkForUpdates(f.cache, f.trust, { ...options, force: true });
  assert.equal(f.requests.length, 3);
  assert.equal((await readCurrent(f.cache)).digest, f.installed.digest);
  await checkForUpdates(f.cache, f.trust, { ...options, force: true });
  assert.equal(f.requests.length, 4, 'repeat pending check fetches only metadata, not the verified payload again');
  const next = await selectSessionRuntime(f.cache, f.trust, options);
  assert.equal(next.productVersion, '1.0.0-rc.4');
  assert.equal(f.installed.productVersion, '1.0.0-rc.3');
  assert.equal(await readFile(f.installed.entry, 'utf8'), f.a.main.toString());
}));
test('disabling Auto or pinning after staging prevents future activation; explicit pin persists', () => updateFixture(async f => {
  const opts = { fetcher: f.fetcher, readiness: async () => true, ownership: async () => true };
  await setUpdatePolicy(f.cache, { mode: 'auto', consent: true });
  await checkForUpdates(f.cache, f.trust, opts);
  await setUpdatePolicy(f.cache, { mode: 'notify' });
  assert.equal((await selectSessionRuntime(f.cache, f.trust, opts)).digest, f.installed.digest);
  await setUpdatePolicy(f.cache, { mode: 'pinned', pin: { version: f.installed.productVersion, digest: f.installed.digest } });
  const count = f.requests.length;
  await checkForUpdates(f.cache, f.trust, { ...opts, force: true });
  assert.equal(f.requests.length, count);
  assert.equal((await selectSessionRuntime(f.cache, f.trust, opts)).digest, f.installed.digest);
}));
test('shared lock, TTL, network failure and far clock skew bound checks without blocking the installed runtime', () => updateFixture(async f => {
  const now = 1_800_000_000_000;
  await Promise.all(Array.from({ length: 5 }, () => checkForUpdates(f.cache, f.trust, { fetcher: f.fetcher, now })));
  assert.equal(f.requests.length, 1);
  await checkForUpdates(f.cache, f.trust, { fetcher: f.fetcher, now: now - 100 });
  assert.equal(f.requests.length, 1);
  let failedRequests = 0;
  const offline = async () => { failedRequests++; throw Error('private network detail'); };
  await checkForUpdates(f.cache, f.trust, { fetcher: offline, now: now + 86_400_000 });
  await checkForUpdates(f.cache, f.trust, { fetcher: offline, now: now + 86_400_001 });
  assert.equal(failedRequests, 1);
  await checkForUpdates(f.cache, f.trust, { fetcher: offline, now: now - 2 * 86_400_000 });
  await checkForUpdates(f.cache, f.trust, { fetcher: offline, now: now - 2 * 86_400_000 + 1 });
  assert.equal(failedRequests, 2);
  assert.equal((await selectSessionRuntime(f.cache, f.trust)).digest, f.installed.digest);
  assert(!JSON.stringify(await updateStatus(f.cache)).includes('private network'));
}));
test('incompatible skills/schema/browser and edited ownership hold before download or activation', () => updateFixture(async f => {
  await setUpdatePolicy(f.cache, { mode: 'auto', consent: true });
  let next = 4;
  for (const change of [{ skills: 'd'.repeat(64) }, { storageWrite: 'd'.repeat(64) }, { permissions: ['new_access'] }]) {
    f.release(f.bundle(`1.0.0-rc.${next}`, { ...f.generation, ...change }), next++);
    await checkForUpdates(f.cache, f.trust, { fetcher: f.fetcher, force: true });
    assert.equal((await updateStatus(f.cache)).hold, 'UPDATE_INCOMPATIBLE');
  }
  assert.equal(f.requests.length, 3);
  assert.equal((await readCurrent(f.cache)).digest, f.installed.digest);
}));
test('failed readiness quarantines exact B; repeat metadata does not retry it; manual retry is explicit', () => updateFixture(async f => {
  await setUpdatePolicy(f.cache, { mode: 'auto', consent: true });
  let smokes = 0;
  const options = { fetcher: f.fetcher, readiness: async () => { smokes++; return false; }, ownership: async () => true };
  await checkForUpdates(f.cache, f.trust, options);
  await checkForUpdates(f.cache, f.trust, { ...options, force: true });
  assert.equal(smokes, 1);
  assert.equal((await readCurrent(f.cache)).digest, f.installed.digest);
  assert.equal((await updateStatus(f.cache)).hold, 'UPDATE_QUARANTINED');
  await retryQuarantine(f.cache, JSON.parse(f.b.manifest) && f.b.asset.manifestSha256);
  await checkForUpdates(f.cache, f.trust, { ...options, force: true });
  assert.equal(smokes, 2);
}));
test('read-only status and selection survive unavailable endpoint; corrupt staged payload never activates', () => updateFixture(async f => {
  assert.equal((await updateStatus(f.cache)).mode, 'notify');
  assert.equal(f.requests.length, 0);
  await setUpdatePolicy(f.cache, { mode: 'auto', consent: true });
  const opts = { fetcher: f.fetcher, readiness: async () => true, ownership: async () => true };
  await checkForUpdates(f.cache, f.trust, opts);
  await writeFile(join(f.cache, 'versions', f.b.asset.manifestSha256, 'main.cjs'), 'edited');
  assert.equal((await selectSessionRuntime(f.cache, f.trust, opts)).digest, f.installed.digest);
  await mkdir(join(f.cache, '.install.lock'));
  assert.equal((await selectSessionRuntime(f.cache, f.trust, opts)).digest, f.installed.digest);
  await rm(join(f.cache, '.install.lock'), { recursive: true });
}));
test('pre-operation startup failure restores only an allowed previous generation; no operation is replayed', () => updateFixture(async f => {
  const options = { fetcher: f.fetcher, readiness: async () => true, ownership: async () => true };
  await setUpdatePolicy(f.cache, { mode: 'auto', consent: true });
  await checkForUpdates(f.cache, f.trust, options);
  const selected = await selectSessionRuntime(f.cache, f.trust, options);
  assert.equal(selected.productVersion, '1.0.0-rc.4');
  await assert.rejects(rollbackGeneration(f.cache, { readiness: async () => false }), /UPDATE_ROLLBACK_UNAVAILABLE/);
  assert.equal((await readCurrent(f.cache)).digest, selected.digest);
  await quarantineStartup(f.cache, selected.digest, f.installed, { readiness: async () => true });
  assert.equal((await readCurrent(f.cache)).digest, f.installed.digest);
  assert.equal((await updateStatus(f.cache)).hold, 'UPDATE_QUARANTINED');
  const calls = f.requests.length;
  await selectSessionRuntime(f.cache, f.trust, options);
  assert.equal(f.requests.length, calls);
}));
test('edited/pinned host integration defers activation while retaining the verified candidate', () => updateFixture(async f => {
  const options = { fetcher: f.fetcher, readiness: async () => true, ownership: async () => false };
  await setUpdatePolicy(f.cache, { mode: 'auto', consent: true });
  await checkForUpdates(f.cache, f.trust, options);
  assert.equal((await selectSessionRuntime(f.cache, f.trust, options)).digest, f.installed.digest);
  assert.equal((await updateStatus(f.cache)).hold, 'UPDATE_INTEGRATION_HELD');
  assert.equal((await updateStatus(f.cache)).pending.version, '1.0.0-rc.4');
  assert.equal((await selectSessionRuntime(f.cache, f.trust, { ...options, ownership: async () => true })).productVersion, '1.0.0-rc.4');
}));
