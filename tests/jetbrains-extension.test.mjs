import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../extensions/jetbrains/', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');

test('JetBrains source names a platform plugin with bounded IDE actions', () => {
  const descriptor = read('src/main/resources/META-INF/plugin.xml');
  assert.match(descriptor, /<depends>com\.intellij\.modules\.platform<\/depends>/);
  assert.match(descriptor, /id="dev\.stateport\.jetbrains\.copyCardHandoff"/);
  assert.match(descriptor, /id="dev\.stateport\.jetbrains\.showSetup"/);
  assert.doesNotMatch(descriptor, /com\.intellij\.mcpServer|com\.intellij\.ml\.llm/);
});

test('JetBrains plugin keeps agent setup explicit and avoids runtime executables', () => {
  const action = read('src/main/java/dev/stateport/jetbrains/CopyCardHandoffAction.java');
  const help = read('src/main/java/dev/stateport/jetbrains/ShowSetupAction.java');
  assert.match(action, /Handoff\.create/);
  assert.match(help, /Settings.*Tools.*AI Assistant.*Model Context Protocol/);
  assert.doesNotMatch(action + help, /ProcessBuilder|Runtime\.getRuntime|Desktop\.getDesktop/);
});
