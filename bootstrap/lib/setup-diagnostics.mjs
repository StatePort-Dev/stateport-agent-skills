import {lstat,readdir,open} from 'node:fs/promises';
import {join,relative,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

const roots=['.agents/skills','.claude/skills','.codex/skills','.cursor/skills'];
const configs={cursor:'.cursor/mcp.json',claude:'.claude.json',codex:'.codex/config.toml'};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function safe(home,path) {
  const rel=relative(home,path);if(!rel||rel==='..'||rel.startsWith('..'+sep))throw Error('UNSAFE_SETUP_PATH');
  let current=resolve(home);
  for(const part of ['',...rel.split(sep)]) {
    if(part)current=join(current,part);
    try {if((await lstat(current)).isSymbolicLink())throw Error('UNSAFE_SETUP_PATH');}catch(e){if(e.code!=='ENOENT')throw e;}
  }
}
async function bytes(home,path) {
  await safe(home,path);let file;
  try {
    file=await open(path,'r');const stat=await file.stat();
    if(!stat.isFile()||stat.size>4*1024*1024)throw Error('SETUP_DATA_UNREADABLE');
    const chunks=[];let total=0;
    for(;;){const buffer=Buffer.alloc(65536),{bytesRead}=await file.read(buffer,0,buffer.length,null);if(!bytesRead)break;total+=bytesRead;if(total>4*1024*1024)throw Error('SETUP_DATA_UNREADABLE');chunks.push(buffer.subarray(0,bytesRead));}
    return Buffer.concat(chunks);
  }catch(e){if(e.code==='ENOENT')return undefined;throw e;}finally{await file?.close();}
}
async function json(home,path) {const value=await bytes(home,path);return value===undefined?undefined:JSON.parse(value);}
async function inventory(home,root) {
  const base=join(home,root),hashes={},folders=[];let files=0,total=0;
  await safe(home,base);let names;
  try {names=await readdir(base);}catch(e){if(e.code==='ENOENT')return{hashes,folders,files};throw e;}
  async function walk(path) {
    await safe(home,path);
    for(const name of await readdir(path,{withFileTypes:true})){
      if(++files>4096)throw Error('SETUP_DATA_UNREADABLE');const child=join(path,name.name);
      if(name.isSymbolicLink())throw Error('UNSAFE_SETUP_PATH');
      if(name.isDirectory())await walk(child);
      else if(name.isFile()){const value=await bytes(home,child);if(!value)throw Error('SETUP_DATA_UNREADABLE');total+=value.length;if(total>16*1024*1024)throw Error('SETUP_DATA_UNREADABLE');hashes[relative(base,child).split(sep).join('/')]=sha(value);}
      else throw Error('UNSAFE_SETUP_PATH');
    }
  }
  const candidates=names.filter(n=>/^(?:stateport|scenariodeck)(?:-|$)/i.test(n));if(candidates.length>64)throw Error('SETUP_DATA_UNREADABLE');
  for(const name of candidates){
    if(!/^(?:stateport|scenariodeck)-[a-z0-9-]+$/.test(name))throw Error('UNSAFE_SETUP_PATH');
    folders.push(root+'/'+name);await walk(join(base,name));
  }
  return {hashes,folders,files:Object.keys(hashes).length};
}
function same(actual,expected) {
  return expected&&typeof expected==='object'&&!Array.isArray(expected)&&Object.keys(expected).length<=4096&&Object.keys(actual).length===Object.keys(expected).length&&Object.entries(actual).every(([name,hash])=>expected[name]===hash);
}
/** Read-only observations for legacy runtime CONFLICT. Never supplies mutation
 * authority, file contents, launch arguments, credentials or another writer. */
export async function diagnoseSetupConflict({home,cache,agent,platform=process.platform,env=process.env}) {
  if(!configs[agent])return {schemaVersion:'agent-setup-diagnostics/1',agent,configState:'unknown',issues:[]};
  const issues=[],configPath=configs[agent];let configState='unknown';
  const add=(code,path,extra={})=>{if(issues.length<12)issues.push({code,path,severity:'blocking',scope:agent,...extra});};
  let current,legacy;
  const appData=platform==='darwin'?join(home,'Library/Application Support'):platform==='win32'?(env.APPDATA??join(home,'AppData/Roaming')):(env.XDG_CONFIG_HOME??join(home,'.config'));
  try{current=await json(home,join(cache,'agent-setup/receipt.json'));}catch{add('OWNERSHIP_RECORD_UNREADABLE',relative(home,join(cache,'agent-setup/receipt.json')));}
  try{legacy=await json(home,join(appData,'ScenarioDeck Local Alpha/agent-setup/receipt.json'));}catch{/* legacy ownership remains unproved */}
  for(const root of (agent==='cursor'?roots:agent==='codex'?roots.slice(0,1).concat('.codex/skills'):['.claude/skills'])){
    try {
      const actual=await inventory(home,root);if(!actual.folders.length)continue;
      if(current?.schemaVersion===1&&same(actual.hashes,current.roots?.[root]?.hashes))continue;
      const previous=legacy?.schemaVersion===1?legacy.roots?.[root]:undefined;
      const owned=same(actual.hashes,previous?.hashes);
      add(owned?'DESKTOP_SKILLS_REMAIN':'UNOWNED_OR_EDITED_SKILLS',root,{folders:actual.folders,files:actual.files,...(owned&&/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(previous.version??'')?{version:previous.version}:{})});
    }catch(e){add(e.message==='UNSAFE_SETUP_PATH'?'UNSAFE_SETUP_PATH':'SETUP_DATA_UNREADABLE',root);}
  }
  try {
    const raw=await bytes(home,join(home,configPath));
    if(!raw)configState='absent';
    else if(agent==='codex'){configState='unknown';if(!issues.length)add('MCP_CONFIG_REVIEW',configPath);}
    else{
      const config=JSON.parse(raw);if(!config||typeof config!=='object'||Array.isArray(config))throw Error('invalid');const servers=config.mcpServers??{};
      if(!servers||typeof servers!=='object'||Array.isArray(servers))throw Error('invalid');
      configState=Object.hasOwn(servers,'stateport')?'present':'absent';
      if(Object.hasOwn(servers,'scenariodeck'))add('LEGACY_MCP_ENTRY',configPath);
      if(configState==='present'){
        const entry=servers.stateport,owned=current?.agents?.[agent]?.config?.entry;
        if(entry?.disabled===true||entry?.enabled===false)add('MCP_DISABLED',configPath);
        else if(!owned||!isDeepStrictEqual(entry,owned))add('MCP_ENTRY_CONFLICT',configPath);
      }
    }
  }catch(e){add(e.message==='UNSAFE_SETUP_PATH'?'UNSAFE_SETUP_PATH':'MCP_CONFIG_UNREADABLE',configPath);}
  for(const file of ['installed_plugins.json','config.json']) {
    try {const value=await bytes(home,join(home,`.${agent}/plugins`,file));if(value&&/stateport|scenariodeck/i.test(value.toString('utf8')))add('PLUGIN_INSTALL_PRESENT',`.${agent}/plugins/${file}`);}
    catch(e){add(e.message==='UNSAFE_SETUP_PATH'?'UNSAFE_SETUP_PATH':'SETUP_DATA_UNREADABLE',`.${agent}/plugins/${file}`);}
  }
  try{const path=join(home,`.${agent}/plugins/cache`);await safe(home,path);if((await readdir(path)).some(n=>/stateport|scenariodeck/i.test(n)))add('PLUGIN_INSTALL_PRESENT',`.${agent}/plugins/cache`);}catch(e){if(e.code!=='ENOENT')add(e.message==='UNSAFE_SETUP_PATH'?'UNSAFE_SETUP_PATH':'SETUP_DATA_UNREADABLE',`.${agent}/plugins/cache`);}
  return {schemaVersion:'agent-setup-diagnostics/1',agent,configState,issues};
}
