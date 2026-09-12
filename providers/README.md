# Provider integrations

`registry.json` is the machine-readable support inventory. The Codex CLI has
an install-tested source package, but no verified StatePort agent workflow or
release. Other listed hosts remain preparation only.

| Provider | Preparation |
| --- | --- |
| Codex CLI / desktop / IDE extension | [Codex](codex/README.md) |
| Claude Code | [Claude Code](claude/README.md) |
| Copilot in VS Code / CLI | [Copilot](copilot/README.md) |
| Cursor Agent | [Cursor](cursor/README.md) |

Keep host surfaces distinct. A working CLI does not establish IDE or cloud
support. Native VS Code/JetBrains extensions are not housed in this repository.

The Codex package uses generated canonical skill copies checked for freshness
in CI. Do not create independently edited SKILL.md files or a generic plugin
framework for a single skill.
