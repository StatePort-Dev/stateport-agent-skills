import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'skills/stateport-debugging');
const packaged = path.join(root, 'plugins/stateport/skills/stateport-debugging');

test('Codex plugin distributes the exact canonical skill and references', () => {
  const sourceFiles = ['SKILL.md', ...readdirSync(path.join(source, 'references')).map(name => `references/${name}`).sort()];
  for (const name of sourceFiles) {
    assert.equal(readFileSync(path.join(packaged, name), 'utf8'), readFileSync(path.join(source, name), 'utf8'), name);
  }
  assert.deepEqual(JSON.parse(readFileSync(path.join(root, 'plugins/stateport/plugin.json'), 'utf8')).name, 'stateport');
  assert.equal(
    readFileSync(path.join(root, 'plugins/stateport/scripts/setup-codex-mcp.mjs'), 'utf8'),
    readFileSync(path.join(root, 'scripts/setup-codex-mcp.mjs'), 'utf8')
  );
});
