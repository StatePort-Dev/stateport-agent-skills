import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'scripts/setup-copilot-mcp.mjs');
const packaged = path.join(root, 'plugins/stateport/scripts/setup-copilot-mcp.mjs');
const launch = { command: '/opt/State Port.AppImage', args: ['--mcp'] };

test('Copilot MCP helper is packaged and only adds a missing StatePort entry', async () => {
  assert.equal(readFileSync(packaged, 'utf8'), readFileSync(source, 'utf8'));
  const { planCopilotMcpSetup, copilotCommandSucceeded } = await import(pathToFileURL(source).href);
  assert.equal(copilotCommandSucceeded({ status: 0, error: new Error('EPERM'), stdout: '' }), false);
  assert.equal(copilotCommandSucceeded({ status: 0, error: new Error('EPERM'), stdout: '{}' }), false);
  assert.equal(copilotCommandSucceeded({ status: 1, stdout: '{}' }), false);
  assert.equal(planCopilotMcpSetup(launch, { mcpServers: {} }).action, 'add');
  assert.equal(planCopilotMcpSetup(launch, { mcpServers: { other: { type: 'local', command: '/bin/true', args: [] } } }).action, 'add');
  assert.equal(planCopilotMcpSetup(launch, { mcpServers: { stateport: {
    type: 'local', command: launch.command, args: launch.args, tools: ['*'], source: 'user', enabled: true
  } } }).action, 'unchanged');
  assert.throws(() => planCopilotMcpSetup(launch, { mcpServers: { stateport: {
    type: 'local', command: '/other', args: ['--mcp'], tools: ['*'], source: 'user', enabled: true
  } } }), /already exists/);
  assert.throws(() => planCopilotMcpSetup(launch, { mcpServers: { stateport: {
    type: 'local', command: launch.command, args: launch.args, tools: ['*'], source: 'workspace', enabled: true
  } } }), /already exists/);
  assert.throws(() => planCopilotMcpSetup(launch, { mcpServers: { stateport: {
    type: 'local', command: launch.command, args: launch.args, tools: ['*'], source: 'user', enabled: false
  } } }), /already exists/);
  assert.throws(() => planCopilotMcpSetup(launch, { mcpServers: { stateport: null } }), /already exists/);
  assert.throws(() => planCopilotMcpSetup(launch, { mcpServers: null }), /inventory/);
});
