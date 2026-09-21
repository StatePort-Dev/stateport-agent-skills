# Cursor Agent integration

The portable StatePort Agent Plugin is a source candidate for Cursor. Local
plugin loading and a complete StatePort workflow remain unverified. The package
contains one generated canonical skill and no bundled runtime or automatic MCP
configuration.

## Load the development source

For Cursor IDE, copy the reviewed `plugins/stateport` directory to
`~/.cursor/plugins/local/stateport`, reload the window, and inspect **Customize**.
Organization policy may disable local imports. Cursor Agent CLI can load a
reviewed checkout with its documented `--plugin-dir` option. Authentication and
plugin discovery must be verified in the actual host.

The independent [StatePort VSIX](../../extensions/vscode/README.md) is a
different distribution path. A VSIX install does not establish Agent Plugin
loading; avoid enabling duplicate skills or MCP providers.

## Connect Desktop MCP

In StatePort Desktop, use **Settings → Coding agents → Copy MCP config**. Save
and review the JSON, then run from the plugin directory:

```sh
node scripts/setup-cursor-mcp.mjs < desktop-mcp-config.json
node scripts/setup-cursor-mcp.mjs --apply < desktop-mcp-config.json
```

The helper requires Node.js 22+. It previews and then merges only
`mcpServers.stateport` in Cursor's user-scope MCP file, preserves unrelated
content, leaves an identical entry unchanged and rejects conflicts. It never
starts Desktop or writes project-level configuration.

Confirm the real connection in Cursor's MCP UI or supported CLI. The recorded
synthetic setup command is not connection proof. Do not enumerate Cards or
start Capture merely to test setup.

Remove only an entry that matches the same reviewed Desktop configuration:

```sh
node scripts/setup-cursor-mcp.mjs --remove < desktop-mcp-config.json
```

Local copies are user-managed: replace the complete reviewed plugin directory
or update its selected checkout, then restart the host. Current status and
version-bound reports are collected in the
[compatibility inventory](../../docs/COMPATIBILITY.md).
