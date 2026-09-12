# Copilot CLI source-package check, 2026-09-12

Status: **LIMITED source/install and synthetic setup proof; StatePort workflow
NOT RUN**.

| Field | Observed value |
| --- | --- |
| Host | GitHub Copilot CLI `1.0.83` |
| OS / architecture | Linux x86_64 |
| Package | Published `0.1.0-alpha.1` from public commit `dee46febff502ad1ee28210da080aa2b2b0fd8b8`; `0.1.0-alpha.2` helper tested locally |
| Runtime | Installed StatePort Desktop unavailable in this environment |
| Agent/model | NOT RUN |
| Execution location | Local CLI with isolated `COPILOT_HOME` and `COPILOT_CACHE_HOME` under `/tmp` |

The published root `plugin.json` uses Agent Plugins 1.0 and contains a
generated copy of the canonical skill. The package does not include an MCP
server executable, startup hook, or runtime credentials.

## Commands and results

- The official CLI was installed only in a temporary directory;
  `copilot --version` returned `1.0.83`.
- `copilot plugin marketplace add <public-checkout>` and
  `copilot plugin install stateport@stateport-dev` in an isolated profile:
  PASS. Copilot reported one installed skill, live from that checkout.
- `copilot plugin marketplace add StatePort-Dev/stateport-agent-skills` and
  `copilot plugin install stateport@stateport-dev` in a second isolated profile:
  PASS. The Git marketplace checkout resolved to commit
  `dee46febff502ad1ee28210da080aa2b2b0fd8b8`.
- `copilot skill list --json`: reported enabled `stateport-debugging` with
  source `plugin`. This is discovery, not an agent evaluation.
- First `copilot plugin update stateport`: blocked by sandbox DNS. Retrying
  with network access returned `already at latest` for `0.1.0-alpha.1`.
  `copilot plugin uninstall stateport` removed it; the plugin list was empty.
- The packaged `0.1.0-alpha.2` helper previewed a synthetic Desktop config.
  In a separate isolated profile containing an unrelated `other` MCP entry,
  `node scripts/setup-copilot-mcp.mjs --apply` added only `stateport`.
  Repeating it made no change. A different synthetic `stateport` command was
  rejected before any write. After removing `stateport`, `other` remained.
  The synthetic launch was `/bin/true --mcp`; it was never a StatePort
  handshake. Nested CLI execution required an unsandboxed local smoke because
  the sandbox returned an empty result for the child process.

## Unrun acceptance

Published Git-source installation of `0.1.0-alpha.2`, real MCP handshake,
supplied-Card inspect/open/reopen/compare, create-first Capture, explicit and
implicit agent invocation, rollback, VS Code/Copilot Agent, macOS, Windows,
remote execution, and release-artifact installation are **NOT RUN**. The public
runtime contract currently supports existing-Card operations but not the
agent Capture lifecycle and managed Page control.

This record supports `unverified` for Copilot CLI only. It does not support
`verified` for Copilot in VS Code or a claim that an agent reproduced or fixed
a bug.
