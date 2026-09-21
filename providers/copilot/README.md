# GitHub Copilot integrations

GitHub Copilot CLI can install the shared StatePort plugin from this repository.
Source installation and skill discovery have been checked on Linux; the
StatePort workflow remains unverified. Copilot Agent in VS Code is a separate,
unverified host surface.

## Copilot CLI development source

```sh
copilot plugin marketplace add StatePort-Dev/stateport-agent-skills
copilot plugin install stateport@stateport-dev
copilot skill list --json
```

The plugin contains the generated canonical skill. It does not bundle Desktop,
write MCP configuration during installation or grant Capture permission.

In StatePort Desktop, use **Settings → Coding agents → Copy MCP config**. Save
and review the JSON, then run from the installed plugin directory:

```sh
node scripts/setup-copilot-mcp.mjs < desktop-mcp-config.json
node scripts/setup-copilot-mcp.mjs --apply < desktop-mcp-config.json
copilot mcp get stateport --json
```

The helper requires Node.js 22+ and Copilot CLI. It accepts one Desktop-shaped
`stateport` stdio entry, preserves unrelated entries, leaves an identical entry
unchanged, rejects conflicts and never launches Desktop.

Start a fresh CLI session and confirm public tool discovery. Package discovery
or saved MCP configuration is not a live StatePort workflow. Do not enumerate
Cards or start Capture merely to test setup.

Update or remove the CLI plugin with:

```sh
copilot plugin marketplace update stateport-dev
copilot plugin update stateport
copilot plugin uninstall stateport
```

The old-to-new StatePort transition remains unverified. Remove a separately
configured server only after confirming ownership:

```sh
copilot mcp remove stateport
```

## Copilot Agent in VS Code

VS Code supports Git marketplace Agent Plugins through
`chat.plugins.marketplaces`. Add this repository, enable Agent Plugins, review
the trust prompt, and install StatePort from `@agentPlugins`. Add the Desktop
server through **MCP: Add Server** using the copied local stdio configuration.

An authenticated Copilot Agent workflow has not been checked. The independent
[StatePort VSIX](../../extensions/vscode/README.md) is another distribution
path; do not enable both without resolving duplicate skill and MCP entries.

Current status and version-bound reports are collected in the
[compatibility inventory](../../docs/COMPATIBILITY.md). CLI installation, VS
Code plugin loading, MCP connection and successful debugging are separate
claims.
