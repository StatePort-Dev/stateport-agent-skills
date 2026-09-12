# Compatibility and evidence

The canonical inventory is [providers/registry.json](../providers/registry.json).
Codex CLI, Claude Code, Copilot CLI, and the VSIX in VS Code/Cursor are
`unverified` after source-package or extension install checks; the remaining
entries are `scaffold`. No StatePort agent workflow is verified.

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
