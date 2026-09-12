# Changelog

## Unreleased

### Behavior

- Keep the existing Card reuse and Capture boundaries; no new runtime action.

### Packaging and providers

- Add one integration release metadata source and deterministic version sync
  across portable plugin, Codex, Claude and native source manifests. Raw skill
  copies carry their version locally. Manual copies remain user-managed.

### Native extensions

- Align VSIX and JetBrains source-candidate versions with the integration
  release version. This is source metadata, not a Marketplace publication.

### Compatibility

- Define capability-first MCP compatibility decisions and explicit update
  guidance. A runtime contract projection remains a separate dependency;
  no real runtime handshake or host update transition is claimed.

### Breaking changes

- None claimed. No mandatory Desktop update is introduced by this source
  change; a future MCP contract change must be called out explicitly.

### Earlier development source changes

- Add a thin IntelliJ Platform ZIP source candidate with native Tools menu
  actions for exact Card handoff and the documented AI Assistant MCP setup
  path. Build and binary checks are separate from IDE/agent workflow proof.
- Add a preview-first Cursor user-scope MCP helper that merges only a reviewed
  Desktop launch, refuses conflicts and removes only a matching entry. Cursor
  Agent plugin load and workflow remain unverified.
- Add a thin VS Code VSIX source candidate with the generated canonical skill,
  opt-in Desktop MCP provider and exact Card handoff. The same VSIX installed
  and uninstalled in isolated VS Code and Cursor profiles; agent workflows are
  not verified.
- Add a Copilot CLI source-package guide and preview-first MCP helper; public
  `0.1.0-alpha.1` plugin installation and local synthetic setup checks passed.
  VS Code Agent and all StatePort workflows remain unverified.
- Add a Claude Code manifest to the shared source package and make the
  marketplace catalog valid for both Claude Code and Codex CLI. Claude Code
  source install/disable/update/remove passed locally. Five manual Claude Code
  commands route to the canonical skill. A preview-first helper registers the
  installed Desktop's copied MCP command through Claude Code's public CLI;
  agent workflow remains unverified.
- Add a Codex CLI source package with generated canonical skill content and a
  bounded Desktop-config-to-Codex MCP setup helper. Local package install/remove
  and synthetic configuration checks passed; runtime and agent workflows remain
  unverified.
- Initial canonical debugging skill draft and portable references.
- Provider preparation guides and explicit unverified compatibility registry.
- Dependency-free structural validation, synthetic evaluation scenarios, and CI.
- Contribution, security, ownership, and issue/PR templates.

No runtime handshake, agent workflow, or marketplace publication is claimed
by this entry.
