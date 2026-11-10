import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const sha = text => createHash('sha256').update(text).digest('hex');
async function fixture(run) {
  const home=await mkdtemp(join(tmpdir(),'stateport-diagnosis-')),cache=join(home,'cache');
  try {await run({home,cache});} finally {await rm(home,{recursive:true,force:true});}
}
test('diagnoses Desktop-owned orphan skills after MCP removal and does not mutate anything',()=>fixture(async({home,cache})=>{
  const {diagnoseSetupConflict}=await import('../lib/setup-diagnostics.mjs');
  const text='unchanged original skill',relative='stateport-debugging/SKILL.md';
  await mkdir(join(home,'.agents/skills/stateport-debugging'),{recursive:true});await writeFile(join(home,'.agents/skills',relative),text);
  const legacy=join(home,'.config/ScenarioDeck Local Alpha/agent-setup');await mkdir(legacy,{recursive:true});
  const receipt=JSON.stringify({schemaVersion:1,agents:{cursor:{root:'.agents/skills'}},roots:{'.agents/skills':{version:'0.1.0-beta.78',hashes:{[relative]:sha(text)}}}});await writeFile(join(legacy,'receipt.json'),receipt);
  await mkdir(join(home,'.cursor'));const config='{"mcpServers":{}}\n';await writeFile(join(home,'.cursor/mcp.json'),config);
  const result=await diagnoseSetupConflict({home,cache,agent:'cursor',platform:'linux',env:{}});
  assert.equal(result.configState,'absent');assert(result.issues.some(i=>i.code==='DESKTOP_SKILLS_REMAIN'&&i.path==='.agents/skills'&&i.files===1));
  assert.deepEqual(result.issues.find(i=>i.code==='DESKTOP_SKILLS_REMAIN').folders,['.agents/skills/stateport-debugging']);
  assert.equal(await readFile(join(legacy,'receipt.json'),'utf8'),receipt);assert.equal(await readFile(join(home,'.cursor/mcp.json'),'utf8'),config);
}));
test('reports both skills and existing MCP blockers without returning command, environment or other servers',()=>fixture(async({home,cache})=>{
  const {diagnoseSetupConflict}=await import('../lib/setup-diagnostics.mjs');await mkdir(join(home,'.agents/skills/stateport-debugging'),{recursive:true});await writeFile(join(home,'.agents/skills/stateport-debugging/SKILL.md'),'local');await mkdir(join(home,'.cursor'));
  await writeFile(join(home,'.cursor/mcp.json'),JSON.stringify({mcpServers:{stateport:{command:'DO_NOT_EXPOSE_COMMAND',env:{TOKEN:'DO_NOT_EXPOSE_SECRET'}},other:{url:'DO_NOT_EXPOSE_OTHER'}}}));
  const result=await diagnoseSetupConflict({home,cache,agent:'cursor',platform:'linux',env:{}});assert(result.issues.some(i=>i.code==='UNOWNED_OR_EDITED_SKILLS'));assert(result.issues.some(i=>i.code==='MCP_ENTRY_CONFLICT'));assert(!JSON.stringify(result).includes('DO_NOT_EXPOSE'));
}));
test('does not follow linked skills and does not mistake exact Node-owned skills for a conflict',()=>fixture(async({home,cache})=>{
  const {diagnoseSetupConflict}=await import('../lib/setup-diagnostics.mjs');await mkdir(join(home,'.agents/skills'),{recursive:true});await mkdir(join(home,'outside'));await symlink(join(home,'outside'),join(home,'.agents/skills/stateport-linked'),process.platform==='win32'?'junction':'dir');
  assert((await diagnoseSetupConflict({home,cache,agent:'cursor',platform:'linux',env:{}})).issues.some(i=>i.code==='UNSAFE_SETUP_PATH'));
  await rm(join(home,'.agents/skills/stateport-linked'));await mkdir(join(home,'.agents/skills/stateport-debugging'));await writeFile(join(home,'.agents/skills/stateport-debugging/SKILL.md'),'owned');await mkdir(join(cache,'agent-setup'),{recursive:true});await writeFile(join(cache,'agent-setup/receipt.json'),JSON.stringify({schemaVersion:1,agents:{cursor:{root:'.agents/skills'}},roots:{'.agents/skills':{hashes:{'stateport-debugging/SKILL.md':sha('owned')}}}}));
  assert.equal((await diagnoseSetupConflict({home,cache,agent:'cursor',platform:'linux',env:{}})).issues.length,0);
}));

