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
