# Five-skill beta source validation — 2026-09-21

Integration source: `0.1.0-beta.1`. Result: PASS for source/package checks below.
No new real-host workflow, installed beta transition, native artifact install,
tag or Marketplace publication is claimed.

## Changes reviewed

- Five canonical entrypoints: debugging, capture, journey, replay experiments,
  and transfer. Common references have one authoring location and are generated
  into each self-contained skill, plugin package and VS Code package.
- Public operation map covers all 34 MCP registrations in beta.20 source.
  Capture instructions include supplied credentials, fill_credential, fresh
  element IDs, supported actions and ordinary-state Save without invented bugs.
- AGENT_INSTALL.md includes installation and updates, alpha migration, restart,
  version/discovery checks and recovery. Native and raw-copy paths are explicit.
- Integration/manifests/native source metadata use the same beta version.
  Historical host reports and provider support statuses are preserved.

## Actual validation

- Before implementation, `node tests/plugin-package.test.mjs` failed because
  only stateport-debugging existed and the new-repro command still selected it.
- `npm run sync` — PASS; generated skills, metadata and VS Code discovery.
- `npm run verify` — PASS; nine test files, including five-skill distribution,
  beta metadata, byte-idempotent sync, read-only drift checks, shared-reference
  propagation, obsolete reference handling and existing setup/native tests.
- Skill Creator `quick_validate.py` on every canonical skill — PASS, five skills.
- Read-only comparison of public tool registrations with public-mcp.md —
  34 registered, 34 documented, zero missing. This is source coverage only.
- `git diff --check` — PASS.
- Reviewed new public text/links; no private source links, Cards, credentials
  or captured payloads were added.

Codex CLI update syntax was checked with installed `codex plugin --help`,
`codex plugin marketplace --help` and `codex plugin add --help`. Claude and
Copilot command guidance was checked against their official documentation linked
from AGENT_INSTALL.md. No installed user plugin or MCP configuration was changed.

## Remaining behavioral evidence

EV-12 through EV-19 in the evaluation inventory cover login sequencing, older
runtime fallback, existing Journey confirmation, experiments, ordinary/protected
imports, sharing and alpha migration. They remain `not_run` until separate agent
runs record actual decisions. Structural tests do not establish implicit
activation, skill loading or a complete current-code fix/reopen/compare loop.
