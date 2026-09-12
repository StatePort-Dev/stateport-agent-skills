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

## Incremental delivery

Start with one draft skill and explicit unverified provider rows. The shared
source package can be installed in isolated Codex CLI, Claude Code and Copilot
CLI profiles, but supplied-Card agent workflow still needs real-host evidence.
Add the creation workflow only after its public capabilities are available and
verified. Extend to other hosts with the same behavior source.

The shared plugin manifests contain no fabricated MCP executable. Their generated
skill and setup helpers are checked for freshness; each helper consumes the
installed Desktop's copied MCP configuration and refuses conflicting entries.
The thin VS Code extension source is under `extensions/vscode/`. It uses a
generated skill copy and registers an MCP definition only after user setup.
Its VSIX is a separate artifact from the agent plugin. JetBrains integration
remains a separate implementation.

## Versioning

Repository versions describe skill/packaging releases, not Desktop versions.
Each verified host record binds the host version, skill version, and runtime
version/contract. Keep development versions unverified until those runs exist.
Do not publish a tag or claim universal compatibility just to complete setup.
