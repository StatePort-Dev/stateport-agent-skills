import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough,Writable} from 'node:stream';
const discovery={status:'ready',detected:['vscode','cursor','claude','codex']};
const load=()=>import('../lib/agent-selection.mjs');
const output=()=>{let text='';const stream={isTTY:true,write:s=>{text+=s;}};return{stream,text:()=>text}};
test('all detected supported agents are configured by default without a selection question',async()=>{
 const {chooseAgents}=await load(),out=output();
 let asks=0; const result=await chooseAgents({discovery,interactive:true,output:out.stream,ask:async()=>{asks++;throw Error('UNEXPECTED_PROMPT')}});
 assert.equal(asks,0);assert.deepEqual(result.agents,['codex','claude','cursor','vscode']);assert.equal(result.method,'automatic');assert.equal(result.schemaVersion,'agent-selection/2');assert(!out.text().includes('Selection ['));
});
test('user can select a subset, all installed, none, and explicitly retry a missing host',async()=>{
 const {chooseAgents}=await load();
 for(const [answer,agents] of [['1,3',['codex','cursor']],['none',[]],['2',['claude']]]){
  const r=await chooseAgents({discovery,choose:true,interactive:true,output:output().stream,ask:async()=>answer});assert.deepEqual(r.agents,agents);
 }
 const r=await chooseAgents({discovery:{status:'ready',detected:['cursor']},explicit:'codex',interactive:false});assert.deepEqual(r.agents,['codex']);
});
test('invalid input is retried, never silently converted into the default',async()=>{
 const {chooseAgents}=await load(),out=output(),answers=['bad','1,1','1,3'];let calls=0;
 const r=await chooseAgents({discovery,choose:true,interactive:true,output:out.stream,ask:async()=>answers[calls++]});assert.equal(calls,3);assert.deepEqual(r.agents,['codex','cursor']);assert(out.text().includes('Choose'));
});
test('non-interactive defaults also attempt every detected agent and retain per-agent conflicts',async()=>{
 const {chooseAgents,setupSelectedAgents}=await load();let calls=0;
 const selection=await chooseAgents({discovery,interactive:false});assert.equal(selection.status,'selected');assert.equal(selection.agents.length,4);
 const r=await setupSelectedAgents(selection,async agent=>{calls++;return{status:agent==='cursor'?'failed':'installed',agent,result:agent==='cursor'?{status:'failed',reason:'CONFLICT'}:{mcp:'ready'}}});assert.equal(calls,4);assert.equal(r.status,'partial');
 assert.deepEqual((await chooseAgents({discovery,explicit:'all',interactive:false})).agents,selection.agents);
});
test('requested manual chooser requires a terminal and cannot be mixed with an explicit selection',async()=>{
 const{chooseAgents}=await load();await assert.rejects(chooseAgents({discovery,choose:true,interactive:false}),/AGENT_CHOICE_REQUIRES_TTY/);
 await assert.rejects(chooseAgents({discovery,choose:true,interactive:true,explicit:'cursor'}),/INVALID_ARGUMENTS/);
});
test('Claude IDE evidence is labelled and selected without claiming a standalone CLI',async()=>{
 const{chooseAgents}=await load(),out=output();const r=await chooseAgents({discovery:{status:'ready',detected:['claude','cursor','vscode'],claude:{cli:false,editors:['vscode']}},interactive:true,output:out.stream,ask:async()=>{throw Error('NO_PROMPT')}});
 assert.deepEqual(r.agents,['claude','cursor','vscode']);assert.deepEqual(r.claude,{cli:false,editors:['vscode']});assert(out.text().includes('Claude Code · VS Code extension'));
});
test('unavailable discovery cannot become automatic all, explicit names still work',async()=>{
 const {chooseAgents}=await load(),d={status:'unavailable',detected:[]};
 assert.equal((await chooseAgents({discovery:d,explicit:'all',interactive:false})).status,'required');
 assert.deepEqual((await chooseAgents({discovery:d,explicit:'cursor,codex',interactive:false})).agents,['codex','cursor']);
 await assert.rejects(chooseAgents({discovery,explicit:'cursor,cursor'}),/INVALID_ARGUMENTS/);
 await assert.rejects(chooseAgents({discovery,explicit:'unknown'}),/INVALID_ARGUMENTS/);
});
test('batch configures only selected agents sequentially, keeps each failure and single-agent response compatibility',async()=>{
 const {setupSelectedAgents}=await load();const calls=[];
 const configure=async agent=>{calls.push(agent);return{status:agent==='claude'?'failed':'installed',agent,result:agent==='claude'?{status:'failed',reason:'CONFLICT'}:{status:'installed',version:'0.1.0-beta.82',mcp:'ready'}}};
 const result=await setupSelectedAgents({status:'selected',agents:['codex','claude','vscode']},configure);
 assert.equal(result.schemaVersion,'agent-setup-batch/1');assert.equal(result.status,'partial');assert.deepEqual(calls,['codex','claude','vscode']);assert.equal(result.results[1].result.reason,'CONFLICT');
 const single=await setupSelectedAgents({status:'selected',agents:['cursor']},configure);assert.deepEqual(single,await configure('cursor'));
 const skipped=await setupSelectedAgents({status:'skipped',agents:[]},configure);assert.equal(skipped.status,'skipped');
});
test('EOF and SIGINT reject the prompt, never confirm checked defaults',async()=>{
 const {promptForAgents}=await load();
 for(const mode of ['end','SIGINT']){
  const input=new PassThrough(),output=new Writable({write(c,e,done){done()}});
  const pending=promptForAgents({input,output,terminal:false,query:'Select: '});
  setImmediate(()=>mode==='end'?input.end():input.emit('data',Buffer.from('\x03')));
  if(mode==='SIGINT')setImmediate(()=>input.end());
  await assert.rejects(pending,/SETUP_CANCELLED/);
 }
});
test('Codex in VS Code is checked without CLI and is not duplicated as generic manual VS Code',async()=>{
 const {chooseAgents}=await load(),out=output();const r=await chooseAgents({discovery:{status:'ready',detected:['vscode','codex'],codex:{cli:false,editors:['vscode']}},choose:true,interactive:true,output:out.stream,ask:async()=>''});assert.deepEqual(r.agents,['codex','vscode']);assert(out.text().includes('VS Code extension'));assert(!out.text().includes('manual connection'));assert.deepEqual(r.codex,{cli:false,editors:['vscode']});
});
test('Copilot Chat keeps its own automatic host label alongside automatic Codex',async()=>{
 const {chooseAgents}=await load(),out=output();await chooseAgents({discovery:{status:'ready',detected:['vscode','codex'],codex:{cli:false,editors:['vscode']},copilotChat:['vscode']},interactive:true,output:out.stream,ask:async()=>''});assert(out.text().includes('VS Code / Copilot'));assert(!out.text().includes('manual connection'));
});

test('explicit all-host selection attempts each target without suppressing the others on a protected conflict',async()=>{
 const {chooseAgents,setupSelectedAgents}=await load();let calls=0;
 const s=await chooseAgents({discovery,explicit:'codex,claude,cursor'});
 const result=await setupSelectedAgents(s,async agent=>{calls++;return{status:'failed',agent,result:{reason:'CONFLICT'}}});assert.equal(calls,3);assert.equal(result.status,'partial');
});

test('compatible all remains available without inferring editor preference',async()=>{
 const {chooseAgents}=await load();const compatible={status:'ready',detected:['codex','cursor','vscode']};
 for(const choice of ['all',''])assert.deepEqual((await chooseAgents({discovery:compatible,choose:true,interactive:true,output:output().stream,ask:async()=>choice})).agents,['codex','cursor','vscode']);
 assert.deepEqual((await chooseAgents({discovery:compatible,explicit:'all',interactive:false})).agents,['codex','cursor','vscode']);
});
