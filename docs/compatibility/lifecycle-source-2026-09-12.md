# Integration lifecycle source check, 2026-09-12

This is source/package evidence for the `0.1.0-alpha.5` candidate, not a
StatePort runtime handshake, old-to-new host update, agent workflow, or release.
The starting checkout was clean `main` at
`36e4e8b52f68624a7466a7540cfd6eaf7996cd77`; `git ls-remote origin
refs/heads/main` returned the same SHA. Local and remote tag listings were
empty. `gh release list` could not connect to `api.github.com`, so GitHub
Release status was not verified. This check ran before the candidate was
committed; the resulting commit SHA is recorded by Git, not inferred here.

Commands and results:

- Baseline `npm run verify`: PASS, eight test files and structural check.
- New `node tests/integration-lifecycle.test.mjs` before implementation: RED
  for missing `integration.json`, update classification and compatibility
  evaluator. After implementation: four tests passed, including sandbox drift
  repair and second-sync byte idempotence.
- Final `npm run verify`: PASS, nine test files and `PASS structural checks:
  109 files; host/runtime evaluations NOT RUN`.
- `git diff --check`: PASS.
- `/tmp/stateport-vsce-tool/node_modules/.bin/vsce package --no-dependencies
  --out /tmp/stateport-vscode-0.1.0-alpha.5.vsix`: PASS. The local 14-file
  archive contains `integration.json` and the canonical compatibility
  reference. SHA-256:
  `19a1dac973b5903cf881301f2ccf6d9ea33c5c97c0ec005e1dcfc12ac3cd0389`.
- Offline JetBrains `gradle clean build buildPlugin verifyPlugin` initially
  could not start inside the restricted sandbox: its file-lock handler could
  not create a network socket. Re-running the same offline command outside
  that sandbox with cached JDK 25, Gradle 9.4.1 and IDE distributions: PASS,
  19 tasks; four verifier targets compatible (IDEA and WebStorm 2026.1.3
  and 2026.2.0.1). Local ZIP SHA-256:
  `96df5b57a04d3e24ce1f7a62d8f5bb5b528d5c9f9d7190feca46f9aa189269ff`.

No StatePort integration was installed or updated in a live host during this
follow-up. No Marketplace submission, runtime contract projection, Card use,
agent invocation or installed-product acceptance was performed. The older
provider evidence reports retain their original version-bound scope.
