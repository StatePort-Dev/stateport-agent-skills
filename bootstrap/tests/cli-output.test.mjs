import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { updateFixture, sha } from './update-fixture.mjs';
import { createCliOutput } from '../lib/cli-output.mjs';

const exec = promisify(execFile);
const entry = fileURLToPath(new URL('../bin/stateport.mjs', import.meta.url));
async function scenario(setup, run) {
  return updateFixture(async f => {
    const doctor = { version: '1.0.0-rc.3', host: { status: 'candidate' }, browser: { status: 'found', channel: 'chrome' } };
    const body = `const replies=${JSON.stringify({ doctor, setup, 'update-readiness': { version: '1.0.0-rc.3', status: 'ready', execution: 'allowed', generation: f.generation } })};process.stdout.write(JSON.stringify(process.argv[2]==='setup'&&replies.setup?.agent?{...replies.setup,agent:process.argv[4]}:replies[process.argv[2]]??{})+'\\n');`;
    await writeFile(join(f.source, 'main.cjs'), body);
    const manifest = JSON.parse(await readFile(join(f.source, 'candidate.json'), 'utf8'));
    manifest.files[0] = { path: 'main.cjs', bytes: Buffer.byteLength(body), sha256: sha(body) };
    const bytes = JSON.stringify(manifest); await writeFile(join(f.source, 'candidate.json'), bytes);
    const env = { ...process.env, HOME: f.root, USERPROFILE: f.root, XDG_DATA_HOME: join(f.root, 'data'), LOCALAPPDATA: join(f.root, 'data'), NO_COLOR: '1' };
    delete env.NODE_TEST_CONTEXT; delete env.FORCE_COLOR;
    const invoke = async args => {
      try { return { ...(await exec(process.execPath, [entry, ...args], { env })), code: 0 }; }
      catch (error) { if (typeof error.code !== 'number') throw error; return { stdout: error.stdout, stderr: error.stderr, code: error.code }; }
    };
    await run({ invoke, root: f.root, install: ['install', '--agent', 'cursor', '--candidate-dir', f.source, '--manifest-sha256', sha(bytes)] });
  });
}
const success = { status: 'installed', agent: 'cursor', result: { status: 'installed', version: '0.1.0-beta.82', mcp: 'ready', unchanged: false }, configuration: { scope: 'user', path: '/synthetic/home/.cursor/mcp.json', serverName: 'stateport' } };

test('ordinary install shows a component checklist and a concrete next agent request, without protocol JSON', () => scenario(success, async ({ invoke, install }) => {
  const r = await invoke(install);
  assert.equal(r.code, 0, r.stderr);
  for (const text of ['StatePort', 'Installer', 'Runtime', 'Google Chrome', 'Skills', 'Cursor', 'How to Start', 'new chat', 'Use StatePort']) assert(r.stdout.includes(text), text);
  assert(!/candidate_installed|currentTask|agent-task-session|nativeAcceptance|published|"status"|\x1b/.test(r.stdout), r.stdout);
  assert.equal(r.stderr, '');
}));

test('repeat and offline installation explain what is already installed', () => scenario(success, async ({ invoke, install }) => {
  assert.equal((await invoke(install)).code, 0);
  const repeat = await invoke(install); assert.equal(repeat.code, 0); assert.match(repeat.stdout, /already installed/i);
  const offline = await invoke(['install', '--agent', 'cursor', '--offline']); assert.equal(offline.code, 0); assert.match(offline.stdout, /offline/i); assert.match(offline.stdout, /already installed/i);
}));

test('Cursor conflict is partial setup, preserves existing installation and gives safe recovery', () => scenario({ ...success, status: 'failed', result: { status: 'failed', reason: 'CONFLICT' } }, async ({ invoke, install }) => {
  const r = await invoke(install);
  assert.equal(r.code, 1);
  assert.match(r.stdout, /Runtime.*1\.0\.0-rc\.3/);
  assert.match(r.stdout, /Skills.*not (?:updated|configured)/i);
  assert.match(r.stdout, /Cursor.*not configured/i);
  assert.match(r.stdout, /existing.*preserved/i);
  assert.match(r.stdout, /BLOCKING/);
  assert.match(r.stdout, /\.cursor\/mcp\.json/);
  assert(!/ready to use|installation complete/i.test(r.stdout));
}));

