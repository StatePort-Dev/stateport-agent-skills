# StatePort Agent Skills

Canonical skills and provider integration sources for using StatePort with
coding agents. The intended workflow is to preserve a useful browser
reproduction as a State Card and reuse that Card while changing current code.

## Status

**Development scaffold. No supported plugin release yet.**

This repository contains an initial draft skill, provider preparation guides,
structural checks, evaluation scenarios, and contribution infrastructure.
Host installation, automatic invocation, and end-to-end StatePort workflows
have **not** been verified. A directory or a passing structural check is not a
compatibility claim. The bootstrap version is not a published release.

Do not install this draft in a production workflow or point it at sensitive
applications. Contributors may evaluate it with synthetic data and explicit
local authorization. There are no automatic install hooks, bundled credentials,
embedded runtime, or automatic MCP configuration writes.

## Repository boundary

- `skills/` owns the canonical behavior and portable references.
- `providers/` owns client-specific preparation and, later, tested packaging.
- StatePort Desktop, its MCP server, capture/replay engine, and credentials stay
  outside this repository. Skills consume the public contract; they do not
  implement another runtime.
- Native VS Code and JetBrains extension implementations are separate work.
  An agent plugin is not an IDE extension.

```text
skills/stateport-debugging/
  SKILL.md
  references/
providers/
  registry.json
  codex/
  claude/
  copilot/
  cursor/
docs/
scripts/
tests/
.github/
```

## Development

Use Node.js 22 or later and npm. There are no package dependencies and no
installation step is required for the checks:

```sh
npm run verify
```

Read [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md) before changes.
The canonical skill is [stateport-debugging](skills/stateport-debugging/SKILL.md).
The [compatibility guide](docs/COMPATIBILITY.md) defines what counts as verified.
The [evaluation guide](tests/evaluations/README.md) separates structural tests
from real-agent behavioral evidence.

## Installation and releases

There is currently no tested end-user installation command. Do not infer one
from the repository name. Provider guides are preparation documents, not
working plugins. See [release gates](docs/RELEASING.md).

## Governance and security

See [architecture](docs/ARCHITECTURE.md), [security](SECURITY.md), and
[bootstrap instructions](docs/GITHUB_SETUP.md). This repository's MIT license
covers its own source only; it does not relicense StatePort Desktop or grant
rights to third-party trademarks. See [LICENSE](LICENSE).
