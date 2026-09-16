# Cursor Agent Plugin source candidate

Status: **scaffold for Cursor Agent discovery and workflows**. The portable
[Agent Plugins 1.0 package](../../plugins/stateport/plugin.json) has one generated
copy of the [canonical debugging skill](../../skills/stateport-debugging/SKILL.md).
[Cursor's plugin documentation](https://prod.cursor.com/docs/plugins) says this
root manifest and `skills/` layout can be loaded as an Agent Plugin; this is
a host format claim, not proof that the StatePort package loaded in Cursor.
The package has no `mcp.json`, because the installed Desktop launch path is
user-specific. It adds no duplicate persistent rules or speculative hooks.

For Cursor IDE local testing, copy the reviewed `plugins/stateport` directory
to `~/.cursor/plugins/local/stateport`, reload the window, and inspect
**Customize** for the skill. Cursor documents that path and notes local
imports can be disabled by organization policy. The current environment has
Cursor `3.7.27`, but a GUI plugin-load observation has **not** been recorded.
Do not mark the Agent Plugin installed from a VSIX sideload; the
[native extension source](../../extensions/vscode/README.md) is separate.

Cursor Agent CLI `2026.09.10-fd3934a` exposes `--plugin-dir <path>` for a local
plugin. A synthetic read-only attempt with this package stopped at
`Authentication required` before agent execution. No skill discovery or
implicit/explicit invocation is claimed from that attempt. Authentication
must be handled by the user through Cursor's supported flow.

The local copy and CLI `--plugin-dir` source are user-managed: replace the
reviewed copy or update the selected source checkout, then reload/restart the
agent. Cursor's marketplace refresh mechanism is separate from this local
source candidate; no StatePort Marketplace update was tested.

## Local MCP setup

[Cursor's MCP documentation](https://prod.cursor.com/docs/mcp) specifies the
user-scope `~/.cursor/mcp.json` file and local stdio transport. From the
installed plugin directory, save and review Desktop's **Copy MCP config** JSON,
then run:

```sh
node scripts/setup-cursor-mcp.mjs < desktop-mcp-config.json
node scripts/setup-cursor-mcp.mjs --apply < desktop-mcp-config.json
```

The first command previews; `--apply` merges only `mcpServers.stateport`,
retains other top-level/other-server values, leaves an identical entry alone,
and refuses a conflicting entry or invalid file. It does not start the server.
To remove only the matching entry with the same reviewed Desktop config:

```sh
node scripts/setup-cursor-mcp.mjs --remove < desktop-mcp-config.json
```

The helper requires Node.js 22+. It never configures a project-level server or
overwrites a different `stateport` entry. Do not also enable the VSIX MCP
provider or another user/workspace StatePort server without resolving the
duplicate. Run `agent mcp list` or inspect Cursor's MCP UI for a real connection;
the recorded `/bin/true --mcp` smoke cannot provide one.

See the [safe local CLI record](../../docs/compatibility/cursor-agent-source-2026-09-12.md).
Existing-Card workflow still needs a real Desktop connection. Create-first
Capture additionally requires the public lifecycle, available enabled
permission, and the exact managed Page capability reported by that connection.
