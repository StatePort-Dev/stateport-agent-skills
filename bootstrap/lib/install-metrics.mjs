// Closed installer-only schema. Never pass argv, discovery, doctor, environment,
// setup results or native exception strings into a network envelope.
const endpoint = 'https://licensing.stateport.dev/v1/install-events';
const release = value => typeof value === 'string' && /^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-(?:rc|beta)\.\d{1,6})?$/.test(value);
const dimensions = {
  platform: ['linux', 'windows', 'macos'], architecture: ['x64', 'arm64'],
  operation: ['install', 'update', 'browser_install'], installation: ['fresh', 'existing'],
  agents: ['none', 'required', 'codex', 'claude', 'cursor', 'codex_claude', 'codex_cursor', 'claude_cursor', 'codex_claude_cursor'],
  browser_preference: ['system', 'pinned'], update_policy: ['notify', 'auto', 'pinned'],
};
const buckets = ['configuration', 'network', 'verification', 'unsupported', 'unknown'];
const terminals = ['install_completed', 'install_needs_attention', 'install_failed', 'install_deferred'];

function safeContext(input) {
  if (!release(input.installer_version) || !release(input.runtime_version) || input.node_major !== 24) return;
  const safe = { installer_version: input.installer_version, runtime_version: input.runtime_version, node_major: input.node_major };
  for (const [name, allowed] of Object.entries(dimensions)) {
    if (!allowed.includes(input[name])) return;
    safe[name] = input[name];
  }
  if (!((safe.platform === 'macos' && safe.architecture === 'arm64') || (safe.platform !== 'macos' && safe.architecture === 'x64'))) return;
  return safe;
}

export function installFailureBucket(error) {
  const code = error instanceof Error ? error.message : '';
  if (['RELEASE_HTTP', 'RELEASE_REDIRECTS'].includes(code) || (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name))) return 'network';
  if (/^(?:RELEASE_[A-Z_]+|ARCHIVE_[A-Z_]+|MANIFEST_[A-Z_]+|INVENTORY_[A-Z_]+|INSTALL_INTEGRITY)$/.test(code)) return 'verification';
  if (/^(?:DOWNLOAD_[A-Z_]+|NETWORK_[A-Z_]+)$/.test(code)) return 'network';
  if (['PLATFORM_UNSUPPORTED', 'NODE_24_LTS_CANDIDATE_REQUIRED'].includes(code)) return 'unsupported';
  if (['RUNTIME_FAILED', 'RUNTIME_UNAVAILABLE', 'RUNTIME_REPLY_INVALID', 'INSTALL_LOCKED', 'PIN_RELEASE_REQUIRED'].includes(code)) return 'configuration';
  return 'unknown';
}

export function createInstallMetrics(input, {
  published = false, disabled = false, offline = false, env = process.env,
  fetcher = globalThis.fetch, timeoutMs = 800,
} = {}) {
  const context = safeContext(input);
  const automated = Boolean(env.NODE_TEST_CONTEXT) || (Boolean(env.CI) && !['false', '0'].includes(String(env.CI).toLowerCase()));
  const enabled = published && !disabled && !offline && context
    && env.DO_NOT_TRACK !== '1' && env.STATEPORT_TELEMETRY_DISABLED !== '1'
    && !automated;
  let finished = false;
  async function send(event_name, result_bucket) {
    if (!enabled) return;
    const controller = new AbortController();
    let timer;
    try {
      // The independent deadline also handles a transport ignoring AbortSignal.
      await Promise.race([
        Promise.resolve().then(() => fetcher(endpoint, {
          method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'StatePortInstaller/1' },
          body: JSON.stringify({ schema_version: 1, ...context, event_name, result_bucket }),
          signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store',
        })).then(response => { void response?.body?.cancel().catch(() => {}); }),
        new Promise(resolve => { timer = setTimeout(resolve, timeoutMs); }),
      ]);
    } catch { /* No response bodies or transport errors enter installer output. */ }
    finally { clearTimeout(timer); controller.abort(); }
  }
  const started = send('install_started', 'none');
  return {
    async finish(event, bucket = 'none') {
      if (finished || !terminals.includes(event)) return;
      if (event === 'install_failed' ? !buckets.includes(bucket)
        : event === 'install_needs_attention' ? bucket !== 'configuration' : bucket !== 'none') return;
      finished = true;
      await started;
      await send(event, bucket);
    },
  };
}
