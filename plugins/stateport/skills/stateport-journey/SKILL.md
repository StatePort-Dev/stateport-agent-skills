---
name: stateport-journey
description: Replay a StatePort Card's recorded Journey on retained source or current local code, inspect its steps and progress, and explain the terminal outcome.
license: MIT
---

# StatePort Journey

Use this skill to inspect or replay a recorded interaction sequence. Read
[the Journey procedure](references/journey.md),
[workflow guidance](references/workflow.md) and
[data handling](references/safety.md).

Inspect the supplied Card and its Journey with `inspect_state` and
`inspect_journey`. Use `inspect_journey_action` if the next recorded step helps
explain the sequence or a failure. For inspection-only requests, report this
evidence without starting a run.

For replay, select the target from the task: `frontendOrigin` for current
loopback code, omitted for retained captured source. A localhost capture needs
the running local frontend. Ask only if the target is genuinely ambiguous.

`start_journey` requires explicit user confirmation of this exact Card. An
existing request to replay the named Card provides that confirmation; do not
ask again. Set `confirmedByUser: true` only on that basis. Use
`allowProtectedLocalValuesForThisRun: true` only when the user also authorized
protected local values for this run. If that decision is missing and required,
ask for it without exposing any values.

Read `get_journey_progress` until completion, a failure or a manual barrier.
Avoid rapid polling. Use `stop_run` to finalize and retain the terminal result;
honor an explicit request to leave the visible run open and explain that its
final result is still pending. Do not stop early and report completion.

Report the target, completed/total actions, terminal outcome and useful next
step for any failure. Read the persisted run/outcome and compare runs when the
task includes verification. A Journey completed on retained source is evidence
about that source; current-code verification needs a run on that code.
