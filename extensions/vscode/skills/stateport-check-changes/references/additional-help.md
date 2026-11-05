# Optional additional help

Material implementation choices without a browser run use the separate
[source observations](source-observations.md) path. The saved-state admission
below applies to additional browser checks and run-derived observations.

Use only when discovery advertises `workflowPolicy.additionalHelp.protocol` =
`agent-additional-help/1`, availability is true and the relevant effective
preference is on. Older/unreadable capabilities fail closed for these automatic
extras; continue the original task normally. Discovery does not grant access.
The initial adapter is a terminal saved-state run owned by the same MCP task.
External helper receipts and protected/Journey/No-Card runs are not adopted.
Do not reopen, recapture or change adapters merely to obtain an extra message.

## One useful variant, when already justified

After a usable finalized MAIN candidate, run one response variant when all the
following admissions are satisfied, using only
facts already known in the task: an exact saved JSON response and a requirement
or contract establishing that the proposed data are admissible, relevant to the
reported behavior, and preserve a named invariant. An array alone does not prove
that an empty array is allowed. Do not explore source/routes, recapture, or open a
browser to invent a hypothesis. Repeated main checks and superficial activity
are not additional value. If any admission is missing, silently skip.

The main terminal result may include `replayedResponses` (`replayed-response-sources/1`):
exact already-observed exchange/occurrence references, with request origin/path but
no body or query. Match only the response whose JSON contract and variant you
already know from the task. These references do not establish JSON eligibility or
semantic admissibility. No extra route/body discovery is needed or justified.

Use `run_additional_check` once with the main run ID, exact source digest,
checkpoint/exchange/occurrence, one RFC7396 merge patch, short justification and
predeclared typed consumption witness plus invariant (at most two checks; one
may serve both). Null removes a field. Include only already-known necessary
click/check/uncheck actions. No authentication or protected context, header/status
changes, remap, network faults, multi-route patch, live fallback or Save Revision.
Runtime reserves one attempt before preparation; preparation and all useful work
share a 30-second budget and at most one browser start. Retries return the same
attempt. Timeout, cancellation, failed admission or startup consume the budget;
do not retry, resume after reconnect, or run a second candidate/baseline/repair
loop. Stop only owned optional resources, preserving the main result and Card.

`passed`/`counterexample` require delivered patch AND observable application
consumption AND evaluated invariant. Mere delivery, missing witness, unknown,
not_exercised, timeout, not_run, unsupported or cleanup failure are not PASS and
normally add no optional chat fragment. Expected main-versus-variant differences
are not a comparability warning or a paired FAIL-to-PASS proof.
A relevant counterexample changes the main verdict: continue the original scoped
fix and its necessary ordinary verification, without renewing the optional budget.
When edits are forbidden or the violation remains unresolved, lead the final answer
with that finding. Qualify any passing checks as the original recorded case; do not
lead with an unqualified success and bury the required-behavior violation later.
Never expand the original edit scope because a neighboring contract issue was found.
Full Harden and Check Changes remain separate explicit user requests.

## Useful facts in the existing final answer

Before ending the original MCP task, call `prepare_task_observations` for its exact
main run (and the original baseline when available), if this adapter is supported.
No new diagnostic browser is opened. Set `frontendChangeExpected` only when known
changes affect the observed loaded frontend graph, never for backend-only work or
unknown/unobserved lazy modules. Set `requestChangeIntended` from the actual task.

Use returned served-build relation/coverage and request authority as bounded
observations, not Git attestation or backend proof. Same observed frontend bytes
alone do not prove stale cache. Intended request changes are not regressions;
missing captured responses limit proof, rather than establish a backend defect.
Do not silently recapture, remap or go live to remove the limitation.

Include returned nonempty markdown exactly once in the ordinary final answer,
unless that same fact is already explained there or the user disabled it. Empty
markdown stays silent. Translate criterion wording while preserving exact UI
labels. Do not omit a new useful result merely because the main fix passed.
Integrate at most one new relevant fragment into the ordinary answer, in the
conversation's language. Positive additions: at most 30 words. Findings/limits:
at most 70 words total, two points, one justified next action and one useful
existing link. Prefer a material finding over a positive note. Plain Markdown
only: no HTML, tables, large cards, IDs/status footers or universal success badges.
Do not repeat a fact already explained in the main answer or another handoff.
Keep exact main/variant/task/check IDs in the receipts. Do not append a raw-ID
footer after the fragment; show diagnostic identities only when details were
explicitly requested. An available useful source Card link is sufficient.
An empty fragment means silence. A source Card link is labeled source Card;
it does not reopen a transient counterexample. Media/export consent is unchanged.

Always retain `requiredMainLimitations` in the main assessment, even when chat
observations are off: no false PASS. Counterexample means continue the fix, not
append a reassuring note. Already explained limitations need no duplicate block.

## User control

`Additional check` and `Observations and advice in chat` are independent shared
runtime-profile preferences in Desktop Settings > Coding agents. All connected
hosts use the same profile. The original task may opt out of either or all
StatePort work; use `begin_agent_task.workflow` false values for task-local opt-out,
or perform no StatePort operations for a full ban. Do not reset user choices.

For an explicit permanent user request use `set_workflow_preferences` with
`scope: runtime_profile`, `userRequestedChange: true`, and only the requested
additionalCheck/chatObservations fields. This needs no browser task or fake origin.
Confirm persistence only after `persisted:true`. Task-local changes use scope task
on the existing task. One-off explicit verification uses its existing authorized
workflow; never enable a global automatic preference just to perform it.
Runtime rechecks current preferences/authority during optional execution and at
handoff. Disabling additional work cancels it; disabling observations suppresses
the pending optional fragment. Do not rely on stale discovery after a user change.

For an advertised compatible runtime, integrate the one-time explanation using
[first useful result](first-use.md) after a real useful result. This never adds
work or a trial requirement to the original task.
