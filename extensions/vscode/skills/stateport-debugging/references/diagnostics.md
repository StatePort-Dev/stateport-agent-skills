# One diagnostic question

Use this reference only when existing evidence and focused code reading leave a
material uncertainty. If the cause is already sufficiently clear, make the scoped
patch; diagnostics are not a mandatory step before every edit.

1. State one question and what observation could disprove the hypothesis. Reuse
   available evidence first: `read_console_evidence` is the recorded Card baseline;
   `read_run_console` belongs to the exact current run. Where supplied, source and
   stackFrames contain zero-based generated coordinates. Missing maps do not make
   generated locations useless. Older runtimes may omit localization. Never guess
   an original source file, apply an old map to a new build or substitute baseline
   errors for candidate errors.
2. Choose the cheapest sufficient supported source: existing evidence, an explicitly
   authorized local project probe, or the existing [response experiment](experiments.md).
   Do not discover every tool or load every reference. Reuse the available verifier
   and toolchain. Public StatePort MCP does not expose an arbitrary-code probe or
   runner Page; a private experimental helper is not an installed capability.
3. For a local probe, select only permitted non-sensitive relations. Never probe
   credentials, protected inputs, cookies, tokens or equality with a protected
   value. Record workspace/source/build identity, Card/revision and run/document
   identity. Keep one question, at most three points, twenty observations and
   8 KiB of cleaned text; use stricter advertised limits where present. Execution
   and cleanup must finish within the remaining task budget. No events means
   not reached or insufficient evidence, never a false hypothesis. Distinguish
   setup failure, wrong/stale build, execution failure and truncation.
4. For a response experiment, bind the exact source/exchange/occurrence, track the
   replacement session, and require actual delivery plus an application check.
   No consumption means not exercised. JSON merge-patch null deletes a field;
   it does not test literal null or HTTP status. Restore original data afterward.
5. Remove only owned instrumentation on success, failure and cancellation. Preserve
   later source edits and disclose cleanup conflicts. Instrumented behavior can
   differ, especially in races. Final same-Card current-code verification and all
   material criteria use clean code and original conditions without overlays.

Return the question, performed operation, observations, current localization,
run/build/conditions, omissions and exact details references. Label measured
facts **OBSERVED**, agent conclusions **INFERRED**, and missing evidence **UNKNOWN**.
An application-emitted probe value is an observation from the application, not a
runtime-confirmed assertion or root cause. Temporal proximity is not causality.
Return to the patch after a sufficient answer. Do not repeat diagnosis without
new evidence or automatically start Harden Case or Check Changes.