test('explicit JSON retains task-session contract and failure semantics', () => scenario({ ...success, status: 'failed', result: { status: 'failed', reason: 'CONFLICT' } }, async ({ invoke, install }) => {
  const r = await invoke([...install, '--json']); assert.equal(r.code, 1);
  const rows = r.stdout.trim().split('\n').map(line => JSON.parse(line));
  const last = rows.at(-1); assert.equal(last.setup.result.reason, 'CONFLICT');
  assert.equal(last.currentTask.protocol, 'agent-task-session/1'); assert.equal(last.published, false);
  assert(!r.stdout.includes('\x1b')); assert.equal(r.stderr, '');
}));

test('no detected agent is an explicit incomplete checklist and offers supported agent commands', () => scenario({ status: 'guided_setup_required', detected: [] }, async ({ invoke, install }) => {
  const r = await invoke(install.filter((_,i)=>i!==1&&i!==2)); assert.equal(r.code, 1);
  assert.match(r.stdout, /Skills.*not configured/i); assert.match(r.stdout, /agent.*not selected/i);
  assert.match(r.stdout, /npx stateport install --agent codex/);
  assert.match(r.stdout, /--agent claude/); assert.match(r.stdout, /--agent cursor/);
}));

test('help and version do not install anything, unknown commands fail with useful help', () => scenario(success, async ({ invoke, root }) => {
  const help = await invoke(['--help']); assert.equal(help.code, 0); assert.match(help.stdout, /--json/);
  const version = await invoke(['--version']); assert.equal(version.code, 0); assert.match(version.stdout, /^\d+\.\d+\.\d+/);
  await assert.rejects(access(join(root, 'data')));
  const typo = await invoke(['instlal']); assert.equal(typo.code, 1); assert.match(typo.stdout + typo.stderr, /help/);
}));

test('MCP failure remains machine-only without requiring --json', () => scenario(success, async ({ invoke }) => {
  const r = await invoke(['mcp']); assert.equal(r.code, 1);
  assert.equal(JSON.parse(r.stdout).code, 'RUNTIME_NOT_INSTALLED'); assert.equal(r.stderr, '');
}));

test('doctor and management status have readable defaults and explicit JSON', () => scenario(success, async ({ invoke, install }) => {
  await invoke(install);
  const doctor = await invoke(['doctor']); assert.equal(doctor.code, 0); assert.match(doctor.stdout, /Installation check/);
  const data = JSON.parse((await invoke(['doctor', '--json'])).stdout); assert.equal(data.browser.channel, 'chrome');
  const updates = await invoke(['updates', 'status']); assert.equal(updates.code, 0); assert.match(updates.stdout, /Notify/); assert(!updates.stdout.includes('{'));
  assert.equal(JSON.parse((await invoke(['updates', 'status', '--json'])).stdout).mode, 'notify');
}));

function rendered(value, options = {}) {
  let text = '';
  const output = createCliOutput({ stream: { isTTY: options.tty ?? false, write: chunk => { text += chunk; } }, env: options.env ?? {}, columns: options.columns ?? 80 });
  output.emit(value); return text;
}
test('terminal output blocks control-sequence injection and respects NO_COLOR', () => {
  const value = { status: 'candidate_installed', version: '1.0.0-rc.5', doctor: { browser: { status: 'found', channel: 'chrome' } }, setup: { ...success, status: 'failed', result: { reason: 'CONFLICT' }, configuration: { path: '/safe/\x1b]52;c;SECRET\x07\nconfig.json' } } };
  const plain = rendered(value); assert(!/[\x00-\x1f\x7f-\x9f]/.test(plain.replaceAll('\n', '')));
  assert(!rendered(value, { tty: true, env: { NO_COLOR: '', TERM: 'xterm' } }).includes('\x1b'));
  assert(rendered(value, { tty: true, env: { TERM: 'xterm' } }).includes('\x1b['));
});

