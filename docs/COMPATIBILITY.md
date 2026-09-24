# Compatibility and evidence

The canonical inventory is [providers/registry.json](../providers/registry.json).
Its `update` object independently records `method`, documented `automatic`
behavior and StatePort-specific `evidenceStatus`. The method taxonomy is
`native-auto`, `native-manual`, `manual-copy`, `source-install`, or `unverified`.
The [version/update policy](VERSIONING_AND_UPDATES.md) records each host's
current install, update and removal path. None has a verified old-to-new
StatePort update transition yet.
Codex CLI, Claude Code, Copilot CLI, the VSIX in VS Code/Cursor, and the
JetBrains ZIP source for IntelliJ IDEA/WebStorm are `unverified` after limited
package, install, or binary checks. The remaining entries are `scaffold`.
The [beta.19 Linux record](compatibility/codex-cli-beta19-2026-09-20.md) confirms
explicit Codex CLI Capture through Review/Discard, separate runtime Save and
Original replay checks, and user-reported manual full-cycle acceptance.
It does not yet establish a complete agent-driven current-code fix loop, so
the aggregate Codex CLI status remains `unverified` with bounded evidence attached.

- `scaffold`: preparation exists; there is no installable adapter.
- `unverified`: an adapter exists, but required host runs are incomplete.
- `verified`: version-bound install and workflow evidence is recorded.
- `blocked`: a concrete limitation prevents the promised integration.

For `verified`, each evidence record must include nonempty `hostVersion`,
`runtimeVersion`, `skillVersion`, `date` (YYYY-MM-DD), and `report` (a local safe
Markdown path). The report must distinguish explicit and implicit invocation,
installation, update/remove, supplied-Card reuse and new Capture. Record failures
and unsupported OS/surfaces. Evidence must use synthetic data only.

The local validator checks structure and presence, not the truth of a report.
A maintainer reviews the actual evidence before changing support status.
Spec compliance, static tests and one successful demo do not prove universal
activation. Do not claim remote IDE, cloud agent or cross-machine support from
a local installation result.

The [VSIX source check](compatibility/vscode-vsix-source-2026-09-12.md) records
only packaging and sideload evidence for VS Code and Cursor.
The [Cursor Agent source check](compatibility/cursor-agent-source-2026-09-12.md)
records only a synthetic MCP setup and an authentication-blocked agent attempt.
The [JetBrains source check](compatibility/jetbrains-source-2026-09-12.md)
records ZIP build and binary verification, without a live IDE command run.

The [seven-skill candidate record](compatibility/skills-beta2-source-2026-09-24.md)
adds source checks, actual Linux Codex discovery/Capture and incomplete routing
evidence. Full A/B/C and macOS acceptance remain unverified.
