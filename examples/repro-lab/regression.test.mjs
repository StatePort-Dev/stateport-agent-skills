import test from 'node:test';
import assert from 'node:assert/strict';
import { decision } from './public/decision.mjs';

test('a reviewer cannot allocate credits when the API says zero remain', () => {
  const result = decision('reviewer', 10, { remaining: 0, defaultLimit: 100 });
  assert.equal(result.available, 0, 'zero is a valid quota, not a missing quota');
  assert.equal(result.allowed, false);
});
