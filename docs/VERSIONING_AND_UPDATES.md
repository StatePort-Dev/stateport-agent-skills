# Integration versions and updates

This inventory was audited at `36e4e8b52f68624a7466a7540cfd6eaf7996cd77`
on 2026-09-12, before the lifecycle changes in this source tree. The checkout
was clean on `main` and matched `origin/main`. Local `git tag --list` was empty.
The remote GitHub Releases query failed because `api.github.com` was unreachable;
remote release absence was not independently rechecked.

## Version-bearing and distribution-bearing surfaces

The **before** values are retained here as audit evidence, not current release
claims. `integration.json` now owns the source candidate's release version;
`npm run sync` generates the named artifact fields. There is no independent
VS Code or JetBrains version line: neither has a separately evidenced release
cycle. The MCP contract number is a consumer compatibility range, not a
Desktop or plugin SemVer. No minimum Desktop SemVer is asserted because the
public runtime has not provided an evidenced floor.

| Surface | Before version/source and role | Before maintenance | Install and update owner | Evidence |
| --- | --- | --- | --- | --- |
| Root `package.json` | `0.1.0-alpha.4`; private development metadata | Manual | Source maintainer; no npm installation | Structural checks only |
| Portable `plugins/stateport/plugin.json` | `0.1.0-alpha.4`; installable Git-source package | Manual | Host plugin manager | CLI install evidence only |
| Codex `.codex-plugin/plugin.json` | `0.1.0-alpha.4`; compatibility metadata | Manual | Codex plugin manager | CLI install evidence only |
| Claude `.claude-plugin/plugin.json` | `0.1.0-alpha.4`; host package metadata and update cache key | Manual | Claude plugin manager | Install and same-version update command only |
| Root `.claude-plugin/marketplace.json` | No version; Git-source catalog and policy | Manual, not version-bearing | Host marketplace refresh | Catalog/install evidence only |
| VS Code `extensions/vscode/package.json` | `0.1.0-alpha.0`; VSIX identity | Manual | VS Code/Cursor extension manager or sideloading user | Local VSIX install/remove; no update transition |
| JetBrains `build.gradle` | `0.1.0-alpha.0`; ZIP build identity | Manual | IDE plugin manager or sideloading user | ZIP and binary verifier only |
| JetBrains `plugin.xml` | `0.1.0-alpha.0`; plugin descriptor | Manual | IDE plugin manager or sideloading user | ZIP and binary verifier only |
| Provider guides and registry | Host versions and historical alpha versions are evidence labels, not release owners | Manual | Maintainer | Rows remain `scaffold` or `unverified` |
| Generated plugin skill and setup helpers | No separate version; copies of canonical source | Generated | `npm run sync` | Drift check in `npm run verify` |
| Generated VSIX skill, parser, license | No separate version; copies of canonical source | Generated | `npm run sync` | Drift check and source packaging |
| Release docs, changelog, Git tags/releases | No tag in local checkout; changelog was `Unreleased` | Manual editorial/gated publication | Maintainer and GitHub Release | No release verified in this audit |

The real divergence was native `0.1.0-alpha.0` versus plugin/root
`0.1.0-alpha.4`. Historical version strings in dated evidence reports remain
historical. The VSIX example output path was also fixed to alpha.0 and is now
version-neutral. The root catalog deliberately has no redundant version field.

For this next source candidate, `integration.json` says `0.1.0-alpha.5`.
The generated fields are root `package.json`, all three plugin manifests,
VS Code `package.json`, JetBrains Gradle/descriptor versions, plus the local
`integration.json` inside canonical, plugin and VSIX skill directories. The
last file lets a copied raw skill report its installed integration version
without network access. The existing generator also keeps skill references,
setup helpers, VSIX parser and license in sync. `npm run check` rejects drift;
the check does not establish any host workflow result.

## Host-owned update paths

`Automatic` describes a documented host mechanism and its conditions, not a
StatePort update test. Every StatePort update evidence field is `unverified`
until a real old-to-new install and activation is recorded. A source checkout,
local package, sideloaded file, and Marketplace publication are distinct.

