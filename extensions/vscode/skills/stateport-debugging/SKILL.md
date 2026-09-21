---
name: stateport-debugging
description: Investigate browser bugs with a StatePort State Card, inspect console and replay evidence, and verify code fixes by reopening and comparing the same saved reproduction.
license: MIT
---

# StatePort debugging

Help the user understand and fix the reported behavior using a repeatable State
Card. Read [workflow guidance](references/workflow.md) and
[data handling](references/safety.md). Discover the connected public tools and
their schemas; [the operation map](references/public-mcp.md) explains the paths.
For missing capabilities, use [compatibility guidance](references/compatibility.md).

## Start from the task

Use the exact supplied Card/revision. `inspect_state` establishes its identity,
captured context and authentication requirement. A Card ID may already identify
an immutable revision; use the real schema rather than adding a revision argument.
Use `list_states` only when choosing a Card is part of this task and none was
supplied. Resolve an ambiguous match instead of silently choosing the latest.

Use the symptom, expected behavior and local frontend target already provided
by the user or established in the workspace. Ask one focused question only if
missing information changes the investigation or intended code change. A request
to inspect a Card does not need a bug description; report what its evidence shows.
For a new reproduction, use `stateport-capture` when installed, or the bundled
[Capture procedure](references/capture.md). Code-only work needs no Capture.

## Find the cause

Read `read_console_evidence` for redacted baseline errors/warnings and
`get_state_history` for earlier exact-Card runs when useful. Distinguish recorded
console events from evidence of the current code. Use `get_auth_requirement` or
`inspect_auth` to explain an actual login blocker without retrieving secrets.

Open the Card on the intended current local frontend with `open_state`. It
requires `frontendOrigin` and defaults to headless; use visible mode when the
user wants to watch. Inspect `list_routes` and relevant `inspect_exchange`
projections to understand replay behavior. Follow observed evidence into the
application code and perform the requested diagnosis or fix.

If reproducing requires recorded interactions, use `stateport-journey` or
[the Journey procedure](references/journey.md). If changing request matching,
responses or routing is needed, use `stateport-replay-experiments` or
[the experiment procedure](references/experiments.md). These procedures use
the same Card and runtime; they do not require another installation.

## Verify and hand off

Retain a baseline run before the change. Use `stop_run` to finalize an active
run, `get_run_summary` for its stable run ID, and `get_reproduction_outcome`
for an exact persisted attempt. Reopen the same Card/revision against the
changed code, finalize and compare with `compare_runs`. Repeat when another
code change requires another check. Preserve any replacement session IDs
returned by runtime operations.

Report the observed symptom, cause or remaining hypothesis, change made, actual
execution target, baseline/candidate evidence and unresolved gaps. Captured-source
replay exercises the retained build; it does not verify a modified frontend.
A successful Open or Save alone does not establish a fix, and captured responses
do not verify the current backend. If evidence is inconclusive, explain what
would resolve it and continue useful investigation within the task.

Use [handoff guidance](references/handoff.md) when pausing or resuming. A new
Card is appropriate for a requested new case or a demonstrated unusable original;
explain the reason and retain the original reference.
