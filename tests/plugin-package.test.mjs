import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { syncCodexSkill } from '../scripts/generate-codex-plugin.mjs';

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

test('Claude marketplace installs the same self-contained skill package', () => {
  const marketplace = JSON.parse(readFileSync(path.join(root, '.claude-plugin/marketplace.json'), 'utf8'));
  assert.equal(marketplace.owner.name, 'StatePort-Dev');
  assert.match(marketplace.description, /StatePort/);
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, 'stateport');
  assert.equal(marketplace.plugins[0].source, './plugins/stateport');

  const manifest = JSON.parse(readFileSync(path.join(root, 'plugins/stateport/.claude-plugin/plugin.json'), 'utf8'));
  const portable = JSON.parse(readFileSync(path.join(root, 'plugins/stateport/plugin.json'), 'utf8'));
  const codex = JSON.parse(readFileSync(path.join(root, 'plugins/stateport/.codex-plugin/plugin.json'), 'utf8'));
  const repository = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.name, portable.name);
  assert.equal(manifest.version, portable.version);
  assert.equal(manifest.version, codex.version);
  assert.equal(manifest.version, repository.version);
  assert.equal(manifest.description, portable.description);
  assert.equal(manifest.author.name, portable.author.name);
  assert.equal(readdirSync(path.join(packaged, 'references')).length > 0, true);
  assert.equal(manifest.commands, './claude/commands/');
  const commands = readdirSync(path.join(root, 'plugins/stateport/claude/commands')).sort();
  assert.deepEqual(commands, ['check-connection.md', 'compare-runs.md', 'new-repro.md', 'reopen-card.md', 'use-card.md']);
  for (const command of commands) {
    const content = readFileSync(path.join(root, 'plugins/stateport/claude/commands', command), 'utf8');
    assert.match(content, /disable-model-invocation: true/);
    assert.match(content, /\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/stateport-debugging\/SKILL\.md/);
  }
});

test('generated VS Code skill freshness rejects obsolete packaged references', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'stateport-generator-'));
  try {
    cpSync(path.join(root, 'skills'), path.join(temp, 'skills'), { recursive: true });
    cpSync(path.join(root, 'scripts'), path.join(temp, 'scripts'), { recursive: true });
    cpSync(path.join(root, 'LICENSE'), path.join(temp, 'LICENSE'));
    syncCodexSkill(temp, false);
    const stale = path.join(temp, 'extensions/vscode/skills/stateport-debugging/references/obsolete.md');
    writeFileSync(stale, 'stale\n');
    assert.ok(syncCodexSkill(temp, true).includes('extensions/vscode/skills/stateport-debugging/references/obsolete.md'));
    syncCodexSkill(temp, false);
    assert.deepEqual(syncCodexSkill(temp, true), []);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
