# Claude Code source-package check, 2026-09-12

Status: **LIMITED local install proof; StatePort workflow NOT RUN**.

| Field | Observed value |
| --- | --- |
| Host | Claude Code `2.1.269` |
| OS / architecture | Linux x86_64 |
| Plugin source | Local public repository checkout, development version `0.1.0-alpha.1` |
| Runtime | Installed StatePort Desktop unavailable in this environment |
| Agent/model | NOT RUN |
| Execution location | Local CLI with isolated `CLAUDE_CONFIG_DIR` under `/tmp` |

The official Claude Code plugin contract uses `.claude-plugin/plugin.json`,
`skills/<name>/SKILL.md`, and a Git marketplace entry with a relative source.
The shared package carries no `.mcp.json`, hooks, or runtime executable. The
installed skill copy was compared byte-for-byte with the generated source.

## Commands and results

- `claude --version`: `2.1.269 (Claude Code)` from an official CLI npm package
  installed only in a temporary directory.
- `claude plugin validate .`: PASS with two non-blocking warnings for `interface`
  and `policy`. Those catalog fields serve Codex CLI; Claude Code ignores them.
- `claude plugin validate plugins/stateport`: PASS without warnings.
- `claude plugin marketplace add <public-checkout>` in an isolated profile:
  added `stateport-dev` at user scope.
- `claude plugin install stateport@stateport-dev --json`: installed
  `0.1.0-alpha.1` at user scope. The first isolated profile reported the one
  canonical skill and zero bundled MCP servers, hooks, or agents.
- After adding five bounded manual commands, a second fresh isolated profile
  installed the local source. `claude plugin details` reported six entries:
  `stateport-debugging`, `use-card`, `new-repro`, `reopen-card`, `compare-runs`,
  and `check-connection`. This is discovery proof, not agent behavior proof.
- Repeating `claude plugin install` reported already installed. `disable`
  changed the isolated profile to `enabled: false`; `enable` restored it.
  `update` reported that `0.1.0-alpha.1` was current.
- `claude plugin uninstall stateport@stateport-dev` removed the install;
  `claude plugin list --json` returned an empty list.
- The helper from the packaged plugin previewed a synthetic Desktop config
  without writes. Against a new isolated profile with an unrelated `other`
  server, `node scripts/setup-claude-mcp.mjs --apply` added only `stateport`.
  Repeating `--apply` failed closed on the existing name. `claude mcp get`
  showed both entries; after `claude mcp remove stateport --scope user`, the
  unrelated entry remained. The synthetic launch was `/bin/true --mcp`, so
  its health check failed as expected; this is not a StatePort handshake.
- After publication, a fresh Git marketplace/profile fetched public commit
  `dee46febff502ad1ee28210da080aa2b2b0fd8b8` and installed
  `0.1.0-alpha.1`. `claude plugin details` discovered the canonical skill and
  five commands; repeated install, disable/enable and uninstall completed.
  The cached skill matched the canonical source. Repository checks passed for
  this commit. The later `0.1.0-alpha.2` helper change is local only so far.

## Unrun acceptance

Published Git-source installation of `0.1.0-alpha.2`, real MCP handshake,
supplied-Card inspect/open, current-code replay and compare, explicit or
implicit agent invocation, rollback to an older version, and every Capture
case are **NOT RUN**. macOS, Windows, Claude desktop, and remote execution are
**NOT RUN**. The public runtime currently exposes existing-Card operations but
not the agent Capture lifecycle or managed Page control needed for create-first
reproduction.

This record supports `unverified` for Claude Code. It does not prove that a
StatePort Card reproduces a bug or that an agent fixes one.
