import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncCodexSkill } from '../scripts/generate-codex-plugin.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const documents = ['README.md', 'AGENT_INSTALL.md', 'docs/VERSIONING_AND_UPDATES.md', 'CHANGELOG.md'];
const start = '<!-- integration-version:start -->';
const end = '<!-- integration-version:end -->';
const slot = /<!-- integration-version:start -->`[^`\n]+`<!-- integration-version:end -->/g;

function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stateport-install-version-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  for (const name of ['integration.json', 'package.json', 'LICENSE', 'skills', 'scripts', 'plugins', 'extensions', ...documents]) {
    fs.mkdirSync(path.dirname(path.join(temp, name)), { recursive: true });
    fs.cpSync(path.join(root, name), path.join(temp, name), { recursive: true });
  }
  return temp;
}

test('current installation documentation derives its version from integration.json', () => {
  const { integrationVersion } = JSON.parse(fs.readFileSync(path.join(root, 'integration.json')));
  for (const name of documents) {
    const text = fs.readFileSync(path.join(root, name), 'utf8');
    assert.deepEqual(text.match(slot), [`${start}\`${integrationVersion}\`${end}`], name);
  }
});

test('successive releases detect documentation drift, repair it, and preserve history and pinning', t => {
  const temp = fixture(t);
  const metadataPath = path.join(temp, 'integration.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath));
  const history = '\nHistorical evidence: integration `0.1.0-beta.2`, Desktop `1.0.0-beta.19`.\n';
  fs.appendFileSync(path.join(temp, 'CHANGELOG.md'), history);
  const outside = () => documents.map(name => fs.readFileSync(path.join(temp, name), 'utf8').replace(slot, '<VERSION>'));
  const original = outside();
  for (const version of ['0.1.0-beta.999', '0.2.0', '0.2.1-alpha.1']) {
    fs.writeFileSync(metadataPath, `${JSON.stringify({ ...metadata, integrationVersion: version }, null, 2)}\n`);
    const before = documents.map(name => fs.readFileSync(path.join(temp, name), 'utf8'));
    const drift = syncCodexSkill(temp, true);
    for (const name of documents) assert.ok(drift.includes(name), name);
    assert.deepEqual(documents.map(name => fs.readFileSync(path.join(temp, name), 'utf8')), before, 'check must not write');
    syncCodexSkill(temp);
    for (const name of documents) {
      assert.deepEqual(fs.readFileSync(path.join(temp, name), 'utf8').match(slot), [`${start}\`${version}\`${end}`], name);
    }
    assert.deepEqual(outside(), original, 'history, selected channels and pinned refs must remain untouched');
    assert.deepEqual(syncCodexSkill(temp, true), []);
    syncCodexSkill(temp);
    assert.deepEqual(syncCodexSkill(temp, true), []);
  }
});

test('invalid or missing documentation version slots fail before sync writes anything', async t => {
  for (const [label, corrupt] of [
    ['missing', text => text.replace(slot, '`0.1.0-beta.2`')],
    ['unclosed', text => text.replace(end, '')],
    ['duplicate', text => `${text}\n${start}\`0.1.0-beta.2\`${end}\n`],
    ['extra marker', text => `${text}\n${start}\n`]
  ]) {
    await t.test(label, t => {
      const temp = fixture(t);
      const doc = path.join(temp, 'AGENT_INSTALL.md');
      fs.writeFileSync(doc, corrupt(fs.readFileSync(doc, 'utf8')));
      const metadataPath = path.join(temp, 'integration.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath));
      fs.writeFileSync(metadataPath, JSON.stringify({ ...metadata, integrationVersion: '0.2.0' }));
      const snapshot = documents.map(name => fs.readFileSync(path.join(temp, name), 'utf8'));
      const manifest = fs.readFileSync(path.join(temp, 'package.json'), 'utf8');
      for (const check of [true, false]) {
        assert.throws(() => syncCodexSkill(temp, check), /AGENT_INSTALL\.md.*version slot/);
        assert.deepEqual(documents.map(name => fs.readFileSync(path.join(temp, name), 'utf8')), snapshot);
        assert.equal(fs.readFileSync(path.join(temp, 'package.json'), 'utf8'), manifest);
      }
    });
  }
});

test('a missing version document fails before sync changes other documents or manifests', t => {
  const temp = fixture(t);
  const metadataPath = path.join(temp, 'integration.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath));
  fs.writeFileSync(metadataPath, JSON.stringify({ ...metadata, integrationVersion: '0.2.0' }));
  const read = name => fs.readFileSync(path.join(temp, name), 'utf8');
  const before = [read('README.md'), read('AGENT_INSTALL.md'), read('package.json')];
  fs.rmSync(path.join(temp, 'CHANGELOG.md'));
  for (const check of [true, false]) {
    assert.throws(() => syncCodexSkill(temp, check), /ENOENT.*CHANGELOG\.md/);
    assert.deepEqual([read('README.md'), read('AGENT_INSTALL.md'), read('package.json')], before);
  }
});

test('invalid canonical versions cannot be synchronized into install instructions', async t => {
  for (const version of [null, 2, '', ['0.1.0'], '1.0.0-beta.104', '0.1.0-beta.1\n', '0.1.0-beta.x']) {
    await t.test(JSON.stringify(version), t => {
      const temp = fixture(t);
      const file = path.join(temp, 'integration.json');
      const metadata = JSON.parse(fs.readFileSync(file));
      fs.writeFileSync(file, JSON.stringify({ ...metadata, integrationVersion: version }));
      const before = fs.readFileSync(path.join(temp, 'AGENT_INSTALL.md'), 'utf8');
      assert.throws(() => syncCodexSkill(temp), /Invalid canonical integration metadata/);
      assert.equal(fs.readFileSync(path.join(temp, 'AGENT_INSTALL.md'), 'utf8'), before);
    });
  }
});
