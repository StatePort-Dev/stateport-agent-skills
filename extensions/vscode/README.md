# StatePort Debugging for VS Code — source candidate

This thin VSIX contributes the generated canonical `stateport-debugging` skill
to VS Code and offers opt-in local MCP setup. It does not include StatePort
Desktop or claim that an agent has completed a StatePort workflow.

For a local source build, run `node scripts/generate-codex-plugin.mjs` and
`npm run verify` at the repository root. Install the official
`@vscode/vsce@3.9.2` packaging tool into a temporary directory, then run
`vsce package --no-dependencies --out /tmp/stateport-vscode-0.1.0-alpha.0.vsix`
from this extension directory. No packaging dependency is added to the source
package. Review the VSIX contents before sideloading.

Install the reviewed VSIX with **Extensions: Install from VSIX**. In the Command
Palette, run **StatePort: Configure Desktop MCP** and paste the installed
Desktop's **Copy MCP config** JSON. Review the source and remove any separately
installed StatePort agent plugin, standalone skill, or MCP entry first to avoid
duplicate behavior. The extension accepts only the Desktop-shaped `stateport`
stdio command and arguments; it never runs the command during configuration.

Use **MCP: List Servers** to inspect/start the server and check the actual
connection. **StatePort: Copy Exact Card Handoff** prepares a prompt containing
an identifier and revision supplied by you. The command accepts only letters,
digits, `.`, `_`, `:`, `/`, `@`, `#` and `-` in each value; unsupported identifiers
need a manual handoff. It does not inspect the Card; the
agent must do that through public MCP. **StatePort: Remove Extension MCP
Connection** removes only this extension's saved launch configuration. Uninstall
the VSIX separately via Extensions.

The extension runs locally (`extensionKind: ui`). A remote Desktop/extension
host path is not supported by this source candidate. The manifest's
`stateport-dev` publisher ID is provisional for sideload packaging; Marketplace
publisher ownership and submission are not established.

The same VSIX can be sideloaded with Cursor's **Install from VSIX** flow. Its
CLI accepted the package on Cursor `3.7.27`, but loading the skill and the MCP
provider in Cursor has not yet been verified. Cursor Agent Plugin installation
is a separate path and must not be inferred from VSIX sideloading.

The source package and local host checks are recorded in the repository's
compatibility documentation. A VSIX install is not evidence of agent
invocation, MCP handshake, Capture, or a successful bug fix.
