# Node Runtime: bounded Ubuntu agent qualification, 4 November 2026

This is a synthetic, version-bound compatibility check. It establishes useful
Free Capture and read-only workflows in two hosts, not general support or a
complete fix-and-verify loop. Account-blocked hosts remain untested.

Native Ubuntu 24.04.5 x64, X11, Node 24.19.0, npm 11.17.0, system Chrome
156.0.8078.79 / Playwright 1.63.0. Runtime 1.0.0-rc.4 is the signed
[public GitHub RC](https://github.com/StatePort-Dev/stateport-releases/releases/tag/v1.0.0-rc.4-agent.1),
not an npm registry publication. Runtime source `6aa1db39a7a5e9da12d9e14e353f86fa58392c23`,
platform manifest `a57b24e507c10e094796e5b861570e458361a60ba39185372d7d902ca1cfdaf2`,
bootstrap archive `a76ec667cafa40fbacbc812c568284bc9ed5ee87aed01ec25284efa3483fdf79`.
All seven skills beta.81 came from exact source
`02f32eb739755fd8c0b8bd90bf9eb3b8207e9f22`.

| Exact host | Setup and instructions | Current-chat CLI | Actual Node MCP / Capture | Cold saved-case reuse | Verdict |
| --- | --- | --- | --- | --- | --- |
| Claude Code CLI 2.1.317 | Model-free explicit Claude setup, repeat unchanged, conflict refusal, native config lookup and remove pass; no model login | BLOCKED_ENV | Model operations BLOCKED_ENV | BLOCKED_ENV | NOT_ESTABLISHED |
| Copilot standalone CLI 1.0.105, gpt-6-luna | Bootstrap selected Codex; native manual Copilot MCP plus exact project skills required; model loaded skill | Install executed; finite foreground stdin continuation unproved | Actual recorded Page, Review and Save; normal Open ACTIVATION_REQUIRED | New process inspected same revision, fake case rejected; no human/browser reopen | WORKS_WITH_LIMITATIONS: Free Capture/Inspect only |
| Copilot VS Code 1.144.0, built-in Copilot Chat 0.72.0 | Native Local Agent UI and synthetic workspace trust; isolated profile needs normal sign-in | BLOCKED_ENV | Project config prepared; discovery/operation unproved | BLOCKED_ENV | NOT_ESTABLISHED |
| Cursor IDE 3.27.22 | Agent ran bootstrap; manual project Node alias/enable needed; skill loaded | Install executed; canonical foreground continuation unproved | Actual recorded Page, Review and Save; baseline DEVELOPER_ACCESS_REQUIRED | New conversation after Node restart inspected same revision/history; fake case rejected | WORKS_WITH_LIMITATIONS: Free Capture/Inspect only |
| Cursor CLI | Optional; initially unavailable | NOT_RUN | NOT_RUN | NOT_RUN | NOT_ESTABLISHED |

Cursor first displayed Grok 4.6 Medium; a later native Free **Switch to Auto**
choice was used. The resolved model ID was not independently reported, so the
workflow is not attributed to a specific model. Copilot's model ID comes from
actual provider usage records. No API fallback, trial, upgrade or overage was
used. There is no inferred CLI/IDE equivalence or Windows/macOS result.

The same original broken localhost checkout was used independently per host:
a Project field and terms checkbox should enable Continue. The recording Page
really received those actions. An external unchanged oracle observed disabled
Continue (FAIL). Source hash
`706e7fe3a1ab85c7c5d08ffc3ae4ef90739fe0c16a871f1adcaa78921939f73e` and oracle hash
`74e23c8d381db8419eb2c0f468ba55a56ae04fd53ac6b51ee40804ee3b67f255` stayed fixed.
Review/Save did not become a claim of repair: no source edit, replay baseline,
changed-build verification or inherited PASS occurred. Both saved cases remain
unverified. Cold Inspect is a read-only result, not cold browser Open.

## Setup and recovery limits

The intended installer is a CLI operation that delivers runtime, skills and MCP.
A chat request was used to test whether the agent itself can perform installation
and continue its original task. It is not an additional required installer.
Manual setup/new conversations do not pass the current-chat bridge gate.

For Copilot, use its documented native local stdio MCP configuration with the
verified Node launcher returned by bootstrap and the exact canonical skills.
Automatic Copilot host selection is not qualified. For Cursor, review the
project MCP entry, enable it through native UI and choose a distinct alias if a
legacy user entry is also connected. A normal source enable/trust prompt remains
required; never overwrite a conflicting owner entry or disable security.
These are scoped fallback facts, not a generic automatic setup claim.

Copilot's model described a missing stdin facility but did not exercise an actual
foreground probe. Cursor proposed a noncanonical FIFO/background bridge, which
was rejected before execution. Neither proves that the host can never support
the canonical bridge. Cursor's legacy user MCP was connected but not used for
the qualified project operations; saved-case location bound those operations to
the isolated Node profile. Desktop GUI did not run. This is isolated dependency
proof, not a physically clean OS.

Code-only and explicit opt-out probes produced zero StatePort MCP calls in both
working hosts. Exact supplied-case reuse and nonexistent-case rejection passed.
Copilot selected the workflow for a no-brand supplied-case prompt; general
implicit create-first routing remains unqualified. Permission denial and missing
access were reported honestly. Active browser cancellation, temporary runtime
unavailability, independent human Open, complete per-host setup/remove controls,
Claude/VS Code model workflows and full same-case fix/verify remain open.

Failed attempts were retained: an overly small harness process limit crashed
Chrome, corrected to 512; incompatible CLI argument combinations failed before
model execution; a model-supplied extra origin was refused by normal policy.
These do not establish runtime incompatibility. No credentials, private source,
raw Cards or provider logs are included in this public record.

Heavy hosts ran sequentially under 4 GiB RAM, zero swap and one CPU quota.
Cursor plus its Node/browser children reached approximately 4 GiB; this is not
StatePort-only memory. Its graceful timer did not enforce a hard deadline and
explicit closure was required. VS Code closed after 300 seconds, peak 1.43 GiB.
All owned heavy scopes and the fixture server were closed; the original source,
oracle and owner Cursor MCP config were unchanged. No independent user-demand,
performance or token-savings claim follows from these tests.

Provider aggregate statuses, automatic-delivery qualification and historical
Desktop setup evidence are unchanged. Readiness, setup, skill loading, actual
MCP operations, same-chat continuation and complete fix/verify are separate gates.
