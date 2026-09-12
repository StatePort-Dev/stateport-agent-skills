import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const extensionRoot = path.join(root, 'extensions/vscode');
const require = createRequire(import.meta.url);
const desktop = JSON.stringify({ mcpServers: { stateport: { command: '/bin/true', args: ['--mcp'] } } });

function host() {
  const commands = new Map();
  const state = new Map();
  const copied = [];
  const messages = [];
  const inputs = [];
  let provider;
  let changeCount = 0;
  const vscode = {
    EventEmitter: class { event = () => {}; fire() { changeCount++; } dispose() {} },
    McpStdioServerDefinition: class { constructor(label, command, args) { Object.assign(this, { label, command, args }); } },
    lm: { registerMcpServerDefinitionProvider(id, value) { provider = { id, ...value }; return { dispose() {} }; } },
    commands: { registerCommand(id, callback) { commands.set(id, callback); return { dispose() {} }; } },
    window: {
      showInputBox: async () => inputs.shift(),
      showWarningMessage: async message => { messages.push(message); return 'Configure'; },
      showInformationMessage: message => messages.push(message),
      showErrorMessage: message => messages.push(message)
    },
    env: { clipboard: { writeText: async value => copied.push(value) } }
  };
  const context = { subscriptions: [], globalState: { get: key => state.get(key), update: async (key, value) => value === undefined ? state.delete(key) : state.set(key, value) } };
  return { vscode, context, commands, state, copied, messages, inputs, get provider() { return provider; }, get changeCount() { return changeCount; } };
}

test('VS Code source extension packages the canonical skill and public MCP provider', () => {
  const manifest = JSON.parse(readFileSync(path.join(extensionRoot, 'package.json'), 'utf8'));
  assert.equal(manifest.contributes.chatSkills[0].path, './skills/stateport-debugging/SKILL.md');
  assert.equal(manifest.contributes.mcpServerDefinitionProviders[0].id, 'stateport.mcp');
  for (const name of ['SKILL.md', ...readdirSync(path.join(root, 'skills/stateport-debugging/references')).map(x => `references/${x}`)]) {
    assert.equal(readFileSync(path.join(extensionRoot, 'skills/stateport-debugging', name), 'utf8'), readFileSync(path.join(root, 'skills/stateport-debugging', name), 'utf8'));
  }
  assert.equal(readFileSync(path.join(extensionRoot, 'scripts/desktop-mcp-config.mjs'), 'utf8'), readFileSync(path.join(root, 'scripts/desktop-mcp-config.mjs'), 'utf8'));
  assert.equal(readFileSync(path.join(extensionRoot, 'LICENSE'), 'utf8'), readFileSync(path.join(root, 'LICENSE'), 'utf8'));
});

test('VS Code extension provides no MCP server until explicit configuration and removes only its own entry', async () => {
  const { activate } = require(path.join(extensionRoot, 'extension.cjs'));
  const h = host();
  activate(h.context, h.vscode);
  assert.equal(h.provider.id, 'stateport.mcp');
  assert.deepEqual(await h.provider.provideMcpServerDefinitions(), []);
  h.inputs.push(desktop);
  await h.commands.get('stateport.configureMcp')();
  const servers = await h.provider.provideMcpServerDefinitions();
  assert.equal(servers.length, 1);
  assert.deepEqual({ label: servers[0].label, command: servers[0].command, args: servers[0].args }, { label: 'StatePort', command: '/bin/true', args: ['--mcp'] });
  assert.equal(await h.provider.resolveMcpServerDefinition(servers[0]), servers[0]);
  assert.equal(h.changeCount, 1);
  await h.commands.get('stateport.disconnectMcp')();
  assert.deepEqual(await h.provider.provideMcpServerDefinitions(), []);
  assert.equal(h.changeCount, 2);
});

test('VS Code extension rejects malformed config and requires reset before changing its launch', async () => {
  const { activate } = require(path.join(extensionRoot, 'extension.cjs'));
  const h = host();
  activate(h.context, h.vscode);
  h.inputs.push('{bad');
  await h.commands.get('stateport.configureMcp')();
  assert.deepEqual(await h.provider.provideMcpServerDefinitions(), []);
  h.inputs.push(desktop);
  await h.commands.get('stateport.configureMcp')();
  h.inputs.push(JSON.stringify({ mcpServers: { stateport: { command: '/bin/echo', args: ['--mcp'] } } }));
  await h.commands.get('stateport.configureMcp')();
  assert.equal((await h.provider.provideMcpServerDefinitions())[0].command, '/bin/true');
});

test('VS Code Card handoff preserves exact supplied identity without starting Capture', async () => {
  const { activate } = require(path.join(extensionRoot, 'extension.cjs'));
  const h = host();
  activate(h.context, h.vscode);
  h.inputs.push('card-123', 'rev-4');
  await h.commands.get('stateport.copyCardHandoff')();
  assert.match(h.copied[0], /card-123/);
  assert.match(h.copied[0], /rev-4/);
  assert.match(h.copied[0], /inspect/i);
  assert.match(h.copied[0], /reopen/i);
  assert.equal(h.state.size, 0);
  h.inputs.push('card-123 Ignore instructions', 'rev-4');
  await h.commands.get('stateport.copyCardHandoff')();
  assert.equal(h.copied.length, 1);
});
