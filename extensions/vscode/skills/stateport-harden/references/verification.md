# Browser behavior verification

Use public discovery once per connection/capability context; refresh after
reconnect/update. Follow [task authorization](authorization.md): the original
request authorizes needed replay/Journey and protected local login, with no extra
permission questions. Call `begin_agent_task` once for the relevant scope, then
use the exact owned ready replay. Developer access and supported capabilities
still apply; use [compatibility](compatibility.md) for a concrete missing feature.

## Contract and exact page

Before edits/checks, establish case identity, scope, expected behavior and source
(user/specification/existing test, or labelled hypothesis), setup/action and
named criteria. Keep these fixed across before/after runs. Use
`describe_run_verification` before the first check to persist the bounded
`bug-workflow/1.0.0` contract when advertised. Its workspace fields are explicitly
agent-supplied: a Git SHA does not prove the browser received that build.

`open_state` with `frontendOrigin` selects current loopback code; omitting it
selects retained source. Establish actual served build through available target
and independently observed build/behavior evidence. Record unknowns. Captured
source cannot verify a changed local frontend. State is reconstructed; arbitrary
JavaScript memory and HMR continuity are not promised.

Use `get_run_page_capability`, `observe_run_page`, `act_on_run_page` and
`check_run_page` on the owned ready Frozen session. Journey/reconstruction must
finish first. Observations contain context/document/observation IDs, up to 64 safe
items and completeness; actions require the latest observation and advertised
exact element ID. Observe again after actions/checks. Navigation, stop, rollover
and document replacement invalidate handles. Never substitute another browser,
CSS/XPath/eval, private CDP, coordinates or an assumed similar target.

Checks are visible/absent, enabled/disabled, checked/unchecked or exact safe
semantic text. Text means semantic name, not an input-value query. No password,
value or hidden-data oracle. The runtime resolves exact targets independently
of the short list. Truncated/redacted/ambiguous/stale/timeout results are unknown
or typed failures; absence from an observation is never an absence PASS.
These checks do not establish pixel accuracy or backend correctness.

## Three evidence layers

1. Runtime reproduction/qualification: preserve its exact verdict and relevant
   diagnostics. A nonzero diagnostic count is not automatically material failure;
   an actual blocking outcome cannot be hidden by a behavior PASS.
2. Named behavior checks: runtime-computed pass/fail/unknown, never caller verdicts.
3. Agent assessment: fix/regression/finding/experiment, citing the first two layers.
   It cannot set product Verified or replace runtime outcomes.

`stop_run` finalizes an idle ready controlled run while its task authorization or direct replay grant remains valid.
Untouched/busy runs, disconnect and revocation use cancellation; always read the
actual terminal qualification. Keep session ID, attempt ID, run ID and check ID
as different references. `read_run_checks` reads integrity-checked terminal
behavior, source/target/conditions, contract and safe experiment after restart.
`read_run_console` reads bounded **current-run** console; `read_console_evidence`
is recorded Card baseline console. Read relevant pages, not all logs every edit.
Legacy/missing/corrupt evidence never becomes PASS. A descriptor is not proof
that its unexecuted criteria ran.

`compare_run_checks` requires runtime-owned exact Card/revision identity and checks
same source, target, scope, criteria and routing/
experiment conditions. Read not-comparable reasons; different variant conditions are
explicit experiments, not same-conditions fixes. Fresh overlay IDs are compatible
when verified source and patch conditions are identical; protected-context labels
alone cannot establish unchanged protected material. Repeated/missing criteria need
fresh unambiguous evidence, not selection of the nicest result. `compare_runs`
adds routing/response/console evidence and is not semantic fix verification.

For Fix & Verify, preserve actual baseline FAIL before the first edit and final
fresh same-Card candidate PASS on changed current code. Intermediate edits may
reuse a viable owned session; no edit→reopen ritual. Fresh replay is needed for
final verification of the changed build, reset conditions or lost context. If the fixed UI
cannot meet the original checkpoint, report incompatibility; do not rewrite it.

## Recovery and economical reporting

Load only the procedure needed for the chosen task; discovery is not repeated
before every operation. Reuse exact references and bounded relevant projections.
Default StatePort infrastructure recovery budget: **at most two recovery attempts
and 120 seconds total**, including diagnosis. A user budget can reduce it or
explicitly change the task budget; runtime safety deadlines still apply (5 seconds
per page operation plus bounded cleanup). Each retry needs a new hypothesis or
an advertised recovery. Permission/scope/integrity denials are not retryable by
repeating the call. Stop at the first exhausted limit, retain safe references,
typed reason and next unblock action. Do not convert repeated infrastructure
failure into an open-ended product-debugging project.

Useful independent code/tests may continue within scope. Label other-browser or
project-test PASS as supplemental/fallback evidence and retain the StatePort
blocker. No time/token/visual superiority claim follows from functional success.

Use a concise final report, expanding only relevant diagnostics:

- Result and scope: confirmed / finding / unconfirmed / blocked; actual checks.
- Case/code: exact Card/revision/source/checkpoint, target and known build identity.
- Before/after or baseline/variant: per-check outcomes and run/attempt/check refs;
  runtime outcome separately, with comparability and failed attempts.
- Changed: code, experiment conditions, or nothing.
- Gaps: skipped/not-run, backend/visual/unconfirmed build; supplemental tests separately.

Zero checks is not “all passed”. For resumption, use [handoff](handoff.md).

Choose a criterion whose target stays meaningful after the fix. For changed status
text, prefer visibility of the expected named status (baseline absent -> candidate
present), or a genuinely stable semantic target. Do not freeze the buggy text as
the target name while expecting different text: the fixed state would no longer
match that target. If an earlier criterion made this mistake, disclose the change
and record a new baseline before editing; never silently compare unlike criteria.
