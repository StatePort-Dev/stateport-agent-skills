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
const skillNames = ['stateport-capture', 'stateport-check-changes', 'stateport-debugging', 'stateport-harden', 'stateport-journey', 'stateport-replay-experiments', 'stateport-transfer'];

test('all seven skills ship self-contained, with shared references, metadata and VS Code discovery', () => {
  assert.deepEqual(readdirSync(path.join(root, 'skills')).sort(), skillNames);
  for (const base of ['skills', 'plugins/stateport/skills', 'extensions/vscode/skills']) {
    assert.deepEqual(readdirSync(path.join(root, base)).sort(), skillNames);
    for (const skill of skillNames) {
      const location = path.join(root, base, skill);
      assert.equal(readFileSync(path.join(location, 'SKILL.md'), 'utf8'), readFileSync(path.join(root, 'skills', skill, 'SKILL.md'), 'utf8'));
      assert.deepEqual(JSON.parse(readFileSync(path.join(location, 'integration.json'))), JSON.parse(readFileSync(path.join(root, 'integration.json'))));
      for (const reference of readdirSync(path.join(source, 'references'))) {
        assert.equal(readFileSync(path.join(location, 'references', reference), 'utf8'), readFileSync(path.join(source, 'references', reference), 'utf8'));
      }
    }
  }
  const vscode = JSON.parse(readFileSync(path.join(root, 'extensions/vscode/package.json')));
  assert.deepEqual(vscode.contributes.chatSkills.map(x => x.path).sort(), skillNames.map(x => `./skills/${x}/SKILL.md`));
  assert.ok(vscode.files.includes('skills/'));
});

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
    const skill = command === 'new-repro.md' ? 'stateport-capture' : 'stateport-debugging';
    assert.ok(content.includes(`\${CLAUDE_PLUGIN_ROOT}/skills/${skill}/SKILL.md`));
  }
});

test('generated VS Code skill freshness rejects obsolete packaged references', () => {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'stateport-generator-'));
  try {
    cpSync(path.join(root, 'skills'), path.join(temp, 'skills'), { recursive: true });
    cpSync(path.join(root, 'scripts'), path.join(temp, 'scripts'), { recursive: true });
    cpSync(path.join(root, 'LICENSE'), path.join(temp, 'LICENSE'));
    for (const name of ['integration.json', 'package.json']) cpSync(path.join(root, name), path.join(temp, name));
    for (const name of ['plugins', 'extensions']) cpSync(path.join(root, name), path.join(temp, name), { recursive: true });
    syncCodexSkill(temp, false);
    const shared = path.join(temp, 'skills/stateport-debugging/references/workflow.md');
    writeFileSync(shared, readFileSync(shared, 'utf8') + '\nSynthetic shared-reference change.\n');
    const portable = path.join(temp, 'skills/stateport-capture/references/workflow.md');
    const before = readFileSync(portable, 'utf8');
    const drift = syncCodexSkill(temp, true);
    assert.ok(drift.includes('skills/stateport-capture/references/workflow.md'));
    assert.ok(drift.includes('plugins/stateport/skills/stateport-journey/references/workflow.md'));
    assert.ok(drift.includes('extensions/vscode/skills/stateport-transfer/references/workflow.md'));
    assert.equal(readFileSync(portable, 'utf8'), before, 'check mode must not mutate copies');
    syncCodexSkill(temp, false);
    assert.equal(readFileSync(portable, 'utf8'), readFileSync(shared, 'utf8'));
    const stale = path.join(temp, 'extensions/vscode/skills/stateport-debugging/references/obsolete.md');
    writeFileSync(stale, 'stale\n');
    assert.ok(syncCodexSkill(temp, true).includes('extensions/vscode/skills/stateport-debugging/references/obsolete.md'));
    syncCodexSkill(temp, false);
    assert.deepEqual(syncCodexSkill(temp, true), []);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
