---
name: stateport-check-changes
description: Use when the user asks StatePort to check frontend changes for regressions against relevant saved browser cases, including after a bug fix. Does not imply permission to change code or inspect every Card.
license: MIT
---

# Check Changes

Use the original request as authorization for all necessary in-scope steps.
Read [task authorization](references/authorization.md); begin execution automatically
without separate Capture, replay, Journey or supplied-credential permission prompts.

The user's requested scope overrides this procedure. For a planning, routing or
explanation-only request, stop after reading the needed instructions: do not
inspect Cards, invoke runtime operations or investigate source unless requested.


Check for regressions in relevant saved cases. **Do not change source or tests**
unless the user separately requests fixes. Read [verification](references/verification.md)
and use its exact-page checks, comparability, evidence and recovery limits.

Use the requested Cards first. When selection is needed, inspect the current
change area and safe Library metadata; choose at most **five** relevant cases
by project, route, affected feature and known behavior. Explain relevance briefly.
A smaller set is normal. Do not build a dependency graph or scan every history.
No Cards, irrelevant Cards, or absent expectations means a scope gap or inspection
only, not “all passed”. Ask for a meaningful criterion only when unavailable.

Fix the criteria before running candidate checks. Use exact Card/source,
current-code target and declared conditions. For each case retain runtime
outcome, actual named behavior results and terminal references.

- **Confirmed regression:** comparable explicit base PASS and candidate FAIL
  for the same criterion, with known base/candidate build evidence.
- **Current finding:** candidate FAIL without a valid comparable base. A recorded
  Card or console baseline is not a pre-change behavioral PASS.
- **No regression observed in this scope:** comparable checks pass; name their
  limited coverage. No universal correctness claim.
- **Blocked / not run / inconclusive:** access, replay, missing criterion/build,
  legacy evidence, ambiguity or incomplete observations prevent the check.

Do not silently switch branches, replace a running service, infer a base from
memory, or recapture to hide incompatibility. If the requested baseline cannot
be run safely with existing authority, retain the finding and exact gap. An
existing supplied base run may be reused only when its conditions match.
Report cases skipped and every failed/blocked attempt, using the shared concise
report. A finding does not authorize an automatic fix or hardening sweep.

Starter: “Use StatePort to check for regressions after my changes to [area],
using relevant saved cases in this project. Do not change code. Distinguish
confirmed regressions, current findings, and cases you could not verify.”
