# Agent Runtime and qualification

[StatePort stable installer](https://www.npmjs.com/package/stateport).
Run `npx stateport` (PowerShell: `npx.cmd stateport`) with existing Node.js 24.x/npm.
Desktop remains an optional visual client of the same engine, Cards, protected
storage and signed access. Package availability does
not establish full native/model/trust acceptance or upgrade provider statuses.

The [transparent MIT bootstrap](../bootstrap/README.md) verifies an independently
pinned Ed25519 release and the full native archive inventory. It contains no private
engine source, own Node or Electron. The system-browser runtime excludes Chromium;
the pinned fallback requires a separate explicit download confirmation. Registry
integrity and cryptographic public-source provenance were verified independently.

## Current publication and source boundary

Canonical setup: https://docs.stateport.dev/getting-started/install/ . Installer, engine and skills have independent versions. The stable skills source
is 1.0.0; each signed runtime defines its exact bundled snapshot. Three-OS native
machine controls are separate from real model/human acceptance; Windows chat is
owner-reported on its contextual baseline and macOS manual/model is unverified,
tracked and non-blocking. Retained provider receipts keep their original versions.

The 6 November chooser/network/doctor changes ship in installer 1.0.1.
Earlier 1.0.0 bytes retain their original contract. No personal
configuration or provider status is changed by documentation or static tests.

## Agent setup recovery in 1.1.0

Run `npx --yes stateport@latest`. Setup configures all detected supported
agents and migrates recognizable older StatePort connections automatically.
Missing owned files/entries can be restored; edited, disabled or foreign settings
are preserved with an agent-specific blocker. Existing pins and update consent
remain unchanged. Saved-data compatibility is versioned independently of engine
releases; unknown/mixed storage changes remain blocked.

| Agent | User MCP config | User skills |
| --- | --- | --- |
| Codex CLI / IDE | `~/.codex/config.toml` | `~/.agents/skills` |
| Claude Code CLI / IDE | `~/.claude.json` | `~/.claude/skills` |
| Cursor | `~/.cursor/mcp.json` | owned shared `~/.agents/skills` |
| Copilot | `~/.copilot/mcp-config.json` | `~/.copilot/skills` |

VS Code's older Local harness also receives an owned `Code/User/mcp.json`
compatibility bridge, including existing bounded user profiles. JSONC comments
and unrelated servers are retained. Multiple recognized provider skill folders
are valid. Remote or linked profiles outside the current home are protected.

Claude standalone setup requires no third-party marketplace. A recognized
personal StatePort plugin can migrate with a private StatePort-only record;
plugin cache and other plugins are preserved. Corporate restrictions on MCP or
skills require administrator approval; the installer never changes policy.
Local saved configuration and launch checks are separate from host discovery,
login, model availability and completed workflows. New native archives are built
on three OSes; functional qualification for this release is local Ubuntu only.

## Current task versus next session

Installer 1.1.0 prints human-readable progress, a component checklist and
first-task/explore/browser-case messages. Default setup configures all detected
supported agents without a selection prompt, including non-TTY/JSON use.
`--choose-agents` enables the optional terminal picker; explicit `--agents`
and `--agent` remain available. Codex, Claude Code, Cursor and VS Code/Copilot
are separate targets. Registered official Claude IDE extensions are discovered
without a standalone CLI. Protected per-agent conflicts do not suppress setup of
the other targets. A recognizable old StatePort installation migrates automatically with a private scoped record; custom state stays protected. Per-agent outcomes remain separate. Automation and authorized same-chat setup use
`npx stateport --json`; its exact `currentTask` descriptor remains machine-readable.
MCP/task-session stay protocol-only without a flag. An incomplete agent setup
exits 1, including a protected conflict with an existing installation. The runtime
can still be installed successfully while that agent connection needs attention.

A verified installer can return an exact local Node command/argument vector for
CLI continuation. That descriptor is distinct from Card/page text and from tool
permissions. Use the original task and the coding host's normal local approvals.
No hot MCP reload is assumed. The current launcher uses `task-session`, a
finite foreground execution session retained by the coding host. Its first JSON
line supplies project + original scope; later lines request tools, an idempotent
named operation, or close. Keep stdin open between calls. EOF/host cancellation
close the owned worker; an explicit close waits for worker exit. This reuses the
same runtime/authority and keeps its capability token private. It is not a global
service, another solver, or a reason to bypass host approvals. Legacy detached
commands remain for controlled launchers; a host that reaps detached children
requires foreground support, not an invented driver or silent service.

[CLI continuation](../skills/stateport-debugging/references/cli-continuation.md)
is canonical. Capture remains optional for tasks without a useful browser case.
An existing Card uses reuse; honor automatic Capture opt-out. Review and signed
Developer access remain the existing runtime gates. Establish actual baseline
failure before editing and verify the same Card/revision with unchanged criteria
and source/build limits. Unit tests or successful Save are not a fixed bug.

Human `access` uses a narrow browser flow. Email/verification/activation codes
must never pass through chat, command arguments, agent outputs or screenshots.
A versioned human-local recovery action grants no task permissions. Free work
continues when access is declined or unavailable. Human `open <Card ID>` uses
the exact local runtime launcher and a foreground owned browser, not an assumed
Desktop URI receiver. It does not claim verification by opening a page.

Future-session setup reuses ownership/conflict handling and canonical seven
skills. Its pinned Node MCP launcher has no repeated `npx latest`, global pnpm or
Desktop dependency. File installation/probe is not host discovery. Next-session
MCP requires actual host observation. Node candidate range is 24.x; exact build
patch is not a user prerequisite. Other LTS ranges remain unqualified.

## Native qualification

| Target | Package/native vault | System browser and pinned fallback | Same-chat Codex, cold human Open, next session |
| --- | --- | --- | --- |
| Windows 11 x64 | Native CI vault/recovery/Free Capture controls; actual VM named npm/setup/repeat/cold checks | System Edge reviewed Capture/cold reads; pinned archive audited | Full native model/human/trust acceptance pending |
| macOS Apple Silicon arm64 | Native CI Keychain/recovery/Free Capture controls | System Chrome CI Capture/cold reads; pinned archive audited | Owner-host/model/human/native trust acceptance pending |
| Ubuntu 24.04 x64 | Native CI and actual host bounded controls; fresh named npm/repeat/cold Card checks | System Chrome reviewed Capture; pinned archive audited | Actual local Codex first-use MCP/foreground flow; broader human/trust acceptance pending |

No WSL, cross-build, hosted package or two-platform result substitutes for all
three native workflows. Preserve sandbox, OS security policy, browser-owned
profiles, exact native addon closure and fail-closed egress. Other hosts have
only adapter contract preparation; no Claude/Cursor/IDE workflow claim follows.

Update/rollback/uninstall preserve Cards, credentials and signed identity.
Changed owned skills/config or foreign entries require conflict resolution.
Named npm installation, reviewed Capture/Save, repeat and new-process cold Inspect
are recorded for RC5 on Ubuntu and Windows. Windows QA normalizes temporary
8.3 aliases and retains native OS browser variables; product data stays isolated. Public website
primary-entry conversion retains its separate acceptance gates; no site deployment
or marketplace release follows from this package publication.

The [update policy source candidate](VERSIONING_AND_UPDATES.md#node-runtime-update-policy-candidate)
adds explicit Auto/Notify/Pinned controls over the same verified delivery chain.
Its real three-platform A→B/model/trust acceptance and public rollout are separate
from the retained earlier runtime evidence. No provider status is upgraded.


### Chat access source candidate

Compatible Node recovery1.2 advertises a first-use trial or expired-access purchase
action and optional `open_developer_access` host action. It opens the human-only
window from chat; the existing official plans checkout, verified-email trial and
signed activation remain authoritative. No automatic trial/purchase, secrets in
chat or repeated Capture/setup. Retained localCommand is a fallback for older
hosts. RC5 includes this action; the earlier immutable RC4 does not. This does
not promote native/provider compatibility; discover the actual runtime.

## RC6 first useful result and RC9 installer

Runtime rc.6 contains bundled skills beta.83, bounded source-context observations,
source-only continuation without Capture or trial, and a single first-use
introduction after a useful result. An explicit Developer trial CTA remains
optional; refusal does not activate access or trigger repeated offers. Ordinary
tasks can stay quiet when no useful StatePort material is present.

Codex presence includes registered extensions in VS Code, VS Code Insiders and
Cursor, independently of a global Codex CLI. Provider-aware labels keep Copilot
Chat distinct from Codex and retain actual configuration outcomes.

The runtime has three-OS native CI proof for source/progress safety, vault and
Free Capture controls. Local Ubuntu Codex model/foreground first-use delivery
passed; the owner confirmed the Windows chat acceptance. macOS manual/model
acceptance remains unverified and non-blocking by owner decision. This does not
qualify every provider, native trust scenario or human payment/recovery flow.

Installer rc.9 includes the [anonymous install-event disclosure and opt-out](../bootstrap/README.md#anonymous-installer-metrics).
The engine remains the separately signed runtime rc.6; npm UI/source and runtime
versions are independent.

## Independent stable engine delivery

Installer 1.0.0 resolves the current signed stable engine for a new install.
Ed25519 trust, sequence high-water, archive inventory and generation/storage
compatibility are checked before activation. Existing exact pins remain pinned;
no running session switches engine. Fresh update policy is Stable/Notify.
Existing RC policy is preserved and can be changed explicitly with
`npx stateport updates channel stable --confirm`. Auto still requires consent.
The installer can explain the Node 24 prerequisite when started on Node 20–23.
The engine itself remains Node 24.x; no private Node or Chromium is bundled by
default. Package releases, engine releases and skills versions are independent.
