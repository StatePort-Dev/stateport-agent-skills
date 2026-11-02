import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { verifyReleaseEnvelope } from '../lib/release.mjs';

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
