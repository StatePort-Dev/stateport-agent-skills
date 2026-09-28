## Repair only a demonstrated failure

Diagnose from the safe diagnostic and source before another browser action;
use [one bounded diagnostic](diagnostics.md) for an unresolved fact. Observation
labels can concatenate container text and are not exact accessible names.
A correct assertion failing at the bug is evidence, not an assertion to repair.

For an invalid or missing required exercise assertion, keep prerequisites and use
`recheck --recheck-source local` while original served code remains, or advertised
`recheck --recheck-source captured_source` after app edits. The latter uses retained
original material, preserves the original local run, and needs fresh `verify` with
that exact repaired verifier. Prefer local recheck while original code remains:
retained responses cannot recreate mutable server coordination or concurrent
response timing. Check the reported assertion line before changing the app; an
early prerequisite assertion is not the later bug criterion. Do not revert the app, edit receipt identities,
silently recapture, or substitute a weaker live script.

- `preparation.captureObservation.kind: requests_pending_at_stop`: Capture
  retained unfinished requests. Replay can deliberately keep those requests pending;
  a live-server reset does not release recorded transport outcomes. If that pending
  state is the reported bug, preserve it. If an invalid early assertion interrupted
  the intended actions, repair the reproduction while the original build remains.
  Try same-Card recheck only when the retained state can represent those actions.
  When it cannot, preserve the failed Card/receipts, state why a corrected Capture
  is necessary, and record the actual reproduction before any app edit. This is
  not permission to silently recapture, rerun a control benchmark, weaken an
  assertion, revert an existing fix, or route replay requests live.
- Capture assertion followed by replay timeout: inspect the earlier prerequisite
  and retained transport once. A sign-in screen is not the original bug. Check
  completed login versus pending response and supported protected auth; never
  copy cookies/passwords into a Card. Do not repeat unchanged recheck/verify:
  an app edit alone does not repair an unreachable replay prerequisite. Use the
  same helper's standalone `live` mode for separate authorized checks; retain the
  failed baseline instead of spending another Verify on the same restore failure.
  If restoration is unsupported, preserve the gap and finish authorized independent
  tests/live checks rather than repairing assertions around an unreachable screen.
- `browser_launch_failed` with `host_execution_restricted`: retry the exact helper
  command through the host's permitted execution/approval path. Keep the verifier.
  Do not treat a sandbox failure as helper unavailability, switch to stepwise MCP,
  or bypass a denial. A missing executable/dependency needs installation repair.
- `unrecorded_select` is an advisory observation, not a failure. If restore fails,
  inspect verifier selectOption/dispatchEvent and repair that input with trusted
  keys. App-generated changes after recorded actions can be valid; a successful
  replay needs no repair. Preserve the rest of the verifier and its assertions.
- `baseline_restore_pending` in the retained baseline receipt: the Card and Capture
  observation exist. After resolving the reported restore prerequisite, use
  advertised `resume` with the same arguments, verifier and original build.
  It restores the same Card without Capture or setup. A changed build cannot
  replace the original baseline. Do not rerun Capture to manufacture qualification.
- `BASELINE_VERIFIER_MISMATCH`: repair through recheck, not repeated verify.
- `BASELINE_SETUP_MISMATCH`: restore original prerequisite meaning; keep
  exercise-only helpers inside exercise.
- `BASELINE_BUILD_UNAVAILABLE`: original bytes were not established; repeated
  recheck cannot fix this. Missing retained material also remains a comparison gap.
- `CAPTURE_TICKET_AUTH_UNAVAILABLE`: protected host storage is unavailable;
  anonymous retries or removing credentials do not repair it. Use supported
  protected MCP login for authenticated Capture. Unsupported restoration stays a gap.

