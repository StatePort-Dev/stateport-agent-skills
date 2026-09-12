# Contributing

Start with [AGENTS.md](AGENTS.md), the [architecture](docs/ARCHITECTURE.md), and
[compatibility rules](docs/COMPATIBILITY.md). Keep pull requests focused.

## Local checks

Node.js 22+ is required. Run `npm run verify`; no dependency install is needed.
Behavioral changes to scripts require a failing test before the fix.
For skill changes, add or adjust a synthetic evaluation case and record actual
agent behavior in a fresh session when that host is available. Otherwise retain
an unverified status and explain the missing evidence.

## Public contributions

Use English for public instructions, documentation, and identifiers. Never copy
private product documents or real application captures into issues or PRs.
Submit small, synthetic reproduction steps and version information instead.
No contributions may require a private StatePort source checkout to use a skill.

## Provider adapters

An adapter must reference the canonical skill. Include official format sources,
minimum/actual tested versions, scope, transport, install/update/uninstall
behavior, collision handling, and a reproducible verification record.
Do not overwrite an existing user MCP or agent configuration.

## Review

The PR must state what changed, which checks actually ran, and which host tests
did not run. Self-review is required. A code owner can review significant changes;
this scaffold does not impose a mandatory second reviewer on a solo maintainer.
Security reports follow [SECURITY.md](SECURITY.md), not ordinary issue templates.