test('invalid config shape is a named blocker and plugin observations stay secret-free',()=>fixture(async({home,cache})=>{
  const {diagnoseSetupConflict}=await import('../lib/setup-diagnostics.mjs');await mkdir(join(home,'.cursor/plugins'),{recursive:true});
  await writeFile(join(home,'.cursor/mcp.json'),'[]');
  await writeFile(join(home,'.cursor/plugins/installed_plugins.json'),JSON.stringify({plugins:['stateport'],private:'DO_NOT_EXPOSE_PLUGIN'}));
  const result=await diagnoseSetupConflict({home,cache,agent:'cursor',platform:'linux',env:{}});
  assert(result.issues.some(i=>i.code==='MCP_CONFIG_UNREADABLE'));
  assert(result.issues.some(i=>i.code==='PLUGIN_INSTALL_PRESENT'));assert(!JSON.stringify(result).includes('DO_NOT_EXPOSE_PLUGIN'));
}));
test('names a current owned multi-root Cursor conflict instead of pointing at an absent MCP entry',()=>fixture(async({home,cache})=>{
 const {diagnoseSetupConflict}=await import('../lib/setup-diagnostics.mjs');const roots={};
 for(const root of ['.agents/skills','.claude/skills']){await mkdir(join(home,root,'stateport-example'),{recursive:true});await writeFile(join(home,root,'stateport-example/SKILL.md'),'owned');roots[root]={hashes:{'stateport-example/SKILL.md':sha('owned')}};}
 await mkdir(join(cache,'agent-setup'),{recursive:true});await writeFile(join(cache,'agent-setup/receipt.json'),JSON.stringify({schemaVersion:1,roots}));
 const result=await diagnoseSetupConflict({home,cache,agent:'cursor',platform:'linux',env:{}});assert(result.issues.some(i=>i.code==='MULTIPLE_OWNED_SKILL_ROOTS'));assert(!result.issues.some(i=>i.code==='UNOWNED_OR_EDITED_SKILLS'));
}));
test('Codex diagnostics parse real TOML and distinguish enabled plugin from inactive cache',()=>fixture(async({home,cache})=>{
 const {diagnoseSetupConflict}=await import('../lib/setup-diagnostics.mjs');
 await mkdir(join(home,'.codex/plugins/cache/stateport-dev'),{recursive:true});
 await writeFile(join(home,'.codex/config.toml'),'model="unchanged"\n');
 const cached=await diagnoseSetupConflict({home,cache,agent:'codex',platform:'linux',env:{}});
 assert.equal(cached.configState,'absent');assert.deepEqual(cached.issues,[]);
 const text='[plugins."stateport@stateport-dev"]\nenabled=true\n[mcp_servers.other]\nenv={TOKEN="DO_NOT_EXPOSE_SECRET"}\n[mcp_servers.stateport]\ncommand="/opt/StatePort/resources/mcp-runtime/node"\nargs=["/opt/StatePort/resources/mcp-runtime/mcp-main.cjs"]\n';
 await writeFile(join(home,'.codex/config.toml'),text);
 const result=await diagnoseSetupConflict({home,cache,agent:'codex',platform:'linux',env:{}});
 assert.equal(result.configState,'present');assert.equal(result.migrationAvailable,true);
 assert(result.issues.some(i=>i.code==='CODEX_PLUGIN_ACTIVE'));
 assert(!JSON.stringify(result).includes('DO_NOT_EXPOSE'));
 assert.equal(await readFile(join(home,'.codex/config.toml'),'utf8'),text);
}));
test('names the exact portable Copilot and custom-profile blocker without exposing values',()=>fixture(async({home,cache})=>{
 const {diagnoseSetupConflict}=await import('../lib/setup-diagnostics.mjs');
 for(const [file,config]of[['.copilot/mcp-config.json',{mcpServers:{stateport:{command:'DO_NOT_EXPOSE',disabled:true}}}],['.config/Code/User/profiles/qa/mcp.json',{servers:{stateport:{command:'DO_NOT_EXPOSE'}}}]]){await mkdir(join(home,file,'..'),{recursive:true});await writeFile(join(home,file),JSON.stringify(config));}
 const r=await diagnoseSetupConflict({home,cache,agent:'vscode',platform:'linux',env:{}});
 assert(r.issues.some(i=>i.path==='.copilot/mcp-config.json'&&i.code==='MCP_DISABLED'));
 assert(r.issues.some(i=>i.path==='.config/Code/User/profiles/qa/mcp.json'&&i.code==='MCP_ENTRY_CONFLICT'));
 assert(!JSON.stringify(r).includes('DO_NOT_EXPOSE'));
}));
