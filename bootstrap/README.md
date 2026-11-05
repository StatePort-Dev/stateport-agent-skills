# StatePort

Save a browser reproduction as a State Card, verify a fix against the same
conditions, and reopen it in a later coding-agent session.

Requires an existing Node.js 24.x/npm installation. Install with `npx stateport`
(PowerShell: `npx.cmd stateport`). The transparent bootstrap verifies and downloads
the platform runtime and configures the detected supported coding agent.
Desktop is optional. Capture uses a separate StatePort-owned browser profile.
The system-browser runtime excludes Chromium; the pinned browser fallback is a
separate explicit, integrity-checked download. Developer execution requires
valid StatePort Developer access.

Documentation: https://docs.stateport.dev/
Source: https://github.com/StatePort-Dev/stateport-agent-skills/tree/main/bootstrap

## What happens next

The terminal shows download progress, a component checklist (runtime, browser,
skills and coding-agent connection), and concrete next steps with an example
request for your agent. Existing edited/foreign settings are preserved; a setup
conflict is clearly marked incomplete and exits with code 1. Runtime installation
and host tool discovery are separate outcomes.

Use `npx stateport --json` for scripts or an authorized same-chat agent setup.
It returns the exact verified `currentTask` launcher descriptor. Human text is
not a machine protocol. MCP/task-session remain machine-only automatically.
`--help` and `--version` do not install anything. `NO_COLOR` disables colour;
redirected output is plain text.

Bootstrap rc.6 delivers these terminal improvements while retaining signed
runtime rc.5 and skills beta.82. No runtime or browser artifact is replaced.
