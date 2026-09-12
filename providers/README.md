# Provider integrations

`registry.json` is the machine-readable support inventory. Each guide below is
preparation only. No installable provider package has been delivered yet.

| Provider | Preparation |
| --- | --- |
| Codex CLI / desktop / IDE extension | [Codex](codex/README.md) |
| Claude Code | [Claude Code](claude/README.md) |
| Copilot in VS Code / CLI | [Copilot](copilot/README.md) |
| Cursor Agent | [Cursor](cursor/README.md) |

Keep host surfaces distinct. A working CLI does not establish IDE or cloud
support. Native VS Code/JetBrains extensions are not housed in this repository.

When packaging is implemented, use the canonical skill directly when supported.
If a host needs copies, generate them deterministically and check freshness in
CI. Do not create four independently edited SKILL.md files or a generic plugin
framework for a single skill.
