import { homedir } from 'node:os';

const agents = { codex: 'Codex', claude: 'Claude Code', cursor: 'Cursor' };
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
  return value.setup?.status !== 'installed' || value.doctor?.browser?.status !== 'found';
}

const recovery = {
  INVALID_ARGUMENTS: ['That command is not recognised.', 'Run npx stateport --help to see the available commands.'],
  PLATFORM_UNSUPPORTED: ['This platform is not supported yet.', 'Use Windows x64, macOS Apple Silicon, or Linux x64.'],
  NODE_24_LTS_CANDIDATE_REQUIRED: ['StatePort needs Node.js 24.', ['Install Node.js 24: https://nodejs.org/en/download', 'Run npx stateport again.']],
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

export function createCliOutput({ json = false, stream = process.stdout, env = process.env, columns = stream.columns ?? 80 } = {}) {
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
  const check = (ok, label, detail) => line(`${ok ? '✓' : '!'} ${label.padEnd(13)} ${terminalText(detail)}`, ok ? '32' : '33');
  const next = (steps, title = 'Next') => { heading(title); steps.forEach((step, index) => line(`${index + 1}. ${step}`)); };
  const begin = () => { if (json || started) return; started = true; line(); line('StatePort', '1;31'); line('Reproduce a bug. Verify the fix.', '2'); };
  const footer = () => { line(); line('Capture is free. A Developer trial starts only when you choose it.', '2'); line(); };
  function installation(value, title) {
    const setup = value.setup ?? {}, result = setup.result ?? {}, agent = agents[setup.agent] ?? 'Coding agent';
    const configured = setup.status === 'installed', browser = value.doctor?.browser;
    const attention = installNeedsAttention(value);
    heading(title ?? (attention ? 'Installed — setup needs attention' : value.unchanged ? 'Already installed' : 'Installed'));
    check(true, 'Runtime', version(value.version) + (value.cache === 'verified_offline' ? ' · verified offline cache' : ' · verified'));
    check(browser?.status === 'found', 'Browser', browser?.status === 'found' ? `${browsers[browser.channel] ?? 'System browser'} · found` : 'not found');
    check(configured, 'Skills', configured ? `${version(result.version)} · ${result.unchanged ? 'up to date' : 'installed'}` : result.reason === 'CONFLICT' ? 'not updated · existing installation' : 'not configured');
    check(configured, setup.agent ? `${agent} MCP` : 'Agent', configured ? 'configured' : setup.agent ? 'not configured' : 'not selected');
    if (result.reason === 'CONFLICT') {
      heading(`${agent} connection needs attention`);
      line('Existing StatePort settings or skills conflict with this installation.');
      line('Your existing setup has been preserved.');
      if (setup.configuration?.path) line(`Review: ${homePath(setup.configuration.path)}`);
      next([`Review the existing StatePort installation in ${agent}.`, 'To switch, remove the old setup using its original installer.', 'After removal, run npx stateport again.']);
    } else if (result.reason === 'HOST_MISSING') {
      next([`Install or open ${agent} in this user account.`, `Run npx stateport install --agent ${setup.agent} again.`]);
    } else if (setup.status === 'guided_setup_required') {
      heading('Choose your coding agent');
      if (setup.reason === 'COPILOT_ADAPTER_REQUIRED') line('Copilot needs its documented MCP/skills setup.');
      else line('No supported coding agent was detected in this user account.');
      line('Run the command for the agent you use:');
      for (const [key, name] of Object.entries(agents)) { line(name); command(`npx stateport install --agent ${key}`); }
    } else if (!configured) {
      heading(`${agent} setup could not finish`);
      line(`Reason: ${terminalText(result.reason ?? 'SETUP_UNAVAILABLE')}`);
      if (setup.configuration?.path) line(`Review: ${homePath(setup.configuration.path)}`);
      next(['Review npx stateport doctor --json for diagnostics.', 'Resolve the reported issue, then run npx stateport again.']);
    } else if (browser?.status !== 'found') {
      next(['Install Google Chrome or Microsoft Edge on Windows.', 'Or run npx stateport browser-install to review the optional Chromium download.']);
    } else {
      next([setup.agent === 'cursor' ? 'Open Cursor and start a new chat.' : `Restart ${agent} and open a new chat.`, 'Give your agent the page URL and steps. For example:'], `Next in ${agent}`);
      line(); line('“Use StatePort to reproduce this bug: <URL and steps>.”', '36');
      line(); line('Your agent will ask for any permissions it needs.');
      if (setup.agent === 'cursor') line('If StatePort is not listed, restart Cursor to reload its tools.');
    }
    footer();
  }
  function doctor(value) {
    heading('Installation check'); check(Boolean(value.version), 'Runtime', version(value.version));
    check(value.browser?.status === 'found', 'Browser', value.browser?.status === 'found' ? `${browsers[value.browser.channel] ?? 'System browser'} · found` : 'not found');
    if (value.vault) check(['roundtrip_passed', 'available'].includes(value.vault.status), 'OS key store', terminalText(value.vault.status));
    line(); line('For full diagnostics: npx stateport doctor --json'); line();
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
      heading(title); next(Array.isArray(step) ? step : [step]); line(); line(`Error: ${code === 'NODE_24_LTS_CANDIDATE_REQUIRED' ? 'NODE_VERSION_UNSUPPORTED' : code}`, '2'); line(); return;
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
    if (json) { emit({ name: 'stateport', commands: ['install', 'doctor', 'update', 'updates', 'browser-install', 'rollback', 'uninstall', 'repair-launcher'], options: ['--json', '--help', '--version'] }); return; }
    begin(); heading('Get started'); line('npx stateport'); line('Install StatePort and connect your coding agent.');
    heading('Manage your installation');
    for (const [command, description] of [['install --agent cursor', 'Choose Cursor, codex or claude'], ['doctor', 'Check runtime and browser'], ['update', 'Check for an update'], ['updates status', 'Show update policy'], ['browser-install', 'Review optional Chromium download'], ['rollback', 'Restore the retained previous runtime'], ['uninstall', 'Remove unchanged owned agent setup'], ['repair-launcher --confirm', 'Repair the launcher; keep a backup']]) line(`npx stateport ${command}  — ${description}`);
    heading('Options'); line('--json     Machine-readable output for agents and scripts'); line('--offline  Use a verified installation without downloading'); line('--version  Show installer version'); line();
  } };
}

function updateMessage(status) {
  return ({ not_configured: 'No public update channel is configured for this build.', unavailable: 'The update check is unavailable. Existing installed work can continue.', not_installed: 'Run npx stateport first.', pinned: 'An exact version is pinned.', throttled: 'An update check ran recently.', up_to_date: 'You are up to date.', staged: 'An update is prepared for a new session.', pending_next_session: 'An update is prepared for a new session.', held: 'The update was not applied. Your current runtime is kept.', checked: 'Check complete. No update was selected.', update_available: 'An update is available for review.', retry_allowed: 'Retry is enabled for the selected version.', incompatible: 'This update needs reviewed setup.' })[status] ?? terminalText(status ?? 'No change');
}
