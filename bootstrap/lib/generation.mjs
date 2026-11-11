import { NODE_RANGE, NATIVE_API, supportedNode } from './node-host.mjs';
const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function knownGeneration(value) {
  const legacy = value?.schemaVersion === 'agent-generation/1';
  const keys = legacy ? 'arch,browser,launcher,mcp,nativeABI,nodeMajor,permissions,platform,schemaVersion,skills,storageRead,storageWrite,task,taskSession'
    : 'arch,browser,launcher,mcp,nativeAPI,nodeRange,permissions,platform,schemaVersion,skills,storageRead,storageWrite,task,taskSession';
  return value && Object.keys(value).sort().join(',') === keys
    && (legacy ? value.nodeMajor === 24 && value.nativeABI === '137' : value.schemaVersion === 'agent-generation/2' && value.nodeRange === NODE_RANGE && value.nativeAPI === NATIVE_API)
    && value.launcher === 1
    && (((value.platform === 'linux' || value.platform === 'win32') && value.arch === 'x64') || (value.platform === 'darwin' && value.arch === 'arm64'))
    && value.task === 'agent-task/1' && value.taskSession === 'agent-task-session/1'
    && ['mcp', 'skills', 'storageRead', 'storageWrite'].every(key => hex(value[key]))
    && Array.isArray(value.permissions) && value.permissions.length > 0 && value.permissions.length <= 16
    && value.permissions.every(item => typeof item === 'string' && /^[a-z_-]{1,64}$/.test(item))
    && value.browser && Object.keys(value.browser).sort().join(',') === 'payload,playwright,preference'
    && ['system', 'pinned'].includes(value.browser.preference) && typeof value.browser.playwright==='string' && /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(value.browser.playwright)
    && (value.browser.preference === 'system' ? value.browser.payload === null : hex(value.browser.payload));
}
export function validGeneration(value, host = {platform:process.platform, arch:process.arch, node:process.versions.node, modules:process.versions.modules, napi:process.versions.napi}) {
  return Boolean(knownGeneration(value) && value.platform === host.platform && value.arch === host.arch
    && (value.schemaVersion === 'agent-generation/1'
      ? host.node.split('.')[0] === '24' && value.nativeABI === host.modules
      : supportedNode(host.node) && Number(host.napi) >= NATIVE_API));
}
