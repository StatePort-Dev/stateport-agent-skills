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
  if (typeof command !== 'string' || /[\0\r\n]/.test(command)) throw new Error('Desktop MCP command must be an absolute installed path');
  const absolute = platform === 'win32' ? path.win32.isAbsolute(command) : path.isAbsolute(command);
  if (!absolute) throw new Error('Desktop MCP command must be an absolute installed path');
  const expected = platform === 'win32'
    ? ['--no-stdio-init', '--mcp']
    : platform === 'linux'
      ? ['--ozone-platform=headless', '--headless', '--disable-gpu', '--mcp']
      : ['--mcp'];
  const linuxBundled = platform === 'linux' && path.posix.basename(command) === 'node' &&
    path.posix.basename(path.posix.dirname(command)) === 'mcp-runtime' &&
    Array.isArray(args) && args.length === 1 &&
    args[0] === path.posix.join(path.posix.dirname(command), 'mcp-main.cjs');
  if (linuxBundled) return { command, args };
  if (!Array.isArray(args) || args.length !== expected.length || args.some((arg, i) => arg !== expected[i])) {
    throw new Error('Desktop MCP arguments do not match the installed runtime contract');
  }
  return { command, args };
}
