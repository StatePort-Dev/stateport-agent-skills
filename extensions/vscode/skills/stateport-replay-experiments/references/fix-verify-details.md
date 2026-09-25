# Conditional Fix & Verify details

Load only for the condition that brought you here. The original task authorization
and proof contract still apply; these details add no permission.

## Intermediate states

Use this path when a page criterion (semantic or visual) belongs to a different
state than another criterion. Choose a reusable precondition before the first
required transition. For new Capture, Save after mandatory Review without compound
baseline, then ready Open. For a supplied Card, reuse its ready owned run; no
Capture/Review/Save or extra Open. A captured post-transition destination is an
outcome, not proof that current code performed the transition. Validate restored checkpoint without repeating recorded
steps. `describe_run_verification` once with the complete immutable descriptor;
perform genuinely subsequent actions and check/capture images at each required
state. `check_run_page` uses current observationId, named criterion and semantic
target/condition; `observeAfter: true` returns the next observation. Stop once.
Repeat the same descriptor, subsequent actions and state-specific evidence on a
fresh same-Card candidate, then compare_run_checks. Never bulk-check all criteria
at the final state when earlier observations are required. If all page criteria
apply after one subsequent action, perform it then finish_run_verification.

## Semantic and visual limits

`allowRebind` supports only unique same-document semantic targets. Runtime actual
roles remain authoritative; use control only when the obligation concerns the
action rather than an explicitly required button role. Truncated/redacted,
ambiguous, stale or timeout evidence is unknown; missing from a short observation
is not absence PASS. Safe text concerns semantic names, not input values.

Navigation requires the action and its outcome, not merely enabled controls.
For a needed image use an advertised visual request or list_visual_surfaces then
capture_visual_evidence on the exact owned Page. Inspect native pixels, retain
identity/completeness/limits and report fail/pass/inconclusive as agent visual
assessment. Runtime visual/internal unsupported remains unchanged. Privacy limits
or unavailable vision leave a gap; neither semantic proxies nor another browser
bypass privacy. StatePort provides no arbitrary eval, private journal/CDP or
hidden-data oracle. A separately authorized project/browser test may establish a
named unproved criterion; attribute it separately and retain its actual permissions.
Do not invent a StatePort API or bypass ownership, privacy or host controls.

## Failed checks

When advertised, run-page-check/1.1.0 attaches diagnostic to FAIL. Use diagnostic.code
and diagnostic.nextAction, not an inferred build failure:

| Code / nextAction | Focused resolution |
| --- | --- |
| TARGET_KIND_MISMATCH / review_criterion | Compare the strict role with the actual requirement. observedKind and optional disabled describe that same page; they neither widen the target nor make FAIL a PASS. |
| TARGET_NOT_FOUND / inspect_target | Inspect the intended target and completeness/context before changing the assertion. |
| CONDITION_NOT_MET / inspect_behavior | Inspect the unmet behavior; do not assume another Open will change it. |

Diagnostics carry no action handles. Keep unknown reasons and uncertainty intact.
Without diagnostics, use one focused public observation to distinguish target from
behavior where possible; otherwise retain the unresolved gap. Do not invent a cause.

If the assertion encoded the wrong intent, preserve its original result and change
the descriptor explicitly. Re-establish the same revised assertion on original
code baseline and fresh candidate; do not relabel the old FAIL, weaken an explicit
role requirement, or infer before/after from a candidate-only passing check. Recreate
baseline from isolated known pre-fix source if necessary, preserving the working
fix and pinned target. If that evidence is unavailable, retain the proof gap.

## Compatibility and recovery

Pin the actual verified baseline frontend origin, including scheme/host/port.
Restart the candidate server there; do not silently substitute another origin or
a documentation default. An unavailable/mismatched target is a recovery gap, not
permission to weaken comparison or reuse a different-target receipt.

For granular comparison candidates, pass baselineRunId to open_state; verify_fix
always preflights its baseline. BASELINE_TARGET_MISMATCH returns opened:false and
the known baselineTarget; restore that authorized target. BASELINE_TARGET_UNAVAILABLE
means no usable local baseline target is established. Keep the gap; do not guess.
INVALID_INPUT includes a Card/revision mismatch. Origins are normalized, but a
changed hostname or port is a different target. Do not omit baselineRunId to evade
comparison validation. Intentional cross-target Open remains an ordinary separate
operation; its evidence does not replace the required same-target candidate.

To recreate baseline after editing, preserve all working source/test changes,
including new files. Run the known pre-fix source from an isolated checkout and
preserve the working fix throughout. Do not reset/restore/overwrite the working
fix temporarily and rely on restoring it before timeout. Use the same pinned
origin for the new baseline and fresh candidate. If the original source or target
cannot be established, report the gap; do not manufacture a baseline from HEAD or
an assumed equivalent build. Keep source, run and served-build identities explicit.

Missing optimized options use advertised granular public tools with the same
criteria and explicit StatePort use. Missing visual support is a gap; label any
permitted supplement separately. Capture authentication/Review/context:
[capture.md](capture.md). Other concrete questions: [compatibility](compatibility.md),
[Journey](journey.md), [experiments](experiments.md), [safety](safety.md).

Use at most two infrastructure recovery attempts and 120 seconds total, each with
a new hypothesis or advertised recovery. Preserve typed blockers when exhausted;
read-only diagnosis and existing tests may continue. Until actual baseline proof
exists, source/test edits remain gated. No configuration or host approval, access,
ownership, integrity, origin or privacy bypass. Do not delete source Cards.

Use compact results first. read_evidence_batch accepts eight exact refs; full or
paged receipts/checks/console answer an unresolved question only. Retain missing
baseline evidence, not-comparable reasons and unchanged failures. Unknown served
bytes prevent unqualified current-code proof; compilation or Git identity alone
cannot repair it. Functional evidence is not a benchmark win.
