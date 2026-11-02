import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { encodeRuntimeArchive, decodeRuntimeArchive } from '../lib/archive.mjs';

test('round-trips regular runtime bytes including a binary addon and rejects alteration', () => {
  const files = [{ path: 'main.cjs', bytes: Buffer.from('synthetic') }, { path: 'node_modules/keytar/build/Release/keytar.node', bytes: Buffer.from([0, 1, 255]) }];
  const archive = encodeRuntimeArchive(files);
  assert.deepEqual(decodeRuntimeArchive(archive), files);
  assert.throws(() => decodeRuntimeArchive(Buffer.from('not gzip')));
  const bad = Buffer.from(archive); bad[Math.floor(bad.length / 2)] ^= 255; assert.throws(() => decodeRuntimeArchive(bad));
});
test('round-trips nested framework helper names using a valid USTAR prefix boundary', () => {
  const path = 'bundled-browser/browser/chromium-1243/chrome-mac-arm64/Chromium.app/Contents/Frameworks/Chromium Framework.framework/Versions/153.0.8010.12/Helpers/Chromium Helper (Renderer).app/Contents/MacOS/Chromium Helper (Renderer)';
  assert(path.length <= 255);
  const files = [{ path, bytes: Buffer.from('synthetic framework helper') }];
  assert.deepEqual(decodeRuntimeArchive(encodeRuntimeArchive(files)), files);
  assert.throws(() => encodeRuntimeArchive([{ path: 'a'.repeat(101), bytes: Buffer.alloc(0) }]), /ARCHIVE_PATH/);
});
test('rejects traversal, duplicate paths and every link/extended-header type', () => {
  for (const path of ['../escape', '/escape', 'C:\\escape', 'dir/../escape', 'dir\\escape', 'CON', 'dir./file']) assert.throws(() => encodeRuntimeArchive([{ path, bytes: Buffer.from('x') }]));
  assert.throws(() => encodeRuntimeArchive([{ path: 'main.cjs', bytes: Buffer.alloc(0) }, { path: 'MAIN.cjs', bytes: Buffer.alloc(0) }]));
  const header = Buffer.alloc(1024); header.write('escape'); header.write('0000000\0', 124); header[156] = '2'.charCodeAt(0);
  header.fill(32, 148, 156); const checksum = header.subarray(0, 512).reduce((sum, byte) => sum + byte, 0); header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148);
  assert.throws(() => decodeRuntimeArchive(gzipSync(header)), /ARCHIVE_TYPE/);
});
test('admits only declared internal browser-framework links after authenticated extraction opt-in', () => {
  const files = [
    { path: 'bundled-browser/browser/chromium-1243/App.framework/Versions/A/file', bytes: Buffer.from('native synthetic') },
    { path: 'bundled-browser/browser/chromium-1243/App.framework/Versions/Current', kind: 'symlink', target: 'A' },
  ];
  const archive = encodeRuntimeArchive(files);
  assert.throws(() => decodeRuntimeArchive(archive), /ARCHIVE_TYPE/);
  assert.deepEqual(decodeRuntimeArchive(archive, { allowBundleLinks: true }), files);
  assert.throws(() => encodeRuntimeArchive([files[0], { ...files[1], target: '../../../../../../outside' }]), /ARCHIVE_LINK/);
  assert.throws(() => encodeRuntimeArchive([files[0], { ...files[1], target: 'Current' }]), /ARCHIVE_LINK/);
  assert.throws(() => encodeRuntimeArchive([...files, { path: 'bundled-browser/browser/chromium-1243/App.framework/Other', kind: 'symlink', target: 'Versions/Current/../A' }]), /ARCHIVE_LINK/);
  assert.throws(() => encodeRuntimeArchive([
    files[0],
    { path: 'bundled-browser/browser/chromium-1243/App.framework/Alias', kind: 'symlink', target: 'Versions' },
    { path: 'bundled-browser/browser/chromium-1243/App.framework/Alias/Current', kind: 'symlink', target: 'A' },
  ]), /ARCHIVE_LINK/);
});
