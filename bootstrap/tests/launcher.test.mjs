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
test('automatic stable metadata migration cannot replace a key, foreign URL, edited loader or extra file',async()=>{
 for(const change of ['key','url','code','extra'])await updateFixture(async f=>{
  const prefix='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/';
  const old={schemaVersion:'agent-update-trust/1',status:'published',publisher:'StatePort-Dev',channel:'rc',url:prefix+'rc.json',keyId:f.trust.keyId,publicKey:f.trust.publicKey};
  const next={...old,channel:'stable',url:prefix+'stable.json',channels:{stable:prefix+'stable.json',rc:prefix+'rc.json'}};
  await ensureLauncher(f.cache,old);
  if(change==='key')next.keyId='different-key';
  if(change==='url')next.url='https://example.test/stable.json';
  if(change==='code')await writeFile(join(f.cache,'launcher/lib/install.mjs'),'custom local code');
  if(change==='extra')await writeFile(join(f.cache,'launcher/private.env'),'SYNTHETIC_PRIVATE_VALUE');
  await assert.rejects(ensureLauncher(f.cache,next),/LAUNCHER_REPAIR_REQUIRED/);
  assert.deepEqual(JSON.parse(await readFile(join(f.cache,'launcher/release.json'),'utf8')),old);
  assert.equal((await readdir(f.cache)).filter(n=>n.startsWith('.launcher-backup-')).length,0);
 });
});
test('unchanged owned RC launcher adopts the same-key official stable catalog without asking for repair',()=>updateFixture(async f=>{
 const prefix='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/';
 const old={schemaVersion:'agent-update-trust/1',status:'published',publisher:'StatePort-Dev',channel:'rc',url:prefix+'rc.json',keyId:f.trust.keyId,publicKey:f.trust.publicKey};
 const next={...old,channel:'stable',url:prefix+'stable.json',channels:{stable:prefix+'stable.json',rc:prefix+'rc.json'}};
 const loader=await ensureLauncher(f.cache,old),bytes=await readFile(loader);
 assert.equal(await ensureLauncher(f.cache,next),loader);
 assert.deepEqual(await readFile(loader),bytes);
 assert.deepEqual(JSON.parse(await readFile(join(f.cache,'launcher/release.json'),'utf8')),next);
 assert.equal((await readdir(f.cache)).filter(n=>n.startsWith('.launcher-backup-')).length,1);
 await ensureLauncher(f.cache,next);
 assert.equal((await readdir(f.cache)).filter(n=>n.startsWith('.launcher-backup-')).length,1);
}));

test('explicit setup adopts only the exact owned Node-24 loader closure and preserves a backup', () => updateFixture(async f => {
  const {rm}=await import('node:fs/promises');
  const trust={status:'unpublished'};
  const path=await ensureLauncher(f.cache,trust);
  const old=await readFile(new URL('./fixtures/launcher-node24-install.txt',import.meta.url));
  await writeFile(join(f.cache,'launcher/lib/install.mjs'),old);
  await writeFile(join(f.cache,'launcher/lib/archive.mjs'),await readFile(new URL('./fixtures/launcher-node24-archive.txt',import.meta.url)));
  await rm(join(f.cache,'launcher/lib/node-host.mjs'),{force:true});
  await rm(join(f.cache,'launcher/lib/generation.mjs'),{force:true});
  assert.equal(await ensureLauncher(f.cache,trust),path);
  assert.deepEqual(await readFile(join(f.cache,'launcher/lib/install.mjs')),await readFile(new URL('../lib/install.mjs',import.meta.url)));
  assert.equal((await readdir(f.cache)).filter(n=>n.startsWith('.launcher-backup-')).length,1);
  await ensureLauncher(f.cache,trust);
  assert.equal((await readdir(f.cache)).filter(n=>n.startsWith('.launcher-backup-')).length,1);
}));
