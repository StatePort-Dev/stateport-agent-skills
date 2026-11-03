import { createHash, verify } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile, symlink, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { decodeRuntimeArchive } from './archive.mjs';
import { installCandidate } from './install.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function trustedUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || !['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com'].includes(url.hostname)) throw Error('RELEASE_URL');
  if (url.hostname === 'github.com' && !url.pathname.startsWith('/StatePort-Dev/stateport-releases/releases/download/')) throw Error('RELEASE_URL');
  return url.href;
}
function signedDocument(envelope, config, pinned = true) {
  if (config.status !== 'published') throw Error('RELEASE_UNPUBLISHED');
  if (!config.publicKey || envelope?.keyId !== config.keyId) throw Error('RELEASE_KEY');
  if (typeof envelope.payload !== 'string' || envelope.payload.length > 1398104 || typeof envelope.signature !== 'string' || envelope.signature.length !== 88 || !/^[A-Za-z0-9+/]+={0,2}$/.test(envelope.payload) || !/^[A-Za-z0-9+/]+={0,2}$/.test(envelope.signature)) throw Error('RELEASE_INTEGRITY');
  const bytes = Buffer.from(envelope.payload, 'base64');
  if (bytes.length > 1024 * 1024 || (pinned && (!hex(config.manifestSha256) || sha(bytes) !== config.manifestSha256))) throw Error('RELEASE_INTEGRITY');
  if (!verify(null, bytes, config.publicKey, Buffer.from(envelope.signature, 'base64'))) throw Error('RELEASE_SIGNATURE');
  return { document: JSON.parse(bytes.toString('utf8')), digest: sha(bytes) };
}
export function verifyReleaseEnvelope(envelope, config) {
  const { document } = signedDocument(envelope, config);
  if (document.schemaVersion !== 'agent-runtime-release/1' || document.version !== config.version) throw Error('RELEASE_VERSION');
  return validateAssets(document);
}
function validateAssets(document) {
  if (!Array.isArray(document.assets) || document.assets.length !== 3) {
    // A unit fixture can explicitly supply all three; publication cannot omit macOS.
    throw Error('RELEASE_PLATFORM_MATRIX');
  }
  const platforms = new Set();
  for (const asset of document.assets) {
    const key = `${asset.platform}-${asset.arch}`;
    if (!['linux-x64', 'win32-x64', 'darwin-arm64'].includes(key) || platforms.has(key)) throw Error('RELEASE_PLATFORM_MATRIX'); platforms.add(key);
    for (const payload of [asset, asset.browserFallback]) {
      if (!payload || !Number.isSafeInteger(payload.bytes) || payload.bytes < 1 || payload.bytes > 512 * 1024 * 1024 || !hex(payload.sha256) || !hex(payload.manifestSha256)) throw Error('RELEASE_ASSET');
      trustedUrl(payload.url);
    }
  }
  return document;
}
export async function download(url, maximumBytes, fetcher, options = {}) {
  url = trustedUrl(url);
  for (let hop = 0; hop <= 5; hop++) {
    const response = await fetcher(url, { redirect: 'manual', credentials: 'omit', referrerPolicy: 'no-referrer', signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(options.timeoutMs ?? 120_000)]) : AbortSignal.timeout(options.timeoutMs ?? 120_000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location'); await response.body?.cancel();
      if (!location) throw Error('RELEASE_HTTP'); url = trustedUrl(new URL(location, url).href); continue;
    }
    if (!response.ok || !response.body) throw Error('RELEASE_HTTP');
    const chunks = []; let size = 0;
    for await (const chunk of response.body) { size += chunk.length; if (size > maximumBytes) throw Error('RELEASE_SIZE'); chunks.push(Buffer.from(chunk)); }
    return Buffer.concat(chunks);
  }
  throw Error('RELEASE_REDIRECTS');
}
export async function installPublishedRelease(config, cache, fetcher = fetch, options = {}) {
  if (config.status !== 'published') throw Error('RELEASE_UNPUBLISHED');
  const envelope = JSON.parse((await download(config.url, 2 * 1024 * 1024, fetcher)).toString('utf8'));
  const document = verifyReleaseEnvelope(envelope, config);
  return installReleaseDocument(document, cache, fetcher, options);
}
/** One archive verifier/extractor for explicit and opportunistic delivery. */
export async function installReleaseDocument(document, cache, fetcher = fetch, options = {}) {
  validateAssets(document);
  const platform = document.assets.find(asset => asset.platform === process.platform && asset.arch === process.arch);
  if (!platform) throw Error('PLATFORM_UNSUPPORTED');
  const asset = options.browserPreference === 'pinned' ? platform.browserFallback : platform;
  if (options.browserPreference === 'pinned' && options.confirmDownload !== asset.sha256) return {
    status: 'browser_download_required', bytes: asset.bytes, sha256: asset.sha256, version: document.version,
    action: 'Repeat browser-install with --confirm-download and this exact SHA-256 after host approval. No browser downloaded yet.',
  };
  options.onDownload?.({ bytes: asset.bytes, version: document.version, browser: options.browserPreference === 'pinned' ? 'pinned_chromium' : 'system' });
  const bytes = await download(asset.url, asset.bytes, fetcher, options);
  if (bytes.length !== asset.bytes || sha(bytes) !== asset.sha256) throw Error('RELEASE_ASSET_INTEGRITY');
  const files = decodeRuntimeArchive(bytes, { allowBundleLinks: true, allowPathHeaders: true });
  const metadataFile = files.find(file => file.path === 'candidate.json');
  if (!metadataFile || sha(metadataFile.bytes) !== asset.manifestSha256) throw Error('RELEASE_ASSET_INTEGRITY');
  const metadata = JSON.parse(metadataFile.bytes.toString('utf8'));
  if (metadata.productVersion !== document.version) throw Error('RELEASE_VERSION');
  if (options.generation && JSON.stringify(metadata.generation) !== JSON.stringify(options.generation)) throw Error('RELEASE_GENERATION');
  if ((metadata.browserPreference ?? 'system') !== (options.browserPreference ?? 'system')) throw Error('RELEASE_BROWSER_VARIANT');
  // macOS aliases /var to /private/var. Resolve only the trusted OS temporary
  // root before allocating our unique directory; payload/cache paths stay strict.
  const temporary = await mkdtemp(join(await realpath(tmpdir()), 'stateport-release-'));
  try {
    for (const file of files.filter(file => file.kind !== 'symlink')) {
      const path = join(temporary, file.path); await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      await writeFile(path, file.bytes, { flag: 'wx', mode: file.executable ? 0o700 : 0o600 });
    }
    for (const file of files.filter(file => file.kind === 'symlink')) {
      if (process.platform === 'win32') throw Error('BUNDLE_LINK_UNSUPPORTED');
      const path = join(temporary, file.path); await mkdir(dirname(path), { recursive: true, mode: 0o700 }); await symlink(file.target, path);
    }
    return await (options.install ?? installCandidate)({ source: temporary, cache, manifestSha256: asset.manifestSha256 });
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

function semverParts(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(value)) throw Error('RELEASE_VERSION');
  const [base, ...suffix] = value.split('-');
  const parts = base.split('.').map(Number);
  if (parts.some(part => !Number.isSafeInteger(part))) throw Error('RELEASE_VERSION');
  const pre = suffix.join('-').split('.').filter(Boolean);
  if (pre.some(part => /^0\d+$/.test(part))) throw Error('RELEASE_VERSION');
  return { parts, pre };
}
export function compareVersions(a, b) {
  const x = semverParts(a), y = semverParts(b);
  for (let i = 0; i < 3; i++) if (x.parts[i] !== y.parts[i]) return Math.sign(x.parts[i] - y.parts[i]);
  if (!x.pre.length || !y.pre.length) return x.pre.length === y.pre.length ? 0 : x.pre.length ? -1 : 1;
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const a = x.pre[i], b = y.pre[i]; if (a === b) continue;
    if (a === undefined || b === undefined) return a === undefined ? -1 : 1;
    const an = /^\d+$/.test(a), bn = /^\d+$/.test(b);
    if (an && bn) return a.length === b.length ? (a < b ? -1 : 1) : Math.sign(a.length - b.length);
    if (an !== bn) return an ? -1 : 1;
    return a < b ? -1 : 1;
  }
  return 0;
}
/** Dynamic selection is authenticated by the same independently pinned key,
 * never by a digest returned beside an untrusted download. */
