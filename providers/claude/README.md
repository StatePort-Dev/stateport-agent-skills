# Claude Code integration candidate

Status: **source plugin install-tested on Claude Code 2.1.269 for Linux x64;
StatePort runtime and agent workflows unverified**.

The [shared plugin package](../../plugins/stateport/.claude-plugin/plugin.json)
contains the generated copy of the [canonical debugging skill](../../skills/stateport-debugging/SKILL.md).
Run `npm run sync` after editing the canonical skill or integration metadata;
`npm run verify` checks that the packaged copy is current. Do not edit it by
hand. Claude Code loads it as `/stateport:stateport-debugging`. This explicit
invocation is a host format fact, not evidence that the agent will select or
execute the workflow correctly.

Five manual entry points are also available:
`/stateport:use-card`, `/stateport:new-repro`, `/stateport:reopen-card`,
`/stateport:compare-runs`, and `/stateport:check-connection`. They carry only
host-specific invocation metadata and route the request to the canonical skill;
they do not add a second debugging strategy. The create-first entry first
requires the connected runtime to advertise the complete public Capture
lifecycle with available, enabled permission.

The package intentionally has no `.mcp.json` and runs no install hooks. Connect
only the MCP server supplied by an installed StatePort Desktop using the
Desktop's public **Copy MCP config** output. Save the copied JSON to a local
file and review its absolute command and arguments. From the installed plugin
directory, the optional helper previews a Claude Code user-scope change and
applies it only when requested:

```sh
node scripts/setup-claude-mcp.mjs < desktop-mcp-config.json
node scripts/setup-claude-mcp.mjs --apply < desktop-mcp-config.json
claude mcp get stateport
```

The helper accepts one Desktop-shaped stdio entry, uses Claude Code's public
`mcp add-json` command, and leaves unrelated entries to Claude Code. An
existing `stateport` entry makes the CLI reject the add; review it manually
before changing anything. The helper does not run the Desktop executable or
check the connection. `claude mcp get` performs a separate connection check;
use it only after the installed Desktop is ready. The helper needs Node.js 22+
and Claude Code on `PATH`. The package cannot infer an executable,
authenticate the copied configuration, or authorize Capture.
The [public MCP operation map](../../skills/stateport-debugging/references/public-mcp.md)
supports supplied-Card reuse and capability-gated agent Capture. It does not
grant Capture permission or prove a Claude Code workflow.

## Source installation

After reviewing a published revision, use Claude Code's Git marketplace flow:

```sh
claude plugin marketplace add StatePort-Dev/stateport-agent-skills
claude plugin install stateport@stateport-dev
claude plugin details stateport@stateport-dev
```

The first recorded install used a local checkout with
`claude plugin marketplace add /path/to/stateport-agent-skills` and an isolated
`CLAUDE_CONFIG_DIR`. Published Git-source installation through
`0.1.0-alpha.4` subsequently passed in fresh profiles. A real MCP handshake
and any agent invocation remain untested. Use
`claude plugin disable`, `enable`, `update`,
or `uninstall` with `stateport@stateport-dev` to manage the plugin without
touching Desktop data or separately configured MCP servers. To remove the
helper-created user-scope server separately, first check its ownership, then
use `claude mcp remove stateport --scope user`.
Claude Code documents startup auto-update for marketplace plugins, but
third-party marketplaces are disabled by default unless the user enables it.
For a deliberate update, refresh `stateport-dev` with
`claude plugin marketplace update stateport-dev`, then run
`claude plugin update stateport@stateport-dev`. The recorded update command
found the same version; no StatePort old-to-new update was tested. An explicit
manifest version must be bumped for Claude's cache to take new source bytes.

The [source-install evidence](../../docs/compatibility/claude-code-source-2026-09-12.md)
records the tested commands and limitations. Run the synthetic cases from the
[evaluation guide](../../tests/evaluations/README.md) in a real host with a
public Desktop runtime before considering the integration verified. Existing
Card use and new Capture require separate evidence.
