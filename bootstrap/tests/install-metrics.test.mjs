import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInstallMetrics, installFailureBucket } from '../lib/install-metrics.mjs';

const context = {
  installer_version: '1.0.0-rc.9', runtime_version: '1.0.0-rc.5',
  platform: 'linux', architecture: 'x64', node_major: 24, operation: 'install',
  installation: 'fresh', agents: 'codex_cursor', browser_preference: 'system', update_policy: 'notify',
};
const options = { published: true, env: {}, timeoutMs: 40 };

test('sends one start and one terminal to the fixed first-party endpoint without adjacent private data', async () => {
  const requests = [];
  const metrics = createInstallMetrics({ ...context, argv: ['--secret', 'SECRET'], home: '/home/alice', project: 'private' }, {
    ...options, fetcher: async (url, init) => { requests.push({ url, init }); return new Response(null, { status: 204 }); },
  });
  await metrics.finish('install_completed');
  await metrics.finish('install_failed', 'unknown');
  assert.equal(requests.length, 2);
  for (const { url, init } of requests) {
    assert.equal(url, 'https://licensing.stateport.dev/v1/install-events');
    assert.equal(init.redirect, 'error');
    assert.equal(init.credentials, 'omit');
    assert.deepEqual(Object.keys(init.headers), ['content-type', 'user-agent']);
    const body = JSON.parse(init.body);
    assert.deepEqual(body, { schema_version: 1, ...context, event_name: body.event_name, result_bucket: 'none' });
    assert(!/SECRET|alice|private|argv|project|home/.test(init.body));
  }
  assert.deepEqual(requests.map(r => JSON.parse(r.init.body).event_name), ['install_started', 'install_completed']);
});

test('opt-out, offline, candidate and automated contexts make no metric request', async () => {
  for (const changes of [{ disabled: true }, { offline: true }, { published: false },
    { env: { DO_NOT_TRACK: '1' } }, { env: { STATEPORT_TELEMETRY_DISABLED: '1' } },
    { env: { CI: 'true' } }, { env: { CI: '1' } }, { env: { CI: 'yes' } }, { env: { CI: 'TRUE' } }, { env: { NODE_TEST_CONTEXT: 'child-v8' } }]) {
    let count = 0;
    await createInstallMetrics(context, { ...options, ...changes, fetcher: async () => { count++; } }).finish('install_completed');
    assert.equal(count, 0, JSON.stringify(changes));
  }
});

test('invalid dimensions cannot send arbitrary strings; terminal schema cannot be expanded', async () => {
  for (const [key, value] of [['installer_version', 'https://secret.example'], ['runtime_version', 'user@example.com'],
    ['node_major', '/home/alice'], ['agents', 'private-project'], ['platform', 'my-hostname'], ['update_policy', 'secret']]) {
    let count = 0;
    await createInstallMetrics({ ...context, [key]: value }, { ...options, fetcher: async () => { count++; } }).finish('install_completed');
    assert.equal(count, 0);
  }
  const requests = [];
  const metrics = createInstallMetrics(context, { ...options, fetcher: async (_url, init) => { requests.push(JSON.parse(init.body)); return new Response(null, { status: 204 }); } });
  await metrics.finish('SECRET', '/home/alice');
  await metrics.finish('install_failed', 'SECRET');
  assert.equal(requests.length, 1);
});

test('errors and a fetch implementation that ignores abort cannot hang or fail installation', async () => {
  for (const fetcher of [async () => { throw Error('SECRET https://customer.example'); }, async () => new Promise(() => {})]) {
    const before = Date.now();
    await createInstallMetrics(context, { ...options, fetcher }).finish('install_failed', 'unknown');
    assert(Date.now() - before < 500);
  }
});

test('only closed error buckets leave the installer', () => {
  assert.equal(installFailureBucket(Error('RELEASE_SIGNATURE')), 'verification');
  assert.equal(installFailureBucket(Error('PLATFORM_UNSUPPORTED')), 'unsupported');
  assert.equal(installFailureBucket(Error('DOWNLOAD_TIMEOUT')), 'network');
  assert.equal(installFailureBucket(Error('RUNTIME_FAILED')), 'configuration');
  assert.equal(installFailureBucket(Error('https://customer.example Bearer SECRET')), 'unknown');
});
