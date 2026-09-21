# VS Code/Cursor VSIX source check, 2026-09-12

Status: **LIMITED package and sideload proof; extension UI and StatePort agent
workflow NOT RUN**.

| Field | Observed value |
| --- | --- |
| Source commit | Published `57d9f5d66c06776c9fc48c5e9bd7d26921afa5d8`; [repository checks passed](https://github.com/StatePort-Dev/stateport-agent-skills/actions/runs/34688164216) |
| VSIX | `stateport-vscode-0.1.0-alpha.0-57d9f5d.vsix`, local file under `/tmp`; not uploaded or released |
| SHA-256 | `1af3cd3ce3920dea71d21f948253533ec7443ae11e88c30264a1427b10e692f9` |
| VS Code | `1.137.0`, Linux x86_64, isolated user-data and extensions directories |
| Cursor | `3.7.27`, embedded VS Code `1.105.1`, Linux x86_64, isolated directories |
| StatePort Desktop/runtime | Unavailable for a real MCP handshake |
| Agent/model | NOT RUN |

The official [VS Code extension MCP guide](https://code.visualstudio.com/api/extension-guides/ai/mcp)
documents `registerMcpServerDefinitionProvider`; the
[extension contribution reference](https://code.visualstudio.com/api/references/contribution-points)
documents `chatSkills`. The [Cursor extension API](https://prod.cursor.com/docs/extension-api)
documents additional Cursor-specific facilities, but this VSIX does not assume
their availability in VS Code. These references establish the source format,
not StatePort host compatibility.

## Commands and results

- `npm run verify` at the source commit: PASS (six test files and 81 structural
  source files). The tests exercise opt-in MCP definition registration,
  conflicting/invalid configuration, removal, exact Card handoff and generated
  skill freshness with a synthetic host API. They are not a GUI or agent run.
- Official `@vscode/vsce@3.9.2` installed outside the repository.
  `vsce package --no-dependencies --out /tmp/stateport-vscode-0.1.0-alpha.0.vsix`
  from `extensions/vscode/`: PASS. The VSIX contains 12 ZIP entries: manifest,
  extension code, license, guide, generated skill/references, and a generated
  copy of the shared Desktop MCP config parser. It contains no Desktop binary,
  Card, credential or user setting.
- `code --user-data-dir <isolated> --extensions-dir <isolated>
  --install-extension <VSIX> --force`: PASS, listing
  `stateport-dev.stateport@0.1.0-alpha.0`. The corresponding Cursor CLI
  install/list command passed for the **same** VSIX. Installed skill and parser
  bytes matched source in both isolated profiles.
- `code --uninstall-extension stateport-dev.stateport` and the corresponding
  Cursor CLI uninstall: PASS; each profile then listed no extensions.
- The source commit and evidence follow-up `55d33643d7c95b5ff833a8269284790623f687cb`
  were later published; [repository checks for the follow-up passed](https://github.com/StatePort-Dev/stateport-agent-skills/actions/runs/34688282685).

## Unrun acceptance and distribution

VS Code/Cursor GUI activation, contributed skill discovery, real MCP definition
registration and handshake, duplicate-path behavior with an installed agent
plugin, Copilot/Cursor Agent invocation, exact Card inspect/open/reopen/compare,
Capture, macOS/Windows, remote hosts and a current-code fix cycle are **NOT
RUN**. The VSIX publisher ID is provisional; Marketplace publisher ownership,
submission and approval were not checked. The artifact exists locally under
`/tmp` only. `vscode-extension` and `cursor-vsix` therefore remain
`unverified`, and this report does not change `copilot-vscode` or
`cursor-agent` from `scaffold`.
