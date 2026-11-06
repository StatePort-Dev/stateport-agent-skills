# Integration versions and updates

The [Node Agent Runtime RC](AGENT_RUNTIME_CANDIDATE.md) has independent
CLI-first current-chat, next-session MCP, Node/browser/OS-vault and three-native-OS
gates. Source preparation does not upgrade any provider status. The bootstrap
version is independent of runtime and integration versions; current public
Desktop evidence below remains historical/current to its exact recorded scope.

StatePort uses three independent version lines:

- **Integration version** identifies this repository's skill, plugin manifests,
  setup helpers and native source candidates. The current beta source version
  is <!-- integration-version:start -->`0.1.0-beta.84`<!-- integration-version:end -->
  in [`integration.json`](../integration.json).
- **Desktop/runtime version** identifies the installed StatePort application and
  MCP process. It does not determine the integration version.
  Resolve a requested install/update from the official public release channel
  using [AGENT_INSTALL.md](../AGENT_INSTALL.md#resolve-the-desktop-release),
  preserving the selected channel and explicit pins.
- **MCP contract version** describes compatibility of the public tool schemas.
  The integration accepts the range declared in `integration.json` when a
  runtime advertises that value. Otherwise it uses discovered public tools and
  reports contract compatibility as unverified.

`npm run sync` propagates the integration version and generated canonical files
to provider and editor packages and the marked current-version slots in README,
AGENT_INSTALL, this document and CHANGELOG. `npm run check` rejects drift and
missing, duplicate or malformed slots; sync validates all slots before writing.
Historical compatibility evidence and pinned refs are not rewritten. Neither command
proves that a host loaded the package or completed a StatePort workflow.

## Development source

Tagged source prereleases bind a reviewed integration version to immutable
source. They do not by themselves establish supported-host workflow or update
acceptance. An installation from `main` follows moving development source and
must not be presented as an immutable release. The provider registry and
[compatibility evidence](COMPATIBILITY.md) state exactly what has been checked.

The current source includes seven skills. An integration version bump
does not create a tag or establish new host acceptance. Publishing a supported
beta requires at least one explicitly supported host to complete the core supplied-Card workflow from an immutable
tag: install, public MCP discovery, inspect/open, reproduce, change current
code, reopen the same revision, compare evidence, then update/remove. Other
hosts may remain `unverified` if that limitation is clear and their artifacts
are not presented as supported releases.

## Host-owned update paths

The executable install/update procedure, including alpha migration, restart,
verification and failure recovery, is in
[AGENT_INSTALL.md](../AGENT_INSTALL.md#update-an-existing-installation).

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

Copied or project-local StatePort skill directories are user-managed. Read
`integration.json` beside each `SKILL.md` for its version. Update a clean reviewed
branch checkout with `git pull --ff-only`, or replace the complete seven-directory
set from the selected reviewed source/ref. Preserve customized copies and pinned
refs. All references and metadata must accompany each skill. Ordinary task skills
do not poll for updates; explicitly requested updates follow AGENT_INSTALL.md.

## Release rules

- Bump `integrationVersion` for distributable source changes and run
  `npm run sync` before verification.
- Never reuse a tag or release version for different bytes.
- Bind compatibility claims to the exact host, runtime, integration version,
  operating system and safe evidence report.
- Keep source validity, installation, update, connection, Capture and complete
  debugging workflow as separate claims.
- Follow [RELEASING.md](RELEASING.md) before creating a tag or GitHub Release.

## Node runtime update policy candidate

RC5 is published on npm with a signed rc channel. The
[transparent bootstrap](../bootstrap/README.md) defines actual commands. Auto requires saved explicit consent; old/non-interactive
installs remain Notify. Pinned binds a verified exact version/digest. Repeat setup
preserves policy and channel. Only an explicit action releases a pin or changes
channel. Ordinary bug tasks never change these settings on their own.

A stable owned local launcher selects one fully verified generation before a new
CLI task/MCP process. Baseline, edits and candidate verification retain that exact
runtime/tools/skills/browser; no hot reload is assumed. A finite owner-bound job
may prepare compatible bytes using one shared throttled check per 24 hours, not
per tool/project. Notify downloads metadata only. Disabling Auto after staging
prevents future automatic activation. Read-only status/doctor/recovery and
uninstall do not trigger implicit updates. MCP stdout remains protocol-only.

Compatibility is an explicit generation record, including OS/Node/native ABI,
launcher/task/MCP, exact bundled skills, browser, shared storage and permissions.
Changed/edited/pinned host files or unknown compatibility hold for explicit
setup/restart through the original ownership-aware installer. No Node/system
browser update, OS daemon, global npm/cache rewrite or irreversible data migration
is introduced. Legacy setup ownership is not silently migrated.

The signed channel rejects publisher/channel mismatch, replay/downgrade and
same-version byte replacement. A failed pre-operation generation is quarantined;
allowed previous code remains available for a future session. User operations
are never automatically replayed after failure. Existing strictly validated
retirement/revocation still applies; failed network/policy checks do not become
online activation. Browser download consent, user data and active resources stay
protected. Explicit reviewed-bootstrap launcher repair preserves changed files
in a local backup and requires host restart.

Native Linux compiled A/B with a synthetic signed channel has bounded active
Capture/MCP and same-Card cold-reuse evidence. That is not a real model conversation,
full Windows/macOS model/trust qualification or universal automatic compatibility.
RC4-to-RC5 changes the MCP/skills generation and requires explicit reviewed setup.
Provider update statuses remain unverified until their exact host workflows pass.

An unavailable exact Node candidate pin does not silently execute different
installed bytes. Use read-only status/recovery and an explicit pin change.
