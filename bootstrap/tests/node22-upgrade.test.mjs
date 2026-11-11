import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';import {join} from 'node:path';
import {updateFixture} from './update-fixture.mjs';
import {NODE_RANGE} from '../lib/node-host.mjs';
import {installCurrentPublishedRelease,checkForUpdates,selectSessionRuntime,rollbackGeneration} from '../lib/updates.mjs';
import {readCurrent} from '../lib/install.mjs';
import {setUpdatePolicy} from '../lib/update-policy.mjs';
function dual(old){const g={...old,schemaVersion:'agent-generation/2',nodeRange:NODE_RANGE,nativeAPI:8};delete g.nodeMajor;delete g.nativeABI;return g;}

test('explicit signed install migrates a Node-24 runtime on either host, retains data, and repeats',()=>updateFixture(async f=>{
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 const card=join(f.root,'retained-card.json');await writeFile(card,'synthetic retained Card bytes');
 const policy=await readFile(join(f.cache,'update-policy.json'),'utf8');
 f.release(f.bundle('1.2.0',dual(f.generation)),5,'stable');
 const installed=await installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher});
 assert.equal(installed.generation.schemaVersion,'agent-generation/2');
 assert.equal((await installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher})).unchanged,true);
 assert.equal(await readFile(card,'utf8'),'synthetic retained Card bytes');assert.equal(await readFile(join(f.cache,'update-policy.json'),'utf8'),policy);
 await assert.rejects(rollbackGeneration(f.cache),/UPDATE_INCOMPATIBLE/);
 assert.equal((await readCurrent(f.cache)).digest,installed.digest);
}));
test('auto cannot cross generation schemas; explicit setup does not release a pin',()=>updateFixture(async f=>{
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 await setUpdatePolicy(f.cache,{mode:'auto',consent:true,channel:'stable'});
 f.release(f.bundle('1.2.0',dual(f.generation)),5,'stable');
 await checkForUpdates(f.cache,f.trust,{fetcher:f.fetcher,force:true});
 assert.equal((await readCurrent(f.cache)).digest,f.installed.digest);
 assert.equal(JSON.parse(await readFile(join(f.cache,'update-state.json'),'utf8')).hold,'UPDATE_INCOMPATIBLE');
 await setUpdatePolicy(f.cache,{mode:'pinned',pin:{version:f.installed.productVersion,digest:f.installed.digest}});
 if(process.versions.node.startsWith('22.')) await assert.rejects(installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher}),/RUNTIME_NODE_UNSUPPORTED/);
 else assert.equal((await installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher})).digest,f.installed.digest);
 assert.equal((await readCurrent(f.cache)).digest,f.installed.digest);
}));
test('dual-Node generation supports exact automatic A to B activation while retaining the loaded identity',()=>updateFixture(async f=>{
 f.trust.channel='stable';f.trust.url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
 const g=dual(f.generation);f.release(f.bundle('1.2.0',g),5,'stable');
 const a=await installCurrentPublishedRelease(f.cache,f.trust,{fetcher:f.fetcher});
 await setUpdatePolicy(f.cache,{mode:'auto',consent:true,channel:'stable'});
 f.release(f.bundle('1.2.1',g),6,'stable');
 await checkForUpdates(f.cache,f.trust,{fetcher:f.fetcher,force:true});
 const state=JSON.parse(await readFile(join(f.cache,'update-state.json'),'utf8'));assert.equal(state.hold,null,JSON.stringify(state));assert(state.pending,JSON.stringify(state));
 const b=await selectSessionRuntime(f.cache,f.trust);
 assert.equal(b.productVersion,'1.2.1');assert.equal(a.productVersion,'1.2.0');
 assert.equal((await rollbackGeneration(f.cache)).productVersion,'1.2.0');
}));
