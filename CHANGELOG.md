# Changelog

## Unreleased

Current development source: `0.1.0-alpha.10`. No tag or supported end-user
release has been published.

### User setup

- Add a Settings-first setup entrypoint that works before the first Card and a
  generic path for local coding agents with stdio MCP support.
- Package the shared debugging skill for Codex CLI, Claude Code and GitHub
  Copilot CLI, with preview-first local MCP setup helpers.
- Add source candidates for Cursor Agent, VS Code/Cursor VSIX, and IntelliJ
  IDEA/WebStorm.

### Debugging workflow

- Define supplied-Card inspection, open, reproduction and same-revision
  comparison as the canonical workflow.
- Add capability-gated agent Capture with explicit permission, exact managed
  Page control and Review before Save.
- Keep missing capabilities, permission barriers and contract mismatches as
  explicit blockers instead of guessing private runtime behavior.

### Packaging and safety

- Generate provider and editor copies from one canonical skill and one
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
