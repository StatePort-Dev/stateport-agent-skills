import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, realpath, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readUpdatePolicy, setUpdatePolicy, checkDue, compatibleGeneration,validGeneration } from '../lib/update-policy.mjs';
import { installCandidate } from '../lib/install.mjs';

test('Notify default never silently acquires Auto consent; repeat setup preserves exact pin/channel', async () => {
  const cache = await mkdtemp(join(await realpath(tmpdir()), 'stateport-policy-'));
  try {
    assert.equal((await readUpdatePolicy(cache)).mode, 'notify');
    assert.equal((await readUpdatePolicy(cache)).channel, 'stable');
    await assert.rejects(setUpdatePolicy(cache, { mode: 'auto' }), /UPDATE_CONSENT_REQUIRED/);
    assert.equal((await setUpdatePolicy(cache, { mode: 'auto', consent: true })).mode, 'auto');
    const source = join(cache, 'fixture'); await mkdir(source);
    const sha = bytes => createHash('sha256').update(bytes).digest('hex');
    await writeFile(join(source, 'main.cjs'), 'synthetic');
    const raw = JSON.stringify({ schemaVersion: 'agent-runtime-candidate/1.0.0', productVersion: '1.0.0-rc.3', platform: process.platform, arch: process.arch, entry: 'main.cjs', nodeCandidate: '24.x', files: [{ path: 'main.cjs', bytes: 9, sha256: sha('synthetic') }] });
    await writeFile(join(source, 'candidate.json'), raw);
    const installed = await installCandidate({ source, cache, manifestSha256: sha(raw) });
    const pin = { version: installed.productVersion, digest: installed.digest };
    await setUpdatePolicy(cache, { mode: 'pinned', pin });
    assert.deepEqual((await readUpdatePolicy(cache)).pin, pin);
    await assert.rejects(setUpdatePolicy(cache, { mode: 'notify' }), /PIN_RELEASE_REQUIRED/);
    assert.equal((await setUpdatePolicy(cache, { mode: 'notify', releasePin: true })).mode, 'notify');
  } finally { await rm(cache, { recursive: true, force: true }); }
});
test('one 24h TTL covers failures/repeated projects and bounds clock skew', () => {
  const now = 1_800_000_000_000;
  assert.equal(checkDue({}, now), true);
  assert.equal(checkDue({ checkedAt: now - 100 }, now), false);
  assert.equal(checkDue({ checkedAt: now - 86_400_000 }, now), true);
  assert.equal(checkDue({ checkedAt: now + 60_000 }, now), false);
  assert.equal(checkDue({ checkedAt: now + 86_400_001 }, now), true);
});
test('generation compatibility is explicit, exact and conservative, including skills/storage/browser/permissions', () => {
  const a = { schemaVersion: 'agent-generation/1', launcher: 1, nodeMajor: 24, nativeABI: process.versions.modules,
    platform: process.platform, arch: process.arch, task: 'agent-task/1', taskSession: 'agent-task-session/1',
    mcp: 'a'.repeat(64), skills: 'b'.repeat(64), storageRead: 'c'.repeat(64), storageWrite: 'c'.repeat(64),
    browser: { preference: 'system', playwright: '1.63.0', payload: null }, permissions: ['owned-runtime'] };
  assert.equal(compatibleGeneration(a, structuredClone(a)), null);
  for (const field of ['launcher', 'nodeMajor', 'nativeABI', 'task', 'mcp', 'skills', 'storageWrite', 'permissions']) {
    assert.equal(compatibleGeneration(a, { ...a, [field]: 'changed' }), 'UPDATE_INCOMPATIBLE');
  }
  assert.equal(compatibleGeneration(a, { ...a, browser: { ...a.browser, preference: 'pinned' } }), 'UPDATE_INCOMPATIBLE');
  const dependencyUpdate={...a,browser:{...a.browser,playwright:'1.64.0'}};
  assert.equal(validGeneration(dependencyUpdate),true,'signed manifest version is structural, not an npm bootstrap dependency');
  assert.equal(validGeneration({...a,browser:{...a.browser,playwright:['1.64.0']}}),false);
  assert.equal(compatibleGeneration(a,dependencyUpdate),'UPDATE_INCOMPATIBLE','running-generation compatibility stays exact');
  assert.equal(compatibleGeneration(a, { ...a, unknownPermission: true }), 'UPDATE_INCOMPATIBLE');
  assert.equal(compatibleGeneration(undefined, a), 'UPDATE_INCOMPATIBLE');
});
