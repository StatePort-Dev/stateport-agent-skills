# Fix & Verify

Use public schemas and begin_agent_task `responseMode: text` (structured only if
host-visible). Read once; retain Card/revision, case/run/session IDs and evidence.
Batch independent source reads during reproduction; sequence page/dependent checks.
Use prescribed toolchains; keep full logs locally and return summaries/failure
excerpts. Read focused source/test sections; never hide failures.

## Choose proof before Capture

Freeze all requested outcomes, including default/regression and explicit internal
requirements. “Task-required” browser/API checks follow these obligations, not
mere diagnostic availability; required live effects need live evidence, not replay
responses alone. Setup controls/actions are steps unless their state is requested.
Optional diagnostics/journals create no acceptance obligations. Use
sufficient public network/page evidence. If insufficient, add one targeted proof
(prefer a relevant test); retain the gap if it cannot establish the clause.
Keep the same advertised bug-workflow/2.0.0 descriptor within schema limits for
before/after; caseId may be omitted.

Choose the reusable checkpoint:
- **Rendering at restored setup/data:** use compound checkpoint baseline/verify_fix
  and inspect actual recomputed output. Visual criteria alone need no extra action.
- **An action's result, changed or unchanged:** Save the precondition BEFORE it;
  execute the action and check its outcome on baseline and fresh candidate. Restored
  post-action state does not prove the transition. Preserve explicit steps and
  regressions in Capture and these acceptance actions. If the task requires all
  reported steps before Save, perform them, then restore the precondition through
  legitimate authorized page actions and verify it before Save. If unavailable,
  retain the precondition gap; never silently omit requested Capture steps.
A supplied Card without the needed precondition leaves a disclosed gap; preserve
its exact identity, never claim restoration proves an unexercised transition.

## Prepare and capture

Use authorized task live URLs/running server origins, not an illustrative docs
port; resolve genuinely conflicting running targets before begin. Begin once with
`prepare: {kind: capture, input: {name, sourceUrl}}` or
`{kind: open, stateCardId, frontendOrigin}` for a supplied Card. Reuse the first
observation. Open restores recorded steps through the selected checkpoint;
validate it, do not repeat them. Mismatch is a gap; pending Open resumes exactly.

Follow every explicit step/regression. For unspecified choices, take the shortest
sequence distinguishing the outcomes; stop unrelated exploration once reproduced.
Use focused observations, elementId, observeAfter and returned observations.
Duplicate names need container, not position; row clicks remain clicks. Choose
criterion targets by intent before baseline: button/link availability uses
advertised `kind: control` with exact name/container. An explicit
role requirement remains strict button/link; ambiguity stays unknown. After actionPerformed
with failed follow-up, observe without repeating. Unique requestId per mutation;
reuse only uncertain delivery. Setup images need a distinct criterion/gap; visual
outcomes require an actual baseline and fresh candidate image.

Map supplied report to supported Description/Observed/Expected fields; distinguish
reported/observed and disclose unavailable persistence. Read [Capture](capture.md)
only for login, unresolved Review warning or a concrete operation/recovery question.

## Baseline gate

New Capture: `stop_capture` → mandatory Review/warnings → Save. For checkpoint criteria,
`save_capture` with `baseline: {frontendOrigin, descriptor, visual?}` and requestId
Saves, freshly Opens/checks/images/terminalizes. Inspect nested baseline.status:
require completed + runId AND actual baseline failure before source/test edits.
state:saved alone is insufficient. Blocked/pending must recover first; read-only
diagnosis may continue. Retain the saved Card; never Save again. Pending baseline:
exact-session resume_run, then finish_run_verification.

For new Capture action results, Save without compound baseline → ready Open.
For a supplied Card, reuse its ready owned run; no Capture/Review/Save or extra Open.
Perform required actions, then finish_run_verification(sessionId, descriptor,
optional visual/requestId). Checkpoint criteria need no additional actions.
Without compound Save support, new Capture uses Save → ready Open → finish. Finish performs
no actions/new Open and needs no extra Stop. Criteria at different intermediate
states need checks/images at each state, using [details](fix-verify-details.md).
Retain actual FAIL, regression evidence and terminal runId before edits. Pin the
verified baseline frontendOrigin (scheme, host, port); restart the server at that
same target for candidates. Do not switch ports to repair comparability. If a new
baseline is needed after edits, preserve the working fix and use an isolated known
pre-fix checkout; never temporarily undo the fix in the working tree. See recovery
details for missing original source or an unavailable pinned target.

## Fix, verify, stop

Diagnose concrete hypotheses. Choose the smallest source read,
project test or authorized runtime probe that can disprove it; a focused probe may
be better than broad source reading. Once enough evidence supports a scoped fix,
implement and test it; avoid another confirmation of the same hypothesis. Label
causal uncertainty separately from acceptance coverage. Diagnostic
probes do not add criteria. Prefer existing project tools/tests over building a
new driver stack for optional diagnosis. StatePort adds no private/eval/CDP access;
separate authorized probes retain their scope/privacy and attributed evidence.
Rebuild built assets; a source-serving dev server uses its update plus fresh proof.

- Checkpoint: verify_fix(baselineRunId, stateCardId, frontendOrigin, requestId,
  optional visual). It returns the fresh terminal run, image, behavior comparison,
  facets and served-build evidence. Reuse those exact applicable comparisons;
  compare_run_checks/compare_runs only fill a named missing field, not reconfirm a
  returned result. Pending verify resumes exact
  sessionId with a new requestId.
- Action results: fresh ready open_state with baselineRunId → same actions → finish
  with identical descriptor → compare_run_checks. This Open and verify_fix validate
  the same Card/revision and baseline target before opening; no extra preflight read.
  A preflight rejection with opened:false opened no candidate: recover the pinned
  target or retain the gap.
  Intermediate-state criteria use the details path.

Reuse evidence only for its exact Card/revision, run pair, criteria, target and
verified code. New edits require a fresh candidate. Independent mandatory live API
proof remains required; a returned replay comparison cannot replace it. Run the
existing authorized project verifier when its applicable result is missing; retain
and reuse it. Cover missing live request/destination proof with the available
project toolchain; do not rebuild a driver stack merely to repeat existing proof.
On failed checks, use advertised diagnostic: TARGET_KIND_MISMATCH → review criterion,
TARGET_NOT_FOUND → inspect target, CONDITION_NOT_MET → inspect behavior. Role mismatch
does not prove stale code. Resolve one focused question; do not repeat the same
check/Open/Save without changed evidence or a concrete new hypothesis. A criterion
repair needs matched new baseline/candidate assertions; retain the previous FAIL
and working fix. Follow [repair details](fix-verify-details.md#failed-checks).
Read all statuses/coverage: pass/fail/unknown/unsupported/not_run. Attribute image/
test assessment separately; never relabel runtime unsupported as deterministic
PASS. Missing/inconclusive evidence stays a gap. Served-build concerns delivered
bytes; unknown or Git SHA alone cannot prove current code. Runtime qualification/
routing equivalence cannot prove UI behavior.

Finish after baseline FAIL, fix, required tests, fresh same-Card candidate, all
material outcomes, current served code and no mandatory gap/blocker. Report exact
case/runs, outcomes, visual assessment, build, tests and gaps; end_agent_task directly.
No extra comparison/browser/receipt/test is required. Missing a required field or
criterion? Name it and read/test only its resolution. No automatic Check Changes/
Harden. Load details only for intermediate states, compatibility, privacy, target
ambiguity or recovery.
