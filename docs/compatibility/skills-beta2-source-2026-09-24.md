# Seven-skill source candidate — 2026-09-24

Integration `0.1.0-beta.2` is a source candidate, not a published tag or a
supported-host upgrade. The previous five workflows remain, with Check Changes
and Harden Case added and Fix & Verify strengthened. One original task request
authorizes its required Capture, replay and supplied-credential steps; explicit
scope, revocation and protected-storage boundaries still apply.

Source: `npm run sync` and `npm run verify` passed 45 tests and 363 structural files
before integration with the concurrent Reproduction Lab documentation. These
checks do not by themselves prove activation or full workflow acceptance.

Actual Linux host: Codex CLI `0.155.0-alpha.16.3`, `gpt-6-sol`, medium effort.
Temporary project-local skills and explicit invocation-only MCP configuration
were used; the user's saved configuration was unchanged. Runtime was a local
unpacked production candidate reporting `1.0.0-beta.23`, not an OS installer upgrade.

- New-Card and supplied-Card Fix & Verify: observed baseline failures, frontend
  fixes and fresh same-Card passing checks. A final new-Card cycle also completed
  on the candidate's final task-scope guard build.
- Check Changes: a comparable baseline/candidate pair distinguished a regression
  from unchanged behavior. Missing-Card and no-base classifications were retained;
  the reporting invocation for no-base evidence reached its deadline.
- Harden Case: independent empty/single-item/omitted-field variants, exact repeated
  conditions and restoration of the original reached terminal checks. The host
  reached its deadline after writing the report, so clean host completion is not
  claimed for that invocation. A separately requested same-variant fix completed
  with fresh passing checks and original/single-item checks preserved.
- Global replay permission remained disabled during the final task-scoped runs.
  Capture, Save and replay used the original task authorization without repeated
  consent prompts or global preference changes.
- Fresh routing checks covered code-only, explicit Fix & Verify, Check Changes
  without base, Harden, permission denial and Capture-only requests. Earlier host
  sandbox startup failures and an explanation-only scope miss were retained;
  corrected scope checks completed through supported per-command approval.

The host sandbox error was `mountinfo path is not absolute` when starting
bubblewrap. Supported per-command approval allowed authorized fixture operations
without disabling host protections. No macOS workflow or OS installation upgrade
was evaluated in this candidate acceptance.

One completed bounded synthetic comparison used identical source/contracts,
Codex/model/effort and common browser acceptance, with ordinary Playwright/scripts
available to both arms. Control completed in 116.245 seconds; StatePort in 308.101
seconds. Both fixes passed independent empty/single/two-item checks. StatePort
used more observed tokens and operations and also needed to repair a supplemental
test locator. It supplied a reusable Card and durable comparable runtime checks;
future reuse value was not measured. The earlier blocked control attempt remains
a separate failed protocol attempt. No general speed, token, quality or
subscription-usage advantage is established. Tools were preinstalled; complete
cold-install cost is unknown. Aggregate provider support remains **unverified**.