export function verifyChannelEnvelope(envelope, trust, highWater = {}) {
  const verified = signedDocument(envelope, trust, false), d = verified.document;
  const keys = 'assets,channel,publisher,schemaVersion,sequence,version';
  if (d.schemaVersion !== 'agent-runtime-release/2' || Object.keys(d).sort().join(',') !== keys || !Number.isSafeInteger(d.sequence) || d.sequence < 1) throw Error('RELEASE_SCHEMA');
  semverParts(d.version);
  if (d.publisher !== trust.publisher || trust.publisher !== 'StatePort-Dev') throw Error('RELEASE_PUBLISHER');
  if (d.channel !== trust.channel || !['stable', 'beta', 'rc'].includes(d.channel)) throw Error('RELEASE_CHANNEL');
  if ((d.channel === 'stable' && d.version.includes('-')) || (d.channel !== 'stable' && !d.version.includes(`-${d.channel}.`))) throw Error('RELEASE_CHANNEL');
  if (highWater.sequence && (d.sequence < highWater.sequence || (d.sequence === highWater.sequence && verified.digest !== highWater.releaseDigest))) throw Error('RELEASE_REPLAY');
  if (highWater.version && compareVersions(d.version, highWater.version) < 0) throw Error('RELEASE_DOWNGRADE');
  if (highWater.version === d.version && highWater.releaseDigest !== verified.digest) throw Error('RELEASE_VERSION_REPLACED');
  validateAssets(d);
  return verified;
}
