const path = require('node:path');
const { pathToFileURL } = require('node:url');

const setting = 'desktopLaunch';
const desktopParser = pathToFileURL(path.join(__dirname, 'scripts/desktop-mcp-config.mjs')).href;

async function parseDesktopConfig(text) {
  const parser = await import(desktopParser);
  return parser.parseDesktopConfig(text);
}

function exactIdentifier(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 256 &&
    /^[A-Za-z0-9][A-Za-z0-9._:/@#-]*$/.test(value);
}

function activate(context, host = require('vscode')) {
  const changed = new host.EventEmitter();
  context.subscriptions.push(changed);

  context.subscriptions.push(host.lm.registerMcpServerDefinitionProvider('stateport.mcp', {
    onDidChangeMcpServerDefinitions: changed.event,
    provideMcpServerDefinitions: async () => {
      const stored = context.globalState.get(setting);
      if (!stored) return [];
      let launch;
      try { launch = await parseDesktopConfig(JSON.stringify({ mcpServers: { stateport: stored } })); }
      catch { return []; }
      return [new host.McpStdioServerDefinition('StatePort', launch.command, launch.args)];
    },
    resolveMcpServerDefinition: server => server
  }));

  context.subscriptions.push(host.commands.registerCommand('stateport.configureMcp', async () => {
    const raw = await host.window.showInputBox({
      title: 'StatePort Desktop MCP configuration',
      prompt: 'Paste the installed Desktop Copy MCP config JSON. No executable is launched during setup.',
      ignoreFocusOut: true
    });
    if (raw === undefined) return;
    let launch;
    try { launch = await parseDesktopConfig(raw); }
    catch (error) { await host.window.showErrorMessage(error.message); return; }
    const existing = context.globalState.get(setting);
    if (existing) {
      if (JSON.stringify(existing) === JSON.stringify(launch)) {
        await host.window.showInformationMessage('The same StatePort Desktop MCP entry is already configured in this extension.');
      } else {
        await host.window.showErrorMessage('A different StatePort entry is already configured. Remove it with the extension command before replacing it.');
      }
      return;
    }
    const accepted = await host.window.showWarningMessage(
      'This adds one local StatePort MCP source for this extension. Remove any separate StatePort MCP or skill install first to avoid duplicate agent tools.',
      { modal: true }, 'Configure'
    );
    if (accepted !== 'Configure') return;
    await context.globalState.update(setting, launch);
    changed.fire();
    await host.window.showInformationMessage('StatePort MCP source configured. Check its connection in MCP: List Servers; a runtime handshake has not run yet.');
  }));

  context.subscriptions.push(host.commands.registerCommand('stateport.disconnectMcp', async () => {
    if (context.globalState.get(setting) === undefined) return;
    await context.globalState.update(setting, undefined);
    changed.fire();
    await host.window.showInformationMessage('StatePort MCP source removed from this extension. Other MCP configuration was not changed.');
  }));

  context.subscriptions.push(host.commands.registerCommand('stateport.copyCardHandoff', async () => {
    const card = await host.window.showInputBox({ title: 'Exact StatePort Card ID', ignoreFocusOut: true });
    if (card === undefined) return;
    if (!exactIdentifier(card)) { await host.window.showErrorMessage('Enter an exact Card ID using letters, digits, and . _ : / @ # - only.'); return; }
    const revision = await host.window.showInputBox({ title: 'Exact StatePort Card revision', ignoreFocusOut: true });
    if (revision === undefined) return;
    if (!exactIdentifier(revision)) { await host.window.showErrorMessage('Enter an exact Card revision using letters, digits, and . _ : / @ # - only.'); return; }
    await host.env.clipboard.writeText(`Use StatePort Card \`${card}\` at exact revision \`${revision}\`. Inspect that Card first, open it on the current code, then reopen the same Card/revision and compare evidence after the change. Do not start a new Capture for this supplied Card. Confirm the identity and results through the public StatePort MCP tools.`);
    await host.window.showInformationMessage('Exact Card handoff copied for review and pasting into your agent. The Card was not inspected by this command.');
  }));
}

module.exports = { activate };
