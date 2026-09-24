# Journey procedure

Inspect the exact Card with `inspect_state` and availability with
`inspect_journey`. `inspect_journey_action` takes `stateCardId` and
`afterCompletedActions`; it returns a redacted next action without starting it.
Use this for understanding the sequence or explaining a failed step.

Follow [task authorization](authorization.md). `start_journey` executes a visible
Frozen Journey in a Clean Session within the original task consent. Pass the exact
`stateCardId`, and `frontendOrigin` for current loopback code (omit it for retained
source). Required protected local login is authorized by the task; do not request
another per-run decision or retrieve its values. Legacy direct calls accept
`confirmedByUser: true` and `allowProtectedLocalValuesForThisRun: true` based on
consent already present in the original task.

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

`open_state` is the separate Saved State path. Supply `frontendOrigin` for current
loopback code or omit it for retained Original material. This includes localhost
captures with retained HTML/resources; an older Card lacking material needs a new
capture for offline Original. Do not substitute Journey and call it Saved State.
