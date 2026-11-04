# GitHub Copilot integrations

For a validated Node-only candidate, use the
[shared candidate contract](../../docs/AGENT_RUNTIME_CANDIDATE.md). Same-chat CLI
continuity and future-session MCP are separate. The
[4 November Ubuntu record](../../docs/compatibility/node-agents-ubuntu-2026-11-04.md)
records exact Node-only results and open gates. Published Desktop instructions
below retain their separate historical scope.

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

The plugin contains all seven generated canonical skills. It does not bundle Desktop,
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


Licensed Ubuntu follow-up: [exact surface results](../../docs/compatibility/node-agents-ubuntu-2026-11-04-licensed.md). Copilot CLI and
VS Code completed actual same-case fix/verify and cold browser reuse; manual setup
and same-chat boundaries remain. Cursor licensed model verification hit included
quota; Claude Code model access remains unqualified. Aggregate provider and legacy
Desktop statuses are unchanged. This is scoped signed-GitHub-RC evidence, not an
npm registry installation or all-platform support claim.
