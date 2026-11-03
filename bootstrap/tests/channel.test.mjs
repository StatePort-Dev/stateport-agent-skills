import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { verifyChannelEnvelope } from '../lib/release.mjs';

test('signed channel binds publisher/channel/sequence and rejects replay and same-version digest replacement', () => {
  const key = generateKeyPairSync('ed25519');
  const trust = { status: 'published', keyId: 'fixture', publicKey: key.publicKey.export({ type: 'spki', format: 'pem' }), publisher: 'StatePort-Dev', channel: 'rc' };
  const asset = { bytes: 100, sha256: 'a'.repeat(64), manifestSha256: 'b'.repeat(64), url: 'https://github.com/StatePort-Dev/stateport-releases/releases/download/fixture/runtime.tar.gz' };
  const doc = { schemaVersion: 'agent-runtime-release/2', version: '1.0.0-rc.4', publisher: trust.publisher, channel: 'rc', sequence: 2,
    assets: [['linux','x64'],['win32','x64'],['darwin','arm64']].map(([platform, arch]) => ({ platform, arch, ...asset, browserFallback: asset })) };
  const envelope = value => { const bytes = Buffer.from(JSON.stringify(value)); return { keyId: trust.keyId, payload: bytes.toString('base64'), signature: sign(null, bytes, key.privateKey).toString('base64') }; };
  const verified = verifyChannelEnvelope(envelope(doc), trust, {});
  assert.equal(verified.document.version, doc.version);
  assert.throws(() => verifyChannelEnvelope(envelope(doc), { ...trust, publisher: 'foreign' }, {}), /RELEASE_PUBLISHER/);
  assert.throws(() => verifyChannelEnvelope(envelope(doc), { ...trust, channel: 'stable' }, {}), /RELEASE_CHANNEL/);
  assert.throws(() => verifyChannelEnvelope(envelope(doc), trust, { sequence: 3 }), /RELEASE_REPLAY/);
  assert.throws(() => verifyChannelEnvelope(envelope(doc), trust, { sequence: 2, releaseDigest: 'c'.repeat(64) }), /RELEASE_REPLAY/);
  assert.throws(() => verifyChannelEnvelope(envelope(doc), trust, { sequence: 1, version: doc.version, releaseDigest: 'c'.repeat(64) }), /RELEASE_VERSION_REPLACED/);
  assert.throws(() => verifyChannelEnvelope(envelope({ ...doc, version: '1.0.0-rc.2' }), trust, { sequence: 1, version: '1.0.0-rc.3' }), /RELEASE_DOWNGRADE/);
  assert.throws(() => verifyChannelEnvelope(envelope({ ...doc, command: 'remote shell' }), trust, {}), /RELEASE_SCHEMA/);
  const bad = envelope(doc); bad.signature = Buffer.alloc(64).toString('base64');
  assert.throws(() => verifyChannelEnvelope(bad, trust, {}), /RELEASE_SIGNATURE/);
  assert.equal(verified.digest, createHash('sha256').update(Buffer.from(bad.payload, 'base64')).digest('hex'));
});
