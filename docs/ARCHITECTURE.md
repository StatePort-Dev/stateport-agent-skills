# Architecture

## One behavior source

The portable skill and its references live under `skills/`. Provider-specific
packaging lives under `providers/`. Public distribution must remain usable
without access to any private product repository.

The public MCP contract is the boundary. StatePort Desktop/runtime owns Capture,
managed-page execution, storage, authentication, permissions, cleanup, safe
projections and outcome semantics. This repository owns the agent's selection
of Card/reproduction workflow, instructions, packaging and host setup guidance.
Never move an engine, a credential store or a private API client here.

## Provider adapters

The shared source package can be installed in Codex CLI, Claude Code and
Copilot CLI, but each host keeps an independent evidence status.
The creation workflow is capability-gated: it needs discovery of the public
Capture lifecycle, available and enabled permission, and the exact managed
Page. Extend to other hosts through adapters that preserve the same behavior
source rather than copying or redefining the workflow.

The shared plugin manifests contain no fabricated MCP executable. Their generated
skill and setup helpers are checked for freshness; each helper consumes the
installed Desktop's copied MCP configuration and refuses conflicting entries.
The thin VS Code extension source is under `extensions/vscode/`. It uses a
generated skill copy and registers an MCP definition only after user setup.
Its VSIX is a separate artifact from the agent plugin. The thin IntelliJ
Platform plugin under `extensions/jetbrains/` adds native handoff/setup-help
actions and a separately built ZIP. It does not carry a runtime or grant MCP
authority; AI Assistant connection remains an explicit host step.

## Versioning

The root [integration metadata](../integration.json) owns one integration
release version for the portable package and current native source candidates.
`npm run sync` propagates it to manifests and puts a local copy beside each
distributed skill. Its MCP contract range is a consumer expectation, not a
claim that every Desktop runtime advertises a version field. The
[version/update policy](VERSIONING_AND_UPDATES.md) defines the boundary.
Repository versions describe skill/packaging releases, not Desktop versions.
Each verified host record binds the host version, skill version, and runtime
version/contract. Keep development versions unverified until those runs exist.
Do not publish a tag or claim universal compatibility just to complete setup.
