import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { updateFixture, sha } from './update-fixture.mjs';
const exec = promisify(execFile);

async function scenario(run) {
  return updateFixture(async f => {
    const bootstrap = join(f.root, 'bootstrap');
    await mkdir(join(bootstrap, 'bin'), { recursive: true });
    await cp(new URL('../lib', import.meta.url), join(bootstrap, 'lib'), { recursive: true });
    await cp(new URL('../bin/stateport.mjs', import.meta.url), join(bootstrap, 'bin/stateport.mjs'));
    await cp(new URL('../update-release.json', import.meta.url), join(bootstrap, 'update-release.json'));
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
    pkg.private = false; pkg.version = '1.0.0-rc.9';
    await writeFile(join(bootstrap, 'package.json'), JSON.stringify(pkg));
    const key = generateKeyPairSync('ed25519');
    const payload = Buffer.from(JSON.stringify({ schemaVersion: 'agent-runtime-release/1', version: '1.0.0-rc.4',
      assets: [['linux', 'x64'], ['win32', 'x64'], ['darwin', 'arm64']].map(([platform, arch]) => ({ platform, arch, ...f.b.asset, browserFallback: f.b.asset })) }));
    const releaseUrl = 'https://github.com/StatePort-Dev/stateport-releases/releases/download/fixture/release.json';
    const envelope = { keyId: 'fixture', payload: payload.toString('base64'), signature: sign(null, payload, key.privateKey).toString('base64') };
    await writeFile(join(bootstrap, 'release.json'), JSON.stringify({ status: 'published', version: '1.0.0-rc.4', url: releaseUrl,
      keyId: 'fixture', publicKey: key.publicKey.export({ type: 'spki', format: 'pem' }), manifestSha256: sha(payload) }));
    const log = join(f.root, 'events.jsonl'), preload = join(f.root, 'transport.mjs');
    await writeFile(log, '');
    // The real CLI/verifier/installer runs against signed synthetic artifacts.
    // This test-only preload replaces fetch; no real service is contacted.
    await writeFile(preload, `import {appendFile} from 'node:fs/promises';
globalThis.fetch=async(url,init)=>{
 if(url==='https://licensing.stateport.dev/v1/install-events'){
  await appendFile(${JSON.stringify(log)},init.body+'\\n');return new Response(null,{status:204});
 }
 if(process.env.METRICS_TEST_DOWNLOAD_FAILURE==='1')throw Error('https://customer.example SECRET');
 if(url===${JSON.stringify(releaseUrl)})return new Response(${JSON.stringify(JSON.stringify(envelope))});
 if(url===${JSON.stringify(f.b.asset.url)})return new Response(Buffer.from(${JSON.stringify(f.b.archive.toString('base64'))},'base64'));
 throw Error('UNEXPECTED_TEST_NETWORK');
};`);
    const env = { ...process.env, HOME: f.root, USERPROFILE: f.root, XDG_DATA_HOME: join(f.root, 'data'), LOCALAPPDATA: join(f.root, 'data'), NODE_OPTIONS: `--import=${JSON.stringify(preload)}` };
    for (const name of ['NODE_TEST_CONTEXT', 'CI', 'DO_NOT_TRACK', 'STATEPORT_TELEMETRY_DISABLED']) delete env[name];
    const invoke = async (args, extra = {}) => {
      await writeFile(log, '');
      let result;
      try { result = { ...await exec(process.execPath, [join(bootstrap, 'bin/stateport.mjs'), ...args], { env: { ...env, ...extra } }), code: 0 }; }
      catch (error) { if (typeof error.code !== 'number') throw error; result = { stdout: error.stdout, stderr: error.stderr, code: error.code }; }
      return { ...result, events: (await readFile(log, 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line)) };
    };
    await run({ invoke });
  });
}

test('real published CLI reports silent start/completion, cached repeat, attention and download failure', () => scenario(async ({ invoke }) => {
  const first = await invoke(['install', '--agents', 'none', '--json']);
  assert.equal(first.code, 0, first.stderr);
  assert.deepEqual(first.events.map(e => [e.event_name, e.installation]), [['install_started', 'fresh'], ['install_completed', 'fresh']]);
  assert(!/telemetry|metrics/i.test(first.stdout + first.stderr));
  assert.equal(first.events[0].agents, 'none');
  const repeat = await invoke(['install', '--agents', 'none', '--json']);
  assert.equal(repeat.code, 0, repeat.stderr);
  assert(repeat.events.every(e => e.installation === 'existing'));
  const partial = await invoke(['install', '--agent', 'cursor', '--json']);
  assert.equal(partial.code, 1);
  assert.equal(partial.events.at(-1).event_name, 'install_needs_attention');
  const failure = await invoke(['install', '--agents', 'none', '--json'], { METRICS_TEST_DOWNLOAD_FAILURE: '1' });
  assert.equal(failure.code, 1);
  assert.equal(failure.events.at(-1).event_name, 'install_failed');
  assert(!JSON.stringify(failure.events).includes('SECRET'));
}));

test('real CLI opt-out, offline and read-only commands emit no events', () => scenario(async ({ invoke }) => {
  for (const [args, env] of [
    [['install', '--agents', 'none', '--json', '--no-telemetry'], {}],
    [['install', '--agents', 'none', '--json'], { DO_NOT_TRACK: '1' }],
    [['install', '--agents', 'none', '--json'], { STATEPORT_TELEMETRY_DISABLED: '1' }],
    [['install', '--agents', 'none', '--json', '--offline'], {}],
    [['--help'], {}], [['--version'], {}], [['doctor', '--json'], {}],
  ]) {
    const result = await invoke(args, env);
    assert.equal(result.code, 0, result.stderr);
    assert.deepEqual(result.events, [], args.join(' '));
  }
}));
