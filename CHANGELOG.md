# Changelog

## Unreleased

Current beta source: `0.1.0-beta.2`. No tag or supported end-user
release has been published.

### User setup

- Include installation and updating in AGENT_INSTALL.md, with host commands,
  alpha-to-beta migration, restart, verification and recovery guidance.

- Add a Settings-first setup entrypoint that works before the first Card and a
  generic path for local coding agents with stdio MCP support.
- Package the five shared skills for Codex CLI, Claude Code and GitHub
  Copilot CLI, with preview-first local MCP setup helpers.
- Add source candidates for Cursor Agent, VS Code/Cursor VSIX, and IntelliJ
  IDEA/WebStorm.

### Debugging workflow

- Prepare Bug context from supplied issue descriptions/links during Capture;
  map Description/Observed/Expected without redundant questions and distinguish
  actual observations from reported symptoms. Persist through a discovered
  public writer when available; beta.20 has no such writer, so report prepared
  context as unsaved instead of claiming it was stored.

- Split task entrypoints into debugging, capture, journey, replay experiments
  and transfer; share the common MCP procedures without manual copies.
- Cover all 34 public MCP operations and beta.20 supplied credentials,
  fill_credential, observed element IDs and available actions.
- Use existing task authorization and defaults; ask only for consequential
  missing information. Ordinary captures need no bug symptom.

- Use login credentials supplied for the requested Capture without repeated
  consent; prefer the runtime's protected credential operation and exact observed
  element IDs when available. Keep legacy runtime capability checks.

- Define supplied-Card inspection, open, reproduction and same-revision
  comparison as the canonical workflow.
- Add capability-gated agent Capture with explicit permission, exact managed
  Page control and Review before Save.
- Keep missing capabilities, permission barriers and contract mismatches as
  explicit blockers instead of guessing private runtime behavior.

### Packaging and safety

- Generate provider and editor copies from canonical entrypoints, shared references and one
  integration version.
- Preserve unrelated MCP configuration, reject conflicts and require the
  installed Desktop's copied launch configuration.
- Add structural, packaging and setup tests plus a reviewed-public-repository
  allowlist for outbound GitHub source links.

### Compatibility

- Record version-bound source installation, editor packaging and bounded Codex
  CLI Capture/replay evidence under `docs/compatibility/`.
- Keep aggregate provider status unverified until a complete agent-driven
  current-code fix/reopen/compare workflow is recorded.

### Breaking changes

- None claimed.

## 0.1.0-beta.2 source candidate

- Strengthened Fix & Verify with baseline failure, fresh current-build verification,
  durable named checks, finite recovery and separate runtime/behavior/agent results.
- Added Check Changes (bounded relevant cases; no edits by default) and Harden Case
  (independent valid data variants; delivery and consumption required).
- Preserved Capture, Journey, Replay Experiments and Transfer. Generated seven-skill
  packages remain self-contained; installation/update paths use the complete set.
- New behavior controls and ordinary-Card response experiments require discovered
  runtime support. Skills authorize the necessary Capture/replay/Journey and protected
  login steps from the original task, without repeated permission prompts or global
  permission changes. Agent Capture defaults on while preserving explicit choices.
  Host acceptance remains unverified;
  this source candidate is not a published release or a performance claim.

- Original replay guidance now distinguishes retained localhost application material
  from Local/current-code replay; old Cards missing HTML need recapture for offline Original.
