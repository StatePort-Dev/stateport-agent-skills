# StatePort bootstrap candidate

Transparent local candidate installer for an existing Node 24.x/npm host.
This package is private and not published. The public `npx stateport` path has
not been qualified, and default release resolution deliberately refuses to run.
Registry E404 does not establish name ownership. Do not publish this package.

Reviewed local evaluation (replace placeholders with trusted absolute paths and
the independently supplied build-manifest digest):

```sh
node <bootstrap>/bin/stateport.mjs install --candidate-dir <payload-directory> --manifest-sha256 <candidate-json-sha256>
```

This writes the per-user runtime cache and detected agent's owned skills/MCP
configuration. Use a disposable account for acceptance. Optional `--agent codex`,
`--agent claude` or `--agent cursor` selects one existing installer adapter; it is
not proof of that host's discovery. The JSON reply supplies an exact current-task
launcher. `doctor`, `access`, `open <card-id>`, `update --offline`, `rollback` and
`uninstall` are suffixes for this same bootstrap entry. Never use the unpublished
registry command as a local evaluation shortcut.

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

The implemented resolver verifies a signed, independently pinned manifest and
download inventory. `release.json` intentionally leaves public resolution off.
Before public delivery: qualify this release chain, controlled npm
name/trusted publisher, archive/download and interruption recovery,
product distribution terms, all three native hosts and complete agent workflows
remain required. Candidate file tests do not prove any of those gates.
