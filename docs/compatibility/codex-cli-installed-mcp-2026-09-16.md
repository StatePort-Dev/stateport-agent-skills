# Codex CLI installed MCP probe — 2026-09-16

Status: **blocked before MCP discovery in Codex CLI; Capture runtime surface
confirmed separately**.

This probe used Codex CLI `0.154.0-alpha.6.1` and the installed Linux
StatePort Desktop package `1.0.0-beta.10`. It did not invoke a StatePort tool
or read, list, open, replay, capture, or change any Card, session, browser, or
application data.

## What was checked

- The exact stdio launch supplied by the installed Desktop was added through
  the preview-first Codex helper and verified with `codex mcp get stateport
  --json`: `/opt/StatePort/StatePort --mcp`, with no configured environment or
  working directory.
- A fresh, ephemeral, read-only `codex exec` session attempted MCP startup and
  tool discovery only. The client found zero StatePort tools because the
  StatePort process exited before `initialize`.
- Codex's MCP client log identified the immediate reason: the nested launch had
  no X server or `DISPLAY`, so Electron could not initialize. Passing the
  parent display variables to `codex exec` did not make them available to its
  MCP child process.
- An independent direct stdio `initialize` smoke of the same installed
  executable succeeded in the desktop login environment. This separates the
  installed server's basic protocol response from the Codex-host launch failure.

The temporary `stateport` Codex entry was removed after the failed probe, so
the user profile is not left with a server that fails on every Codex startup.

## Result and next evidence

This is a real negative Codex-host result, not evidence of StatePort tool use
or a debugging workflow. A supported headless launch path, or a Codex host that
passes the required display context to the installed Desktop, is required
before rerunning connection discovery. The beta.10 package used for this
original probe predates the public Capture lifecycle required for AG-02 through
AG-05; the beta.11 follow-up below separates its runtime result from the still
missing recorded synthetic-page run.

## Beta.11 follow-up

After upgrading the installed package to `1.0.0-beta.11`, a direct public MCP
smoke confirmed `initialize`, `ping`, and 28 advertised tools. The server now
includes `get_capture_capability`, `start_capture`, `observe_capture`,
`observe_capture_page`, `act_on_capture_page`, `stop_capture`, `save_capture`,
and `discard_capture`. `get_capture_capability` reported a clean managed
session and `auth: "none"`, but correctly required explicit Capture permission.
No Card, Page, or Capture session was accessed.

The same fresh, read-only Codex CLI discovery smoke still failed before
`initialize` because the nested Electron launch had no display context. The
temporary Codex entry was again removed. The public CLI has no agent-permission
command, so the remaining permission step belongs to the Desktop's explicit
local authorization control; it must not be bypassed through private files or
configuration.
