# Provider integrations

`registry.json` is the machine-readable support inventory. Codex CLI, Claude
Code, and Copilot CLI have install-tested source packages; VSIX has local
install smoke, and the JetBrains source has a local build. Bounded Codex CLI
Capture/replay checks exist, but no host has yet completed the full supported
current-code fix/reopen/compare workflow.

| Provider | Preparation |
| --- | --- |
| Codex CLI / desktop / IDE extension | [Codex](codex/README.md) |
| Claude Code | [Claude Code](claude/README.md) |
| Copilot in VS Code / CLI | [Copilot](copilot/README.md) |
| Cursor Agent | [Cursor](cursor/README.md) |
| IntelliJ IDEA / WebStorm plugin | [JetBrains](../extensions/jetbrains/README.md) |

Keep host surfaces distinct. A working CLI does not establish IDE or cloud
support. Native VS Code and JetBrains source candidates live under `extensions/`.

The Codex package uses generated canonical skill copies checked for freshness
in CI. Edit canonical entrypoints under `skills/` and shared references under
`skills/stateport-debugging/references`; regenerate packaged copies. Installation
and update instructions are in [AGENT_INSTALL.md](../AGENT_INSTALL.md).
