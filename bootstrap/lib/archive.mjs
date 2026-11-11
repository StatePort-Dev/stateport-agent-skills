import { gzipSync, gunzipSync } from 'node:zlib';
import { posix } from 'node:path';

const MAX_BYTES = 512 * 1024 * 1024;
export function validArchivePath(path, maximumLength = 1024) {
  return typeof path === 'string' && path.length <= maximumLength && /^[A-Za-z0-9_.@ ()+-]+(?:\/[A-Za-z0-9_.@ ()+-]+)*$/.test(path)
    && path.split('/').every(part => part.length <= 255 && part !== '.' && part !== '..' && !/[. ]$/.test(part) && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?: *\.| *$)/i.test(part));
}
function ustarParts(path) {
  if (Buffer.byteLength(path) > 255) return undefined;
  if (Buffer.byteLength(path) <= 100) return { name: path, prefix: '' };
  let split = path.lastIndexOf('/');
  while (split >= 0 && (Buffer.byteLength(path.slice(0, split)) > 155 || Buffer.byteLength(path.slice(split + 1)) > 100)) split = path.lastIndexOf('/', split - 1);
  return split < 0 ? undefined : { prefix: path.slice(0, split), name: path.slice(split + 1) };
}
function pathHeader(path) {
  const tail = ` path=${path}\n`; let size = Buffer.byteLength(tail) + 1;
  while (String(size).length + Buffer.byteLength(tail) !== size) size = String(size).length + Buffer.byteLength(tail);
  return Buffer.from(`${size}${tail}`);
}
function parsePathHeader(bytes) {
  const space = bytes.indexOf(32), length = bytes.subarray(0, space).toString('utf8');
  if (space < 1 || !/^[1-9][0-9]{0,3}$/.test(length) || Number(length) !== bytes.length || bytes.at(-1) !== 10 || bytes.subarray(space + 1, space + 6).toString('utf8') !== 'path=') throw Error('ARCHIVE_PAX');
  const path = bytes.subarray(space + 6, -1).toString('utf8');
  // One non-sticky path record for the verified browser closure only. No global,
  // linkpath, size, uid, xattr, duplicate record or arbitrary metadata overrides.
  if (!validArchivePath(path) || !/^bundled-browser\/browser\/chromium-[0-9]+\//.test(path) || ustarParts(path)) throw Error('ARCHIVE_PAX');
  return path;
}
function requirePathHeaderSchema(files) {
  const metadata = files.find(file => file.path === 'candidate.json');
  try {
    if (!metadata || !Buffer.isBuffer(metadata.bytes) || metadata.bytes.length > 1024 * 1024) throw Error();
    const value = JSON.parse(metadata.bytes.toString('utf8'));
    if (!['agent-runtime-candidate/1.2.0','agent-runtime-candidate/1.3.0'].includes(value.schemaVersion) || value.archiveFormat !== 'ustar+pax-path/1') throw Error();
  } catch { throw Error('ARCHIVE_SCHEMA'); }
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
  const files = [], seen = new Set(); let offset = 0, pendingPath, usesPathHeaders = false, headers = 0;
  while (offset < tar.length) {
    const header = tar.subarray(offset, offset + 512); offset += 512;
    if (header.every(byte => byte === 0)) {
      if (pendingPath !== undefined) throw Error('ARCHIVE_PAX');
      if (!tar.subarray(offset).every(byte => byte === 0)) throw Error('ARCHIVE_TRAILING_DATA');
      if (usesPathHeaders) requirePathHeaderSchema(files);
      validateBundleLinks(files); return files;
    }
    if (++headers > 8192) throw Error('ARCHIVE_SIZE');
    if (octal(header, 148, 8) !== checksum(header)) throw Error('ARCHIVE_CHECKSUM');
    const isLink = header[156] === 50, isPathHeader = header[156] === 120;
    if (header[156] !== 0 && header[156] !== 48 && !(isLink && options.allowBundleLinks === true) && !(isPathHeader && options.allowPathHeaders === true)) throw Error('ARCHIVE_TYPE');
    const prefix = field(header, 345, 155), name = field(header, 0, 100), physicalPath = prefix ? prefix + '/' + name : name;
    if (!validArchivePath(physicalPath, 255)) throw Error('ARCHIVE_PATH');
    const size = octal(header, 124, 12), mode = octal(header, 100, 8);
    if (size > MAX_BYTES || offset + Math.ceil(size / 512) * 512 > tar.length) throw Error('ARCHIVE_SIZE');
    if (isPathHeader) {
      if (pendingPath !== undefined || size < 1 || size > 2048) throw Error('ARCHIVE_PAX');
      pendingPath = parsePathHeader(tar.subarray(offset, offset + size)); usesPathHeaders = true;
      offset += Math.ceil(size / 512) * 512; continue;
    }
    const path = pendingPath ?? physicalPath; pendingPath = undefined;
    if (seen.has(path.toLowerCase())) throw Error('ARCHIVE_PATH'); seen.add(path.toLowerCase());
    if (files.length >= 4096) throw Error('ARCHIVE_SIZE');
    if (isLink) { if (size !== 0) throw Error('ARCHIVE_LINK'); files.push({ path, kind: 'symlink', target: field(header, 157, 100) }); continue; }
    if (size > MAX_BYTES || offset + size > tar.length || files.length >= 4096) throw Error('ARCHIVE_SIZE');
    files.push({ path, bytes: Buffer.from(tar.subarray(offset, offset + size)), ...(mode & 0o111 ? { executable: true } : {}) });
    offset += Math.ceil(size / 512) * 512;
  }
  throw Error('ARCHIVE_TERMINATOR_MISSING');
}
export function encodeRuntimeArchive(files, options = {}) {
  validateBundleLinks(files);
  const chunks = [], seen = new Set(); let total = 1024, usesPathHeaders = false;
  const append = (header, data) => {
    const padding = Buffer.alloc((512 - data.length % 512) % 512);
    total += 512 + data.length + padding.length; if (total > MAX_BYTES) throw Error('ARCHIVE_SIZE');
    chunks.push(header, data, padding);
  };
  const makeHeader = (path, type, data, file = {}) => {
    const parts = ustarParts(path); if (!parts) throw Error('ARCHIVE_PATH');
    const header = Buffer.alloc(512); header.write(parts.name, 0); header.write(parts.prefix, 345);
    const number = (value, offset, length) => { const text = value.toString(8).padStart(length - 1, '0'); if (text.length >= length) throw Error('ARCHIVE_SIZE'); header.write(text + '\0', offset); };
    number(file.executable ? 0o755 : 0o644, 100, 8); number(0, 108, 8); number(0, 116, 8); number(data.length, 124, 12); number(0, 136, 12);
    header[156] = type; if (type === 50) header.write(file.target, 157);
    header.write('ustar\0', 257); header.write('00', 263);
    header.write(checksum(header).toString(8).padStart(6, '0') + '\0 ', 148);
    return header;
  };
  for (const file of files) {
    if (!validArchivePath(file.path) || seen.has(file.path.toLowerCase())) throw Error('ARCHIVE_PATH'); seen.add(file.path.toLowerCase());
    const isLink = file.kind === 'symlink', data = isLink ? Buffer.alloc(0) : file.bytes;
    if (!Buffer.isBuffer(data) || files.length > 4096) throw Error('ARCHIVE_SIZE');
    let physicalPath = file.path;
    if (!ustarParts(file.path)) {
      if (options.allowPathHeaders !== true) throw Error('ARCHIVE_PATH');
      const record = pathHeader(file.path); parsePathHeader(record); usesPathHeaders = true;
      append(makeHeader('PaxHeaders/browser', 120, record), record);
      physicalPath = 'Payload/browser';
    }
    append(makeHeader(physicalPath, isLink ? 50 : 48, data, file), data);
  }
  if (usesPathHeaders) requirePathHeaderSchema(files);
  return gzipSync(Buffer.concat([...chunks, Buffer.alloc(1024)]));
}
