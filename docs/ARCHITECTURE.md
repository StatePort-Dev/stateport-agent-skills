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
source package can be installed in isolated Codex CLI and Claude Code profiles,
but supplied-Card agent workflow still needs real-host evidence. Add the creation workflow only
after its public capabilities are available and verified. Extend to other
hosts with the same behavior source.

The shared plugin manifests contain no fabricated MCP executable. Its generated
skill and setup helper are checked for freshness; the helper consumes the
installed Desktop's copied MCP configuration and refuses conflicting entries.
Native IDE extensions are separate codebases and consume this skill or its
public artifacts; they do not maintain independent copies.

## Versioning

Repository versions describe skill/packaging releases, not Desktop versions.
Each verified host record binds the host version, skill version, and runtime
version/contract. Keep development versions unverified until those runs exist.
Do not publish a tag or claim universal compatibility just to complete setup.
