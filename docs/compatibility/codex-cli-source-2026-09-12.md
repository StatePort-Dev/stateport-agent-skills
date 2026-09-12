# Codex CLI source-package check, 2026-09-12

Status: **LIMITED source/install proof; StatePort workflow NOT RUN**.

| Field | Observed value |
| --- | --- |
| Host | Codex CLI `0.154.0-alpha.6.1` |
| OS / architecture | Linux 6.8.0-139-generic / x86_64 |
| Node | `v24.19.0` |
| Plugin source | Local public repository checkout, development version `0.1.0-alpha.0` |
| Runtime | Installed StatePort Desktop unavailable in this environment |
| Agent/model | NOT RUN |
| Execution location | Local CLI with isolated `CODEX_HOME` under `/tmp` |

The public source was compared with the current public MCP operation map. It
contains existing-Card `list_states`, `inspect_state`, `open_state`,
`get_run_summary`, `compare_runs`, and related tools, but no public agent
Capture lifecycle or managed-Page control. No development-only API was used.

## Commands and results

- `python3 .../plugin-creator/scripts/validate_plugin.py plugins/stateport`:
  PASS after final manifest metadata was added.
- `node scripts/generate-codex-plugin.mjs --check`: PASS, generated skill and
  setup helper match their canonical sources.
- `codex plugin marketplace add <public-checkout> --json` in an isolated
  `CODEX_HOME`: returned marketplace `stateport-dev`. The checkout path is
  omitted from this public report.
- `codex plugin add stateport@stateport-dev --json`: returned installed plugin
  version `0.1.0-alpha.0`; a repeated add selected the same version. The
  cached `SKILL.md` matched the canonical source byte-for-byte, and the setup
  helper was present. `codex plugin list --json` showed it enabled.
- `codex plugin remove stateport@stateport-dev --json`: returned the plugin ID;
  subsequent `codex plugin list --json` showed no installed plugin.
- A final isolated profile installed the package twice and compared its cached
  skill and helper byte-for-byte with the source. It first registered an
  unrelated synthetic server. The helper **from the installed plugin** added
  only `stateport`; repeating `--apply` reported no change. After explicit
  `codex mcp remove stateport` and plugin removal, `codex mcp list --json`
  contained only the unrelated server. The synthetic launch was `/bin/true
  --mcp`; it was not a StatePort handshake or workflow test.
- `npm run verify`: local structural and unit checks, reported separately from
  host behavior. Published-commit CI is recorded below.

## Published Git-source follow-up

After the development source was published, `codex plugin marketplace add
StatePort-Dev/stateport-agent-skills --ref main --json` fetched public commit
`625658de4e063af632c1f4c8893fada1c63f12d9` into a new isolated profile.
`codex plugin add stateport@stateport-dev` installed version
`0.1.0-alpha.0`. A second fresh Git marketplace/profile fetched public commit
`dee46febff502ad1ee28210da080aa2b2b0fd8b8` and installed
`0.1.0-alpha.1`; the cached skill and helper matched the canonical source.
The plugin was then removed. Repository checks passed for both published
commits. This proves Git-source installation of those source revisions, not a
release or a StatePort agent workflow. The later `0.1.0-alpha.2` helper change
still needs a published Git-source check.

## Unrun acceptance

MCP handshake, exact Card inspect/open, current-code replay, compare, implicit
activation, explicit agent invocation, update/rollback, duplicate standalone
skill behavior, and all create-first Capture cases are **NOT RUN**. Codex
desktop, Codex IDE extension, macOS, Windows, remote execution and a clean
release-artifact install are **NOT RUN**. The setup helper checks JSON shape and
does not authenticate that its absolute executable path really came from
Desktop; the user must review the copied command before applying it.

This record supports the `unverified` Codex CLI registry status only. It does
not support a published release or a claim that StatePort fixes a bug through
an agent.
