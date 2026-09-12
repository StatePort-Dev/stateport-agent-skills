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

Start with one draft skill and explicit unverified provider rows. Prove the
supplied-Card workflow in one local host, then add its native installation
package. Add the creation workflow only after its public capabilities are
available and verified. Extend to other hosts with the same behavior source.

There are no executable plugin manifests in the bootstrap: format-shaped files
with fabricated paths or unsupported MCP commands are worse than explicit
preparation guides. Add manifests only with format checks and real install
proof. Native IDE extensions are separate codebases and consume this skill or
its public artifacts; they do not maintain independent copies.

## Versioning

Repository versions describe skill/packaging releases, not Desktop versions.
Each verified host record binds the host version, skill version, and runtime
version/contract. Keep development versions unverified until those runs exist.
Do not publish a tag or claim universal compatibility just to complete setup.