test('MCP probe warning explains impact and does not claim a ready connection', () => scenario({ ...success, result: { ...success.result, mcp: 'unavailable' } }, async ({ invoke, install }) => {
  const r=await invoke(install);assert.equal(r.code,1);assert.match(r.stdout,/WARNING/);assert.match(r.stdout,/connection.*not (?:confirmed|verified)/i);assert.match(r.stdout,/How to Start/);
}));

test('optional large browser consent stays explicit and its command survives narrow terminals', () => {
  const digest = 'a'.repeat(64), command = `npx stateport browser-install --confirm-download ${digest}`;
  const text = rendered({ status: 'browser_download_required', bytes: 190107363, sha256: digest }, { columns: 48 });
  assert.match(text, /181\.3 MB/); assert(text.includes(command + '\n'));
  assert.match(text, /unchanged/); assert.match(text, /Optional Chromium/);
});

test('prerequisite, download, signature and lock failures offer one safe next action', () => {
  for (const [code, expected] of [['NODE_24_LTS_CANDIDATE_REQUIRED', 'Node.js 24'], ['PLATFORM_UNSUPPORTED', 'not supported'], ['RELEASE_HTTP', 'connection'], ['RELEASE_SIGNATURE', 'could not be verified'], ['INSTALL_BUSY_OR_RECOVERY_REQUIRED', 'Keep the lock']]) {
    const text = rendered({ status: 'blocked', code }); assert(text.includes(expected), code); assert.match(text, /How to Start/); assert(!text.includes('"status"'));
  }
});

test('uninstall, repair, rollback and held updates never imply unproved setup success', () => {
  assert.match(rendered({ status: 'uninstalled' }), /Cards and protected data preserved/);
  assert.match(rendered({ status: 'launcher_repaired' }), /backed up/);
  const rollback = rendered({ status: 'rolled_back', runtime: '1.0.0-rc.4', doctor: { browser: { status: 'found', channel: 'chrome' } }, setup: { ...success, status: 'failed', result: { reason: 'CONFLICT' } } });
  assert.match(rollback, /setup needs attention/); assert.match(rollback, /Cursor MCP.*not configured/);
  const held = rendered({ status: 'update_checked', selected: { version: '1.0.0-rc.5' }, outcome: { status: 'held' } });
  assert.match(held, /not applied/); assert(!held.includes('Restart'));
});

test('orphaned Desktop skills give exact paths and conditional How to Start rather than repeating a failed uninstall',()=>{
  const text=rendered({status:'candidate_installed',version:'1.0.0-rc.5',installerVersion:'1.0.0-rc.7',doctor:{browser:{status:'found',channel:'chrome'}},setup:{...success,status:'failed',result:{reason:'CONFLICT'},diagnostics:{configState:'absent',issues:[{code:'DESKTOP_SKILLS_REMAIN',path:'.agents/skills',files:196,version:'0.1.0-beta.78',folders:['.agents/skills/stateport-debugging']}]}}});
  assert.match(text,/Installer.*1\.0\.0-rc\.7/);assert.match(text,/Runtime.*1\.0\.0-rc\.5/);assert.match(text,/196/);assert.match(text,/MCP entry.*(?:removed|gone)/i);assert.match(text,/\.agents\/skills\/stateport-debugging/);assert.match(text,/BLOCKING.*Cursor/);assert(text.lastIndexOf('How to Start')>text.indexOf('BLOCKING'));assert(!text.includes('original installer'));
});

