import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { verifyReleaseEnvelope, installPublishedRelease } from '../lib/release.mjs';
import { encodeRuntimeArchive } from '../lib/archive.mjs';
import { readCurrent } from '../lib/install.mjs';
import { mkdtemp, rm, mkdir, realpath, symlink, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('requires an independently pinned signing key, version and manifest digest', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const payload = { bytes: 100, sha256: 'a'.repeat(64), manifestSha256: 'b'.repeat(64), url: 'https://github.com/StatePort-Dev/stateport-releases/releases/download/candidate/runtime.tar.gz' };
  const document = Buffer.from(JSON.stringify({ schemaVersion: 'agent-runtime-release/1', version: '1.0.0-rc.3', assets: [['linux','x64'],['win32','x64'],['darwin','arm64']].map(([platform,arch]) => ({ platform, arch, ...payload, browserFallback: payload })) }));
  const config = { status: 'published', keyId: 'release-key', publicKey: publicKey.export({ type: 'spki', format: 'pem' }), version: '1.0.0-rc.3', manifestSha256: createHash('sha256').update(document).digest('hex') };
  const envelope = { keyId: config.keyId, payload: document.toString('base64'), signature: sign(null, document, privateKey).toString('base64') };
  assert.equal(verifyReleaseEnvelope(envelope, config).version, config.version);
  assert.throws(() => verifyReleaseEnvelope(envelope, { ...config, status: 'unpublished' }), /RELEASE_UNPUBLISHED/);
  assert.throws(() => verifyReleaseEnvelope({ ...envelope, payload: Buffer.from('tampered').toString('base64') }, config), /RELEASE_INTEGRITY/);
  assert.throws(() => verifyReleaseEnvelope({ ...envelope, keyId: 'other' }, config), /RELEASE_KEY/);
  const other = generateKeyPairSync('ed25519');
  assert.throws(() => verifyReleaseEnvelope(envelope, { ...config, publicKey: other.publicKey.export({ type: 'spki', format: 'pem' }) }), /RELEASE_SIGNATURE/);
  assert.throws(() => verifyReleaseEnvelope(envelope, { ...config, version: '1.0.0-rc.4' }), /RELEASE_VERSION/);
});

test('authenticates the complete downloaded closure before switching and requires explicit browser download consent', async () => {
  const root = await mkdtemp(join(await realpath(tmpdir()), 'stateport-signed-fixture-'));
  const temporaryRoot = join(root, 'system-temp'); await mkdir(temporaryRoot);
  const alias = join(root, 'system-temp-alias'); await symlink(temporaryRoot, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const previous = Object.fromEntries(['TMPDIR', 'TEMP', 'TMP'].map(key => [key, process.env[key]]));
  for (const key of Object.keys(previous)) process.env[key] = alias;
  const hash = value => createHash('sha256').update(value).digest('hex');
  const base = 'https://github.com/StatePort-Dev/stateport-releases/releases/download/synthetic/';
  const key = generateKeyPairSync('ed25519');
  const main = Buffer.from('throw Error("MUST_NOT_EXECUTE_WHILE_INSTALLING");');
  const bundles = ['system', 'pinned'].map(browserPreference => {
    const manifest = Buffer.from(JSON.stringify({ schemaVersion: 'agent-runtime-candidate/1.0.0', productVersion: '1.0.0-rc.3', platform: process.platform, arch: process.arch, entry: 'main.cjs', nodeCandidate: '24.x', browserPreference, files: [{ path: 'main.cjs', bytes: main.length, sha256: hash(main) }] }));
    const archive = encodeRuntimeArchive([{ path: 'main.cjs', bytes: main }, { path: 'candidate.json', bytes: manifest }]);
    return { archive, asset: { url: base + browserPreference + '.tar.gz', bytes: archive.length, sha256: hash(archive), manifestSha256: hash(manifest) } };
  });
  const document = Buffer.from(JSON.stringify({ schemaVersion: 'agent-runtime-release/1', version: '1.0.0-rc.3', assets: [['linux', 'x64'], ['win32', 'x64'], ['darwin', 'arm64']].map(([platform, arch]) => ({ platform, arch, ...bundles[0].asset, browserFallback: bundles[1].asset })) }));
  const config = { status: 'published', keyId: 'synthetic', publicKey: key.publicKey.export({ type: 'spki', format: 'pem' }), version: '1.0.0-rc.3', manifestSha256: hash(document), url: base + 'release.json' };
  const envelope = JSON.stringify({ keyId: config.keyId, payload: document.toString('base64'), signature: sign(null, document, key.privateKey).toString('base64') });
  const requests = []; let corrupt = false;
  const fetcher = async (url, options) => {
    requests.push(url); assert.equal(options.redirect, 'manual');
    if (url === config.url) return new Response(envelope);
    const bundle = bundles.find(value => value.asset.url === url); assert.ok(bundle);
    return new Response(corrupt ? Buffer.from('corrupted') : bundle.archive);
  };
  try {
    const installed = await installPublishedRelease(config, root, fetcher);
    assert.equal(installed.browserPreference, 'system');
    requests.length = 0;
    const consent = await installPublishedRelease(config, root, fetcher, { browserPreference: 'pinned' });
    assert.equal(consent.status, 'browser_download_required');
    assert.deepEqual(requests, [config.url]);
    assert.equal((await readCurrent(root)).digest, installed.digest);
    corrupt = true;
    await assert.rejects(installPublishedRelease(config, root, fetcher, { browserPreference: 'pinned', confirmDownload: consent.sha256 }), /RELEASE_ASSET_INTEGRITY/);
    assert.equal((await readCurrent(root)).digest, installed.digest);
    corrupt = false;
    assert.equal((await installPublishedRelease(config, root, fetcher, { browserPreference: 'pinned', confirmDownload: consent.sha256 })).browserPreference, 'pinned');
    assert.deepEqual(await readdir(temporaryRoot), [], 'remove only owned extraction directories through the canonical system temp root');
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    await rm(root, { recursive: true, force: true });
  }
});
