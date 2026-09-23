# Try the reproduction with StatePort

Start the app using the [exercise instructions](README.md). Install
[StatePort Desktop](https://stateport.dev/download/?utm_source=github&utm_campaign=repro_lab)
and follow the [agent connection instructions](../../README.md#connect-an-agent).

This fixture contains no login, credentials or external service. Its role selector
is ordinary UI state. Do not supply real credentials for this exercise.

## Capture the synthetic bug

Give your connected coding agent this task from the cloned repository:

> Capture and save a StatePort Card named "Repro Lab — exhausted quota" from
> http://127.0.0.1:4173. I authorize capture of this local synthetic app. Start
> recording before interacting with the page. Choose Reviewer, choose Exhausted
> quota, and set Credits requested to 10. Observe the API response and the UI.
> Expected: remaining 0 means available 0 and allocation disabled. Reported bug:
> the UI displays 100 and enables allocation. Save the observed result and bug
> context, and return the exact Card identity/revision. Do not fix the code yet.

The agent must use the connected runtime's advertised capture capabilities and
the exact managed page. If capture is unavailable, report that specific setup
blocker; manually opening another browser tab does not complete this task.

## Fix against the same reproduction

Use the saved Card's **Use with agent → Copy task**, or replace the two placeholders
below with the actual saved identity:

> Use StatePort Card `<CARD_ID>` at revision `<REVISION>` for this local repo.
> Inspect and open that Card against http://127.0.0.1:4173, retaining a baseline
> run. Fix examples/repro-lab/public/decision.mjs so a reviewer requesting 10
> credits is blocked when remaining is 0; a null quota should still use the
> default. Run node --test examples/repro-lab/regression.test.mjs and npm run
> verify from the repo root. Reopen the same Card against my changed local code,
> finalize and compare the runs. Report the actual available value and button
> state, the Card identity and both run IDs. Keep the fixture response at zero.

Replaying captured frontend assets would exercise the old code. Use the current
local frontend for the candidate run. Captured API responses hold the input
constant; they are not evidence about a changed backend.

## What counts as a result

The candidate should show **0**, **Not enough credits**, and a disabled allocation
button, with the same Reviewer / Exhausted / 10 setup and API response. Retain
baseline and candidate evidence; a successful capture or open alone is not the
comparison.

This new fixture has a tested Node regression (red before the solution, green
after it). Its browser rendering and its own end-to-end StatePort run were not
executed in the publishing environment, whose browser could not reach localhost.
That limitation applies to this example, not to the founder's already reported
StatePort workflow checks on Linux and macOS.