| Surface | Install / version visible | Owner and automatic update | Manual update / uninstall | Last host evidence |
| --- | --- | --- | --- | --- |
| Codex CLI | Git marketplace plugin; `codex plugin list --json` | Codex manager; automatic update unverified | `codex plugin marketplace upgrade stateport-dev`, then review/reinstall with `codex plugin remove` and `codex plugin add`; remove through Codex | `0.154.0-alpha.6.1` Linux, [install record](compatibility/codex-cli-source-2026-09-12.md); update transition not run |
| Codex desktop | Local marketplace candidate; installed version UI unverified | Codex/ChatGPT host; auto unverified | Host plugin UI; removal there | `scaffold`; no host install |
| Codex IDE extension | Standalone raw skill and separate MCP config; version in copied `integration.json` | User; no auto for a manual copy | Replace the skill directory; remove copied directory | `scaffold`; no host install |
| Claude Code | Git marketplace plugin; `claude plugin list --json` | Claude manager; third-party marketplace auto-update disabled by default, user may enable it | `claude plugin marketplace update stateport-dev` and `claude plugin update stateport@stateport-dev`; `claude plugin uninstall` | `2.1.269` Linux, [source record](compatibility/claude-code-source-2026-09-12.md); no old-to-new update |
| Copilot CLI | Git marketplace plugin; `copilot plugin list` | Copilot manager; custom marketplace auto-update requires user/managed opt-in | `copilot plugin marketplace update stateport-dev`, `copilot plugin update stateport`; `copilot plugin uninstall stateport` | `1.0.83` Linux, [source record](compatibility/copilot-cli-source-2026-09-12.md); same-version update only |
| Copilot Agent in VS Code | Agent plugin from Git marketplace; version in installed Agent Plugins view | VS Code; extension update checks can refresh marketplace plugins when enabled | **Extensions: Check for Extension Updates**, update/remove from Agent Plugins view | VS Code `1.137.0` present; no StatePort Agent install/workflow |
| Cursor Agent | Local copied portable plugin or CLI `--plugin-dir`; local `plugin.json` version | User for local copy; no auto | Replace reviewed local plugin, reload; remove local copy | Cursor `3.7.27` and Agent CLI `2026.09.10-fd3934a`, [blocked source record](compatibility/cursor-agent-source-2026-09-12.md) |
| StatePort VSIX in VS Code | Sideloaded VSIX; version in Extensions view | User; VS Code disables auto-update for VSIX by default | Install newer reviewed VSIX, uninstall in Extensions | Local VSIX install/remove on VS Code `1.137.0`, [record](compatibility/vscode-vsix-source-2026-09-12.md) |
| StatePort VSIX in Cursor | Sideloaded same VSIX; version in Extensions view | User; Cursor auto behavior for this sideload unverified | Install newer reviewed VSIX, uninstall in Extensions | Local Cursor `3.7.27` install/remove, [record](compatibility/vscode-vsix-source-2026-09-12.md) |
| JetBrains IDEA / WebStorm | Sideloaded ZIP; version in Installed plugins | User for disk install; Marketplace update settings become relevant only after publication | Install newer reviewed ZIP from disk; disable/uninstall in Plugins | Binary verification for named 2026.1/2026.2 builds, [record](compatibility/jetbrains-source-2026-09-12.md); live IDE update not run |

The host semantics above come from [Codex's local CLI command contract](../providers/codex/README.md),
[Claude's plugin management and auto-update documentation](https://code.claude.com/docs/en/discover-plugins),
[Copilot CLI's plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference),
[VS Code Agent Plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins),
[VS Code extension management](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace),
[Cursor's plugin documentation](https://prod.cursor.com/docs/plugins), and
[JetBrains plugin management](https://www.jetbrains.com/help/idea/managing-plugins.html).
Those documents describe host features, not proof that StatePort auto-updates.

## Manual source and raw skill fallback

A copied `~/.agents/skills` directory, project-local skill, symlink or cloned
source is supported as a **user-managed** fallback. For a clone, review the
desired release and run `git pull` on its selected branch. For a copy, replace
the entire copied skill with the version from the desired StatePort Agent
Skills release; a symlink follows its user's source checkout. Inspect
`integration.json` beside `SKILL.md` to see the local integration version.
No background polling, download or execution is performed by the skill.

## Compatibility and evidence boundary

The consumer checks public MCP discovery and schemas for the operation it needs,
then compares an advertised MCP contract number with the range in
`integration.json` when that number exists. Desktop SemVer is informational,
not a gate. Missing capability has a named blocker; a contract below the range
calls for a Desktop/runtime update; a contract above it calls for an integration
update through the host manager. If the contract number is absent, discovered
operations may be used cautiously, with contract compatibility unverified.
An explicitly malformed contract is an unsupported projection, not an absent
one; report it without guessing an update direction.
The [runtime dependency](RUNTIME_DEPENDENCY.md) specifies the missing public
projection. This repo cannot make a real runtime handshake appear.

The existing `scaffold`/`unverified`/`verified`/`blocked` support status remains
authoritative. `update` on each provider row is an independent classification;
even a future update test will not promote a workflow to `verified`. Source
validity, install, update, agent workflow, and cross-host compatibility each
need their own evidence.
