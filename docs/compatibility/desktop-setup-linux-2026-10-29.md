# Desktop setup — bounded Linux candidate check

Date: 29 October 2026. This is local candidate evidence, not a marketplace release,
OS-installed acceptance, or a qualified agent × OS matrix.

- Desktop: 1.0.0-beta.107 local unpacked Linux x64 production candidate.
- app.asar SHA-256: `1e4eddf940b33a7671c9ee09cd8f9610993fccac986dc231a41efd27784e759c`.
- Skills: 0.1.0-beta.77, official source
  `05fcf42c9b99bbf8b720b761ac0e3ca7e3f6220d`.
- Host: Codex CLI 0.164.0-alpha.11.1, fresh app-server session in an isolated user
  environment. Codex desktop and IDE were not tested by this check.

Actual Desktop UI passed first-launch offer, skip warning and focus, confirmed
skip, Settings installation and repeat. A fresh Codex CLI `skills/list` discovered
all seven StatePort skills, and `mcpServerStatus/list` discovered 59 public tools
including `inspect_state`. No model turn or Card tool call was needed.

A second fresh environment with unavailable network proxy routing passed native
Desktop installation from the bundled fallback, the explicit repository-unavailable
message and repeat. The receipt recorded bundled provenance. The installer did not
execute downloaded scripts, Git, system Node or marketplace installation.

The strict setup helper parser now accepts Linux DEB's bundled
`resources/mcp-runtime/node` with its sibling `mcp-main.cjs` only. AppImage/macOS/
Windows launch paths remain covered by source fixtures. Integration verification
passed 68 tests and structural checks; those tests are not real host discovery.

Claude Code, Cursor IDE, macOS and Windows installed-host checks remain unverified.
Provider workflow statuses remain unchanged. A GUI launch, configuration file or
successful standalone MCP probe does not establish agent discovery. Existing
manual installation, update, conflict and removal guides remain applicable.
