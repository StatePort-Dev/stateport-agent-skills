import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { installCandidate, rollback, uninstallPointer, readCurrent, stageCandidate, activateCandidate, readInstalled } from '../lib/install.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function fixture(run) {
  const root = await mkdtemp(join(await realpath(tmpdir()), 'stateport-bootstrap-'));
  try {
    const source = join(root, 'source'), cache = join(root, 'cache'); await mkdir(source);
    const content = 'process.stdout.write("synthetic runtime");';
    const manifest = { schemaVersion: 'agent-runtime-candidate/1.0.0', productVersion: '1.0.0-rc.3', platform: process.platform, arch: process.arch, entry: 'main.cjs', nodeCandidate: '24.x', files: [{ path: 'main.cjs', bytes: Buffer.byteLength(content), sha256: sha(content) }] };
    await writeFile(join(source, 'main.cjs'), content);
    async function save() { const bytes = JSON.stringify(manifest); await writeFile(join(source, 'candidate.json'), bytes); return sha(bytes); }
    await run({ root, source, cache, manifest, save });
  } finally { await rm(root, { recursive: true, force: true }); }
}
test('stages B without selecting it, then activates only an intact exact generation and retains A', () => fixture(async ({ source, cache, manifest, save }) => {
  const first = await installCandidate({ source, cache, manifestSha256: await save() });
  manifest.productVersion = '1.0.0-rc.4';
  const second = await stageCandidate({ source, cache, manifestSha256: await save() });
  assert.equal((await readCurrent(cache)).digest, first.digest);
  assert.equal((await readInstalled(cache, second.digest)).productVersion, '1.0.0-rc.4');
  await activateCandidate(cache, second.digest);
  assert.equal((await readCurrent(cache)).digest, second.digest);
  assert.equal((await rollback(cache)).digest, first.digest);
  await writeFile(join(second.runtimeRoot, 'main.cjs'), 'edited staged runtime');
  await assert.rejects(activateCandidate(cache, second.digest), /PAYLOAD_INTEGRITY|UNSAFE_PATH/);
  assert.equal((await readCurrent(cache)).digest, first.digest);
}));
test('installs exactly verified files, repeats without rewriting, rolls back and retains runtime/user data', () => fixture(async ({ source, cache, root, manifest, save }) => {
  const first = await installCandidate({ source, cache, manifestSha256: await save() });
  assert.equal(first.unchanged, false);
  assert.equal((await installCandidate({ source, cache, manifestSha256: await save() })).unchanged, true);
  manifest.productVersion = '1.0.0-rc.4';
  const second = await installCandidate({ source, cache, manifestSha256: await save() });
  assert.notEqual(first.digest, second.digest);
  assert.equal((await rollback(cache)).digest, first.digest);
  await mkdir(join(root, 'cards')); await writeFile(join(root, 'cards', 'preserve'), 'synthetic user data');
  await uninstallPointer(cache);
  assert.equal(await readCurrent(cache), undefined);
  assert.equal(await readFile(join(first.runtimeRoot, 'main.cjs'), 'utf8'), 'process.stdout.write("synthetic runtime");');
  assert.equal(await readFile(join(root, 'cards', 'preserve'), 'utf8'), 'synthetic user data');
}));
test('refuses hash mismatch, changed source, wrong platform and edited cached payload without executing it', () => fixture(async ({ source, cache, manifest, save }) => {
  const digest = await save();
  await assert.rejects(installCandidate({ source, cache, manifestSha256: '0'.repeat(64) }), /MANIFEST_INTEGRITY/);
  await writeFile(join(source, 'main.cjs'), 'changed');
  await assert.rejects(installCandidate({ source, cache, manifestSha256: digest }), /PAYLOAD_INTEGRITY/);
  manifest.platform = 'unsupported';
  await assert.rejects(installCandidate({ source, cache, manifestSha256: await save() }), /PLATFORM/);
}));
test('refuses an edited installed payload instead of repairing or executing it on repeat', () => fixture(async ({ source, cache, save }) => {
  const digest = await save(), installed = await installCandidate({ source, cache, manifestSha256: digest });
  await writeFile(join(installed.runtimeRoot, 'main.cjs'), 'foreign edited cached code');
  await assert.rejects(readCurrent(cache), /PAYLOAD_INTEGRITY|UNSAFE_PATH/);
  await assert.rejects(installCandidate({ source, cache, manifestSha256: digest }), /PAYLOAD_INTEGRITY|UNSAFE_PATH/);
  assert.equal(await readFile(join(installed.runtimeRoot, 'main.cjs'), 'utf8'), 'foreign edited cached code');
}));
test('requires the new archive declaration for 1.2 while retaining legacy manifests', () => fixture(async ({ source, cache, manifest, save }) => {
  await installCandidate({ source, cache, manifestSha256: await save() });
  manifest.schemaVersion = 'agent-runtime-candidate/1.2.0';
  await assert.rejects(installCandidate({ source, cache, manifestSha256: await save() }), /MANIFEST_INVALID/);
  manifest.archiveFormat = 'ustar+pax-path/1';
  assert.equal((await installCandidate({ source, cache, manifestSha256: await save() })).productVersion, manifest.productVersion);
}));
test('refuses concurrent or uncertain interrupted ownership while retaining the working pointer', () => fixture(async ({ source, cache, manifest, save }) => {
  const first = await installCandidate({ source, cache, manifestSha256: await save() });
  manifest.productVersion = '1.0.0-rc.4'; const nextDigest = await save();
  await mkdir(join(cache, '.install.lock'));
  await assert.rejects(installCandidate({ source, cache, manifestSha256: nextDigest }), /INSTALL_BUSY_OR_RECOVERY_REQUIRED/);
  assert.equal((await readCurrent(cache)).digest, first.digest);
  // Only the fixture owner releases its synthetic lock, simulating human recovery.
  await rm(join(cache, '.install.lock'), { recursive: true });
  assert.equal((await installCandidate({ source, cache, manifestSha256: nextDigest })).digest, nextDigest);
}));
for (const path of ['../outside', '/absolute', 'C:\\absolute', 'nested/../outside', 'a\\b', 'a//b', 'node_modules/../../outside']) test(`rejects traversal path ${path}`, () => fixture(async ({ source, cache, manifest, save }) => {
  manifest.files[0].path = path;
  await assert.rejects(installCandidate({ source, cache, manifestSha256: await save() }), /MANIFEST_PATH/);
}));
test('rejects source and cache symlinks/junctions before copying or switching', () => fixture(async ({ source, cache, root, save }) => {
  const digest = await save();
  const outside = join(root, 'outside'); await mkdir(outside);
  await symlink(outside, cache, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(installCandidate({ source, cache, manifestSha256: digest }), /UNSAFE_PATH/);
  await rm(cache);
  if (process.platform === 'win32') {
    await rm(source, { recursive: true }); await symlink(outside, source, 'junction');
  } else {
    await rm(join(source, 'main.cjs')); await symlink(join(root, 'outside', 'file'), join(source, 'main.cjs'), 'file');
  }
  await assert.rejects(installCandidate({ source, cache, manifestSha256: digest }), /UNSAFE_PATH/);
}));
