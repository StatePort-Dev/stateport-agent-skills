# StatePort bootstrap candidate

Transparent local candidate installer for an existing Node 24.x/npm host.
This package is private and not published. The public `npx stateport` path has
not been qualified, and default release resolution deliberately refuses to run.
Registry E404 does not establish name ownership. Do not publish this package.

Local evaluation accepts a source-built runtime directory plus its manifest
SHA-256 obtained independently from the trusted build. It verifies the exact
platform and every file before executing runtime setup. It has no dependencies,
postinstall hook, own Node, Electron or global package writes. Runtime setup
reuses the existing ownership-aware skills/MCP installer, without reading Cards
or starting a trial. Successful file installation is not host discovery.

Versioned runtime caches are separate from Cards, licenses and protected storage.
Repeat is a no-op; update switches a pointer only after verification. Rollback
verifies the retained prior version. Uninstall removes only unchanged owned
skills/config and the pointer, retaining runtime caches for active processes and
user data. Edited or foreign resources produce a conflict, never an overwrite.
Interrupted installs retain the prior pointer; an uncertain install lock requires
explicit recovery rather than deletion of a potentially active install.

Before public delivery: authenticated release resolver/provenance, controlled npm
name/trusted publisher, archive/download and interruption recovery qualification,
product distribution terms, all three native hosts and complete agent workflows
remain required. Candidate file tests do not prove any of those gates.
