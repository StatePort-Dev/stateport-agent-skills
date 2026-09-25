# StatePort for coding agents

StatePort saves a browser reproduction as a **State Card** so a coding agent
can inspect the same state before and after a code change. This repository
contains seven task-focused skills and the adapters that connect supported
agents to the local StatePort Desktop MCP server.

StatePort Desktop owns Cards, Capture, replay, permissions and credentials.
This repository contains none of those data or runtime components.

> **Beta source.** The integration version is `0.1.0-beta.10`. Source
> installation and bounded Codex CLI workflows have been checked, but there is
> no tagged or supported end-user release yet. New Bug Workflows real-host acceptance
> remains unverified until version-bound results are recorded. Use synthetic data and review
> the source before installing it.

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

## Connect an agent

1. Install StatePort Desktop from the
   [public download page](https://stateport.dev/download/), then open
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
