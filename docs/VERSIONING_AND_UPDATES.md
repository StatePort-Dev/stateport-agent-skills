# Integration versions and updates

StatePort uses three independent version lines:

- **Integration version** identifies this repository's skill, plugin manifests,
  setup helpers and native source candidates. The current development version
  is `0.1.0-alpha.10` in [`integration.json`](../integration.json).
- **Desktop/runtime version** identifies the installed StatePort application and
  MCP process. It does not determine the integration version.
- **MCP contract version** describes compatibility of the public tool schemas.
  The integration accepts the range declared in `integration.json` when a
  runtime advertises that value. Otherwise it uses discovered public tools and
  reports contract compatibility as unverified.

`npm run sync` propagates the integration version and generated canonical files
to provider and editor packages. `npm run check` rejects drift. Neither command
proves that a host loaded the package or completed a StatePort workflow.

## Development source

There is no tagged StatePort Agent Skills release yet. An installation from
`main` follows a moving development source and must not be presented as an
immutable release. The provider registry and
[compatibility evidence](COMPATIBILITY.md) state exactly what has been checked.

The first beta should be `0.1.0-beta.1`. It requires at least one explicitly
supported host to complete the core supplied-Card workflow from an immutable
tag: install, public MCP discovery, inspect/open, reproduce, change current
code, reopen the same revision, compare evidence, then update/remove. Other
hosts may remain `unverified` if that limitation is clear and their artifacts
are not presented as supported releases.

## Host-owned update paths

| Surface | Update | Removal | StatePort update evidence |
| --- | --- | --- | --- |
| Codex CLI | `codex plugin marketplace upgrade stateport-dev`, then review/reinstall the plugin | `codex plugin remove stateport@stateport-dev` | Old-to-new transition unverified |
| Claude Code | `claude plugin marketplace update stateport-dev`, then `claude plugin update stateport@stateport-dev` | `claude plugin uninstall stateport@stateport-dev` | Old-to-new transition unverified |
| Copilot CLI | `copilot plugin marketplace update stateport-dev`, then `copilot plugin update stateport` | `copilot plugin uninstall stateport` | Old-to-new transition unverified |
| Cursor Agent local source | Replace the reviewed local plugin or update its selected checkout, then restart | Remove the local plugin copy | User-managed; unverified |
| VS Code / Cursor VSIX | Install a newer reviewed VSIX | Uninstall in Extensions | User-managed; update transition unverified |
| IntelliJ IDEA / WebStorm ZIP | Install a newer reviewed ZIP from disk | Disable or uninstall in Plugins | User-managed; update transition unverified |

Plugin removal does not remove a separately configured MCP server. Remove that
entry only after confirming it belongs to this integration. Updating Desktop
does not update an already-running MCP process; restart the host connection and
check the runtime version reported by the new process where available.

## Raw skill fallback

A copied or project-local `skills/stateport-debugging` directory is
user-managed. Read `integration.json` beside `SKILL.md` for its version. Update
a reviewed clone with `git pull`, or replace the complete copied skill directory
from the desired tagged release. The skill never polls for or downloads updates.

## Release rules

- Bump `integrationVersion` for distributable source changes and run
  `npm run sync` before verification.
- Never reuse a tag or release version for different bytes.
- Bind compatibility claims to the exact host, runtime, integration version,
  operating system and safe evidence report.
- Keep source validity, installation, update, connection, Capture and complete
  debugging workflow as separate claims.
- Follow [RELEASING.md](RELEASING.md) before creating a tag or GitHub Release.
