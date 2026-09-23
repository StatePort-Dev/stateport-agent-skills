import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../examples/repro-lab/server.mjs';
import { decision } from '../examples/repro-lab/public/decision.mjs';

test('review decisions distinguish role, input, missing quota, and normal quota', () => {
  assert.equal(decision('member', 10, { remaining: 100, defaultLimit: 100 }).allowed, false);
  for (const amount of [0, -1, NaN, Infinity]) {
    assert.equal(decision('reviewer', amount, { remaining: 100, defaultLimit: 100 }).allowed, false);
  }
  assert.equal(decision('reviewer', 10, { remaining: 100, defaultLimit: 100 }).allowed, true);
  assert.equal(decision('reviewer', 101, { remaining: 100, defaultLimit: 100 }).allowed, false);
  assert.equal(decision('reviewer', 10, { remaining: null, defaultLimit: 100 }).allowed, true);
});

test('localhost fixture serves deterministic API data and only explicit public files', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [scenario, remaining] of [['normal', 100], ['exhausted', 0], ['missing', null]]) {
    const response = await fetch(`${base}/api/quota?scenario=${scenario}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { remaining, defaultLimit: 100 });
  }
  assert.equal((await fetch(`${base}/api/quota?scenario=unknown`)).status, 400);
  const page = await fetch(base);
  assert.match(page.headers.get('content-type'), /text\/html/);
  assert.match(await page.text(), /Reproduction Lab/);
  assert.match(await (await fetch(`${base}/decision.mjs`)).text(), /export function decision/);
  assert.equal((await fetch(`${base}/server.mjs`)).status, 404);
  assert.equal((await fetch(`${base}/api/quota`, { method: 'POST' })).status, 405);
});
