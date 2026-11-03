import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { updateFixture } from './update-fixture.mjs';
import { ensureLauncher } from '../lib/launcher.mjs';

test('stable loader is unchanged on repeat, refuses edits and repairs only explicitly while retaining backup', () => updateFixture(async f => {
  const trust = { status: 'unpublished' };
  const loader = await ensureLauncher(f.cache, trust), before = await readFile(loader);
  assert.equal(await ensureLauncher(f.cache, trust), loader);
  await writeFile(loader, 'my deliberate local edit');
  await assert.rejects(ensureLauncher(f.cache, trust), /LAUNCHER_REPAIR_REQUIRED/);
  await ensureLauncher(f.cache, trust, { repair: true });
  assert.deepEqual(await readFile(loader), before);
  const backups = (await readdir(f.cache)).filter(name => name.startsWith('.launcher-backup-'));
  assert.equal(backups.length, 1);
  assert.equal(await readFile(join(f.cache, backups[0], 'main.cjs'), 'utf8'), 'my deliberate local edit');
}));
