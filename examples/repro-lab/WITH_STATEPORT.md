# Try the reproduction with StatePort

Start the app using the [exercise instructions](README.md): run `npm start`
from `examples/repro-lab` and keep `http://127.0.0.1:4173` running. Install and open
[StatePort Desktop](https://stateport.dev/download/?utm_source=github&utm_campaign=repro_lab).
A coding agent is optional; start with the manual path below.

This fixture contains no login, credentials or external service. Its role selector
is ordinary UI state. Do not supply real credentials for this exercise.

## Manual walkthrough (no coding agent)

1. In Desktop, choose **Create a State Card → Reproduce manually**. Enter
   `http://127.0.0.1:4173`, choose **Clean Session**, and start browser Capture
   before interacting with the page.
2. In the managed browser, choose **Reviewer**, **Exhausted quota · 0**, and
   set **Credits requested** to **10**. Confirm that **API response** has
   `remaining: 0` but **UI says available: 100** and **Simulate allocation** is
   enabled.
3. Choose **Stop and review**. In **Review**, check the captured page, API
   replay and Journey coverage. Name the Card "Repro Lab — exhausted quota"
   and record the observed 100/enabled result and expected 0/disabled result
   in Bug context. Choose **Save State Card**.
4. On that Card, choose **Current local app** with `http://127.0.0.1:4173`,
   **Saved state**, and **Clean Session**, then **Reproduce**. Confirm the
   Reviewer / Exhausted / 10 setup and buggy result; retain this baseline run.
5. Follow [Fix and check](README.md#fix-and-check) and the
   [solution](ARTICLE.md#separate-zero-from-missing) in a second terminal.
   Run `npm test` from the exercise directory (intentionally red before the
   fix, green after it), then `npm run verify` from the repository root.
6. Reproduce the same Card/revision with the same local target and session
   choices against the changed code. Check **0**, **Not enough credits**,
   and disabled **Simulate allocation**, with the same setup and zero API
   response. Keep baseline and candidate evidence to compare.

Capture, Review and Save are free and do not start trial time. Reproduction
against current code requires Developer access. If needed, explicitly choose
**Start 14-day Developer trial** and verify the emailed code: entering an email
or requesting a code does not start the trial; successful verification does.
No payment card, password or StatePort account is required. Reproduction does
not start automatically after verification; choose **Reproduce** yourself.
See the [access instructions](https://docs.stateport.dev/getting-started/open-a-state/#get-developer-access-without-leaving-the-card).

A reopening/restoration result checks the saved state, not whether the bug is
fixed. Record the runtime outcome separately from the named UI checks above.
If changed UI no longer matches the original checkpoint, report that limitation;
do not treat a successful Save, browser launch or comparison as proof of a fix.
See the [reproduction guide](https://docs.stateport.dev/getting-started/open-a-state/).

## Optional coding-agent path

Follow the [agent connection instructions](../../README.md#connect-an-agent),
then use these tasks.

### Capture the synthetic bug

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

### Fix against the same reproduction

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

## What counts as a result

The candidate should show **0**, **Not enough credits**, and a disabled allocation
button, with the same Reviewer / Exhausted / 10 setup and API response. Retain
baseline and candidate evidence; a successful capture or open alone is not the
comparison.

Replaying captured frontend assets would exercise the old code. Use the current
local frontend for the candidate run. Captured API responses hold the input
constant; they are not evidence about a changed backend. StatePort does not
copy a backend database or server environment, or guarantee reproduction of
every site; review the [supported Beta scope](https://stateport.dev/beta).

This new fixture has a tested Node regression (red before the solution, green
after it). Its browser rendering and its own end-to-end StatePort run were not
executed in the publishing environment, whose browser could not reach localhost.
That limitation applies to this example, not to the founder's already reported
StatePort workflow checks on Linux and macOS.
