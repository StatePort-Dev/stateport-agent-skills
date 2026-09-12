import path from 'node:path';

function sameKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === [...keys].sort().join(',');
}

export function parseDesktopConfig(text, platform = process.platform) {
  let config;
  try { config = JSON.parse(text); } catch { throw new Error('Desktop MCP configuration is not valid JSON'); }
  if (!sameKeys(config, ['mcpServers']) || !sameKeys(config.mcpServers, ['stateport']) ||
      !sameKeys(config.mcpServers.stateport, ['command', 'args'])) {
    throw new Error('Desktop MCP configuration contains unsupported fields or servers');
  }
  const { command, args } = config.mcpServers.stateport;
  if (typeof command !== 'string') throw new Error('Desktop MCP command must be an absolute installed path');
  const absolute = platform === 'win32' ? path.win32.isAbsolute(command) : path.isAbsolute(command);
  if (!absolute) throw new Error('Desktop MCP command must be an absolute installed path');
  const expected = platform === 'win32' ? ['--no-stdio-init', '--mcp'] : ['--mcp'];
  if (!Array.isArray(args) || args.length !== expected.length || args.some((arg, i) => arg !== expected[i])) {
    throw new Error('Desktop MCP arguments do not match the installed runtime contract');
  }
  return { command, args };
}
