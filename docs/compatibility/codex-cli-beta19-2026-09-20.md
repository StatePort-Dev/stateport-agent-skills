# Linux beta.19 Capture and Original replay — 2026-09-20

Result: **PASS for the bounded checks below; manual full-cycle acceptance
reported by the user. Aggregate agent debugging support remains unverified.**

This report covers a synthetic public TodoMVC scenario. It contains no Card
payloads, local identifiers, raw logs, private repository links or user data.

## Versions and execution contexts

| Field | Observed value |
| --- | --- |
| Agent host | Codex CLI `0.154.0-alpha.6.1` |
| OS / execution | Linux x86_64, local installed Desktop |
| Runtime | DEB `1.0.0~beta.19`; fresh MCP initialization returned `1.0.0-beta.19` |
| Integration source context | `0.1.0-alpha.8`, source SHA `5a563f4d73f2d6c290cf1e241731bf571ea0adff` |
| Documentation candidate | `0.1.0-alpha.9`; this report is not an alpha.9 install test |
| MCP launch | Exact command and arguments from installed `stateport mcp config` |
| Invocation | Explicit synthetic test instructions; implicit activation not evaluated |
| Model | Not recorded in the isolated CLI result; no model-specific claim |
| Plugin loading | Separate earlier install evidence; not established by this isolated CLI run |

The registry's `skillVersion` identifies the source context, not proof that
the isolated CLI loaded or selected that skill. The fresh CLI used
`--ignore-user-config` with only the production StatePort MCP configuration.
Direct packaged-runtime checks used a separate persistent public stdio client.
Neither is described as a fresh release-artifact plugin installation.

## Results

| Check | Result | Evidence boundary |
| --- | --- | --- |
| Installed package and fresh MCP discovery | PASS | Package version checked; fresh `initialize` and `tools/list` inspected |
| Visible Capture, five actions, Review, Save | PASS | One fresh beta.19 public MCP connection; saved revision 1 inspected |
| Headless Capture, actions, Review, Discard | PASS | Separate fresh beta.19 public MCP connection; final state `discarded` |
| Real Codex CLI Capture | PASS | Capability → start → observe → fill → Enter → observe → Review → Discard |
| Original Journey on the earlier regression Card | PASS | Fresh beta.19 completed 5/5; persisted outcome `confirmed` / `recorded_journey` |
| Original State on the earlier regression Card | PASS | User-started Desktop run; public history contained `confirmed` / `saved_state` |
| New beta.19 Card, manual Capture-to-Original cycle | USER_CONFIRMED | User reported completing the checks; additional per-run receipts were not available in public history when this report was written |
| Agent fixes current code and reopens/compares the same Card twice | NOT_RUN | Original/captured-source replay does not establish current-code fix verification |
| Implicit invocation, plugin update transition, other hosts/OS | NOT_RUN | No extrapolation from the explicit Linux Codex test |

### Capture fixture

The managed recording Page was `https://demo.playwright.dev/todomvc/`.
After observing its textbox, the client filled a synthetic todo, pressed Enter,
then clicked the observed Active, Completed and All links. Every action used
the public semantic Capture operation on that exact recorded Page.

Review reported five replayable Journey steps and zero manual barriers. Save
returned revision 1; public inspection reported complete Capture and a stored
application shell with five resources and an available entry document.
The separate headless test discarded its reviewed capture. Both direct client
processes exited with code 0.

### Real agent-host check

A new isolated Codex CLI process started the installed MCP executable with
the production arguments. The explicit prompt limited work to a disposable
TodoMVC capture, forbade existing-Card reads and Save, and required Discard.
The host completed all eight lifecycle calls, including two semantic actions.
The second observation showed the filter links after Enter; its bounded
projection did not expose the todo text. The record therefore claims the
observed transition, not visual inspection of text absent from that projection.

The parent waited for actual process completion: exit code 0, no signal,
no timeout, and a terminal agent event. A returned process session identifier
was retained and polled; a partial output chunk was not treated as completion.

### Original replay regression and manual acceptance

The earlier synthetic Card had stopped at Enter with
`JOURNEY_TARGET_AMBIGUOUS` after one of five actions, while Original State had
returned `CHECKPOINT_NOT_REACHED`. In a fresh beta.19 MCP process, the explicitly
authorized Journey completed five of five actions. Only after the public
progress reported completion did the client call `stop_run` to finalize it.
The persisted outcome was `confirmed`, and another client read the same
confirmation after the originating process exited.

Public history also contained a successful Desktop Original State result for
that same earlier revision. Both successful receipts reported route, checkpoint
and readiness reached, five replayed resources, no live/missed/blocked requests
and no restoration or launch warnings.

The user subsequently reported completing the remaining manual checks of the
new beta.19 synthetic Card. That acceptance is recorded as user confirmation.
The exact new Card's history still returned no run receipts at report time.
Its manual acceptance is therefore separate from the independently read
terminal receipts of the earlier regression Card.

## Upgrade and replay troubleshooting

The initially connected agent MCP processes predated the Desktop upgrade.
A Journey call on that connection returned `INTERNAL_RUNTIME_FAILURE`.
Its successful Capture and this error were excluded from beta.19 acceptance;
the runtime version serving that connection was not established. Fresh
processes explicitly reported beta.19 and supplied the results above.

After updating Desktop, restart its MCP connection in the host. Check the
new server's initialization version where available and rediscover schemas.
An installed DEB version or cached tool metadata alone cannot identify an
already-running server. Do not rewrite permissions or delete sessions to
compensate for a stale connection.

A separate attempted replay returned `REPRODUCTION_BUSY` during manual
testing. Finish the active test before retrying. Original State in beta.19
still requires Desktop: public `open_state` requires `frontendOrigin` and
does not expose a captured-source Saved State target. Do not substitute a
local-target open and report it as Original State.

## Repeating and maintaining this check

Read the installed version with `dpkg-query -W stateport`, inspect
`stateport mcp config`, and establish a fresh public MCP connection. Record
`initialize.serverInfo.version`, tool schemas and Capture permission before
the synthetic lifecycle above. Review before Save, retain the exact Card and
revision locally, and obtain exact-Card confirmation before Journey.
Read final replay outcomes, not just open-window or Save responses.

Repository validation on this documentation candidate:

- `npm run sync` — generated version metadata synchronized.
- `npm run verify` — PASS, nine test files and 113 structurally checked files.
- `git diff --check` — PASS.

These checks validate source, generated packages and public links; they do not
rerun the recorded host or manual acceptance.

The aggregate provider status stays `unverified`: a two-iteration current-code
fix/reopen/compare run, automatic skill selection, update transition and
release-artifact installation remain separate acceptance work. Other provider
rows retain their existing status. This report makes no Marketplace claim.
