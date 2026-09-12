import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseDesktopConfig } from './desktop-mcp-config.mjs';

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function planCursorMcpSetup(launch, config) {
  if (!object(config) || !object(config.mcpServers)) throw new Error('Cursor MCP configuration is not an object with mcpServers');
  const existing = config.mcpServers.stateport;
  const wanted = { type: 'stdio', command: launch.command, args: launch.args };
  if (existing === undefined) return { action: 'add', config: { ...config, mcpServers: { ...config.mcpServers, stateport: wanted } } };
  if (object(existing) && Object.keys(existing).sort().join(',') === 'args,command,type' &&
      existing.type === 'stdio' && existing.command === launch.command &&
      JSON.stringify(existing.args) === JSON.stringify(launch.args)) return { action: 'unchanged', config };
  throw new Error('A different StatePort MCP entry already exists; review it manually before changing anything');
}

function readCursorConfig(file) {
  try {
    const info = fs.lstatSync(file);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error('Cursor MCP configuration is not a regular file');
    if (info.size > 1_000_000) throw new Error('Cursor MCP configuration is unexpectedly large');
    const bytes = fs.readFileSync(file, 'utf8');
    let config;
    try { config = JSON.parse(bytes); } catch { throw new Error('Cursor MCP configuration is not valid JSON'); }
    return { bytes, config, mode: info.mode & 0o777 };
  } catch (error) {
    if (error.code === 'ENOENT') return { bytes: null, config: { mcpServers: {} }, mode: 0o600 };
    throw error;
  }
}

function writeCursorConfig(file, original, config) {
  const directory = path.dirname(file);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('Cursor config directory is a symlink');
  const current = readCursorConfig(file);
  if (current.bytes !== original.bytes) throw new Error('Cursor MCP configuration changed during setup; retry after reviewing it');
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(config, null, 2)}\n`, { mode: original.mode, flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary);
  }
}

export function setupCursorMcp(file, input, apply = false) {
  const launch = parseDesktopConfig(input);
  const original = readCursorConfig(file);
  const plan = planCursorMcpSetup(launch, original.config);
  if (apply && plan.action === 'add') writeCursorConfig(file, original, plan.config);
  return plan.action;
}

export function removeCursorMcp(file, input) {
  const launch = parseDesktopConfig(input);
  const original = readCursorConfig(file);
  const plan = planCursorMcpSetup(launch, original.config);
  if (plan.action === 'add') return 'unchanged';
  const servers = { ...original.config.mcpServers };
  delete servers.stateport;
  writeCursorConfig(file, original, { ...original.config, mcpServers: servers });
  return 'removed';
}

async function main() {
  const apply = process.argv.includes('--apply');
  const remove = process.argv.includes('--remove');
  if ((apply && remove) || process.argv.length > (apply || remove ? 3 : 2)) throw new Error('Usage: node scripts/setup-cursor-mcp.mjs [--apply|--remove] < desktop-mcp-config.json');
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 16384) throw new Error('Desktop MCP configuration is unexpectedly large');
  }
  const file = path.join(os.homedir(), '.cursor', 'mcp.json');
  if (remove) {
    const result = removeCursorMcp(file, input);
    console.log(result === 'removed' ? 'Matching StatePort MCP entry removed from Cursor user scope; other entries preserved.' : 'No StatePort MCP entry exists; no change made.');
    return;
  }
  const action = setupCursorMcp(file, input, apply);
  if (!apply) {
    console.log(action === 'add' ? 'Preview: add one StatePort stdio MCP entry to Cursor user scope.' : 'Preview: identical StatePort MCP entry already exists.');
    return;
  }
  if (action === 'unchanged') {
    console.log('Identical StatePort MCP entry already exists; no change made.');
    return;
  }
  console.log('StatePort MCP entry added to Cursor user scope; runtime handshake still needs a separate check.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
