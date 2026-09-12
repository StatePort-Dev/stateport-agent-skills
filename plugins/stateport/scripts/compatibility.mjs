/** Classify only facts obtained from the connected public MCP server. */
export function evaluateCompatibility(metadata, runtime, requiredCapabilities = []) {
  if (!runtime?.available) return { status: 'runtime_unavailable' };

  const capabilities = runtime.capabilities;
  if (Array.isArray(capabilities)) {
    const missing = requiredCapabilities.filter(name => !capabilities.includes(name));
    if (missing.length) return { status: 'capability_unavailable', missing };
  }

  const contract = runtime.mcpContractVersion;
  if (Object.hasOwn(runtime, 'mcpContractVersion') && !Number.isInteger(contract)) {
    return { status: 'mcp_contract_unsupported' };
  }
  if (Number.isInteger(contract)) {
    if (contract < metadata.mcpContract.minimum) return { status: 'runtime_update_required' };
    if (contract > metadata.mcpContract.maximum) return { status: 'integration_update_required' };
  }

  if (!Array.isArray(capabilities)) return { status: 'capability_unknown' };
  if (!Number.isInteger(contract)) return { status: 'compatible_unversioned' };
  return { status: 'compatible' };
}
