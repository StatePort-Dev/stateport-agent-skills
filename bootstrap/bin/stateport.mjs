#!/usr/bin/env node
import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { installCandidate, readCurrent, withInstallTransaction } from '../lib/install.mjs';
import { installPublishedRelease } from '../lib/release.mjs';
import { readUpdatePolicy, setUpdatePolicy } from '../lib/update-policy.mjs';
import { updateStatus, checkForUpdates, selectSessionRuntime, rollbackGeneration,installCurrentPublishedRelease } from '../lib/updates.mjs';
import { updateControl } from '../lib/controls.mjs';
import { ensureLauncher } from '../lib/launcher.mjs';
import { createCliOutput, installNeedsAttention, installationReadiness } from '../lib/cli-output.mjs';
import { discoverAgentTools } from '../lib/agent-discovery.mjs';
import { chooseAgents, setupSelectedAgents, promptForAgents } from '../lib/agent-selection.mjs';
import { diagnoseSetupConflict } from '../lib/setup-diagnostics.mjs';
import { createInstallMetrics, installFailureBucket } from '../lib/install-metrics.mjs';

const rawArgs = process.argv.slice(2);
const cliContract=JSON.parse(await readFile(new URL('../cli-contract.json',import.meta.url),'utf8'));
const metadata = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const protocolCommands = new Set(['mcp', 'task-session', 'task-start', 'task-call', 'task-tools', 'task-close']);
const output = createCliOutput({ json: rawArgs.includes('--json') || protocolCommands.has(rawArgs.find(arg => !['--json', '--no-telemetry'].includes(arg))), installerVersion: metadata.version });
const write = (value, kind) => output.emit(value, kind);
let installMetrics;

function beginInstallMetrics(release, { command, selection, current, policy, consentUpdates, offline, source }) {
  const agents = selection?.status === 'required' || !selection ? 'required'
    : ['codex', 'claude', 'cursor', 'vscode'].filter(id => selection.agents.includes(id)).join('_') || 'none';
  installMetrics = createInstallMetrics({
    installer_version: metadata.version, runtime_version: release.version,
    platform: ({ linux: 'linux', win32: 'windows', darwin: 'macos' })[process.platform],
    architecture: process.arch, node_major: Number(process.versions.node.split('.')[0]),
    operation: command === 'browser-install' ? 'browser_install' : command,
    installation: current ? 'existing' : 'fresh', agents,
    browser_preference: command === 'browser-install' || current?.browserPreference === 'pinned' ? 'pinned' : 'system',
    update_policy: consentUpdates ? 'auto' : policy.mode,
  }, { published: metadata.private === false && release.status === 'published' && !source,
    disabled: rawArgs.includes('--no-telemetry'), offline });
}

