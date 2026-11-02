import { createHash, verify } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { decodeRuntimeArchive } from './archive.mjs';
import { installCandidate } from './install.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
function trustedUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || !['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com'].includes(url.hostname)) throw Error('RELEASE_URL');
  if (url.hostname === 'github.com' && !url.pathname.startsWith('/StatePort-Dev/stateport-releases/releases/download/')) throw Error('RELEASE_URL');
  return url.href;
}
export function verifyReleaseEnvelope(envelope, config) {
  if (config.status !== 'published') throw Error('RELEASE_UNPUBLISHED');
  if (!config.publicKey || envelope?.keyId !== config.keyId) throw Error('RELEASE_KEY');
  if (typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(envelope.payload) || !/^[A-Za-z0-9+/]+={0,2}$/.test(envelope.signature)) throw Error('RELEASE_INTEGRITY');
  const bytes = Buffer.from(envelope.payload, 'base64');
  if (bytes.length > 1024 * 1024 || !hex(config.manifestSha256) || sha(bytes) !== config.manifestSha256) throw Error('RELEASE_INTEGRITY');
  if (!verify(null, bytes, config.publicKey, Buffer.from(envelope.signature, 'base64'))) throw Error('RELEASE_SIGNATURE');
  const document = JSON.parse(bytes.toString('utf8'));
  if (document.schemaVersion !== 'agent-runtime-release/1' || document.version !== config.version) throw Error('RELEASE_VERSION');
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
async function download(url, maximumBytes, fetcher) {
  url = trustedUrl(url);
  for (let hop = 0; hop <= 5; hop++) {
    const response = await fetcher(url, { redirect: 'manual', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(120_000) });
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
  const platform = document.assets.find(asset => asset.platform === process.platform && asset.arch === process.arch);
  if (!platform) throw Error('PLATFORM_UNSUPPORTED');
  const asset = options.browserPreference === 'pinned' ? platform.browserFallback : platform;
  if (options.browserPreference === 'pinned' && options.confirmDownload !== asset.sha256) return {
    status: 'browser_download_required', bytes: asset.bytes, sha256: asset.sha256, version: document.version,
    action: 'Repeat browser-install with --confirm-download and this exact SHA-256 after host approval. No browser downloaded yet.',
  };
  options.onDownload?.({ bytes: asset.bytes, version: document.version, browser: options.browserPreference === 'pinned' ? 'pinned_chromium' : 'system' });
  const bytes = await download(asset.url, asset.bytes, fetcher);
  if (bytes.length !== asset.bytes || sha(bytes) !== asset.sha256) throw Error('RELEASE_ASSET_INTEGRITY');
  const files = decodeRuntimeArchive(bytes, { allowBundleLinks: true });
  const metadataFile = files.find(file => file.path === 'candidate.json');
  if (!metadataFile || sha(metadataFile.bytes) !== asset.manifestSha256) throw Error('RELEASE_ASSET_INTEGRITY');
  const metadata = JSON.parse(metadataFile.bytes.toString('utf8'));
  if ((metadata.browserPreference ?? 'system') !== (options.browserPreference ?? 'system')) throw Error('RELEASE_BROWSER_VARIANT');
  const temporary = await mkdtemp(join(tmpdir(), 'stateport-release-'));
  try {
    for (const file of files.filter(file => file.kind !== 'symlink')) {
      const path = join(temporary, file.path); await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      await writeFile(path, file.bytes, { flag: 'wx', mode: file.executable ? 0o700 : 0o600 });
    }
    for (const file of files.filter(file => file.kind === 'symlink')) {
      if (process.platform === 'win32') throw Error('BUNDLE_LINK_UNSUPPORTED');
      const path = join(temporary, file.path); await mkdir(dirname(path), { recursive: true, mode: 0o700 }); await symlink(file.target, path);
    }
    return await installCandidate({ source: temporary, cache, manifestSha256: asset.manifestSha256 });
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
