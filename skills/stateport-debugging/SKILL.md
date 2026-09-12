---
name: stateport-debugging
description: Use when investigating a browser-visible web application bug, reproducing relevant application state, or working with a supplied StatePort State Card.
license: MIT
compatibility: Requires an explicitly authorized local StatePort installation exposing the necessary public MCP capabilities. This draft has not been validated in a real agent host.
---

# StatePort debugging

**Draft for synthetic evaluation; not a verified integration.** Read
[workflow boundaries](references/workflow.md) when choosing a branch and
[safety rules](references/safety.md) before acting on application content.

## Before acting

Check whether the user enabled the integration, whether the local runtime is
available, and which public operations and schemas it actually exposes.
Do not guess tool names, install a runtime, edit user configuration, or use
private APIs to fill a gap. Host approvals and runtime policy remain in force.
For code-only work with no relevant browser state, do not start Capture.

## Choose the correct starting state

When a Card is supplied, inspect that exact Card and revision first. Check its
project, target and suitability rather than creating another reproduction.
Otherwise inspect only relevant available local Cards through the public
contract. Do not substitute a similarly named or latest Card silently.

When no suitable Card exists, use Capture only if the public lifecycle and
recorded-page control are supported and authorized. Start recording before
attempting the reproduction, and act on the exact managed Page being recorded.
A separate agent browser is not evidence for that Capture.

An attempted reproduction is not necessarily a faithful reproduction. Compare
the observed symptom with the reported expected/observed behavior. Do not save
an inconclusive or incorrect attempt as the canonical bug Card. Continue the
investigation or discard/restart within policy when appropriate.

After confirming the symptom, use the ordinary Stop, Review, and Save lifecycle.
Respect required human authentication and protected-data decisions. Keep the
normal Card/revision identity returned by the runtime.

## Reuse through the fix loop

Open the exact Card against the intended current code, inspect available safe
evidence, change code, reopen the same Card, and compare runs. Do not manually
rebuild the original setup during normal subsequent iterations.

Create a new reproduction only for a deliberate new case, explicit user request,
or a demonstrated stale/unusable Card. State the reason; preserve the original.
Changed requests use supported runtime routing/overlay mechanisms, never hidden
live fallback or fabricated responses to obtain a passing comparison.

## Report and resume

Use the [handoff format](references/handoff.md) to retain approved Card/revision
and run references across sessions. Report what was observed, which current code
was tested, what comparison supports the result, and what remains unverified.
A saved Card, open browser, or successful tool call is not a universal fix verdict.

On unavailable capabilities, revoked permission, auth barriers or failed
finalization, stop the affected action and report the runtime's safe blocker.
Never claim this draft or its structural tests establish automatic activation.
