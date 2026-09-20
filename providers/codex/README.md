# Codex integration candidate

Status: **Codex CLI package install-tested on Linux; agent workflow and runtime
unverified.** The Codex desktop surface has not been tested. Codex IDE extension
does not load plugins; it needs a separate standalone skill and MCP setup.

The [StatePort plugin](../../plugins/stateport/plugin.json) packages the
[canonical debugging skill](../../skills/stateport-debugging/SKILL.md). Its skill
and setup helper are generated from the repository sources; run
`npm run sync` after changing canonical source or metadata and
`npm run verify` to check freshness. Do not edit the packaged copies directly.

For explicit first-time setup, start with the [setup entrypoint](../../AGENT_INSTALL.md)
and Desktop **Settings → Coding agents**. A Card is not required. Verify public tool
discovery in the actual host without listing Cards, calling inspect on a fake
ID, or starting Capture. Zero Cards means connection may be verified while
case verification remains unperformed. Once a case is saved in Desktop, use
its secondary instructions link and Settings **Copy task** (when offered).

## Observed host contract

On 2026-09-12, Codex CLI `0.154.0-alpha.6.1` accepted the portable Agent Plugins
manifest with a Codex compatibility manifest and a local marketplace. The
tested scope was an isolated local CLI profile on Linux x64. The plugin adds a
skill; it does not bundle a guessed StatePort executable or automatically grant
Capture authority. The local StatePort MCP server uses stdio and must be
connected separately from the installed Desktop's **Copy MCP config** output.

Official format and surface references: [Codex plugins](https://developers.openai.com/codex/plugins/),
[plugin packaging](https://developers.openai.com/plugins/build/plugins), and
[skills](https://developers.openai.com/codex/skills/). These documents establish
host format, not StatePort compatibility.

## Install from public source

For a reviewed public source revision, add the repository marketplace and
install the plugin:

```sh
codex plugin marketplace add StatePort-Dev/stateport-agent-skills --ref main
codex plugin add stateport@stateport-dev
```

The local checkout form used for the initial package test is
`codex plugin marketplace add /path/to/stateport-agent-skills`. It is a source
test, not release installation proof. Published Git-source installation through
`0.1.0-alpha.4` passed in isolated profiles. This proves package installation
and discovery only. Start a new Codex session after install.
If a standalone `stateport-debugging` skill is already installed, remove or
disable that duplicate before using the plugin; two discovery paths do not
improve activation reliability.

In installed StatePort Desktop, use **Copy MCP config**. Save that one JSON
document to a local file and review its absolute command and arguments. The
optional packaged helper previews a Codex-only change, then applies it when
explicitly requested:

```sh
node scripts/setup-codex-mcp.mjs < desktop-mcp-config.json
node scripts/setup-codex-mcp.mjs --apply < desktop-mcp-config.json
codex mcp get stateport --json
```

Run the helper from the plugin package's own directory. It accepts only the
single Desktop-shaped `stateport` stdio entry, preserves unrelated MCP
servers, rejects a conflicting existing `stateport` entry, and does not run
the Desktop executable during setup. Review the copied command: the helper
cannot authenticate its origin. It needs Node.js 22+ and Codex
CLI. `codex mcp get` proves saved configuration only; open a new agent session
and confirm MCP handshake and the public `inspect_state` capability separately.
If the Desktop has no installed executable, connection cannot be claimed.

## Update and remove

The local CLI exposes `codex plugin marketplace upgrade stateport-dev` to
refresh the Git source, followed by `codex plugin remove stateport@stateport-dev`
and `codex plugin add stateport@stateport-dev` for a reviewed new version.
This old-to-new StatePort path has not been tested. Automatic Codex plugin
updates are unverified. Preview any changed Desktop MCP launch
path against `codex mcp get stateport --json`; this helper deliberately stops on
a conflict instead of overwriting it. Remove the plugin with
`codex plugin remove stateport@stateport-dev`. The separately configured MCP
entry remains until the user chooses `codex mcp remove stateport`; remove it
only after confirming it is the integration-owned entry. These commands do not
delete State Cards, Desktop data, or other servers.

The tested local install/remove and synthetic MCP-configuration results are
recorded in [the Codex CLI source evidence](../../docs/compatibility/codex-cli-source-2026-09-12.md).
Existing-Card AG-01 and Capture AG-02–AG-05 have not run in a real agent host.
Create-first reproduction is available only when the connected runtime
advertises `get_capture_capability` plus the complete public Capture lifecycle,
and reports available, enabled permission. This package neither grants that
permission nor claims host acceptance.

The installed-Desktop probe on 2026-09-16 reached a different host blocker:
an ephemeral, read-only Codex CLI session launched the installed Electron
runtime without a display context, so it exited before MCP discovery. The
temporary configuration was removed after the probe. See the
[installed MCP evidence](../../docs/compatibility/codex-cli-installed-mcp-2026-09-16.md);
beta.11 now advertises the public Capture lifecycle in a direct MCP smoke, but
the Codex-host display blocker remains. This is not Card or Capture workflow
evidence.

The later [beta.16 host discovery probe](../../docs/compatibility/codex-cli-discovery-2026-09-19.md)
discovered inspect/open tools in a real Codex CLI session without Card reads.
It supersedes the earlier display failure for discovery on that version only;
it did not load a plugin or prove Capture or the existing-Card fix loop.
