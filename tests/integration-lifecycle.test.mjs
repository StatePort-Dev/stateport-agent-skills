import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncCodexSkill } from '../scripts/generate-codex-plugin.mjs';
import { validateRegistry } from '../scripts/validate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const json = name => JSON.parse(read(name));

test('one integration release version owns all distribution manifests and local raw-skill metadata', () => {
  const metadata = json('integration.json');
  const version = metadata.integrationVersion;
  assert.match(version, /^0\.\d+\.\d+(?:-alpha\.\d+)?$/);
  for (const name of ['package.json', 'plugins/stateport/plugin.json', 'plugins/stateport/.codex-plugin/plugin.json', 'plugins/stateport/.claude-plugin/plugin.json', 'extensions/vscode/package.json']) {
    assert.equal(json(name).version, version, name);
  }
  assert.equal(json('skills/stateport-debugging/integration.json').integrationVersion, version);
  assert.ok(read('extensions/jetbrains/build.gradle').includes(`version = '${version}'`));
  assert.ok(read('extensions/jetbrains/src/main/resources/META-INF/plugin.xml').includes(`<version>${version}</version>`));
  assert.equal(json('plugins/stateport/skills/stateport-debugging/integration.json').integrationVersion, version);
  assert.equal(json('extensions/vscode/skills/stateport-debugging/integration.json').integrationVersion, version);
});

test('sync detects stale generated versions and skills, repairs them, and is byte-idempotent', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stateport-lifecycle-'));
  try {
    for (const name of ['integration.json', 'package.json', 'LICENSE', 'skills', 'scripts', 'plugins', 'extensions']) {
      fs.cpSync(path.join(root, name), path.join(temp, name), { recursive: true });
    }
    const manifest = path.join(temp, 'extensions/vscode/package.json');
    const skill = path.join(temp, 'plugins/stateport/skills/stateport-debugging/SKILL.md');
    const helper = path.join(temp, 'plugins/stateport/scripts/compatibility.mjs');
    fs.writeFileSync(manifest, fs.readFileSync(manifest, 'utf8').replace(/"version": "[^"]+"/, '"version": "9.9.9"'));
    fs.appendFileSync(skill, '\nstale\n');
    fs.appendFileSync(helper, '\nstale\n');
    assert.ok(syncCodexSkill(temp, true).some(name => name.includes('extensions/vscode/package.json')));
    assert.ok(syncCodexSkill(temp, true).some(name => name.includes('SKILL.md')));
    assert.ok(syncCodexSkill(temp, true).some(name => name.includes('compatibility.mjs')));
    syncCodexSkill(temp, false);
    assert.deepEqual(syncCodexSkill(temp, true), []);
    const once = [manifest, skill].map(name => fs.readFileSync(name, 'utf8'));
    syncCodexSkill(temp, false);
    assert.deepEqual([manifest, skill].map(name => fs.readFileSync(name, 'utf8')), once);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('every provider classifies its update path without promoting workflow support', () => {
  const registry = json('providers/registry.json');
  assert.deepEqual(validateRegistry(registry), []);
  for (const row of registry.providers) {
    assert.ok(['native-auto', 'native-manual', 'manual-copy', 'source-install', 'unverified'].includes(row.update.method), row.id);
    assert.ok(['yes', 'no', 'conditional', 'unverified'].includes(row.update.automatic), row.id);
    assert.ok(['verified', 'unverified'].includes(row.update.evidenceStatus), row.id);
    assert.notEqual(row.status, 'verified');
  }
});

test('compatibility decisions use discovered capabilities and contract, not Desktop SemVer', async () => {
  const module = await import('../scripts/compatibility.mjs').catch(() => ({}));
  assert.equal(typeof module.evaluateCompatibility, 'function');
  const metadata = { mcpContract: { minimum: 1, maximum: 1 } };
  const evaluate = (runtime, requiredCapabilities = ['inspect_state']) => module.evaluateCompatibility(metadata, runtime, requiredCapabilities);
  const cases = [
    [{ available: true, mcpContractVersion: 1, capabilities: ['inspect_state'] }, 'compatible'],
    [{ available: true, mcpContractVersion: 1, runtimeVersion: '999.0.0', capabilities: ['inspect_state', 'new_tool'] }, 'compatible'],
    [{ available: true, mcpContractVersion: 1, runtimeVersion: '0.0.1', capabilities: ['inspect_state'] }, 'compatible'],
    [{ available: true, mcpContractVersion: 1, capabilities: [] }, 'capability_unavailable'],
    [{ available: true, mcpContractVersion: 0, capabilities: ['inspect_state'] }, 'runtime_update_required'],
    [{ available: true, mcpContractVersion: 2, capabilities: ['inspect_state'] }, 'integration_update_required'],
    [{ available: true, mcpContractVersion: 1 }, 'capability_unknown'],
    [{ available: true, capabilities: ['inspect_state'] }, 'compatible_unversioned'],
    [{ available: true, mcpContractVersion: '2', capabilities: ['inspect_state'] }, 'mcp_contract_unsupported'],
    [{ available: false }, 'runtime_unavailable']
  ];
  for (const [runtime, expected] of cases) assert.equal(evaluate(runtime).status, expected, JSON.stringify(runtime));
});
