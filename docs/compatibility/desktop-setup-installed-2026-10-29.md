# Installed Desktop setup — version-bound host checks

Date: 29 October 2026. These are local candidate setup/discovery checks, not a
marketplace release or full agent fix/reopen/compare acceptance.

Ubuntu 24.04.5 LTS x64, OS-installed StatePort 1.0.0-beta.107 DEB:

| Host | Setup/repeat | Actual host discovery |
| --- | --- | --- |
| Codex CLI 0.164.0-alpha.11.1 | PASS | Seven skills; 59 MCP tools via fresh app-server |
| Claude Code 2.1.312 | PASS | Seven skills; MCP connected; 59 tools via real CLI control protocol |
| Cursor IDE 3.7.27 | PASS | Seven skills and 59 enabled tools in the authorized current profile's Settings |

Skills source is 0.1.0-beta.77 at `05fcf42c9b99bbf8b720b761ac0e3ca7e3f6220d`.
Installed app.asar SHA-256:
`307b8917189926ed762616c3bff67c3dcb86bcf705a4cc93840fe053da81e953`.
DEB SHA-256: `d94fcf10ec3409445125671e3b1b930bb34aa8908fef77ba8f8209902753da0d`.
The package retains its original pre-commit candidate provenance; installing it
is not proof of a clean-commit public release.

Native first offer, confirmed skip, Settings setup and repeat passed. A separate
fresh HOME ran installed Desktop and Codex with only loopback in an isolated
network namespace. Bundled fallback setup/repeat and seven skills/59 tools passed
without external network. No model turn, Card tool invocation, Capture or managed
permission change was used. Claude's official native CLI was placed only in task
tooling, not installed globally. Cursor's existing unrelated MCP entry was kept.

The isolated Cursor profile initially required login. Only the subsequently
user-authorized current profile supplies Cursor host evidence. Codex desktop/IDE,
Cursor VSIX, Claude Desktop, cloud/remote agents and other OS combinations are not
qualified by these results. The top-level provider workflow status remains
unverified; `desktopSetup.status` covers only the listed setup/discovery checks.

Windows 11 Pro x64 build 26200 also passed native Codex CLI 0.165.0 installed-host
acceptance: NSIS install, real skip → Settings setup, byte-identical repeat and
fresh discovery of seven skills / 59 tools. This used a native Windows build from
product commit `61a457337a8301feeecad77b6ef2b1b77968e984`, not WSL. Native build,
browser staging, package inventory and 36 focused Windows tests passed. The
symlink-escape fixture uses an unprivileged directory junction on Windows; no
security assertion or OS protection was relaxed.

Windows app.asar SHA-256:
`136add32b221d6e318d1f938c659f4df9f691b83777af17795706149b9bd85f4`.
NSIS SHA-256: `45d75d445b03e99a6078f2e5dba15b9076b71ad581745f78a3cf99dd88ce6307`.
The local installer is unsigned; no signed/public Windows release is claimed.
The founder explicitly excluded macOS from issue #241 acceptance after these
checks. It remains untested and is not a remaining gate for this issue. Private evidence remains in the product repository's
ignored `.issue-work/241/installed-host-20261029/`; no private screenshots or logs
are published here.
