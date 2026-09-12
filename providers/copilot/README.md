# GitHub Copilot integration candidates

Copilot CLI: **source package install-tested on version 1.0.83 for Linux x64;
StatePort runtime and agent workflow unverified**. Copilot Agent in VS Code:
**scaffold; host installation and workflow not run**. These are separate
surfaces in [the compatibility registry](../registry.json).

The [portable Agent Plugins package](../../plugins/stateport/plugin.json)
contains the generated copy of the [canonical debugging skill](../../skills/stateport-debugging/SKILL.md).
It uses the Agent Plugins 1.0 root manifest and `skills/` layout supported by
[Copilot CLI](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
and [VS Code](https://code.visualstudio.com/docs/agent-customization/agent-plugins).
There is no second debugging strategy, bundled runtime, `.mcp.json`, or
automatic Capture permission. After changing the canonical skill or setup
helper, run `node scripts/generate-codex-plugin.mjs` and `npm run verify`;
do not edit the packaged copies by hand.

## Copilot CLI source installation

For a reviewed published revision:

```sh
copilot plugin marketplace add StatePort-Dev/stateport-agent-skills
copilot plugin install stateport@stateport-dev
copilot skill list --json
```

The published `0.1.0-alpha.1` source installed from GitHub in an isolated
`COPILOT_HOME`; `copilot skill list --json` found the enabled
`stateport-debugging` skill. This is package discovery, not agent invocation.
Use `copilot plugin update stateport` to refresh and
`copilot plugin uninstall stateport` to remove. The optional setup helper was
tested locally as development version `0.1.0-alpha.2`; Git-source installation
of that revision is pending publication.

From the installed plugin directory, save and review the installed Desktop's
**Copy MCP config** JSON, then preview or apply a Copilot CLI user-scope entry:

```sh
node scripts/setup-copilot-mcp.mjs < desktop-mcp-config.json
node scripts/setup-copilot-mcp.mjs --apply < desktop-mcp-config.json
copilot mcp get stateport --json
```

The helper accepts only one Desktop-shaped `stateport` stdio entry with its
documented absolute command and arguments. It uses Copilot's public MCP CLI,
preserves unrelated entries, leaves an identical entry unchanged, and rejects
conflicting or disabled entries. It does not launch Desktop or prove an MCP
handshake. It requires Node.js 22+ and Copilot CLI on `PATH`. Review the
copied command first; the helper cannot authenticate its origin. Remove an
integration-owned MCP entry separately with `copilot mcp remove stateport`;
plugin uninstall does not remove it.

The [recorded CLI evidence](../../docs/compatibility/copilot-cli-source-2026-09-12.md)
is limited to installation and synthetic configuration. Supplied-Card reuse
needs a real Desktop MCP connection; create-first Capture needs the public
lifecycle and managed Page capabilities that are not yet in the inspected
contract.

## VS Code Agent

VS Code's documented marketplace mechanism is the `chat.plugins.marketplaces`
setting. A user can add `StatePort-Dev/stateport-agent-skills`, enable
`chat.plugins.enabled`, then find the package under `@agentPlugins` and review
the trust prompt before installation. For MCP, use the host's **MCP: Add
Server** flow with the installed Desktop's copied command and arguments;
choose the local user profile when Desktop runs locally. Do not copy the
synthetic test command. The package has no automatic MCP configuration.

VS Code `1.137.0` is present in the test environment, but an authenticated
Copilot Agent session and a usable StatePort Desktop were unavailable. No VS
Code plugin discovery,
Agent invocation, MCP connection, remote workspace, or VSIX result is claimed.
The independent [evaluation guide](../../tests/evaluations/README.md) defines
the real-host runs needed to change that status.
