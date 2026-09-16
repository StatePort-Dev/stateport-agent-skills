import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'scripts/setup-cursor-mcp.mjs');
const packaged = path.join(root, 'plugins/stateport/scripts/setup-cursor-mcp.mjs');
const desktop = JSON.stringify({ mcpServers: { stateport: { command: '/bin/true', args: ['--ozone-platform=headless', '--headless', '--disable-gpu', '--mcp'] } } });

test('Cursor MCP helper previews then preserves unrelated entries on apply and repeat', async () => {
  assert.equal(readFileSync(packaged, 'utf8'), readFileSync(source, 'utf8'));
  const { setupCursorMcp, removeCursorMcp } = await import(pathToFileURL(source).href);
  const home = mkdtempSync(path.join(os.tmpdir(), 'stateport-cursor-mcp-'));
  try {
    const file = path.join(home, '.cursor/mcp.json');
    mkdirSync(path.dirname(file), { recursive: true });
    const original = { mcpServers: { other: { type: 'stdio', command: '/bin/echo', args: ['synthetic'] } } };
    writeFileSync(file, JSON.stringify(original));
    assert.equal(setupCursorMcp(file, desktop, false), 'add');
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), original);
    assert.equal(setupCursorMcp(file, desktop, true), 'add');
    const after = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(after.mcpServers.other, original.mcpServers.other);
    assert.deepEqual(after.mcpServers.stateport, { type: 'stdio', command: '/bin/true', args: ['--ozone-platform=headless', '--headless', '--disable-gpu', '--mcp'] });
    const bytes = readFileSync(file, 'utf8');
    assert.equal(setupCursorMcp(file, desktop, true), 'unchanged');
    assert.equal(readFileSync(file, 'utf8'), bytes);
    assert.equal(removeCursorMcp(file, desktop), 'removed');
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')), original);
    assert.equal(removeCursorMcp(file, desktop), 'unchanged');
    assert.equal(setupCursorMcp(file, desktop, true), 'add');
    after.mcpServers.stateport.command = '/bin/echo';
    writeFileSync(file, JSON.stringify(after));
    assert.throws(() => setupCursorMcp(file, desktop, true), /already exists/);
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).mcpServers.stateport, after.mcpServers.stateport);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('Cursor MCP helper rejects malformed existing files without a write', async () => {
  const { setupCursorMcp } = await import(pathToFileURL(source).href);
  const home = mkdtempSync(path.join(os.tmpdir(), 'stateport-cursor-mcp-'));
  try {
    const file = path.join(home, '.cursor/mcp.json');
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, '{bad');
    assert.throws(() => setupCursorMcp(file, desktop, true), /not valid JSON/);
    assert.equal(readFileSync(file, 'utf8'), '{bad');
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});
