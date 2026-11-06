import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {updateFixture} from './update-fixture.mjs';
import * as updates from '../lib/updates.mjs';
import {readCurrent} from '../lib/install.mjs';
import {readUpdatePolicy,setUpdatePolicy} from '../lib/update-policy.mjs';
test('one bootstrap installs the signed current stable runtime, repeats without payload download and refuses replay',()=>updateFixture(async f=>{
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 await rm(join(f.cache,'current.json'));
 f.release(f.bundle('1.0.1'),2,'stable');
 const policyBefore=await readFile(join(f.cache,'update-policy.json'),'utf8');
 const options={fetcher:f.fetcher,minimumVersion:'1.0.0'};
 const installed=await updates.installCurrentPublishedRelease(f.cache,f.trust,options);
 assert.equal(installed.productVersion,'1.0.1');assert.equal(installed.publicDeliveryVerified,true);
 assert.equal(await readFile(join(f.cache,'update-policy.json'),'utf8'),policyBefore);
 f.requests.length=0;
 assert.equal((await updates.installCurrentPublishedRelease(f.cache,f.trust,options)).unchanged,true);
 assert.deepEqual(f.requests.map(r=>r.url),[f.trust.url]);
 assert.equal(JSON.parse(await readFile(join(f.cache,'update-state.json'),'utf8')).water.stable.sequence,2);
 f.release(f.bundle('1.0.0'),1,'stable');f.requests.length=0;
 await assert.rejects(updates.installCurrentPublishedRelease(f.cache,f.trust,options),/RELEASE_REPLAY/);
 assert.equal((await readCurrent(f.cache)).digest,installed.digest);
 assert.deepEqual(f.requests.map(r=>r.url),[f.trust.url]);
}));
test('an invalid stable signature leaves the current runtime and payload untouched',()=>updateFixture(async f=>{
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 f.release(f.bundle('1.0.1'),2,'stable');f.getEnvelope().signature=Buffer.alloc(64).toString('base64');
 await assert.rejects(updates.installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher,minimumVersion:'1.0.0'}),/RELEASE_SIGNATURE/);
 assert.equal((await readCurrent(f.cache)).digest,f.installed.digest);
 assert.deepEqual(f.requests.map(r=>r.url),[f.trust.url]);
}));
test('a failed payload download still retains the observed signed-channel high-water mark',()=>updateFixture(async f=>{
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';f.release(f.bundle('1.0.1'),2,'stable');
 const options={minimumVersion:'1.0.0',fetcher:async(url,init)=>{if(url!==f.trust.url)throw Error('synthetic network failure');return f.fetcher(url,init);}};
 await assert.rejects(updates.installCurrentPublishedRelease(f.cache,f.trust,options),/RELEASE_NETWORK/);
 assert.equal((await readCurrent(f.cache)).digest,f.installed.digest);
 f.release(f.bundle('1.0.0'),1,'stable');
 await assert.rejects(updates.installCurrentPublishedRelease(f.cache,f.trust,options),/RELEASE_REPLAY/);
}));
test('explicit stable installation cannot silently change the persisted storage contract',()=>updateFixture(async f=>{
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 f.release(f.bundle('1.0.1',{...f.generation,storageWrite:'e'.repeat(64)}),2,'stable');
 await assert.rejects(updates.installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher,minimumVersion:'1.0.0'}),/UPDATE_INCOMPATIBLE/);
 assert.equal((await readCurrent(f.cache)).digest,f.installed.digest);
 assert.deepEqual(f.requests.map(r=>r.url),[f.trust.url]);
}));
test('explicit installation keeps a valid pin and does not contact the channel',()=>updateFixture(async f=>{
 const pin={version:f.installed.productVersion,digest:f.installed.digest};
 await setUpdatePolicy(f.cache,{mode:'pinned',pin});
 const result=await updates.installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher,minimumVersion:'1.0.0'});
 assert.equal(result.digest,pin.digest);assert.equal(result.unchanged,true);assert.equal(f.requests.length,0);
 assert.deepEqual((await readUpdatePolicy(f.cache)).pin,pin);
}));

test('explicit install tolerates metadata past the background five-second budget and reports phases',()=>updateFixture(async f=>{
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 f.release(f.bundle('1.0.1'),2,'stable');
 const phases=[];
 const result=await updates.installCurrentPublishedRelease(f.cache,f.trust,{minimumVersion:'1.0.0',onPhase:phase=>phases.push(phase),fetcher:async(url,init)=>{
  if(url===f.trust.url)await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,5100);init.signal.addEventListener('abort',()=>{clearTimeout(timer);reject(init.signal.reason);},{once:true});});
  return f.fetcher(url,init);
 }});
 assert.equal(result.productVersion,'1.0.1');assert.equal(phases[0],'metadata');
 assert(phases.includes('download'));assert(phases.includes('verification'));assert(phases.includes('extraction'));
}));

