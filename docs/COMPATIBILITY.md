# Compatibility and evidence

The canonical inventory is [providers/registry.json](../providers/registry.json).
Codex CLI is `unverified` after a local source-package install check; the
remaining entries are `scaffold`. No StatePort agent workflow is verified.

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
