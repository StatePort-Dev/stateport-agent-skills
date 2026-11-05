import { manualEditorTools } from './agent-discovery.mjs';
import { homedir } from 'node:os';

const agents = { codex: 'Codex', claude: 'Claude Code', cursor: 'Cursor', vscode: 'VS Code / Copilot' };
const browsers = { chrome: 'Google Chrome', msedge: 'Microsoft Edge', chromium: 'Chromium' };
// Runtime/config strings are data, including when printed to a terminal.
export const terminalText = value => String(value ?? '').replace(/[\x00-\x1f\x7f-\x9f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, '').slice(0, 4096);
const size = bytes => Number.isSafeInteger(bytes) && bytes > 0 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : 'size unavailable';
const version = value => /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(value ?? '') ? value : 'unknown version';
const homePath = value => {
  const text = terminalText(value), home = homedir();
  return text.startsWith(home + '/') || text.startsWith(home + '\\') ? '~' + text.slice(home.length) : text;
};
export function installNeedsAttention(value) {
  const setup = value.setup ?? {};
  const results = setup.schemaVersion === 'agent-setup-batch/1' ? setup.results : [setup];
  return value.doctor?.browser?.status !== 'found' || (setup.status !== 'skipped' && (!results?.length || results.some(item => item.status !== 'installed' || item.result?.mcp !== 'ready')));
}

const recovery = {
  SETUP_CANCELLED: ['Setup cancelled. No agent configuration was changed.', 'Run npx stateport when you want to choose your agents.'],
  INVALID_ARGUMENTS: ['That command is not recognised.', 'Run npx stateport --help to see the available commands.'],
  PLATFORM_UNSUPPORTED: ['This platform is not supported yet.', 'Use Windows x64, macOS Apple Silicon, or Linux x64.'],
  NODE_24_LTS_CANDIDATE_REQUIRED: ['StatePort needs Node.js 24.', ['Install Node.js 24: https://nodejs.org/en/download', 'Run npx stateport again.']],
  RELEASE_REPLAY: ['The signed update channel is older than a version already verified here.', ['Keep the current runtime. Retry later, or run npx stateport install --offline to configure the verified cache.']],
  RELEASE_DOWNGRADE: ['This channel would downgrade the verified installed runtime.', ['Keep the current runtime. Retry later, or run npx stateport install --offline.']],
  RELEASE_VERSION_REPLACED: ['The channel changed the bytes of an existing version. Setup stopped.', ['Keep the current runtime and report this through https://stateport.dev/.']],
  RUNTIME_NOT_INSTALLED: ['StatePort is not installed yet.', 'Run npx stateport to install it.'],
  OFFLINE_CACHE_UNAVAILABLE: ['No verified offline installation was found.', 'Connect to the internet and run npx stateport once.'],
  PUBLIC_RUNTIME_RELEASE_UNPUBLISHED: ['This build has no public runtime configured.', 'Use the official npm package: npx stateport.'],
  PIN_RELEASE_REQUIRED: ['This installation is pinned to an exact version.', 'To allow changes, run npx stateport updates notify --release-pin.'],
  UPDATE_INCOMPATIBLE: ['This update needs a reviewed setup.', 'Run npx stateport to review the new installation; restart your coding agent afterwards.'],
  LAUNCHER_REPAIR_REQUIRED: ['The StatePort launcher needs repair.', 'Run npx stateport repair-launcher --confirm. Changed launcher files are backed up.'],
  RECOVERY_REQUIRED: ['An interrupted setup needs attention.', 'Keep the existing files. Review npx stateport doctor --json before trying again.'],
  INSTALL_BUSY: ['Another StatePort installation is in progress.', 'Let it finish, then run this command again.'],
  INSTALL_LOCKED: ['Another StatePort installation may still be running.', 'Let it finish before retrying. Do not delete an active installation lock.'],
  INSTALL_BUSY_OR_RECOVERY_REQUIRED: ['Another setup may be running or was interrupted.', 'Let any active setup finish. Keep the lock and existing files if recovery is needed.'],
  ROLLBACK_UNAVAILABLE: ['No previous runtime is available to restore.', 'Keep the current installation, or run npx stateport to review the published version.'],
  UPDATE_ROLLBACK_UNAVAILABLE: ['The previous runtime could not be verified.', 'Keep the current installation. Review npx stateport doctor --json.'],
  RELEASE_HTTP: ['The runtime download could not be completed.', 'Check your connection and try npx stateport again.'],
  RELEASE_REDIRECTS: ['The download destination could not be verified.', 'Try again later using npx stateport.'],
};

export function createCliOutput({ json = false, stream = process.stdout, env = process.env, columns = stream.columns ?? 80, installerVersion } = {}) {
  const color = Boolean(stream.isTTY && env.TERM !== 'dumb' && env.NO_COLOR === undefined);
  const paint = (code, text) => color ? `\x1b[${code}m${text}\x1b[0m` : text;
  const width = Math.max(24, Math.min(80, Number(columns) || 80)) - 4;
  let started = false;
  const line = (text = '', style) => {
    if (!text) { stream.write('\n'); return; }
    // Wrap before colouring; text is printable, never executable terminal markup.
    let remaining = terminalText(text);
    while (remaining.length > width) {
      let end = remaining.lastIndexOf(' ', width);
      if (end < Math.floor(width / 3)) end = width;
      const part = remaining.slice(0, end); stream.write('  ' + (style ? paint(style, part) : part) + '\n');
      remaining = remaining.slice(end).trimStart();
    }
    stream.write('  ' + (style ? paint(style, remaining) : remaining) + '\n');
  };
  const heading = text => { line(); line(text, '1'); };
  // Keep commands on one logical line; terminal soft wrapping stays copyable.
  const command = text => stream.write('  ' + paint('36', terminalText(text)) + '\n');
  const check = (ok, label, detail) => line(`${ok ? '✓' : '!'} ${label.padEnd(18)} ${terminalText(detail)}`, ok ? '32' : '33');
  const next = (steps, title = 'Next') => { heading(title); steps.forEach((step, index) => line(`${index + 1}. ${step}`)); };
  const notice = (level, scope, impact) => { heading(`${level} · ${scope}`); line(impact); };
  const begin = () => { if (json || started) return; started = true; line(); line('StatePort', '1;31'); line('Reproduce a bug. Verify the fix.', '2'); };
  const footer = () => { line(); line('Capture is free. A Developer trial starts only when you choose it.', '2'); line(); };
  function installation(value, title) {
    const root = value.setup ?? {}, batch = root.schemaVersion === 'agent-setup-batch/1';
    const results = batch ? root.results ?? [] : [root], browser = value.doctor?.browser;
    const ready = results.filter(item => item.status === 'installed' && item.result?.mcp === 'ready');
    const attention = installNeedsAttention(value), steps = [];
    heading(title ?? (root.status === 'skipped' ? 'Installed — agent setup skipped' : attention ? 'Installed — setup needs attention' : value.unchanged ? 'Already installed' : 'Installed'));
    check(true, 'Installer', version(value.installerVersion ?? installerVersion) + ' · npm package');
    check(true, 'Runtime', version(value.version) + (value.cache === 'verified_offline' ? ' · engine, verified offline' : ' · engine, verified'));
    check(browser?.status === 'found', 'Browser', browser?.status === 'found' ? `${browsers[browser.channel] ?? 'System browser'} · found` : 'not found');
    for (const setup of results) {
      const result = setup.result ?? {}, agent = agents[setup.agent] ?? 'Coding agent';
      const configured = setup.status === 'installed', connected = configured && result.mcp === 'ready';
      if (batch) check(connected, agent, configured ? `skills ${version(result.version)} · ${connected ? 'MCP launch checked' : 'connection not confirmed'}` : `not configured · ${terminalText(result.reason ?? 'SETUP_UNAVAILABLE')}`);
      else {
        check(configured, 'Skills', configured ? `${version(result.version)} · ${result.unchanged ? 'up to date' : 'installed'}` : result.reason === 'CONFLICT' ? 'not updated · existing installation' : 'not configured');
        check(connected, setup.agent ? `${agent} MCP` : 'Agent', connected ? 'configured · launch checked' : configured ? 'saved · connection not confirmed' : setup.agent ? 'not configured' : root.status === 'skipped' ? 'skipped by choice' : 'not selected');
      }
    }
    for (const setup of results) {
      const result = setup.result ?? {}, agent = agents[setup.agent] ?? 'Coding agent';
      const configured = setup.status === 'installed', connected = configured && result.mcp === 'ready';
      if (configured && result.migration?.status === 'applied') {
        notice('INFO', 'Codex migrated', 'StatePort now uses this Node runtime. Only its connection settings were migrated; plugin cache and pins were kept.');
        line('StatePort-only backup:'); command(`~/${terminalText(result.migration.backupFile)}`);
      }
      if (result.reason === 'CONFLICT') {
        notice('BLOCKING', `${agent} setup`, `This Node installation cannot connect to ${agent} yet. The runtime itself is installed.`);
        line('Your existing setup has been preserved.');
        const diagnostics = setup.diagnostics, issues = diagnostics?.issues ?? [];
        if (diagnostics?.configState === 'absent' && issues.some(i => i.code === 'DESKTOP_SKILLS_REMAIN')) line('The MCP entry is already removed; old skill files still block setup.');
        for (const issue of issues) {
          if (issue.code === 'DESKTOP_SKILLS_REMAIN') line(`${issue.files} unchanged Desktop skill files remain (${version(issue.version)}).`);
          else line(({ MULTIPLE_OWNED_SKILL_ROOTS: 'This runtime cannot combine Cursor with both Codex and Claude skill folders.', UNOWNED_OR_EDITED_SKILLS: 'Existing skill files are unowned or changed.', PREVIOUS_MCP_CONNECTION: 'The previous StatePort MCP connection still points to its old runtime.', MCP_ENTRY_CONFLICT: 'A different or edited StatePort MCP entry is still present.', MCP_DISABLED: 'StatePort was disabled in the agent settings.', LEGACY_MCP_ENTRY: 'A legacy scenariodeck MCP entry is still present.', MIGRATION_UPDATE_REQUIRED: 'This installed runtime predates automatic Codex migration. Update it before migrating.', CODEX_PLUGIN_ACTIVE: 'An enabled StatePort skills plugin belongs to the previous installation.', CODEX_PLUGIN_MANUAL: 'This StatePort plugin uses settings that cannot be migrated safely.', CODEX_PLUGIN_REGISTRY_UNKNOWN: 'A StatePort plugin registry exists without a known enabled/disabled setting.', CODEX_PLUGIN_UNKNOWN: 'The StatePort plugin configuration is custom; automatic migration is unavailable.', PLUGIN_INSTALL_PRESENT: 'A StatePort plugin installation is already present.', UNSAFE_SETUP_PATH: 'A linked or unsafe setup path cannot be used.', MCP_CONFIG_UNREADABLE: 'The MCP config cannot be read as a valid configuration.', OWNERSHIP_RECORD_UNREADABLE: 'The setup ownership record could not be read.' })[issue.code] ?? 'The setup path needs review.');
          line(`Path: ~/${terminalText(issue.path)}`);
          for (const folder of (issue.folders ?? []).slice(0, 12)) line(`  ~/${terminalText(folder)}`);
          if ((issue.folders?.length ?? 0) > 12) line('The complete folder list is in doctor --json.');
        }
        if (issues.some(i => i.code === 'MULTIPLE_OWNED_SKILL_ROOTS')) steps.push('To change unchanged owned connections, run npx stateport uninstall, then reinstall and choose Codex + Cursor or Claude Code + Cursor. Cards are retained.');
        if (!issues.length && setup.configuration?.path) line(`Review: ${homePath(setup.configuration.path)}`);
        if (issues.some(i => ['DESKTOP_SKILLS_REMAIN', 'UNOWNED_OR_EDITED_SKILLS'].includes(i.code))) steps.push('Review the listed skill folders. Move only the old StatePort copies to a backup outside every agent skills folder.');
        if (!diagnostics?.migrationAvailable && !issues.some(i=>i.code==='MIGRATION_UPDATE_REQUIRED') && issues.some(i => ['MCP_ENTRY_CONFLICT', 'LEGACY_MCP_ENTRY'].includes(i.code))) steps.push(setup.agent==='codex'&&!issues.some(i=>i.code==='LEGACY_MCP_ENTRY')?'If you want to replace this custom connection, run codex mcp remove stateport. This removes only its old server entry.':'To switch, remove only the old StatePort MCP entry from the listed config; keep other servers.');
        if (issues.some(i => i.code === 'MCP_DISABLED')) steps.push('If you want StatePort enabled, review its disabled setting in your agent.');
        if (issues.some(i => i.code === 'PLUGIN_INSTALL_PRESENT')) steps.push('Manage the existing StatePort plugin in the agent before adding a standalone installation.');
        if (issues.some(i => ['CODEX_PLUGIN_UNKNOWN','CODEX_PLUGIN_MANUAL','CODEX_PLUGIN_REGISTRY_UNKNOWN'].includes(i.code))) steps.push('Run codex plugin list. To replace a custom StatePort plugin, use codex plugin remove <plugin@marketplace> for that entry only; this uninstalls its old instructions and cache.');
        if (issues.some(i => i.code === 'UNSAFE_SETUP_PATH')) steps.push('Use your dotfile manager to configure the linked file, or replace the indicated link with a regular file before retrying. Do not remove unrelated files.');
        if (issues.some(i=>i.code==='MIGRATION_UPDATE_REQUIRED')) steps.push('Run npx stateport update, then npx stateport install --agent codex. If updates are pinned, choose a compatible release in your update policy first.');
        if (diagnostics?.migrationAvailable) { line('The installer can migrate this recognized connection and save a private StatePort-only backup.'); steps.push('Run npx stateport install --agent codex --migrate-codex to switch this connection to the Node runtime.'); }
        if (!steps.length) steps.push(`Inspect the exact blocker with npx stateport doctor --agent ${setup.agent ?? 'cursor'} --json.`);
        if (!diagnostics?.migrationAvailable) steps.push(`After resolving every listed blocker, run npx stateport install --agent ${setup.agent ?? 'cursor'} again.`);
      } else if (result.reason === 'RUNTIME_UPDATE_REQUIRED') {
        notice('BLOCKING', `${agent} setup`, `The installed runtime predates automatic ${agent} setup. This agent's settings were not changed.`);
        steps.push('Run npx stateport update, then install again. If updates are pinned, select a compatible release in your update policy first.');
      } else if (result.reason === 'HOST_MISSING') {
        notice('BLOCKING', `${agent} setup`, `${agent} was not found. The runtime is installed, but this agent is not connected.`);
        steps.push(`Install or open ${agent} in this user account.`, `Run npx stateport install --agent ${setup.agent} again.`);
      } else if (setup.status === 'skipped') {
        notice('INFO', 'Agent setup skipped', 'Runtime is installed. You chose not to configure an agent. Existing agent connections were kept.');
        steps.push('Run npx stateport install when you want to choose your agents.');
      } else if (setup.status === 'guided_setup_required') {
        notice('BLOCKING', 'Agent setup', 'The runtime is installed; no coding agent was configured.');
        if (setup.reason === 'COPILOT_ADAPTER_REQUIRED') line('Copilot needs its documented MCP/skills setup.');
        else if (setup.reason === 'AGENT_SELECTION_REQUIRED') line('Choose your agents. None were configured automatically.');
        else if (setup.reason === 'AGENT_DISCOVERY_UNAVAILABLE') line('Discovery could not finish. Choose the agents you have.');
        else line('No supported coding agent was detected in this user account.');
        line('In a terminal, run npx stateport to choose. For scripts, select explicitly:');
        command('npx stateport install --agents all');
        line('Or choose one agent:');
        for (const [key, name] of Object.entries(agents)) { line(name); command(`npx stateport install --agent ${key}`); }
        steps.push('Run the command above for your installed coding agent.');
      } else if (!configured) {
        notice('BLOCKING', `${agent} setup`, 'The runtime is installed; the agent setup did not finish.');
        line(`Reason: ${terminalText(result.reason ?? 'SETUP_UNAVAILABLE')}`);
        if (setup.configuration?.path) line(`Review: ${homePath(setup.configuration.path)}`);
        steps.push('Review npx stateport doctor --json for diagnostics.', 'Resolve the reported issue, then run npx stateport again.');
      }
      if (configured && !connected) {
        notice('WARNING', `${agent} connection`, 'Configuration was saved, but the connection is not confirmed. The launch check failed; do not assume the agent can use StatePort.');
        steps.push(`Open ${agent} and inspect its StatePort MCP connection status.`, 'If it fails, run npx stateport doctor --json and review the agent error.');
      }
    }
    if (browser?.status !== 'found') {
      notice('BLOCKING', 'Capture and replay', 'No supported browser was found. Runtime installation is complete; browser work is unavailable.');
      steps.push('Install Google Chrome (or Microsoft Edge on Windows), or review npx stateport browser-install.', 'Run npx stateport again after the browser is available.');
    }
    const manual = manualEditorTools(value.selection ? { ...value.selection, status: value.selection.discovery ?? 'ready' } : undefined);
    if (manual.length) {
      notice('INFO', 'Other tools found', manual.map(tool => tool.label).join(', ') + ': use the documented manual connection. This installer did not change their setup.');
      line('Connection guide:');
      command('https://github.com/StatePort-Dev/stateport-agent-skills/blob/main/AGENT_INSTALL.md');
    }
    if (batch && ready.length) { heading('Ready now: ' + ready.map(item => agents[item.agent]).join(', ')); line('Launch checks passed; open the host to confirm tool discovery.'); }
    if(/^\d+\.\d+\.\d+$/.test(value.version??'')&&value.updates?.channel==='rc'){
      notice('INFO','Update channel','Your previous RC channel setting was kept. The installed stable runtime is usable.');
      steps.push('For stable updates, run npx stateport updates channel stable --confirm. Your update mode and any pin are retained.');
    }
    footer();
    if (ready.length) {
      steps.push(ready.length === 1 ? `Open ${agents[ready[0].agent]} and start a new chat.` : 'Open any ready agent listed above and start a new chat.');
      if (ready.some(item => item.agent === 'vscode')) steps.push('VS Code: select Chat → Agent and approve StatePort if prompted. Sign in to Copilot if VS Code asks.');
      steps.push('Give it your task, or try one of these messages:');
    }
    else steps.push('Once an agent is connected, open it and start a new chat.');
    next([...new Set(steps)], 'How to Start');
    line(); line('Keep the browser setup in a State Card; reopen it to check your changes.');
    line(); line('Work on a task', '1');
    line('“Do this task: <your task>. Use StatePort when it helps.”', '36');
    line(); line('Explore StatePort', '1');
    line('“What can StatePort help me do in this project?”', '36');
    line(); line('Save a browser case', '1');
    line('“Save this browser bug as a State Card: <page URL and steps>.”', '36');
    line(); line('Your agent will ask for any permissions it needs.');
    if (ready.some(item => item.agent === 'cursor')) line('If StatePort is not listed, restart Cursor to reload its tools.');
    line();
  }
  function doctor(value) {
    heading('Installation check'); check(true, 'Installer', version(value.installerVersion ?? installerVersion) + ' · npm package'); check(Boolean(value.version), 'Runtime', version(value.version) + ' · engine');
    check(value.browser?.status === 'found', 'Browser', value.browser?.status === 'found' ? `${browsers[value.browser.channel] ?? 'System browser'} · found` : 'not found');
    if (value.vault) check(['roundtrip_passed', 'available'].includes(value.vault.status), 'OS key store', terminalText(value.vault.status));
    const diagnostic = value.setupDiagnostics;
    if (diagnostic?.issues?.length) {
      notice('BLOCKING', `${agents[diagnostic.agent] ?? 'Agent'} setup`, 'These existing paths prevent this agent from being configured.');
      for (const issue of diagnostic.issues) { line(`${terminalText(issue.code)}: ~/${terminalText(issue.path)}`); for (const folder of (issue.folders ?? []).slice(0,12)) line(`  ~/${terminalText(folder)}`); }
    } else if (diagnostic) notice('INFO', 'Read-only check', 'No known file conflicts were found. This does not confirm a live agent connection.');
    line(); line('For full diagnostics: npx stateport doctor --json');
    next(['Resolve any listed blockers, then run npx stateport.', 'Open your coding agent and start a new chat once setup is configured.'], 'How to Start'); line();
  }
  const emit = (value, kind = value.status) => {
    if (json) { stream.write(JSON.stringify(value) + '\n'); return; }
    begin();
    if (kind === 'candidate_installed') { installation(value); return; }
    if (kind === 'doctor') { doctor(value); return; }
    if (kind === 'downloading_verified_release') { line(); line(`↓ Downloading ${value.browser === 'pinned_chromium' ? 'optional Chromium runtime' : 'StatePort runtime'} · ${size(value.bytes)}`); return; }
    if (kind === 'installing_candidate') { line('Checking runtime and setting up your coding agent…', '2'); return; }
    if (kind === 'browser_download_required') {
      heading('Optional Chromium download'); line(`Download: ${size(value.bytes)}`);
      line('Your current browser selection is unchanged.');
      next(['Review the download size, then confirm its exact SHA-256:']);
      command(`npx stateport browser-install --confirm-download ${terminalText(value.sha256)}`); line(); return;
    }
    if (kind === 'blocked') {
      const code = terminalText(value.code);
      const fallback = /INTEGRITY|SIGNATURE|RELEASE_KEY|MANIFEST|ARCHIVE|INVENTORY/.test(code)
        ? ['The runtime could not be verified.', 'Try again later using the official npx stateport command.']
        : ['StatePort could not finish this command.', 'Run npx stateport doctor --json to inspect the installation.'];
      const [title, step] = recovery[code] ?? fallback;
      if (code === 'NODE_24_LTS_CANDIDATE_REQUIRED') {
        notice('BLOCKING', 'Node.js version', `StatePort needs Node.js 24. Detected: ${terminalText(value.detectedNode ?? 'unknown')}.`);
        line('No runtime or agent settings were changed.');
        next(['If you use nvm: nvm install 24', 'Activate it in this terminal: nvm use 24', 'Run npx stateport again.'], 'How to Start');
        line('Other Node installations: https://nodejs.org/en/download', '2');
        line(); line('Error: NODE_VERSION_UNSUPPORTED', '2'); line(); return;
      }
      notice(code === 'SETUP_CANCELLED' ? 'INFO' : 'BLOCKING', 'This command', title); next(Array.isArray(step) ? step : [step], 'How to Start'); line(); line(`Error: ${code === 'NODE_24_LTS_CANDIDATE_REQUIRED' ? 'NODE_VERSION_UNSUPPORTED' : code}`, '2'); line(); return;
    }
    if (kind === 'uninstalled') { heading('StatePort connection removed'); check(true, 'User data', 'Cards and protected data preserved'); line('Verified runtime cache is retained for active processes.'); next(['Run npx stateport whenever you want to connect again.']); line(); return; }
    if (kind === 'conflict') { heading('Uninstall stopped — existing setup needs review'); line('Edited or foreign settings were preserved.'); next(['Review the existing StatePort setup with its original installer.']); line(); return; }
    if (kind === 'launcher_repaired') { heading('Launcher repaired'); line('Changed launcher files were backed up. User data is preserved.'); next(['Restart your coding agent.']); line(); return; }
    if (kind === 'rolled_back') { installation({ ...value, version: value.runtime }, installNeedsAttention(value) ? 'Runtime restored — setup needs attention' : 'Previous runtime restored'); return; }
    if (kind === 'update_checked') {
      heading('Update check complete'); line(`Selected runtime: ${version(value.selected?.version)}`); line(updateMessage(value.outcome?.status));
      if (value.outcome?.status === 'held') next(['Review npx stateport updates status --json for the exact hold reason.']);
      else if (value.outcome?.status === 'pending_next_session') next(['Start a new agent session to use the selected runtime.']);
      line(); return;
    }
    if (kind === 'updates') {
      heading('Updates');
      if (value.mode) line(`Mode: ${({ notify: 'Notify · ask before updating', auto: 'Auto · compatible updates only', pinned: 'Pinned · exact version' })[value.mode] ?? terminalText(value.mode)}`);
      if (value.channel) line(`Channel: ${terminalText(value.channel)}`);
      if (value.selected?.version) line(`Selected: ${version(value.selected.version)}`);
      if (value.pending?.version) line(`Prepared: ${version(value.pending.version)} · for a new session`);
      if (value.hold) line(`Attention: ${terminalText(value.hold)}`);
      if (value.status) line(updateMessage(value.status));
      line(); line('Details: npx stateport updates status --json'); line(); return;
    }
    heading('Command complete'); line('Details are available with --json.'); line();
  };
  return { begin, emit, help: () => {
    if (json) { emit({ name: 'stateport', commands: ['install', 'doctor', 'update', 'updates', 'browser-install', 'rollback', 'uninstall', 'repair-launcher'], options: ['--json', '--help', '--version', '--no-telemetry'] }); return; }
    begin(); heading('Get started'); line('npx stateport'); line('Install StatePort and connect your coding agent.');
    heading('Manage your installation');
    for (const [command, description] of [['install', 'Choose coding agents; all found agents checked by default'], ['install --agents codex,cursor', 'Explicit choice for scripts; all or none also accepted'], ['install --agent codex --migrate-codex', 'Back up and migrate a recognized StatePort Codex connection'], ['doctor', 'Check runtime and browser'], ['doctor --agent cursor', 'Read-only setup conflict details'], ['update', 'Check for an update'], ['updates status', 'Show update policy'], ['browser-install', 'Review optional Chromium download'], ['rollback', 'Restore the retained previous runtime'], ['uninstall', 'Remove unchanged owned agent setup'], ['repair-launcher --confirm', 'Repair the launcher; keep a backup']]) line(`npx stateport ${command}  — ${description}`);
    heading('Options'); line('--json     Machine-readable output for agents and scripts'); line('--offline  Use a verified installation without downloading'); line('--version  Show installer version'); line('--no-telemetry  Disable anonymous installer metrics (also DO_NOT_TRACK=1)'); line();
  } };
}

function updateMessage(status) {
  return ({ not_configured: 'No public update channel is configured for this build.', unavailable: 'The update check is unavailable. Existing installed work can continue.', not_installed: 'Run npx stateport first.', pinned: 'An exact version is pinned.', throttled: 'An update check ran recently.', up_to_date: 'You are up to date.', staged: 'An update is prepared for a new session.', pending_next_session: 'An update is prepared for a new session.', held: 'The update was not applied. Your current runtime is kept.', checked: 'Check complete. No update was selected.', update_available: 'An update is available for review.', retry_allowed: 'Retry is enabled for the selected version.', incompatible: 'This update needs reviewed setup.' })[status] ?? terminalText(status ?? 'No change');
}
