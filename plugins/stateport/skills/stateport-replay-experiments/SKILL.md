---
name: stateport-replay-experiments
description: Investigate StatePort replay mismatches or test frontend behavior with request remaps, replay/block/local-live routes and JSON response overlays, then compare or restore the baseline.
license: MIT
---

# StatePort replay experiments

Help test the user's hypothesis using the existing Card and supported replay
controls. Read [the experiment procedure](references/experiments.md),
[workflow guidance](references/workflow.md) and
[data handling](references/safety.md).

Inspect the Card and intended local frontend. Use an existing task-owned session
or open the Card on that frontend. Read `list_routes`, `inspect_exchange` and,
for changed requests, `inspect_request_changes`. Choose the relevant route or
trusted evidence from these results; ask only when multiple choices would test
different hypotheses and the task does not settle it.

Use the operation that answers the question:

- `apply_request_remap` / `remove_request_remap` for eligible captured-response
  remaps using runtime-issued evidence IDs.
- `set_route_mode` for replay, block, or explicitly requested Live routing to
  the selected loopback backend.
- `create_response_overlay` / `remove_response_overlay` for JSON merge-patch
  experiments and returning to the baseline.

Carry out the authorized experiment without asking before each ordinary step.
If testing would require an unspecified backend, a persistent revision overlay
or an external action outside the task, clarify that choice first. Default a
remap to `current_experiment` unless persistence was requested.

Retain baseline and candidate run IDs, follow replacement session IDs after
changes, then finalize and compare runs. Record the routes, patch or remap that
changed the conditions. Restore the baseline when the task is complete unless
the user asked to retain the experiment. Some Card types cannot use overlays;
report the runtime result and offer an applicable alternative.

Explain the result in terms of the tested hypothesis. A patched or remapped
captured response can demonstrate frontend behavior; backend correctness
requires evidence from the current backend.
