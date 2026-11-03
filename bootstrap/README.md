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
not proof of that host's discovery. The JSON reply supplies the installed owned task
launcher. Its ready frame binds the exact generation selected at session start. `doctor`, `access`, `open <card-id>`, `update --offline`, `rollback` and
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

Payload schema 1.2 adds explicitly declared, bounded per-file PAX path records
for long native browser framework names. Legacy 1.0/1.1 payloads remain readable;
older readers reject 1.2. Global overrides, linkpath/size/ownership/xattr records,
traversal and foreign links remain forbidden. Release identity and the full
inventory are verified before runtime execution.

## Update policy source candidate

Compatible updates use the same verifier, archive decoder, install lock and
versioned store. The new generation is first staged without changing the current
pointer; only a new task/MCP process may select it. A baseline/edit/candidate
cycle retains one exact runtime, tools, skills and browser. No service, own Node,
system-browser update, npm-cache rewrite or live instruction replacement exists.

Non-interactive installation defaults to **Notify**. `--consent-updates` explicitly
permits compatible Auto delivery; repeat setup preserves an existing policy/pin.
These candidate controls use this bootstrap entry (or installed loader for
`updates`), and are not MCP tools or published registry instructions:

```text
updates status
updates auto --consent
updates notify [--release-pin]
updates pin <already-installed-manifest-sha256>
updates channel stable|beta|rc --confirm
updates check
updates retry <quarantined-manifest-sha256>
repair-launcher --confirm
```

Auto checks during use at most once per 24 hours per installation, including
failed attempts, under the shared conservative lock. Its finite job is tied to
the launcher owner. Notify checks metadata only; Pinned selects exact verified
cached bytes. Disabling Auto/pinning after staging prevents future automatic
activation. `updates status`, doctor, existing calls/close and uninstall never
perform an implicit update. Explicit `update` bypasses TTL, preserving signature,
compatibility, pin and exact browser download-consent requirements.

Dynamic signed envelope v2 binds publisher, channel, monotonic sequence and
version; full asset hashes/inventory and a versioned generation record bind
platform, Node/native ABI, launcher/task/MCP, exact skills, browser, shared storage
and permissions. Unknown/different contracts remain held. Changed or pinned host
instructions/config remain owned by their existing installer; resolve through
that installer and explicit setup/restart. This candidate uses a delivery-local
ownership receipt outside versions; it never silently migrates legacy receipts.

Read-only MCP initialize/discovery does not start the job. Its trusted use signal
follows admission of the original execution task. Status distinguishes running,
selected, retained previous and pending; retained previous is not a safety grant.
Unknown legacy rollback is held; use its original reviewed bootstrap for explicit
legacy recovery.

Readiness binds the actual compiled runtime version to its manifest and is bounded and non-mutating, with no fetch, Card read, vault write,
Capture or trial. Already validated retired/revoked builds cannot become an
automatic fallback; unavailable network/policy does not block installed work.
Pre-operation failures quarantine the exact digest and retain/restore allowed A
for future sessions. A user operation is never automatically replayed on A.
Rollback changes code only; retained versions/browser bytes and user data remain.
Files are flushed before rename; POSIX directories are synced. Windows native
durability, native trust and complete three-platform qualification are separate.

`update-release.json` independently pins update authority and is deliberately
**unpublished**. Fixture keys are test-only. A changed loader/trust anchor requires
explicit official bootstrap repair/reinstall, never self-replacement in npm cache.
Run `repair-launcher --confirm` only through that reviewed official bootstrap;
changed loader files are retained in an exact local backup. Stop/restart the
coding host explicitly after repair. It does not repair edited skills/MCP files.
No public Auto claim follows from these source commands or local A→B receipts.

The implemented resolver verifies a signed, independently pinned manifest and
download inventory. `release.json` intentionally leaves public resolution off.
Before public delivery: qualify this release chain, controlled npm
name/trusted publisher, archive/download and interruption recovery,
product distribution terms, all three native hosts and complete agent workflows
remain required. Candidate file tests do not prove any of those gates.

Prepared update metadata uses only the selected signed JSON at
`https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/rc.json`
(or the explicitly selected `beta.json`/`stable.json`). Wrong repository, branch,
channel, query, fragment and credential-bearing raw URLs are rejected, including
redirects. Runtime archives cannot use this metadata exception. The independent
Ed25519 signature and replay/downgrade checks remain required. This source
candidate does not enable or publish that endpoint.
