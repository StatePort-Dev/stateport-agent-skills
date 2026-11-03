import { generateKeyPairSync, sign, createHash } from 'node:crypto';
import { mkdtemp, rm, realpath, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encodeRuntimeArchive } from '../lib/archive.mjs';
import { installCandidate } from '../lib/install.mjs';

export const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function updateFixture(run) {
  const root = await mkdtemp(join(await realpath(tmpdir()), 'stateport-update-'));
  const cache = join(root, 'cache'), source = join(root, 'source'); await mkdir(source);
  const key = generateKeyPairSync('ed25519'), base = 'https://github.com/StatePort-Dev/stateport-releases/releases/download/fixture/';
  const generation = { schemaVersion: 'agent-generation/1', launcher: 1, nodeMajor: 24, nativeABI: process.versions.modules,
    platform: process.platform, arch: process.arch, task: 'agent-task/1', taskSession: 'agent-task-session/1', mcp: 'a'.repeat(64),
    skills: 'b'.repeat(64), storageRead: 'c'.repeat(64), storageWrite: 'c'.repeat(64), browser: { preference: 'system', playwright: '1.63.0', payload: null }, permissions: ['owned-runtime'] };
  function bundle(version, contract = generation) {
    const main = Buffer.from(`process.stdout.write(JSON.stringify({version:${JSON.stringify(version)},status:'ready',execution:'allowed',generation:${JSON.stringify(contract)}})+'\\n')`);
    const manifest = Buffer.from(JSON.stringify({ schemaVersion: 'agent-runtime-candidate/1.2.0', archiveFormat: 'ustar+pax-path/1',
      productVersion: version, platform: process.platform, arch: process.arch, nodeCandidate: '24.x', entry: 'main.cjs', browserPreference: contract.browser.preference,
      generation: contract, files: [{ path: 'main.cjs', bytes: main.length, sha256: sha(main) }] }));
    const archive = encodeRuntimeArchive([{ path: 'main.cjs', bytes: main }, { path: 'candidate.json', bytes: manifest }]);
    return { main, manifest, archive, asset: { url: base + version + '.tar.gz', bytes: archive.length, sha256: sha(archive), manifestSha256: sha(manifest), generation: contract } };
  }
  const a = bundle('1.0.0-rc.3'), b = bundle('1.0.0-rc.4');
  await writeFile(join(source, 'main.cjs'), a.main); await writeFile(join(source, 'candidate.json'), a.manifest);
  const installed = await installCandidate({ source, cache, manifestSha256: sha(a.manifest) });
  const trust = { status: 'published', keyId: 'fixture', publicKey: key.publicKey.export({ type: 'spki', format: 'pem' }), publisher: 'StatePort-Dev', channel: 'rc', url: base + 'channel.json' };
  let doc, envelope, candidate = b; const requests = [];
  const release = (next = b, sequence = 2) => {
    candidate = next;
    doc = { schemaVersion: 'agent-runtime-release/2', version: JSON.parse(next.manifest).productVersion, publisher: trust.publisher, channel: 'rc', sequence,
      assets: [['linux','x64'],['win32','x64'],['darwin','arm64']].map(([platform, arch]) => ({ platform, arch, ...next.asset, browserFallback: next.asset })) };
    const bytes = Buffer.from(JSON.stringify(doc)); envelope = { keyId: trust.keyId, payload: bytes.toString('base64'), signature: sign(null, bytes, key.privateKey).toString('base64') };
  }; release();
  const fetcher = async (url, options) => { requests.push({ url, options }); return new Response(url === trust.url ? JSON.stringify(envelope) : candidate.archive); };
  try { return await run({ root, cache, source, generation, a, b, installed, trust, fetcher, requests, bundle, release, getEnvelope: () => envelope }); }
  finally { await rm(root, { recursive: true, force: true }); }
}
