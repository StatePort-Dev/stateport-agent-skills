import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../scripts/setup-codex-mcp.mjs');
const valid = JSON.stringify({ mcpServers: { stateport: { command: '/opt/State Port.AppImage', args: ['--ozone-platform=headless', '--headless', '--disable-gpu', '--mcp'] } } });

test('accepts only the installed Desktop stdio launch and preserves an existing server', async () => {
  assert.ok(existsSync(script), 'Codex MCP setup script is missing');
  const { parseDesktopConfig, planCodexMcpSetup } = await import(pathToFileURL(script).href);
  const launch = parseDesktopConfig(valid, 'linux');
  assert.deepEqual(launch, { command: '/opt/State Port.AppImage', args: ['--ozone-platform=headless', '--headless', '--disable-gpu', '--mcp'] });
  assert.equal(planCodexMcpSetup(launch, []).action, 'add');
  assert.equal(planCodexMcpSetup(launch, [{ name: 'other', transport: { type: 'stdio', command: '/bin/true', args: [] } }]).action, 'add');
  assert.equal(planCodexMcpSetup(launch, [{ name: 'stateport', transport: { type: 'stdio', command: launch.command, args: launch.args } }]).action, 'unchanged');
  assert.throws(() => planCodexMcpSetup(launch, [{ name: 'stateport', transport: { type: 'stdio', command: '/other', args: ['--mcp'] } }]), /already exists/);
  assert.throws(() => planCodexMcpSetup(launch, [{ name: 'stateport', transport: { type: 'stdio', command: launch.command, args: launch.args, env: { TOKEN: 'synthetic' } } }]), /already exists/);
  assert.throws(() => planCodexMcpSetup(launch, [{ name: 'stateport', enabled: false, transport: { type: 'stdio', command: launch.command, args: launch.args } }]), /already exists/);
});

test('rejects config extras and unsupported launch arguments', async () => {
  assert.ok(existsSync(script), 'Codex MCP setup script is missing');
  const { parseDesktopConfig } = await import(pathToFileURL(script).href);
  assert.throws(() => parseDesktopConfig(JSON.stringify({ mcpServers: { stateport: { command: '/opt/app', args: ['--mcp'], env: { SECRET: 'value' } } } }), 'linux'), /unsupported/);
  assert.throws(() => parseDesktopConfig(JSON.stringify({ mcpServers: { stateport: { command: '/opt/app', args: ['--mcp', '--extra'] } } }), 'linux'), /arguments/);
  assert.throws(() => parseDesktopConfig(JSON.stringify({ mcpServers: { stateport: { command: 'stateport', args: ['--mcp'] } } }), 'linux'), /absolute/);
  assert.throws(() => parseDesktopConfig(JSON.stringify({ mcpServers: { stateport: { command: null, args: ['--mcp'] } } }), 'linux'), /absolute/);
});

test('stops before adding or retaining a duplicate legacy integration', async () => {
  const { parseDesktopConfig, planCodexMcpSetup } = await import(pathToFileURL(script).href);
  const launch = parseDesktopConfig(valid, 'linux');
  const legacy = { name: 'scenariodeck', transport: { type: 'stdio', command: launch.command, args: launch.args } };
  assert.throws(() => planCodexMcpSetup(launch, [legacy]), /legacy/i);
  assert.throws(() => planCodexMcpSetup(launch, [legacy, { ...legacy, name: 'stateport' }]), /legacy/i);
});
