import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { updateFixture } from './update-fixture.mjs';
import { sha } from './update-fixture.mjs';
import { installCandidate } from '../lib/install.mjs';
const exec = promisify(execFile);
const entry = fileURLToPath(new URL('../bin/stateport.mjs', import.meta.url));

test('CLI update status is read-only; Auto requires consent and Notify remains the non-interactive default', () => updateFixture(async f => {
  const env = { ...process.env, HOME: f.root, XDG_DATA_HOME: join(f.root, 'data'), LOCALAPPDATA: join(f.root, 'data') };
  delete env.NODE_TEST_CONTEXT;
  const run = async args => JSON.parse((await exec(process.execPath, [entry, ...args, '--json'], { env })).stdout);
  assert.equal((await run(['updates', 'status'])).mode, 'notify');
  await assert.rejects(run(['updates', 'auto']));
  assert.equal((await run(['updates', 'auto', '--consent'])).mode, 'auto');
  assert.equal((await run(['updates', 'notify'])).mode, 'notify');
  const trust = JSON.parse(await readFile(new URL('../update-release.json', import.meta.url), 'utf8'));
  assert.equal((await run(['updates', 'check'])).status, trust.status === 'published' ? 'not_installed' : 'not_configured');
}));
test('new bootstrap never selects an unqualified legacy rollback as an automatic safe previous generation', () => updateFixture(async f => {
  const data = join(f.root, 'data');
  const cache = process.platform === 'darwin' ? join(f.root, 'Library/Caches/StatePort/agent-runtime') : join(data, 'StatePort/agent-runtime');
  const raw = JSON.parse(await readFile(join(f.source, 'candidate.json'), 'utf8')); delete raw.generation;
  for (const version of ['1.0.0-rc.3', '1.0.0-rc.4']) {
    raw.productVersion = version; const bytes = JSON.stringify(raw);
    await writeFile(join(f.source, 'candidate.json'), bytes);
    await installCandidate({ source: f.source, cache, manifestSha256: sha(bytes) });
  }
  const before = await readFile(join(cache, 'current.json'));
  const env = { ...process.env, HOME: f.root, USERPROFILE: f.root, XDG_DATA_HOME: data, LOCALAPPDATA: data }; delete env.NODE_TEST_CONTEXT;
  await assert.rejects(exec(process.execPath, [entry, 'rollback', '--json'], { env }), error => JSON.parse(error.stdout).code === 'UPDATE_INCOMPATIBLE');
  assert.deepEqual(await readFile(join(cache, 'current.json')), before);
}));

test('fresh install returns the stable first-task launcher so CLI use participates in Auto', () => updateFixture(async f => {
  const env = { ...process.env, HOME: f.root, XDG_DATA_HOME: join(f.root, 'data') }; delete env.NODE_TEST_CONTEXT;
  const output = await exec(process.execPath, [entry, 'install', '--candidate-dir', f.source, '--manifest-sha256', f.installed.digest, '--json'], { env });
  const result = JSON.parse(output.stdout.trim().split('\n').at(-1));
  assert.equal(result.currentTask.args[0], result.updates.launcher);
  assert.equal(result.currentTask.selection, 'verified_at_new_session_start');
}));
