import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { encodeRuntimeArchive, decodeRuntimeArchive } from '../lib/archive.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
test('rejects traversal, duplicate paths and link/extended-header types without opt-in', () => {
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

const nativePath = 'bundled-browser/browser/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/Frameworks/Google Chrome for Testing Framework.framework/Versions/153.0.8010.12/Helpers/Google Chrome for Testing Helper (Aperitif Renderer).app/Contents/MacOS/Google Chrome for Testing Helper (Aperitif Renderer)';
const format = { schemaVersion: 'agent-runtime-candidate/1.2.0', archiveFormat: 'ustar+pax-path/1' };
test('round-trips the actual over-USTAR native framework path only with explicit versioned path-header support', () => {
  assert(nativePath.length > 255);
  const files = [{ path: nativePath, bytes: Buffer.from('synthetic native helper') }, { path: 'candidate.json', bytes: Buffer.from(JSON.stringify(format)) }];
  assert.throws(() => encodeRuntimeArchive(files));
  const archive = encodeRuntimeArchive(files, { allowPathHeaders: true });
  assert.throws(() => decodeRuntimeArchive(archive), /ARCHIVE_TYPE/);
  assert.deepEqual(decodeRuntimeArchive(archive, { allowPathHeaders: true }), files);
  const legacy = [...files.slice(0, 1), { path: 'candidate.json', bytes: Buffer.from(JSON.stringify({ ...format, schemaVersion: 'agent-runtime-candidate/1.1.0' })) }];
  assert.throws(() => encodeRuntimeArchive(legacy, { allowPathHeaders: true }), /ARCHIVE_SCHEMA/);
});
test('uses standard one-file PAX path records readable by the native archive tool', { skip: process.platform === 'win32' }, async () => {
  const root = await mkdtemp(join(await realpath(tmpdir()), 'stateport-pax-compatibility-'));
  try {
    const path = join(root, 'runtime.tar.gz');
    await writeFile(path, encodeRuntimeArchive([{ path: nativePath, bytes: Buffer.from('synthetic') }, { path: 'candidate.json', bytes: Buffer.from(JSON.stringify(format)) }], { allowPathHeaders: true }));
    const listing = await promisify(execFile)('tar', ['-tzf', path]);
    assert.deepEqual(listing.stdout.trim().split('\n'), [nativePath, 'candidate.json']);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('combines extended browser paths with only declared relative framework links', () => {
  const targetPath = nativePath.replace(/[^/]+$/, 'actual-helper');
  const files = [{ path: targetPath, bytes: Buffer.from('synthetic') }, { path: nativePath, kind: 'symlink', target: 'actual-helper' }, { path: 'candidate.json', bytes: Buffer.from(JSON.stringify(format)) }];
  const archive = encodeRuntimeArchive(files, { allowPathHeaders: true });
  assert.throws(() => decodeRuntimeArchive(archive, { allowPathHeaders: true }), /ARCHIVE_TYPE/);
  assert.deepEqual(decodeRuntimeArchive(archive, { allowPathHeaders: true, allowBundleLinks: true }), files);
});

function record(key, value) {
  const tail = ` ${key}=${value}\n`; let size = tail.length + 1;
  while (String(size).length + tail.length !== size) size = String(size).length + tail.length;
  return `${size}${tail}`;
}
function block(path, type, body = Buffer.alloc(0)) {
  const header = Buffer.alloc(512); header.write(path); header.write('0000644\0', 100); header.write(body.length.toString(8).padStart(11, '0') + '\0', 124); header[156] = type.charCodeAt(0);
  header.fill(32, 148, 156); header.write(header.reduce((sum, byte) => sum + byte, 0).toString(8).padStart(6, '0') + '\0 ', 148);
  return Buffer.concat([header, body, Buffer.alloc((512 - body.length % 512) % 512)]);
}
test('rejects malformed, duplicate/global/unknown PAX overrides and never relaxes effective path safety', () => {
  const finish = block('candidate.json', '0', Buffer.from(JSON.stringify(format)));
  const control = value => block('PaxHeaders/path', 'x', Buffer.from(value));
  const archive = (...parts) => gzipSync(Buffer.concat([...parts, finish, Buffer.alloc(1024)]));
  for (const body of [record('uid', '0'), record('linkpath', 'outside'), record('path', '../outside'), record('path', '/absolute'), record('path', 'main.cjs'), record('path', nativePath) + record('path', nativePath), '1 path=' + nativePath + '\n']) {
    assert.throws(() => decodeRuntimeArchive(archive(control(body), block('Payload/entry', '0')), { allowPathHeaders: true }), /ARCHIVE_PAX|ARCHIVE_PATH/);
  }
  assert.throws(() => decodeRuntimeArchive(archive(block('Global', 'g', Buffer.from(record('path', nativePath)))), { allowPathHeaders: true }), /ARCHIVE_TYPE/);
  assert.throws(() => decodeRuntimeArchive(archive(control(record('path', nativePath)), control(record('path', nativePath))), { allowPathHeaders: true }), /ARCHIVE_PAX/);
  assert.throws(() => decodeRuntimeArchive(gzipSync(Buffer.concat([control(record('path', nativePath)), Buffer.alloc(1024)])), { allowPathHeaders: true }), /ARCHIVE_PAX/);
  assert.throws(() => decodeRuntimeArchive(archive(control(record('path', nativePath)), block('One', '0'), control(record('path', nativePath)), block('Two', '0')), { allowPathHeaders: true }), /ARCHIVE_PATH/);
  const decoded = decodeRuntimeArchive(archive(control(record('path', nativePath)), block('One', '0'), block('ordinary-file', '0')), { allowPathHeaders: true });
  assert.deepEqual(decoded.map(file => file.path), [nativePath, 'ordinary-file', 'candidate.json']);
});
test('new dual-Node manifests retain bounded native Mac PAX paths without admitting undeclared formats',()=>{
 const files=[{path:nativePath,bytes:Buffer.from('synthetic Mac helper')},{path:'candidate.json',bytes:Buffer.from(JSON.stringify({...format,schemaVersion:'agent-runtime-candidate/1.3.0'}))}];
 assert.deepEqual(decodeRuntimeArchive(encodeRuntimeArchive(files,{allowPathHeaders:true}),{allowPathHeaders:true}),files);
 for(const schemaVersion of ['agent-runtime-candidate/1.4.0','agent-runtime-candidate/1.1.0'])assert.throws(()=>encodeRuntimeArchive([files[0],{path:'candidate.json',bytes:Buffer.from(JSON.stringify({...format,schemaVersion}))}],{allowPathHeaders:true}),/ARCHIVE_SCHEMA/);
});
