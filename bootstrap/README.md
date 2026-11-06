# StatePort

## Source follow-up 6 November 2026

The changes in this checkout are not a new published installer. Source now resolves
known agent-selection conflicts before any configuration writes, gives explicit
installation metadata 30 seconds while background checks keep 5 seconds, sanitizes
network/timeout reasons and phase, and explains source versus browser readiness.
Cold doctor reports prerequisites before engine installation. Partial readiness
retains exit 1; JSON readiness/failure diagnostics are additive versioned objects.
Canonical setup: https://docs.stateport.dev/getting-started/install/ .

## Published 1.0.0 behaviour and retained instructions

**Capture a browser reproduction once. Reopen it. Verify the fix.**

StatePort saves the setup of a web-app bug as a **State Card** so you and your
coding agent can return to the same case while changing the code.

[Website](https://stateport.dev) · [Documentation](https://docs.stateport.dev/) ·
[GitHub](https://github.com/StatePort-Dev)

## Install

Use **Node.js 24.x**, npm, and an installed coding agent. The installer can start
on Node 20–23 to explain the prerequisite, but the engine requires Node 24.

```sh
npx stateport@latest
```

In Windows PowerShell, use `npx.cmd stateport@latest` if script policy blocks
`npx.ps1`. You do not need to change the execution policy.

The installer ends with a component checklist and **How to Start**. It identifies
what was installed, what still needs attention, and the next action for your agent.

## How to Start

1. Run the install command. Choose which agents to connect: **all detected
   supported agents are checked by default**. Press Enter to confirm, enter
   numbers to change the set, or choose `none` for runtime only.
2. Resolve any **BLOCKING** items. Open a successfully configured agent and start
   a new chat; restart the host if it needs to reload tools.
3. Start with your current task, or explore another useful workflow:

**Work on a task**

> Do this task: <your task>. Use StatePort when it helps.

**Explore StatePort**

> What can StatePort help me do in this project?

**Save a browser case**

> Save this browser bug as a State Card: <page URL and steps>.

Keep the browser setup in a State Card; reopen it to check your changes. You can
continue an ordinary task without inventing a bug or starting a Capture session.

### Choose agents in a script

```sh
npx stateport install --agents codex,cursor
npx stateport install --agents all
npx stateport install --agents none
```

`all` means every detected supported agent; it does not install missing agents.
`none` retains the runtime and existing connections. `--agent cursor` remains the
single-agent form. Non-interactive/JSON use requires an explicit selection;
otherwise agent files are preserved and the installer reports what to run next.
The task-session descriptor remains available for authorised same-chat work.

Supported automatic targets are **Codex, Claude Code, Cursor and VS Code with
Copilot**. Standard macOS applications are detected without a shell command on
PATH. VS Code and Codex are separate connections; an account/model subscription
and VS Code MCP trust remain your coding host’s own steps.

The report shows each selected agent separately. Other detected editors with no
installer adapter are marked as needing manual connection. **Current runtime
limitation:** Cursor can be configured alongside Codex or Claude Code, but not
with both skill folders at once. The chooser warns about this combination;
protected conflicts remain visible rather than overwriting existing settings.

Your agent follows the normal permission flow. When Capture is needed, review
what was recorded before saving the State Card. A successful setup is separate
from the agent actually discovering its tools.

## What you can do

- Save a difficult browser setup as a reusable State Card.
- Inspect, export, import, and share a saved reproduction.
- Reopen a saved case against current local code.
- Compare the same case before and after a change.

**Free Capture** covers Capture, Review, Save, sharing and inspection.
**Developer access** covers execution such as Open, Replay and fix verification.
A 14-day trial is offered through the human access flow; installing StatePort
never starts it. Email verification and payment stay in the browser, not chat.
Your coding agent's own account/model access is separate.

## A small install, with your existing browser

The npm package is the transparent MIT installer. It downloads and verifies the
signed platform runtime (about **7 MB** with a system browser). Chrome is used on
macOS/Linux; Windows can use Edge or Chrome. Optional pinned Chromium is a
separate download with size and SHA-256 confirmation. Desktop is optional.

Runtime assets are available for **Linux x64, Windows x64, and macOS Apple
Silicon arm64**. Package availability and setup do
not imply complete model, host or native-trust qualification on every platform.
See the [runtime and compatibility notes](https://github.com/StatePort-Dev/stateport-agent-skills/blob/main/docs/AGENT_RUNTIME_CANDIDATE.md).

The **Installer** and **Runtime** versions shown in the checklist may differ.
The installer changes when installation or verification needs a fix. New installs
resolve the current **signed stable engine** without requiring a new npm version.
Existing pins remain pinned. Engine update policy is separate: **Notify** by
default; **Auto** requires explicit consent and applies only to a new session.
Skills have their own version and compatibility checks. A running task never
switches engine or instructions.

## If setup needs attention

| Level | Meaning |
| --- | --- |
| **BLOCKING** | The named part cannot be used yet. The message states which capability is blocked and which installed parts remain available. |
| **WARNING** | A check was not confirmed. For example, MCP configuration may be saved while its launch check fails. Confirm the connection before relying on it. |
| **INFO** | Context or a read-only result; it does not by itself block installation. |

For detailed, read-only conflict inspection:

```sh
npx stateport doctor --agent cursor
```

Replace `cursor` with the selected supported agent. Add `--json` for machine
output. Removing an old MCP entry alone may leave its skill files behind. The
check reports the remaining paths rather than asking you to repeat the same
uninstall. Keep customised files; back up old StatePort copies outside all agent
skills folders before replacing them. Do not delete unrelated agent settings.

A recognized old Codex StatePort plugin/MCP setup can be migrated with a private
backup. The interactive installer explains the change and asks before applying
it. For an explicit migration:

```sh
npx stateport install --agent codex --migrate-codex
```

This disables only the recognized active StatePort skills plugin and replaces
the recognized connection. Custom entries, disabled connections and edited owned
files stay protected; the report gives the exact remaining action.

For automation and an authorised same-chat setup:

```sh
npx stateport install --agents all --json
```

Machine output includes the exact verified continuation descriptor. Single-agent
`setup` retains its shape; multiple agents use `agent-setup-batch/1` with per-agent
results. The additive selection record uses `agent-selection/1`. MCP/task
protocol streams stay machine-only automatically. Incomplete setup exits 1.
`--help` lists commands; `--version` shows the npm installer version.

## About this package

StatePort is a local-first reproduction tool, not a general test runner or a
snapshot of an arbitrary backend. Cards do not carry your browser profile or
protected credentials. Normal host approvals and Developer access checks apply.

This package contains the **MIT installer**, not the private engine source.
[Installer source](https://github.com/StatePort-Dev/stateport-agent-skills/tree/main/bootstrap)
lives beside the public coding-agent integrations. The compiled runtime has its
own product licence. [StatePort on GitHub](https://github.com/StatePort-Dev) is
the organisation's main entry point.

## Anonymous installer metrics

Published online installs send a start and at most one outcome event to StatePort
by default, without a prompt. Disable this with `--no-telemetry`, `DO_NOT_TRACK=1`
or `STATEPORT_TELEMETRY_DISABLED=1`. Offline, candidate and automated test/CI runs
send nothing. Help/version/doctor and ordinary MCP/task use add no install events.

The fixed schema contains installer/runtime versions, OS family, CPU architecture,
Node major, operation, fresh/existing cache, selected agent set, browser preference,
update policy and a closed outcome/failure category. It contains no user, device
or session ID, client timestamp, paths, project/Card/source content, credentials,
raw arguments or raw errors. There is no persistent client analytics store.

Delivery uses StatePort's own HTTPS endpoint, with no redirects, cookies, retries
or queue, and an 800 ms deadline per event. Transport failure cannot fail setup.
Daily aggregates are retained for 90 days. A separate private server receipt
journal retains receipt time, validated IP address when available and recognized
installer User-Agent for 30 days. The client adds no identifier or timestamp.
These counts describe received attempts and outcomes, not unique people or
verified first use. See the [privacy policy](https://stateport.dev/privacy/).