function cacheRoot() {
  const configured = process.platform === 'win32' ? process.env.LOCALAPPDATA : process.platform === 'linux' ? process.env.XDG_DATA_HOME : undefined;
  const base = configured && isAbsolute(configured) ? configured
    : process.platform === 'win32' ? join(homedir(), 'AppData', 'Local')
      : process.platform === 'darwin' ? join(homedir(), 'Library', 'Caches') : join(homedir(), '.local', 'share');
  return join(base, 'StatePort', 'agent-runtime');
}
async function run(runtime, args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runtime.entry, ...args], { stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', windowsHide: true });
    let output = ''; let size = 0;
    child.stdout?.on('data', chunk => { size += chunk.length; if (size > 1024 * 1024) child.kill(); else output += chunk; });
    // No captured native/backend error strings enter bootstrap diagnostics.
    child.stderr?.resume();
    child.once('error', () => reject(Error('RUNTIME_UNAVAILABLE')));
    child.once('close', code => {
      if (code !== 0) { reject(Error('RUNTIME_FAILED')); return; }
      if (!capture) { resolve(undefined); return; }
      try { resolve(JSON.parse(output)); } catch { reject(Error('RUNTIME_REPLY_INVALID')); }
    });
  });
}
async function selectAgents(explicit) {
  if (!rawArgs.includes('--json') && process.stdin.isTTY && process.stdout.isTTY) output.begin();
  return chooseAgents({ discovery: await discoverAgentTools({ home: homedir(), platform: process.platform, env: process.env }), explicit, interactive: !rawArgs.includes('--json') && Boolean(process.stdin.isTTY && process.stdout.isTTY) });
}
async function configureAgents(runtime, cache, selection, migrateCodex = false, setupCapabilities) {
  return setupSelectedAgents(selection, async selected => {
    const targets=setupCapabilities?.schemaVersion===1?setupCapabilities.targets:['codex','claude','cursor'];
    if(!Array.isArray(targets)||!targets.includes(selected))return {status:'failed',agent:selected,result:{status:'failed',reason:'RUNTIME_UPDATE_REQUIRED'}};
    let outcome = await run(runtime, ['setup', '--agent', selected], true);
    if (outcome.agent !== selected || !['installed', 'failed'].includes(outcome.status)) throw Error('RUNTIME_REPLY_INVALID');
    const canMigrate=outcome.capabilities?.schemaVersion===1&&outcome.capabilities?.codexMigration===true;
    if(migrateCodex&&selected==='codex'&&canMigrate&&outcome.result?.reason==='CONFLICT')outcome=await run(runtime,['setup','--agent','codex','--migrate-codex'],true);
    if (outcome.result?.reason === 'CONFLICT') outcome.diagnostics = await diagnoseSetupConflict({ home: homedir(), cache, agent: selected });
    if(outcome.diagnostics?.migrationAvailable&&!canMigrate){outcome.diagnostics.migrationAvailable=false;outcome.diagnostics.issues.push({code:'MIGRATION_UPDATE_REQUIRED',path:'StatePort runtime',severity:'blocking',scope:selected});}
    if(selected==='codex'&&outcome.diagnostics?.migrationAvailable&&!rawArgs.includes('--json')&&process.stdin.isTTY&&process.stdout.isTTY&&!migrateCodex){
      process.stdout.write('\n  Codex: existing StatePort plugin / Desktop connection found.\n  Switch to this Node runtime? This disables only the old StatePort skills plugin,\n  replaces its generated MCP entry and saves a private StatePort-only backup.\n  Plugin cache, pins, other servers and tool permissions are preserved.\n');
      const answer=await promptForAgents({query:'  Migrate StatePort in Codex? [y/N]: '});
      if(/^y(?:es)?$/i.test(answer.trim()))outcome=await run(runtime,['setup','--agent','codex','--migrate-codex'],true);
    }
    if (outcome.agent !== selected || !['installed', 'failed'].includes(outcome.status)) throw Error('RUNTIME_REPLY_INVALID');
    return outcome;
  });
}
let installPhase='prerequisites';
async function main() {
  const args = rawArgs.filter(arg => !['--json', '--no-telemetry'].includes(arg));
  if (['--json', '--no-telemetry'].some(flag => rawArgs.filter(arg => arg === flag).length > 1)) throw Error('INVALID_ARGUMENTS');
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { output.help(); return; }
  if (args.length === 1 && ['--version', '-v'].includes(args[0])) {
    if (rawArgs.includes('--json')) write({ version: metadata.version }); else process.stdout.write(metadata.version + '\n');
    return;
  }
  if (Number(process.versions.node.split('.')[0]) !== 24) throw Error('NODE_24_LTS_CANDIDATE_REQUIRED');
  if (!((process.platform === 'linux' || process.platform === 'win32') && process.arch === 'x64') && !(process.platform === 'darwin' && process.arch === 'arm64')) throw Error('PLATFORM_UNSUPPORTED');
  const commands = new Set(cliContract.commands.map(command=>command.name));
  if (args[0] && !args[0].startsWith('--') && !commands.has(args[0])) throw Error('INVALID_ARGUMENTS');
  const command = commands.has(args[0]) ? args.shift() : 'install';
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { output.help(); return; }
  const cache = cacheRoot();
  const trust = JSON.parse(await readFile(new URL('../update-release.json', import.meta.url), 'utf8'));
  if (command === 'repair-launcher') {
    if (args.length !== 1 || args[0] !== '--confirm') throw Error('INVALID_ARGUMENTS');
    const runtime = await readCurrent(cache);
    if (runtime?.generation?.launcher !== 1) throw Error('LAUNCHER_REPAIR_UNSUPPORTED');
    write({ status: 'launcher_repaired', launcher: await ensureLauncher(cache, trust, { repair: true }), userData: 'preserved', editedLoader: 'backed_up_if_changed' }); return;
  }
  if (command === 'updates') { write(await updateControl(cache, trust, args), 'updates'); return; }
  if (['doctor', 'open', 'access', 'mcp', 'task-session', 'task-start', 'task-call', 'task-tools', 'task-close'].includes(command)) {
    const runtime = await readCurrent(cache);
    if (!runtime && command !== 'doctor') throw Error('RUNTIME_NOT_INSTALLED');
    if (runtime) installPhase='start';
    if (command === 'doctor') {
      let selected;
      if (args.length) {
        if (args.length !== 2 || args[0] !== '--agent' || !['cursor', 'codex', 'claude', 'vscode'].includes(args[1])) throw Error('INVALID_ARGUMENTS');
        selected = args[1];
      }
      if(!runtime){write({status:'blocked',code:'RUNTIME_NOT_INSTALLED',diagnostics:{schemaVersion:'agent-install-failure/1',phase:'prerequisites',runtimeInstalled:false},installerVersion:metadata.version,prerequisites:{node:'24.x',npm:true,platform:`${process.platform}-${process.arch}`,network:['npm','GitHub'],browser:'optional_for_source'},nextAction:'npx stateport'},'doctor');process.exitCode=1;return;}
      const report = { ...await run(runtime, ['doctor'], true), installerVersion: metadata.version };
      if (selected) report.setupDiagnostics = await diagnoseSetupConflict({ home: homedir(), cache, agent: selected });
      write(report, 'doctor'); return;
    }
    if (runtime.generation) {
      // Stable loader performs safe next-session resolution. Read-only and
      // existing task-call/close commands never trigger update checks.
      const loader = join(cache, 'launcher', 'main.cjs');
      await run({ entry: loader }, [command, ...args]); return;
    }
    await run(runtime, [command, ...args]); return;
  }
  if (command === 'uninstall') {
    if (args.length) throw Error('INVALID_ARGUMENTS');
    await withInstallTransaction(cache, async transaction => {
      const runtime = await transaction.current();
      if (runtime) {
        const setup = await run(runtime, ['remove-agent-setup'], true);
        if (setup.status !== 'removed') { write({ status: 'conflict', setup, userData: 'preserved' }); process.exitCode = 1; return; }
      }
      write(await transaction.uninstall());
    }); return;
  }
  if (command === 'rollback') {
    if (args.length && !(args.length === 2 && ['--agent', '--agents'].includes(args[0]))) throw Error('INVALID_ARGUMENTS');
    if (args.length && (!/^(?:all|none|(?:codex|claude|cursor|vscode)(?:,(?:codex|claude|cursor|vscode)){0,3})$/.test(args[1]) || new Set(args[1].split(',')).size !== args[1].split(',').length || (args[0] === '--agent' && !['codex', 'claude', 'cursor', 'vscode'].includes(args[1])))) throw Error('INVALID_ARGUMENTS');
    const policy = await readUpdatePolicy(cache);
    if (policy.mode === 'pinned') throw Error('PIN_RELEASE_REQUIRED');
    const runtime = await rollbackGeneration(cache);
    const selection = await selectAgents(args[1]);
    const doctor=await run(runtime,['doctor'],true);
    const result = { status: 'rolled_back', runtime: runtime.productVersion, doctor, selection, setup: await configureAgents(runtime, cache, selection,false,doctor.capabilities?.agentSetup), hostDiscovered: 'unverified' };
    write(result); if (installNeedsAttention(result)) process.exitCode = 1; return;
  }
  let source, manifestSha256, agent, offline = false, confirmDownload, consentUpdates = false, migrateCodex = false;
  while (args.length) {
    const option = args.shift();
    if (option === '--offline' && !offline) { offline = true; continue; }
    if (option === '--consent-updates' && !consentUpdates) { consentUpdates = true; continue; }
    if (option === '--migrate-codex' && !migrateCodex) { migrateCodex = true; continue; }
    const value = args.shift();
    if (!value) throw Error('INVALID_ARGUMENTS');
    if (option === '--candidate-dir' && !source) source = value;
    else if (option === '--manifest-sha256' && !manifestSha256) manifestSha256 = value;
    else if (option === '--agent' && !agent && ['codex', 'claude', 'cursor', 'vscode'].includes(value)) agent = value;
    else if (option === '--agents' && !agent && /^(?:all|none|(?:codex|claude|cursor|vscode)(?:,(?:codex|claude|cursor|vscode)){0,3})$/.test(value)) agent = value;
    else if (option === '--confirm-download' && !confirmDownload && /^[a-f0-9]{64}$/.test(value)) confirmDownload = value;
    else throw Error('INVALID_ARGUMENTS');
  }
  if ((source && !manifestSha256) || (!source && manifestSha256) || (source && offline)) throw Error('INVALID_ARGUMENTS');
  if(migrateCodex&&(agent!=='codex'||command!=='install'))throw Error('INVALID_ARGUMENTS');
  let runtime, selection;
  const policy = await readUpdatePolicy(cache);
  if (policy.mode === 'pinned' && (command === 'update' || command === 'browser-install' || (manifestSha256 && manifestSha256 !== policy.pin.digest))) throw Error('PIN_RELEASE_REQUIRED');
  if (command === 'update' && !source && !offline && trust.status === 'published') {
    const release = JSON.parse(await readFile(new URL('../release.json', import.meta.url), 'utf8'));
    beginInstallMetrics(release, { command, current: await readCurrent(cache), policy, offline, source });
    const outcome = await checkForUpdates(cache, trust, { force: true, manual: true, confirmDownload });
    const selected = await selectSessionRuntime(cache, trust, { manual: true });
    write({ status: 'update_checked', outcome, selected: { version: selected.productVersion, digest: selected.digest }, updates: await updateStatus(cache) });
    // A checked/held/offered update is not a completed installation.
    await installMetrics.finish('install_deferred'); return;
  }
  if (command !== 'browser-install') {installPhase='agent_setup';selection = await selectAgents(agent);}
  if (offline) {
    runtime = await readCurrent(cache); if (!runtime) throw Error('OFFLINE_CACHE_UNAVAILABLE');
    runtime = { ...runtime, unchanged: true };
  } else if (!source) {
    const release = JSON.parse(await readFile(new URL('../release.json', import.meta.url), 'utf8'));
    if (release.status === 'unpublished') throw Error('PUBLIC_RUNTIME_RELEASE_UNPUBLISHED');
    const current = await readCurrent(cache);
    const resolved=({version})=>{if(!installMetrics)beginInstallMetrics({...release,version}, { command, selection, current, policy, consentUpdates, offline, source });};
    const options={onPhase:phase=>{installPhase=phase;},browserPreference: command === 'browser-install' || current?.browserPreference === 'pinned' ? 'pinned' : 'system',confirmDownload,onDownload:info=>write({status:'downloading_verified_release',...info})};
    if(trust.status==='published'&&(trust.channel==='stable'||trust.channels?.stable)){
      try{runtime=await installCurrentPublishedRelease(cache,trust,{...options,minimumVersion:release.version,onResolved:resolved});}
      catch(error){resolved(release);throw error;}
    }else{resolved(release);runtime=await installPublishedRelease(release,cache,fetch,options);}
    if (runtime.status === 'browser_download_required') { write(runtime); await installMetrics.finish('install_deferred'); return; }
  }
  selection ??= await selectAgents(agent);
  write({ status: 'installing_candidate', permissions: ['copy verified runtime to user-owned versioned cache', 'configure unchanged owned agent skills/MCP'], trial: 'not_started' });
  if(!runtime){installPhase='verification';runtime=await installCandidate({source,cache,manifestSha256});}
  // Persist a quiet Notify default; repeat setup never changes existing policy.
  if (consentUpdates) await setUpdatePolicy(cache, { mode: 'auto', consent: true });
  else {
    const { atomicJson } = await import('../lib/install.mjs');
    await withInstallTransaction(cache, async () => atomicJson(cache, 'update-policy.json', await readUpdatePolicy(cache)));
  }
  const launcher = runtime.generation ? await ensureLauncher(cache, trust) : undefined;
  installPhase='start';
  const doctor = await run(runtime, ['doctor'], true);
  installPhase='agent_setup';
  const setup = await configureAgents(runtime, cache, selection, migrateCodex,doctor.capabilities?.agentSetup);
  const release = JSON.parse(await readFile(new URL('../release.json', import.meta.url), 'utf8'));
  const result = { status: 'candidate_installed', installerVersion: metadata.version, version: runtime.productVersion, unchanged: runtime.unchanged, doctor, selection, setup,
    cache: offline ? 'verified_offline' : 'verified', hostDiscovered: 'unverified', updates: { mode: (await readUpdatePolicy(cache)).mode, channel:(await readUpdatePolicy(cache)).channel, delivery: 'candidate', launcher }, currentTask: {
      command: process.execPath, args: [launcher ?? runtime.entry, 'task-session'], selection: 'verified_at_new_session_start', protocol: 'agent-task-session/1',
      version: runtime.productVersion, digest: runtime.digest, generation: runtime.generation,
      ...(doctor.capabilities?.sourceOnly===true?{sourceOnly:{scope:doctor.capabilities.sourceScope,instruction:'For an originally authorized source-only coding task, this exact source scope needs no Card, browser origin, Capture or trial. Keep the original project. List the exact tools after ready. Use source review/observations and prepare_first_use_message only when advertised and a useful accepted result exists; never fabricate browser scope.'}}:{}),
      input: 'The installed version below is an offer; the ready frame binds the selected runtime at new-session start. Keep this host execution session and stdin open. First JSON line has project, scope, optional deadlineMs. Example for an originally authorized fix task: {"project":"/absolute/original/project","scope":{"userRequestedTask":true,"intent":"fix_verify","sourceOrigins":["http://127.0.0.1:3000"],"frontendOrigins":["http://127.0.0.1:3001"],"stateCardIds":[]},"deadlineMs":600000}. Replace project/origins/Card IDs from the original user task; installation grants no scope. Then JSON lines: operation tools; operation call with requestId/name/arguments; operation close.',
      permissions: 'Use normal host approval for this exact runtime command when required. Installation does not grant browser, project or task permissions.',
    }, published: !source && release.status === 'published' && (runtime.publicDeliveryVerified===true||(!trust.channels?.stable&&trust.channel!=='stable'&&release.version===runtime.productVersion)) };
  result.readiness=installationReadiness(result);
  write(result);
  if (installNeedsAttention(result)) process.exitCode = 1;
  await installMetrics?.finish(installNeedsAttention(result) ? 'install_needs_attention' : 'install_completed', installNeedsAttention(result) ? 'configuration' : 'none');
}
void main().catch(async error => {
  const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : 'INSTALL_FAILED';
  const installed=await readCurrent(cacheRoot()).then(value=>Boolean(value)).catch(()=>null);
  write({ status: 'blocked', code, diagnostics:{schemaVersion:'agent-install-failure/1',phase:installPhase,runtimeInstalled:installed}, ...(code.startsWith('NODE_') ? {nodePrerequisite:'https://nodejs.org/en/download', detectedNode:process.versions.node, requiredNode:'24.x'} : {}) });
  process.exitCode = code === 'SETUP_CANCELLED' ? 130 : 1;
  await installMetrics?.finish('install_failed', installFailureBucket(error));
});
