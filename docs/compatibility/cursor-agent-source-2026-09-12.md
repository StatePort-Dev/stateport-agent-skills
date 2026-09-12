# Cursor Agent source/setup check, 2026-09-12

Status: **LIMITED local setup proof; Agent Plugin load and StatePort workflow
NOT RUN**.

| Field | Observed value |
| --- | --- |
| Cursor IDE | `3.7.27`, Linux x86_64; GUI plugin load not observed |
| Cursor Agent CLI | `2026.09.10-fd3934a`, official Linux x64 package extracted to `/tmp` |
| Package source | Published portable Agent Plugins package `0.1.0-alpha.4` at `1cfb14d0458352cf5d1b6dc1442fdfe98232a4b6`; [repository checks passed](https://github.com/StatePort-Dev/stateport-agent-skills/actions/runs/34688668246) |
| Runtime | Installed StatePort Desktop unavailable |
| Agent/model | NOT RUN; local `--plugin-dir` attempt stopped at authentication |

The official [Cursor plugins guide](https://prod.cursor.com/docs/plugins)
documents root Agent Plugins manifests, the local IDE plugin directory and
Customize inspection. The [MCP guide](https://prod.cursor.com/docs/mcp)
documents `~/.cursor/mcp.json` and stdio server entries. These are host
capabilities, not proof that Cursor loaded the StatePort skill.

## Commands and results

- The official installer script was downloaded and inspected without execution.
  Its pinned CLI tarball was extracted under `/tmp`. `cursor-agent --version`
  returned `2026.09.10-fd3934a`; `--help` listed `--plugin-dir <path>`.
- In a fresh temporary home, `cursor-agent --plugin-dir <local package>
  --mode ask --print <synthetic prompt>` exited with `Authentication required`.
  No agent call, skill load, tool use or model response occurred.
- `node scripts/setup-cursor-mcp.mjs` previewed a synthetic Desktop-shaped
  `/bin/true --mcp` entry. `--apply` added it to a temporary user-scope
  `mcp.json` containing an unrelated `other` server. Cursor CLI `agent mcp
  list` showed both entries with `Connection failed`, as expected for the
  synthetic executable. Repeating `--apply` made no change. `--remove` left
  `other` as the only entry; `agent mcp list` confirmed it.
- The automated source test covers preview, add, repeat, conflict rejection,
  remove, unrelated-entry preservation and invalid-file rejection. It invokes
  the helper's file function directly because the sandbox rejected nested
  subprocesses with `EPERM`. The separate CLI smoke above tested the actual
  command-line entry point.

## Unrun acceptance

Cursor IDE Customize plugin discovery, authenticated Cursor Agent plugin load,
MCP handshake with StatePort Desktop, supplied-Card use, explicit/implicit
triggering, new Capture, current-code reopen/compare, update/rollback, macOS,
Windows and remote execution are **NOT RUN**. No Cursor marketplace submission
or release artifact exists. `cursor-agent` remains `scaffold`; the VSIX sideload
is recorded separately and cannot establish Agent Plugin compatibility.
