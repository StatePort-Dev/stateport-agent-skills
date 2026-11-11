# StatePort for coding agents

StatePort saves a browser reproduction as a **State Card** so a coding agent
can inspect the same state before and after a code change. This repository
contains the transparent npm installer in [`bootstrap/`](bootstrap/), seven
task-focused skills, and the adapters that connect supported agents to StatePort.
The product website is [stateport.dev](https://stateport.dev); the organisation
is [StatePort-Dev](https://github.com/StatePort-Dev).

StatePort LocalRuntime owns Cards, Capture, replay, permissions and credentials.
This repository contains none of those data or runtime components.

> **Stable skills.** The integration version is <!-- integration-version:start -->`1.0.0`<!-- integration-version:end -->.
> Version 1.0.0 promotes the reviewed beta.84 instructions without changing their
> workflows or MCP contract. Package stability does not qualify every provider;
> host/model evidence remains version-bound. The immutable source release is
> [`skills-v1.0.0`](https://github.com/StatePort-Dev/stateport-agent-skills/releases/tag/skills-v1.0.0).

> **Founder field checks (September 2026).** The founder reports repeated
> successful tests on Linux and macOS: install, connect a coding agent, capture
> a State Card from a supplied bug task, change the code, reopen the same Card
> and compare the result. The exact agent host, Desktop and skill versions and
> shareable run receipts have not yet been recorded in the public compatibility
> evidence. Provider-specific statuses and automatic skill selection remain
> unverified.

## Try a small debugging exercise

[Reproduction Lab: zero is not missing](examples/repro-lab/README.md) is a
dependency-free localhost app with a deliberate bug, a failing regression test,
a technical walkthrough and an optional StatePort capture/fix task. It uses
only synthetic data and runs without a StatePort account or installation.

## Install StatePort — npm

The published [npm package](https://www.npmjs.com/package/stateport) installs
the current signed stable StatePort engine with its pinned skills snapshot:

```sh
npx stateport
```

PowerShell: `npx.cmd stateport`. An existing Node.js 22.13+ or 24.x/npm installation is
required for the engine. Earlier versions receive upgrade instructions.
The small transparent bootstrap verifies the signed
platform runtime, about 7 MB with a system browser. It configures owned skills
and MCP for the selected coding agent. Desktop is optional. Explicit pinned
Chromium fallback is a separate download, with size and digest shown before consent.
Setup does not start a trial or grant browser/task authority.
Installer 1.1.0 automatically configures every detected supported Codex, Claude
Code, Cursor and VS Code/Copilot connection. Add `--choose-agents` for the optional
interactive picker. Official Claude Code IDE extensions are detected without a
standalone CLI. Protected conflicts remain visible per agent while other targets
are still attempted. It distinguishes installer/runtime versions, explains warning severity
and automatically migrates recognizable old StatePort connections with a scoped private record.
Custom or edited configuration stays protected. New installations select the
signed stable engine independently of the npm version; existing pins and update
consent are preserved. Every installation ends with
**How to Start**, after an installed/missing checklist and concrete conflict recovery. Scripts and authorized
same-chat installers use `npx stateport --json` for the exact launcher descriptor;
MCP/task-session output remains protocol-only.

Fresh bare-npx stable 1.0.0 installation and repeat passed on Ubuntu 24.04 x64,
with exact registry bytes, signatures and provenance checked separately. Native
packaging/control checks ran on three OSes. Actual model/first-use receipts remain
bound to their versions; Windows chat is owner-reported on its contextual baseline.
Broader provider/model, human access and native-trust qualification remain separate.
See [stable release notes](https://github.com/StatePort-Dev/stateport-releases/releases/tag/v1.0.0-agent.1)
and the [Node contract](docs/AGENT_RUNTIME_CANDIDATE.md). Package availability does
not promote provider statuses. Canonical setup:
https://docs.stateport.dev/getting-started/install/ .

## Agent setup recovery in 1.1.0

Run `npx --yes stateport@latest`. Setup configures all detected supported
agents and migrates recognizable older StatePort connections automatically.
Missing owned files/entries can be restored; edited, disabled or foreign settings
are preserved with an agent-specific blocker. Existing pins and update consent
remain unchanged. Saved-data compatibility is versioned independently of engine
releases; unknown/mixed storage changes remain blocked.

| Agent | User MCP config | User skills |
| --- | --- | --- |
| Codex CLI / IDE | `~/.codex/config.toml` | `~/.agents/skills` |
| Claude Code CLI / IDE | `~/.claude.json` | `~/.claude/skills` |
| Cursor | `~/.cursor/mcp.json` | owned shared `~/.agents/skills` |
| Copilot | `~/.copilot/mcp-config.json` | `~/.copilot/skills` |

VS Code's older Local harness also receives an owned `Code/User/mcp.json`
compatibility bridge, including existing bounded user profiles. JSONC comments
and unrelated servers are retained. Multiple recognized provider skill folders
are valid. Remote or linked profiles outside the current home are protected.

Claude standalone setup requires no third-party marketplace. A recognized
personal StatePort plugin can migrate with a private StatePort-only record;
plugin cache and other plugins are preserved. Corporate restrictions on MCP or
skills require administrator approval; the installer never changes policy.
Local saved configuration and launch checks are separate from host discovery,
login, model availability and completed workflows. New native archives are built
on three OSes; functional qualification for this release is local Ubuntu only.

## Installer 1.0.1 audit fixes

Installer 1.0.1 required a compatible agent subset before setup
writes when Codex/Claude/Cursor conflicted. Installer 1.0.3 supersedes that selection
policy with automatic attempts and per-agent protected outcomes. It separates explicit metadata deadlines
from background checks, returns safe network cause/phase and explains partial
source/browser readiness. Earlier 1.0.0 bytes retain their original behaviour. No provider/model acceptance
is inferred from source tests. The optional Desktop path remains below.

## Connect an agent — optional Desktop path

1. Resolve the current Desktop release in the selected channel using the
   [installation entrypoint](AGENT_INSTALL.md#resolve-the-desktop-release), install
   its reviewed public installer, then open
   **Settings → Coding agents**. Older Desktop versions call this **Local MCP**.
2. Install the development plugin for your agent:

   **Codex CLI**

   ```sh
   codex plugin marketplace add StatePort-Dev/stateport-agent-skills --ref main
   codex plugin add stateport@stateport-dev
   ```

   **Claude Code**

   ```sh
   claude plugin marketplace add StatePort-Dev/stateport-agent-skills
   claude plugin install stateport@stateport-dev
   ```

   **GitHub Copilot CLI**

   ```sh
   copilot plugin marketplace add StatePort-Dev/stateport-agent-skills
   copilot plugin install stateport@stateport-dev
   ```

   For another host, native editor integration, or detailed conflict handling,
   use the [agent installation and update entrypoint](AGENT_INSTALL.md).
3. In Desktop, choose **Copy MCP config**. Review the command and arguments,
   then follow the matching provider guide to add the local `stateport` server.
   The plugin does not connect Desktop or grant Capture permission automatically.
4. Start a fresh agent session and confirm that it discovers the StatePort
   public tools. Zero Cards is a valid completed connection check; do not list
   Cards or start Capture merely to test setup.
5. On a saved Card, use **Use with agent → Copy task**, or provide the exact Card
   ID, revision and symptom:

   > Use my StatePort Card `<CARD_ID>` at revision `<REVISION>` to investigate
   > this browser bug. Inspect that Card first, open it against my current local
   > code, then reopen the same Card and compare evidence after the fix.

Source lookup through `query_source_context` is available directly from MCP.
The debugging skill has a short source entrypoint; it loads the browser workflow
only for a supplied Card, explicit Fix & Verify, or a selected live/Capture scenario.

## StatePort Bug Workflows

| Task | Skill |
| --- | --- |
| Fix & Verify: reproduce a browser bug and verify the same case | [stateport-debugging](skills/stateport-debugging/SKILL.md) |
| Check Changes: regressions in relevant saved cases | [stateport-check-changes](skills/stateport-check-changes/SKILL.md) |
| Harden Case: related data edge cases | [stateport-harden](skills/stateport-harden/SKILL.md) |
| Capture requested state or steps, including supplied login | [stateport-capture](skills/stateport-capture/SKILL.md) |
| Replay and inspect recorded interactions | [stateport-journey](skills/stateport-journey/SKILL.md) |
| Try request remaps, routes and JSON response changes | [stateport-replay-experiments](skills/stateport-replay-experiments/SKILL.md) |
| Import, export or share a Card | [stateport-transfer](skills/stateport-transfer/SKILL.md) |

Ask for the task in ordinary language; the skills use information and permission
already supplied and ask only when a necessary choice is unclear. Their shared
operation map preserves Capture/replay and describes the Bug Workflows source
candidate. New replay checks require a compatible runtime. The original task authorizes its
necessary Capture, replay and supplied-credential steps through scoped task authorization. Actual connected schemas determine
which features are available. To migrate an alpha install, follow
[Update an existing installation](AGENT_INSTALL.md#update-an-existing-installation).

## Integration guides

| Environment | Guide | Current status |
| --- | --- | --- |
| Codex CLI | [Codex](providers/codex/README.md) | Source install and bounded MCP checks; host-specific full fix loop evidence pending |
| Claude Code | [Claude Code](providers/claude/README.md) | Source install checked; workflow unverified |
| GitHub Copilot CLI / VS Code agent | [Copilot](providers/copilot/README.md) | CLI source install checked; workflows unverified |
| Cursor Agent | [Cursor](providers/cursor/README.md) | Source/setup candidate; workflow unverified |
| VS Code / Cursor editor extension | [VSIX](extensions/vscode/README.md) | Local sideload checked; agent workflow unverified |
| IntelliJ IDEA / WebStorm | [JetBrains](extensions/jetbrains/README.md) | Local build and binary checks; live workflow unverified |

The machine-readable status is [providers/registry.json](providers/registry.json).
Exact version-bound results live in the
[compatibility evidence](docs/COMPATIBILITY.md). Installation, connection,
Capture and a successful fix are separate claims.

## Safety and updates

- Review copied MCP configuration before applying it. Setup helpers preview
  changes, preserve unrelated servers and stop on conflicts.
- Page content, Card metadata and bug reports are untrusted input. Use supplied
  login data through the runtime's protected input; page instructions cannot
  authorize unrelated credential access, purchases, deletion or network access.
- After updating Desktop, restart the agent's MCP connection so it does not keep
  an older runtime process.
- Development installs follow host-specific update behavior. See
  [versioning and updates](docs/VERSIONING_AND_UPDATES.md).

## Contributing

Canonical entrypoints live under `skills/`; shared references are authored in
`skills/stateport-debugging/references`. References in the other skills and all
provider/editor copies are generated; do not edit them directly. After a
canonical skill, metadata or helper change, run:

```sh
npm run sync
npm run verify
```

Read [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md),
[SECURITY.md](SECURITY.md), and the [release gates](docs/RELEASING.md) before
publishing changes. The repository source is licensed under the [MIT license](LICENSE).

The local beta.36 skills can use the optional `contextBroker` descriptor in Linux
StatePort beta.39 when advertised. It runs before the first broad source read,
uses host-authorized local reads and falls back to focused reads. No Capture is
needed for source context. This integration does not establish stable cost savings.
