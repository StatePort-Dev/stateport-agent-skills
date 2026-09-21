import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseDesktopConfig } from './desktop-mcp-config.mjs';
export { parseDesktopConfig } from './desktop-mcp-config.mjs';

export function planCodexMcpSetup(launch, servers) {
  if (!Array.isArray(servers)) throw new Error('Codex MCP inventory is unavailable');
  if (servers.some(server => server.name === 'scenariodeck' && server.enabled !== false)) {
    throw new Error('An enabled legacy scenariodeck entry exists; confirm its ownership and resolve migration explicitly before StatePort setup');
  }
  const existing = servers.find(server => server.name === 'stateport');
  if (!existing) return { action: 'add', launch };
  if (existing.enabled !== false && existing.transport?.type === 'stdio' &&
      existing.transport.command === launch.command &&
      JSON.stringify(existing.transport.args) === JSON.stringify(launch.args) &&
      existing.transport.env == null && (existing.transport.env_vars == null || existing.transport.env_vars.length === 0) &&
      existing.transport.cwd == null) {
    return { action: 'unchanged', launch };
  }
  throw new Error('A different StatePort MCP entry already exists; review it manually before changing anything');
}

function codex(args) {
  const result = spawnSync('codex', args, { encoding: 'utf8', timeout: 15000 });
  if (result.status !== 0) throw new Error(`Codex CLI ${args[0]} failed; no other configuration was changed`);
  return result.stdout;
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.length > (apply ? 3 : 2)) throw new Error('Usage: node scripts/setup-codex-mcp.mjs [--apply] < desktop-mcp-config.json');
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 16384) throw new Error('Desktop MCP configuration is unexpectedly large');
  }
  const launch = parseDesktopConfig(input);
  const servers = JSON.parse(codex(['mcp', 'list', '--json']));
  const plan = planCodexMcpSetup(launch, servers);
  if (!apply) {
    console.log(plan.action === 'add' ? 'Preview: add the single StatePort MCP entry to Codex.' : 'Preview: identical StatePort MCP entry already exists.');
    return;
  }
  if (plan.action === 'add') {
    codex(['mcp', 'add', 'stateport', '--', launch.command, ...launch.args]);
    const after = JSON.parse(codex(['mcp', 'list', '--json']));
    if (planCodexMcpSetup(launch, after).action !== 'unchanged') throw new Error('Codex did not retain the expected StatePort MCP entry');
    console.log('StatePort MCP entry added to Codex; runtime handshake still needs a separate check.');
  } else {
    console.log('Identical StatePort MCP entry already exists; no change made.');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
