# StatePort for coding agents

A browser bug is easier to fix when the agent can return to the same page and
state after each code change. StatePort saves that reproduction as a **State
Card**. This repository gives coding agents a shared debugging skill: start
with a specific Card, inspect it, open it against current code, and compare
the result after a fix.

StatePort Desktop is the separate local app that owns your Cards and runs the
MCP server. This repository contains agent plugins and editor integration
sources. It contains no Cards, browser profiles, credentials, or recorder.

> **Development preview.** The plugins install from this GitHub repository,
> but a complete agent debugging run has not been verified. A bounded
> [Codex CLI tool-discovery probe](docs/compatibility/codex-cli-discovery-2026-09-19.md)
> is separate from plugin installation and case verification. Use a test project and synthetic data. There is no supported
> end-user release yet.

## Connect before your first Card

Start in installed Desktop **Settings → Local MCP**, available even with zero
Cards. The empty Library's **Set up coding agent** link leads to that same guide
in Desktop versions with this entry. Review **Copy setup** and paste it into
your selected agent, or use the manual instructions below on older Desktop.
The [setup entrypoint](AGENT_INSTALL.md) explains preview, approvals, discovery
and recovery. No trial or agent Capture permission is needed for setup.

1. Install the plugin for your agent from the public development source:

   **Codex CLI** ([setup guide](providers/codex/README.md))

   ```sh
   codex plugin marketplace add StatePort-Dev/stateport-agent-skills --ref main
   codex plugin add stateport@stateport-dev
   ```

   **Claude Code** ([setup guide](providers/claude/README.md))

   ```sh
   claude plugin marketplace add StatePort-Dev/stateport-agent-skills
   claude plugin install stateport@stateport-dev
   ```

   **GitHub Copilot CLI** ([setup guide](providers/copilot/README.md))

   ```sh
   copilot plugin marketplace add StatePort-Dev/stateport-agent-skills
   copilot plugin install stateport@stateport-dev
   ```

   Review the source before installing it. Installation was checked through
   development version `0.1.0-alpha.4` in isolated Linux profiles. Start a
   new agent session after installing the plugin.
   The host's plugin manager owns future updates where its documented update
   mechanism applies. [Host-specific update paths](docs/VERSIONING_AND_UPDATES.md)
   distinguish manual refresh, conditional auto-update and unverified surfaces.

2. Connect the agent to your local Desktop. In StatePort Desktop, open
   **Settings → Local MCP → Copy MCP config**. Review the copied command and
   arguments, then follow your agent's setup guide above to add that MCP
   server. The plugin does not connect Desktop automatically. Check that the
   agent can reach the server and discover its public tools; saved settings
   alone do not prove a connection.

3. With no Cards, setup is complete once the host discovers the public tools;
   case verification is still unperformed. Record your first case using ordinary
   Desktop **Capture → Review → Save**. From that exact Card, follow the secondary
   setup/instructions link to Settings and review **Copy task**. Saved Notes /
   Observed / Expected are opt-in; the selected AI host may process prompts
   remotely. On older Desktop, give the agent exact ID/revision and symptom:


   > Use my StatePort Card `<CARD_ID>` at revision `<REVISION>` to investigate
   > this browser bug. Inspect that Card first, open it against my current
   > local code, then reopen the same Card and compare evidence after the fix.
   > Tell me what reproduced and what remains unverified.

The [debugging skill](skills/stateport-debugging/SKILL.md) directs the agent
to check the Card's project and target before use. A saved Card or a
successful tool call does not, by itself, prove the bug was fixed.

**Setup is not a Capture test.** Do not enumerate the library or record a case
just to verify the connection. Agent-controlled Capture needs a separately
verified runtime/host workflow and explicit permission. Desktop Capture remains
the first-case path; an unrelated agent browser is not a StatePort Capture.

## Which hosts have been checked?

| Host | Evidence so far | Details |
| --- | --- | --- |
| Codex CLI, Claude Code, GitHub Copilot CLI | Git-source plugin install, skill discovery, and removal in isolated Linux profiles | Setup guides above |
| VS Code and Cursor VSIX | A local VSIX installed and was removed in isolated editor profiles; agent use was not checked | [VSIX guide](extensions/vscode/README.md) |
| Cursor Agent plugin | Source and synthetic MCP setup; plugin load stopped at authentication | [Cursor guide](providers/cursor/README.md) |
| IntelliJ IDEA and WebStorm | Local ZIP build and binary compatibility checks; IDE actions were not run | [JetBrains guide](extensions/jetbrains/README.md) |
| GitHub Copilot Agent in VS Code, Codex desktop/IDE | Preparation only | [Compatibility inventory](docs/COMPATIBILITY.md) |

These checks do not verify an end-to-end StatePort agent workflow. Automatic
skill selection, a real MCP handshake, Card reuse in a live agent,
capability-gated agent Capture, and remote execution need separate evidence. See the
[compatibility inventory](docs/COMPATIBILITY.md) for exact versions and
recorded results.

If an operation is unavailable, first inspect the connected server's public
capabilities and schemas. A missing required capability should be reported by
name; a known MCP contract mismatch calls for an integration or Desktop/runtime
update as explained in the [compatibility policy](skills/stateport-debugging/references/compatibility.md).
The current public runtime has no confirmed version projection, so absence of
one is not proof of incompatibility. A newer Desktop alone does not require a
plugin update.

A copied raw skill, project-local skill, clone or symlink is a supported
**user-managed fallback**. Read `integration.json` beside its `SKILL.md` for
the installed integration version. Pull a reviewed source clone with `git pull`,
or replace the entire copied skill directory from the desired release. The skill
never downloads updates in the background. A VSIX sideload and a JetBrains ZIP
disk install are also user-managed until a real Marketplace publication exists.

## Contributing

The [canonical skill](skills/stateport-debugging/SKILL.md) defines the
debugging workflow; provider packages adapt it to their hosts. Read the
[contributor instructions](AGENTS.md) and [contribution guide](CONTRIBUTING.md)
before changing source. With Node.js 22 or later, run:

```sh
npm run verify
```

After changing canonical skill, metadata or helpers, run `npm run sync` before
`npm run verify`; CI fails on stale generated artifacts.

No dependency install is needed for this check. See the [release gates](docs/RELEASING.md),
[security policy](SECURITY.md), and [MIT license](LICENSE). The audit found no
tag on `origin`; GitHub Release and vendor Marketplace publication remain
separate, unverified gates.
