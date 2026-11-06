import {test} from 'node:test';
import assert from 'node:assert/strict';
import {download} from '../lib/release.mjs';
import {installFailureBucket} from '../lib/install-metrics.mjs';
import * as output from '../lib/cli-output.mjs';

const url='https://raw.githubusercontent.com/StatePort-Dev/stateport-releases/main/channels/stable.json';
test('network diagnostics sanitize fetch and stream errors and distinguish deadlines',async()=>{
 await assert.rejects(download(url,100,async()=>{throw Error('private-proxy-secret');},{metadataChannel:'stable'}),/^Error: RELEASE_NETWORK$/);
 await assert.rejects(download(url,100,async(_url,{signal})=>{
  await new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(signal.reason),{once:true});setTimeout(resolve,50);});
 },{metadataChannel:'stable',timeoutMs:5}),/^Error: RELEASE_TIMEOUT$/);
 await assert.rejects(download(url,100,async()=>new Response(new ReadableStream({start(c){c.error(Error('private-stream-secret'));}})),{metadataChannel:'stable'}),/^Error: RELEASE_NETWORK$/);
});
test('source/browser/configuration/discovery/access readiness are independent',()=>{
 const value={doctor:{capabilities:{sourceOnly:true},browser:{status:'missing'}},setup:{status:'installed',result:{mcp:'ready'}}};
 assert.deepEqual(output.installationReadiness(value),{schemaVersion:'agent-install-readiness/1',runtime:'installed',source:'ready',browser:'unavailable',agentConfiguration:'configured',agentDiscovery:'unverified',access:'not_checked'});
 assert.equal(output.installNeedsAttention(value),true,'legacy partial-readiness exit remains nonzero');
 let text='';output.createCliOutput({stream:{write:s=>{text+=s;}}}).emit({...value,status:'candidate_installed',version:'1.0.0'});
 assert.match(text,/Source work is available/);
 assert.match(text,/Capture and replay/);
});

test('sanitized network causes keep the existing network metric bucket',()=>{
 for(const code of ['RELEASE_NETWORK','RELEASE_TIMEOUT','RELEASE_CANCELLED'])assert.equal(installFailureBucket(Error(code)),'network');
});
