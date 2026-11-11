import {test} from 'node:test';
import assert from 'node:assert/strict';
import {supportedNode, NODE_RANGE} from '../lib/node-host.mjs';
import {validGeneration, knownGeneration, compatibleGeneration} from '../lib/update-policy.mjs';

const host = version => ({platform: process.platform, arch: process.arch, node: version, modules: version.startsWith('22.') ? '127' : '137', napi: '10'});
const generation = () => ({schemaVersion:'agent-generation/2', launcher:1, nodeRange:NODE_RANGE, nativeAPI:8,
  platform:process.platform, arch:process.arch, task:'agent-task/1', taskSession:'agent-task-session/1',
  mcp:'a'.repeat(64),skills:'b'.repeat(64),storageRead:'c'.repeat(64),storageWrite:'c'.repeat(64),
  browser:{preference:'system',playwright:'1.63.0',payload:null},permissions:['owned_browser']});

test('supports the unflagged SQLite floor on Node 22 and retains Node 24 only', () => {
  for (const v of ['22.13.0','22.22.3','24.0.0','24.19.0']) assert.equal(supportedNode(v), true, v);
  for (const v of ['20.19.3','22.8.0','22.12.9','23.0.0','25.0.0','26.0.0','22.13.0-rc.1','22.x','bad']) assert.equal(supportedNode(v), false, v);
});
test('one N-API generation works on both hosts without treating unknown ABIs or ranges as compatible', () => {
  const g=generation();
  for (const v of ['22.13.0','22.22.3','24.19.0']) {
    assert.equal(validGeneration(g,host(v)),true,v);
    assert.equal(compatibleGeneration(g,structuredClone(g),host(v)),null);
  }
  for (const bad of [{nativeAPI:9},{nodeRange:'>=20'},{nativeABI:'137'},{nodeMajor:24},{schemaVersion:'agent-generation/3'}]) assert.equal(validGeneration({...g,...bad}),false);
  assert.equal(validGeneration(g,{...host('22.13.0'),napi:'7'}),false);
  assert.equal(validGeneration(g,host('22.12.0')),false);
  assert.equal(compatibleGeneration(g,{...g,skills:'d'.repeat(64)}),'UPDATE_INCOMPATIBLE');
});
test('legacy Node-24 generation remains inspectable for explicit migration but cannot run on Node 22 or auto-upgrade to v2', () => {
  const g=generation(),old={...g,schemaVersion:'agent-generation/1',nodeMajor:24,nativeABI:'137'};
  delete old.nodeRange;delete old.nativeAPI;
  assert.equal(knownGeneration(old),true);
  assert.equal(validGeneration(old,host('24.19.0')),true);
  assert.equal(validGeneration(old,host('22.22.3')),false);
  assert.equal(compatibleGeneration(old,g,host('24.19.0')),'UPDATE_INCOMPATIBLE');
  assert.equal(knownGeneration({...old,nativeABI:'unknown'}),false);
});
