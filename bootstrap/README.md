# StatePort

**Capture a browser reproduction once. Reopen it. Verify the fix.**

StatePort saves the setup of a web-app bug as a **State Card** so you and your
coding agent can return to the same case while changing the code.

[Website](https://stateport.dev) · [Documentation](https://docs.stateport.dev/) ·
[GitHub](https://github.com/StatePort-Dev)

## Install

You need **Node.js 24.x**, npm, and an installed coding agent.

```sh
npx stateport@latest
```

In Windows PowerShell, use `npx.cmd stateport@latest` if script policy blocks
`npx.ps1`. You do not need to change the execution policy.

The installer ends with a component checklist and **How to Start**. It identifies
what was installed, what still needs attention, and the next action for your agent.

## How to Start

1. Run the install command and resolve any **BLOCKING** items it reports.
2. Once your agent connection is configured, open **Cursor**, **Codex**, or
   **Claude Code** and start a new chat. Restart the host if it needs to reload tools.
3. Give your agent the page URL and reproduction steps. For example:

   > Use StatePort to reproduce this bug: http://localhost:3000 — enter a project
   > name, accept the terms, and check why Continue stays disabled.

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
Silicon arm64**. This is a release candidate: package availability and setup do
not imply complete model, host or native-trust qualification on every platform.
See the [runtime and compatibility notes](https://github.com/StatePort-Dev/stateport-agent-skills/blob/main/docs/AGENT_RUNTIME_CANDIDATE.md).

The **Installer** and **Runtime** versions shown in the checklist may differ.
The installer has its own releases; a UI or npm-page improvement can retain the
same independently verified runtime. The integration/skills version is separate too.

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

For automation and an authorised same-chat setup:

```sh
npx stateport --json
```

Machine output includes the exact verified continuation descriptor. MCP/task
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
