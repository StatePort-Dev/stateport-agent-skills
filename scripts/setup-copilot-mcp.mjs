import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseDesktopConfig } from './setup-codex-mcp.mjs';

export function planCopilotMcpSetup(launch, inventory) {
  const servers = inventory?.mcpServers;
  if (!servers || typeof servers !== 'object' || Array.isArray(servers)) {
    throw new Error('Copilot MCP inventory is unavailable');
  }
  if (!Object.hasOwn(servers, 'stateport')) return { action: 'add', launch };
  const existing = servers.stateport;
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
    throw new Error('A different StatePort MCP entry already exists; review it manually before changing anything');
  }
  const keys = Object.keys(existing).sort().join(',');
  const expectedKeys = ['args', 'command', 'enabled', 'source', 'tools', 'type'].sort().join(',');
  if (keys === expectedKeys && existing.type === 'local' && existing.source === 'user' &&
      existing.enabled === true && existing.command === launch.command &&
      JSON.stringify(existing.args) === JSON.stringify(launch.args) &&
      JSON.stringify(existing.tools) === JSON.stringify(['*'])) {
    return { action: 'unchanged', launch };
  }
  throw new Error('A different StatePort MCP entry already exists; review it manually before changing anything');
}

export function copilotCommandSucceeded(result) {
  return result.status === 0 && !result.error;
}

function copilot(args) {
  const result = spawnSync('copilot', args, { encoding: 'utf8', timeout: 15000 });
  if (!copilotCommandSucceeded(result)) throw new Error(`Copilot CLI ${args[0]} failed; inspect its MCP configuration before retrying`);
  return result.stdout;
}

function inventory() {
  try { return JSON.parse(copilot(['mcp', 'list', '--json'])); }
  catch { throw new Error('Copilot CLI MCP inventory is unavailable; no configuration change attempted'); }
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.length > (apply ? 3 : 2)) {
    throw new Error('Usage: node scripts/setup-copilot-mcp.mjs [--apply] < desktop-mcp-config.json');
  }
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 16384) throw new Error('Desktop MCP configuration is unexpectedly large');
  }
  const launch = parseDesktopConfig(input);
  const plan = planCopilotMcpSetup(launch, inventory());
  if (!apply) {
    console.log(plan.action === 'add' ? 'Preview: add the single StatePort MCP entry to Copilot CLI user scope.' : 'Preview: identical StatePort MCP entry already exists.');
    return;
  }
  if (plan.action === 'unchanged') {
    console.log('Identical StatePort MCP entry already exists; no change made.');
    return;
  }
  copilot(['mcp', 'add', '--json', 'stateport', '--', launch.command, ...launch.args]);
  const after = planCopilotMcpSetup(launch, inventory());
  if (after.action !== 'unchanged') throw new Error('Copilot CLI did not retain the expected StatePort MCP entry');
  console.log('StatePort MCP entry added to Copilot CLI; runtime handshake still needs a separate check.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
