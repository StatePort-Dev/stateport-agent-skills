import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { updateFixture } from './update-fixture.mjs';
const exec = promisify(execFile);
const entry = fileURLToPath(new URL('../bin/stateport.mjs', import.meta.url));

test('CLI update status is read-only; Auto requires consent and Notify remains the non-interactive default', () => updateFixture(async f => {
  const env = { ...process.env, HOME: f.root, XDG_DATA_HOME: join(f.root, 'data'), LOCALAPPDATA: join(f.root, 'data') };
  delete env.NODE_TEST_CONTEXT;
  const run = async args => JSON.parse((await exec(process.execPath, [entry, ...args], { env })).stdout);
  assert.equal((await run(['updates', 'status'])).mode, 'notify');
  await assert.rejects(run(['updates', 'auto']));
  assert.equal((await run(['updates', 'auto', '--consent'])).mode, 'auto');
  assert.equal((await run(['updates', 'notify'])).mode, 'notify');
  assert.equal((await run(['updates', 'check'])).status, 'not_configured');
}));
