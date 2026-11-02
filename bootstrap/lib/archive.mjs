import { gzipSync, gunzipSync } from 'node:zlib';
import { posix } from 'node:path';

const MAX_BYTES = 512 * 1024 * 1024;
export function validArchivePath(path) {
  return typeof path === 'string' && path.length <= 255 && /^[A-Za-z0-9_.@ -]+(?:\/[A-Za-z0-9_.@ -]+)*$/.test(path)
    && path.split('/').every(part => part !== '.' && part !== '..' && !/[. ]$/.test(part) && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
}
function field(header, offset, length) { return header.subarray(offset, offset + length).toString('utf8').replace(/\0.*$/s, ''); }
function octal(header, offset, length) {
  const value = field(header, offset, length).trim();
  if (!/^[0-7]+$/.test(value)) throw Error('ARCHIVE_NUMBER');
  const result = Number.parseInt(value, 8); if (!Number.isSafeInteger(result)) throw Error('ARCHIVE_NUMBER'); return result;
}
function checksum(header) { return header.reduce((sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte), 0); }
export function validateBundleLinks(files) {
  const links = new Map(files.filter(file => file.kind === 'symlink').map(file => [file.path, file]));
  const regular = files.filter(file => file.kind !== 'symlink').map(file => file.path);
  function target(file) {
    const prefix = file.path.split('/').slice(0, 3).join('/') + '/';
    if (!/^bundled-browser\/browser\/chromium-[0-9]+\//.test(file.path) || typeof file.target !== 'string' || file.target.length > 100 || file.target.includes('\\') || posix.isAbsolute(file.target)) throw Error('ARCHIVE_LINK');
    let concrete = false;
    for (const part of file.target.split('/')) {
      if (!part || ((part === '.' || part === '..') && concrete)) throw Error('ARCHIVE_LINK');
      if (part !== '.' && part !== '..') concrete = true;
    }
    const resolved = posix.normalize(posix.join(posix.dirname(file.path), file.target));
    if (!validArchivePath(resolved) || !resolved.startsWith(prefix)) throw Error('ARCHIVE_LINK');
    return resolved;
  }
  function resolveLink(path, visited = new Set()) {
    for (const [name, file] of links) if (path === name || path.startsWith(name + '/')) {
      if (visited.has(name) || visited.size >= 64) throw Error('ARCHIVE_LINK');
      return resolveLink(target(file) + path.slice(name.length), new Set([...visited, name]));
    }
    if (!regular.some(name => name === path || name.startsWith(path + '/'))) throw Error('ARCHIVE_LINK');
    return path;
  }
  for (const file of links.values()) {
    if (files.some(other => other.path.startsWith(file.path + '/'))) throw Error('ARCHIVE_LINK');
    resolveLink(target(file), new Set([file.path]));
  }
}
export function decodeRuntimeArchive(compressed, options = {}) {
  if (!Buffer.isBuffer(compressed) || compressed.length > MAX_BYTES) throw Error('ARCHIVE_SIZE');
  const tar = gunzipSync(compressed, { maxOutputLength: MAX_BYTES });
  if (tar.length % 512) throw Error('ARCHIVE_TRUNCATED');
  const files = [], seen = new Set(); let offset = 0;
  while (offset < tar.length) {
    const header = tar.subarray(offset, offset + 512); offset += 512;
    if (header.every(byte => byte === 0)) {
      if (!tar.subarray(offset).every(byte => byte === 0)) throw Error('ARCHIVE_TRAILING_DATA');
      validateBundleLinks(files); return files;
    }
    if (octal(header, 148, 8) !== checksum(header)) throw Error('ARCHIVE_CHECKSUM');
    const isLink = header[156] === 50;
    if (header[156] !== 0 && header[156] !== 48 && !(isLink && options.allowBundleLinks === true)) throw Error('ARCHIVE_TYPE');
    const prefix = field(header, 345, 155), name = field(header, 0, 100), path = prefix ? prefix + '/' + name : name;
    if (!validArchivePath(path) || seen.has(path.toLowerCase())) throw Error('ARCHIVE_PATH'); seen.add(path.toLowerCase());
    const size = octal(header, 124, 12), mode = octal(header, 100, 8);
    if (isLink) { if (size !== 0) throw Error('ARCHIVE_LINK'); files.push({ path, kind: 'symlink', target: field(header, 157, 100) }); continue; }
    if (size > MAX_BYTES || offset + size > tar.length || files.length >= 4096) throw Error('ARCHIVE_SIZE');
    files.push({ path, bytes: Buffer.from(tar.subarray(offset, offset + size)), ...(mode & 0o111 ? { executable: true } : {}) });
    offset += Math.ceil(size / 512) * 512;
  }
  throw Error('ARCHIVE_TERMINATOR_MISSING');
}
export function encodeRuntimeArchive(files) {
  validateBundleLinks(files);
  const chunks = [], seen = new Set(); let total = 1024;
  for (const file of files) {
    if (!validArchivePath(file.path) || seen.has(file.path.toLowerCase())) throw Error('ARCHIVE_PATH'); seen.add(file.path.toLowerCase());
    const isLink = file.kind === 'symlink', data = isLink ? Buffer.alloc(0) : file.bytes;
    if (!Buffer.isBuffer(data) || files.length > 4096) throw Error('ARCHIVE_SIZE');
    const header = Buffer.alloc(512);
    let name = file.path, prefix = '';
    if (Buffer.byteLength(name) > 100) { const split = name.lastIndexOf('/'); prefix = name.slice(0, split); name = name.slice(split + 1); }
    if (Buffer.byteLength(name) > 100 || Buffer.byteLength(prefix) > 155) throw Error('ARCHIVE_PATH');
    header.write(name, 0); header.write(prefix, 345);
    const number = (value, offset, length) => { const text = value.toString(8).padStart(length - 1, '0'); if (text.length >= length) throw Error('ARCHIVE_SIZE'); header.write(text + '\0', offset); };
    number(file.executable ? 0o755 : 0o644, 100, 8); number(0, 108, 8); number(0, 116, 8); number(data.length, 124, 12); number(0, 136, 12);
    header[156] = isLink ? 50 : 48;
    if (isLink) header.write(file.target, 157);
    header.write('ustar\0', 257); header.write('00', 263);
    header.write(checksum(header).toString(8).padStart(6, '0') + '\0 ', 148);
    const padding = Buffer.alloc((512 - data.length % 512) % 512);
    total += 512 + data.length + padding.length; if (total > MAX_BYTES) throw Error('ARCHIVE_SIZE');
    chunks.push(header, data, padding);
  }
  return gzipSync(Buffer.concat([...chunks, Buffer.alloc(1024)]));
}
