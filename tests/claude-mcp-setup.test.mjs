import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'scripts/setup-claude-mcp.mjs');
const packaged = path.join(root, 'plugins/stateport/scripts/setup-claude-mcp.mjs');

test('Claude helper packages the exact source and uses the bounded Desktop launch', async () => {
  assert.equal(readFileSync(packaged, 'utf8'), readFileSync(source, 'utf8'));
  const { buildClaudeServerConfig, claudeCommandSucceeded } = await import(pathToFileURL(source).href);
  const desktop = { command: '/opt/State Port.AppImage', args: ['--mcp'] };
  assert.deepEqual(buildClaudeServerConfig(desktop), {
    type: 'stdio', command: '/opt/State Port.AppImage', args: ['--mcp']
  });
  assert.equal(claudeCommandSucceeded({ status: 0, error: new Error('EPERM') }), true);
  assert.equal(claudeCommandSucceeded({ status: 1 }), false);
  assert.equal(claudeCommandSucceeded({ status: null, error: new Error('ENOENT') }), false);
});