test('How to Start offers ordinary work, capability discovery and a reusable browser case',()=>{
 const text=rendered({status:'candidate_installed',version:'1.0.0-rc.5',doctor:{browser:{status:'found',channel:'chrome'}},setup:success});
 for(const phrase of ['Work on a task','Do this task:','Use StatePort when it helps','Explore StatePort','What can StatePort help me do','Save a browser case','State Card','check your changes'])assert(text.includes(phrase),phrase);
 assert(!text.includes('<URL and steps>'));
});
test('multiple selected agents retain separate outcomes and actionable ready versus blocked guidance',()=>{
 const results=[{...success,agent:'codex'},{...success,agent:'claude',status:'failed',result:{status:'failed',reason:'CONFLICT'}}];
 const text=rendered({status:'candidate_installed',version:'1.0.0-rc.5',doctor:{browser:{status:'found',channel:'chrome'}},setup:{schemaVersion:'agent-setup-batch/1',status:'partial',results}});
 assert.match(text,/Codex.*MCP launch checked/);assert.match(text,/Claude Code.*not configured/);assert.match(text,/BLOCKING.*Claude Code/);assert.match(text,/Ready now: Codex/);assert.match(text,/How to Start/);
});

test('real CLI without a non-TTY selection installs runtime only and returns the same-chat descriptor',()=>scenario(success,async({invoke,install})=>{
 const args=install.filter((_,i)=>i!==1&&i!==2);
 const r=await invoke([...args,'--json']);assert.equal(r.code,1);const result=JSON.parse(r.stdout.trim().split('\n').at(-1));
 assert.equal(result.selection.status,'required');assert.equal(result.setup.reason,'AGENT_SELECTION_REQUIRED');assert.equal(result.currentTask.protocol,'agent-task-session/1');
 assert(!r.stdout.includes('Selection ['));assert(!r.stdout.includes('“'));
}));
test('real CLI accepts a batch choice and explicit none without claiming a missing connection',()=>scenario(success,async({invoke,install})=>{
 const args=install.filter((_,i)=>i!==1&&i!==2);
 const batch=await invoke([...args,'--agents','codex,cursor','--json']);assert.equal(batch.code,0,batch.stdout);
 const report=JSON.parse(batch.stdout.trim().split('\n').at(-1));assert.equal(report.setup.schemaVersion,'agent-setup-batch/1');assert.deepEqual(report.setup.results.map(r=>r.agent),['codex','cursor']);
 const none=await invoke([...args,'--agents','none']);assert.equal(none.code,0);assert.match(none.stdout,/skipped by choice/);assert.match(none.stdout,/INFO/);assert(!none.stdout.includes('BLOCKING'));
 const duplicate=await invoke([...args,'--agents','cursor,cursor']);assert.equal(duplicate.code,1);
}));

test('rollback respects runtime-only choice and rejects duplicate agents before changing the pointer',()=>scenario(success,async({invoke,install,root})=>{
 assert.equal((await invoke(install)).code,0);
 const source=install[install.indexOf('--candidate-dir')+1],manifest=JSON.parse(await readFile(join(source,'candidate.json'),'utf8'));
 manifest.productVersion='1.0.0-rc.4';const bytes=JSON.stringify(manifest);await writeFile(join(source,'candidate.json'),bytes);
 const next=[...install];next[next.indexOf('--manifest-sha256')+1]=sha(bytes);assert.equal((await invoke(next)).code,0);
 const cache=process.platform==='darwin'?join(root,'Library/Caches/StatePort/agent-runtime'):join(root,'data/StatePort/agent-runtime');
 const pointer=await readFile(join(cache,'current.json'));
 const invalid=await invoke(['rollback','--agents','cursor,cursor','--json']);assert.equal(invalid.code,1);assert.equal(JSON.parse(invalid.stdout).code,'INVALID_ARGUMENTS');assert.deepEqual(await readFile(join(cache,'current.json')),pointer);
 const result=await invoke(['rollback','--agents','none','--json']);assert.equal(result.code,0,result.stdout);const report=JSON.parse(result.stdout);assert.equal(report.runtime,'1.0.0-rc.3');assert.equal(report.setup.status,'skipped');assert.equal(report.selection.method,'explicit');
}));
