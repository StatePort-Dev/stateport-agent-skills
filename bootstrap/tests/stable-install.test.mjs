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
 await assert.rejects(updates.installCurrentPublishedRelease(f.cache,f.trust,options),/synthetic network failure/);
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
