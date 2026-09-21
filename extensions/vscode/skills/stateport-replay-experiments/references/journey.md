# Journey procedure

Inspect the exact Card with `inspect_state` and availability with
`inspect_journey`. `inspect_journey_action` takes `stateCardId` and
`afterCompletedActions`; it returns a redacted next action without starting it.
Use this for understanding the sequence or explaining a failed step.

`start_journey` executes a visible Frozen Journey in a Clean Session. It is
an executable operation, not merely a Desktop handoff. Supply:

- `stateCardId` and `confirmedByUser: true` when the initiating user has
  explicitly requested or confirmed replay of that exact Card;
- `frontendOrigin` for the current loopback frontend, or omit it for retained
  captured-source material. Localhost captures need the local frontend running;
- `allowProtectedLocalValuesForThisRun: true` only when the user explicitly
  permitted protected local values for this run.

Use confirmation already present in the task. When an exact-Card replay request
also clearly asks to use its retained login, that supplies both decisions.
Otherwise ask only for the missing decision when needed. Do not retrieve or
expose protected values. Auth diagnosis is described in [the map](public-mcp.md).

Retain the returned session and attempt references. `get_journey_progress`
reads safe current or terminal progress while the browser remains open. Poll
at a sensible interval and report a persistent stall, manual barrier or failure;
do not wait forever or treat missing progress as completion. At completion,
call `stop_run` to close/finalize, then read the persisted outcome as needed.
If the user wants the browser left open, report the current progress and pending
finalization rather than claiming a stored terminal result.

Use `get_run_summary`, `get_reproduction_outcome` and `get_state_history` for
completed evidence; `compare_runs` compares baseline/candidate run IDs. A run ID,
session ID and attempt ID are different references. On target drift or a replay
miss, explain the failing recorded action and current target. Capture control
does not provide arbitrary interaction or repair tools inside a replay Page.

`open_state` is a separate local Saved State path and requires `frontendOrigin`.
The current public MCP does not provide captured-source Saved State Open; offer
Desktop for that specific request rather than calling Journey and labeling it
Original State. Use capabilities of the connected runtime if this changes.
