---
name: stateport-harden
description: Use when the user asks StatePort to check related data edge cases around a specific browser bug, fix, or exact Card. Does not imply code changes, generic API mocking, or a full regression sweep.
license: MIT
---

# Harden Case

Use the original request as authorization for all necessary in-scope steps.
Read [task authorization](references/authorization.md); begin execution automatically
without separate Capture, replay, Journey or supplied-credential permission prompts.

The user's requested scope overrides this procedure. For a planning, routing or
explanation-only request, stop after reading the needed instructions: do not
inspect Cards, invoke runtime operations or investigate source unless requested.


Check related data edge cases around one browser bug or fix. Keep the original
Card unchanged and **do not change source or tests** without a request to fix.
Read [verification](references/verification.md) and
[single-response experiments](references/experiments.md).

Inspect the exact ordinary Card and relevant application code/schema. Choose
usually **three to five** justified variants, fewer for a narrow scope. Before
each, record its hypothesis, contract validity, precise patch and expected
behavior. Examples include an empty array, one item, an omitted optional field,
zero or long valid text. Invalid API payloads are labelled robustness probes;
frontend permission flags do not test backend authorization.

Use a supported source/checkpoint-bound single replayable JSON exchange.
No raw payload/private-storage inspection, hidden conversion to a legacy Card,
status/header injection, delays, socket faults, multiple routes or Cartesian
combinations. If the ordinary Card is unsupported, report the exact limitation;
a legacy-only demo does not establish this workflow.

Start each variant from a fresh original-Card replay with reset cursors, apply
one transient patch and retain the replacement session ID. Observe/check only
the exact owned replay Page after reconstruction. Confirm both patched response
delivery and a relevant application observation/action demonstrating consumption.
An accepted tool call alone does not establish execution; zero patched requests
means **experiment not exercised**, never PASS for the intended variant. Unchanged UI alone is insufficient proof.

Finalize evidence, preserve the safe source-bound experiment descriptor, then
remove the overlay or freshly reopen the original baseline before the next
variant. Patches replace rather than accumulate. Repeat a discovered failure
using its exact saved descriptor; verify source/checkpoint/exchange identity.
Read descriptors by public run ID after restart, never private paths. Unsafe
conditions remain incomplete; do not save secrets to make a descriptor repeatable.

If a fix is requested, use Fix & Verify on that same failing variant, then check
the original baseline and relevant remaining variants. Otherwise return findings,
exact conditions and gaps in the shared report. Finding no defect is a valid
bounded outcome; do not keep generating variants.

Starter: “Use StatePort Card [exact ID/revision] to check a small set of relevant
data edge cases around [bug/fix]. Keep the original unchanged. Report observed
failures and exact experiment conditions; do not change code yet.”
