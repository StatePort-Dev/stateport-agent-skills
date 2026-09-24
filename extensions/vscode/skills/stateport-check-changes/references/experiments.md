# Replay experiments

Inspect the exact Card and current frontend before opening or using a task-owned
session. Retain a finalized baseline run for comparison. `list_routes` returns
safe targets; `inspect_exchange` selects a discovered `exchangeId`. Use their
actual projection rather than seeking raw captured payloads in private storage.

## Request changes

Read `inspect_request_changes` for trusted request-change evidence.
`apply_request_remap` accepts only an eligible runtime-issued `evidenceId` and
`scope` of `current_experiment` or `revision_overlay`. Prefer the temporary
scope for a temporary experiment; use revision scope when persistence is requested.
An agent-supplied exchange, origin or eligibility assertion cannot substitute
for the runtime's evidence handle. Remove the exact remap with
`remove_request_remap`. Rediscover evidence after a changed session if needed.

## Route and response experiments

`set_route_mode` selects `replay`, `block`, or `live` for an inspected exchange.
Live requires an explicit loopback `targetOrigin`. Use the backend chosen by
the user/task, asking if its identity or authorization is unclear. Do not switch
to Live silently to make a replay failure disappear.

`create_response_overlay` applies an RFC 7396 merge patch to a replayable JSON
exchange. Object keys merge, null deletes a key, and arrays are replaced as a
whole; null deletion is not literal-null testing. Choose the smallest safe patch.
Compatible runtimes support ordinary Session Cards with a versioned single-exchange
source/checkpoint/occurrence binding. Older runtimes/unsupported Cards may refuse;
an advertised operation alone does not establish that this Card supports it.
Use schema/code and safe structural information; never dump captured bodies.

For Harden Case use independent fresh runs, normally 3–5 relevant contract-valid
variants. No status/headers/delay/socket/multi-route injection. Record the hypothesis
and expected check first. Invalid API data is a labelled robustness probe.
After stop, `read_run_checks` returns the safe experiment and patchDelivery.
Delivery must be `delivered`, and a related UI observation/action must demonstrate
application consumption. Otherwise report **experiment not exercised**. In
particular, overlapping capture/local origins may not exercise a replay patch;
never infer consumption from an unchanged page or successful tool call.
The safe descriptor can repeat exact source/checkpoint/exchange/patch conditions;
pass its source as `expectedSource` to `create_response_overlay` on repetition,
and retain original Card/revision references. A changed source must be rejected.
`applicationConsumption: requires_behavior_check` is not a consumption verdict.
Never silently persist a revision or mutate original Card bytes.

Route and overlay operations reopen sessions. Keep the new `sessionId` returned
by each operation; old session references may no longer be valid. The current
route/response overlay path replaces the transient overlay, so do not assume
successive calls accumulate independent patches or route modes. Inspect the
result and explain this limitation for multi-route experiments.

## Compare and restore

Finalize candidate runs with `stop_run` and read `get_run_summary`; compare
baseline and candidate using `compare_runs` for network evidence and
`compare_run_checks` for semantic criteria. Different source or patch conditions remain
`not_comparable` for same-conditions fix claims; report them as experiments.
Track the exact remap/patch/route
conditions. Captured-response remaps and patches establish frontend behavior
under those conditions, not current backend correctness.

Use `remove_request_remap` for a retained exact remap, and
`remove_response_overlay` to remove a transient route/response overlay and
reopen the baseline while the session is active. If already finalized, open
the unchanged original Card again; retain any revision-scoped remap information
needed to remove it explicitly. Do not delete the source Card to reset an
experiment. Leave an experiment in place only when that serves the user's task.