test('reviewed setup upgrades published 1.0.0 to 1.0.1 across the runtime-options-only fingerprint change',()=>updateFixture(async f=>{
 const oldStorage='5f0e61063a05a1f4c700c030ac61d6477c891e7d4762933600c32b6368c6e889';
 const newStorage='1a3e8f25656dd04fed3bdc8dc8d0505dfefe2dd1fa7e8a8f134962a24342dc8b';
 const before=f.bundle('1.0.0',{...f.generation,storageRead:oldStorage,storageWrite:oldStorage});
 const {writeFile}=await import('node:fs/promises');
 const {installCandidate,readInstalled}=await import('../lib/install.mjs');
 const {sha}=await import('./update-fixture.mjs');
 await writeFile(join(f.source,'main.cjs'),before.main);await writeFile(join(f.source,'candidate.json'),before.manifest);
 const installed=await installCandidate({source:f.source,cache:f.cache,manifestSha256:sha(before.manifest)});
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 f.release(f.bundle('1.0.1',{...f.generation,mcp:'d'.repeat(64),skills:'e'.repeat(64),storageRead:newStorage,storageWrite:newStorage}),2,'stable');
 await setUpdatePolicy(f.cache,{mode:'auto',consent:true,channel:'stable'});
 await updates.checkForUpdates(f.cache,f.trust,{fetcher:f.fetcher,force:true,readiness:async()=>{throw Error('must not run automatically');}});
 assert.equal((await updates.updateStatus(f.cache)).hold,'UPDATE_INCOMPATIBLE');
 assert.equal((await readCurrent(f.cache)).digest,installed.digest);
 assert.deepEqual(f.requests.map(r=>r.url),[f.trust.url]);
 const policyBefore=await readFile(join(f.cache,'update-policy.json'),'utf8');
 const result=await updates.installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher,minimumVersion:'1.0.1'});
 assert.equal(result.productVersion,'1.0.1');assert.equal((await readCurrent(f.cache)).digest,result.digest);
 assert.equal(await readFile(join(f.cache,'update-policy.json'),'utf8'),policyBefore);
 assert.equal((await readInstalled(f.cache,installed.digest)).productVersion,'1.0.0');
 assert.deepEqual(await readFile(installed.entry),before.main);
 assert.equal((await updates.installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher,minimumVersion:'1.0.1'})).unchanged,true);
}));

for (const [name,version,read,write] of [
 ['unknown target version','1.0.2','1a3e8f25656dd04fed3bdc8dc8d0505dfefe2dd1fa7e8a8f134962a24342dc8b','1a3e8f25656dd04fed3bdc8dc8d0505dfefe2dd1fa7e8a8f134962a24342dc8b'],
 ['unknown storage hash','1.0.1','f'.repeat(64),'f'.repeat(64)],
 ['mixed read/write contracts','1.0.1','1a3e8f25656dd04fed3bdc8dc8d0505dfefe2dd1fa7e8a8f134962a24342dc8b','f'.repeat(64)],
]) test(`reviewed storage exception rejects ${name} before payload download`,()=>updateFixture(async f=>{
 const oldStorage='5f0e61063a05a1f4c700c030ac61d6477c891e7d4762933600c32b6368c6e889';
 const before=f.bundle('1.0.0',{...f.generation,storageRead:oldStorage,storageWrite:oldStorage});
 const {writeFile}=await import('node:fs/promises');const {installCandidate}=await import('../lib/install.mjs');const {sha}=await import('./update-fixture.mjs');
 await writeFile(join(f.source,'main.cjs'),before.main);await writeFile(join(f.source,'candidate.json'),before.manifest);
 const installed=await installCandidate({source:f.source,cache:f.cache,manifestSha256:sha(before.manifest)});
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 f.release(f.bundle(version,{...f.generation,storageRead:read,storageWrite:write}),2,'stable');
 await assert.rejects(updates.installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher,minimumVersion:'1.0.1'}),/UPDATE_INCOMPATIBLE/);
 assert.equal((await readCurrent(f.cache)).digest,installed.digest);assert.deepEqual(f.requests.map(r=>r.url),[f.trust.url]);
}));
