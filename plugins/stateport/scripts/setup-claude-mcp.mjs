import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseDesktopConfig } from './setup-codex-mcp.mjs';

export function buildClaudeServerConfig(launch) {
  return { type: 'stdio', command: launch.command, args: launch.args };
}

export function claudeCommandSucceeded(result) {
  return result.status === 0;
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.length > (apply ? 3 : 2)) {
    throw new Error('Usage: node scripts/setup-claude-mcp.mjs [--apply] < desktop-mcp-config.json');
  }
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 16384) throw new Error('Desktop MCP configuration is unexpectedly large');
  }
  const launch = parseDesktopConfig(input);
  if (!apply) {
    console.log('Preview: add the single StatePort stdio MCP entry to Claude Code user scope. Existing entries remain under Claude Code control.');
    return;
  }
  const args = ['mcp', 'add-json', '--scope', 'user', 'stateport', JSON.stringify(buildClaudeServerConfig(launch))];
  const result = spawnSync('claude', args, { encoding: 'utf8', timeout: 15000 });
  if (!claudeCommandSucceeded(result)) {
    throw new Error('Claude Code rejected StatePort MCP setup; review existing entries and the installed CLI without replacing configuration automatically');
  }
  console.log('StatePort MCP entry added to Claude Code user scope; runtime handshake still needs a separate check.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
