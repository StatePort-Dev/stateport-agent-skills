# Claude Code integration

Claude Code can install the shared StatePort plugin from this repository. Source
installation and skill discovery have been checked on Linux; a complete
StatePort agent workflow remains unverified.

The plugin contains the five generated canonical skills and five explicit commands:
`/stateport:use-card`, `/stateport:new-repro`, `/stateport:reopen-card`,
`/stateport:compare-runs`, and `/stateport:check-connection`. These commands do
not bundle Desktop, connect MCP automatically or grant Capture permission.

## Install the development source

```sh
claude plugin marketplace add StatePort-Dev/stateport-agent-skills
claude plugin install stateport@stateport-dev
claude plugin details stateport@stateport-dev
```

## Connect Desktop MCP

In StatePort Desktop, use **Settings → Coding agents → Copy MCP config**. Save
and review the JSON, then run from the installed plugin directory:

```sh
node scripts/setup-claude-mcp.mjs < desktop-mcp-config.json
node scripts/setup-claude-mcp.mjs --apply < desktop-mcp-config.json
claude mcp get stateport
```

The helper requires Node.js 22+ and Claude Code. It accepts one Desktop-shaped
`stateport` stdio entry, previews the change, and uses Claude Code's public
user-scope MCP command only after `--apply`. It does not run Desktop or replace
an existing conflicting entry.

Start a fresh agent session and confirm public tool discovery. Saved
configuration is not connection proof. Do not enumerate Cards or start Capture
just to test setup; Capture additionally requires advertised capability and
explicit local permission.

## Update and remove

For version checks, alpha migration and recovery, follow the
[shared update procedure](../../AGENT_INSTALL.md#update-an-existing-installation).

```sh
claude plugin marketplace update stateport-dev
claude plugin update stateport@stateport-dev
claude plugin uninstall stateport@stateport-dev
```

Third-party marketplace auto-update depends on Claude Code settings, and the
StatePort old-to-new transition remains unverified. Remove a separately
configured, integration-owned server with:

```sh
claude mcp remove stateport --scope user
```

Current status and version-bound reports are collected in the
[compatibility inventory](../../docs/COMPATIBILITY.md). Installation, MCP
connection, skill invocation and a successful debugging workflow are separate
claims.
