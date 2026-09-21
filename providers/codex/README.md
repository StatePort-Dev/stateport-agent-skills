# Codex integration

Codex CLI can install the shared StatePort plugin from this repository and
connect separately to the local MCP server supplied by StatePort Desktop.
Source installation and bounded Codex CLI Capture/replay checks have passed on
Linux; the complete current-code fix/reopen/compare workflow remains unverified.
Codex desktop and IDE surfaces have separate, unverified setup paths.

The plugin contains the generated copy of the
[canonical debugging skill](../../skills/stateport-debugging/SKILL.md). It does
not bundle Desktop, guess an executable, configure MCP automatically or grant
Capture permission.

## Install the development source

```sh
codex plugin marketplace add StatePort-Dev/stateport-agent-skills --ref main
codex plugin add stateport@stateport-dev
```

Start a new Codex session after installation. If a standalone
`stateport-debugging` skill is already installed, remove or disable the duplicate
before enabling this plugin.

## Connect Desktop MCP

In StatePort Desktop, open **Settings → Coding agents → Connection details →
Copy MCP config**. Save and review that JSON. From the installed plugin
directory, preview the Codex user configuration change before applying it:

```sh
node scripts/setup-codex-mcp.mjs < desktop-mcp-config.json
node scripts/setup-codex-mcp.mjs --apply < desktop-mcp-config.json
codex mcp get stateport --json
```

The helper requires Node.js 22+ and Codex CLI. It accepts one Desktop-shaped
`stateport` stdio entry, preserves unrelated servers, rejects conflicts and does
not run the copied command. It cannot authenticate the configuration's origin.

`codex mcp get` proves saved configuration, not a live connection. Start a fresh
session and confirm public StatePort tool discovery. Do not list Cards, inspect
a fake ID or start Capture merely to test setup. Zero Cards is a valid completed
connection check.

Codex IDE does not load the plugin; use its supported standalone-skill mechanism
plus the same reviewed Desktop MCP configuration. For Codex desktop, use the
host's plugin and MCP controls when available. Neither surface is verified by
the Codex CLI result.

## Update and remove

```sh
codex plugin marketplace upgrade stateport-dev
codex plugin remove stateport@stateport-dev
codex plugin add stateport@stateport-dev
```

The old-to-new StatePort transition remains unverified. To remove the separately
configured server, first confirm it is integration-owned, then run:

```sh
codex mcp remove stateport
```

Plugin or MCP removal does not delete Cards or Desktop data. After a Desktop
update, restart the MCP connection and check the version reported by the new
process where available.

## Evidence boundary

Current status and version-bound reports are collected in the
[compatibility inventory](../../docs/COMPATIBILITY.md). Package installation,
MCP discovery, agent Capture, supplied-Card reuse and a successful code fix are
separate claims. The current source is a development candidate, not a tagged
release.
