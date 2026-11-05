import{test}from'node:test';import assert from'node:assert/strict';
import{discoverAgentTools,toolCandidates}from'../lib/agent-discovery.mjs';
test('generated discovery uses only bounded executable paths without launching hosts',async()=>{
 const calls=[];const result=await discoverAgentTools({home:'/synthetic/u',platform:'linux',env:{PATH:'/usr/bin:relative:.'},probe:async path=>{calls.push(path);return['/usr/bin/cursor','/usr/bin/codex'].includes(path)}});
 assert.deepEqual(result,{status:'ready',detected:['cursor','codex']});assert(calls.every(path=>path.startsWith('/')));
 const paths=toolCandidates('cursor',{home:'C:\\Users\\u',platform:'win32',env:{PATH:'C:\\bin;relative',LOCALAPPDATA:'C:\\Users\\u\\AppData\\Local'}});assert(paths.includes('C:\\Users\\u\\AppData\\Local\\Programs\\cursor\\Cursor.exe'));assert(!paths.some(p=>p.includes('relative')));
 assert.equal((await discoverAgentTools({home:'/synthetic/u',platform:'linux',env:{},probe:async()=>{throw Error('DO_NOT_EXPOSE')}})).status,'unavailable');
});
