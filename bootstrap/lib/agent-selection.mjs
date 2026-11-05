import {createInterface} from 'node:readline/promises';

export const agentNames={codex:'Codex CLI',claude:'Claude Code',cursor:'Cursor'};
const ids=Object.keys(agentNames),manualNames={vscode:'VS Code',webstorm:'WebStorm'};
export const installedAgents=discovery=>discovery?.status==='ready'?ids.filter(id=>discovery.detected.includes(id)):[];
function parse(value,defaults,numeric=false){
 const text=value.trim().toLowerCase();
 if(text==='all'||(numeric&&text===''))return [...defaults];
 if(text==='none')return [];
 const parts=text.split(',').map(s=>s.trim());
 const selected=parts.map(s=>numeric&&/^[1-3]$/.test(s)?ids[Number(s)-1]:s);
 if(!selected.length||selected.length>3||selected.some(id=>!ids.includes(id))||new Set(selected).size!==selected.length)throw Error('INVALID_ARGUMENTS');
 return ids.filter(id=>selected.includes(id));
}
export async function promptForAgents({input=process.stdin,output=process.stdout,terminal=Boolean(input.isTTY&&output.isTTY),query}){
 const controller=new AbortController(),rl=createInterface({input,output,terminal,historySize:0});
 const cancel=()=>controller.abort();rl.once('SIGINT',cancel);rl.once('close',cancel);
 try{return await rl.question(query,{signal:controller.signal});}
 catch{throw Error('SETUP_CANCELLED');}
 finally{rl.removeListener('SIGINT',cancel);rl.removeListener('close',cancel);rl.close();}
}
export async function chooseAgents({discovery,explicit,interactive=Boolean(process.stdin.isTTY&&process.stdout.isTTY),output=process.stdout,ask}={}){
 const defaults=installedAgents(discovery),base={schemaVersion:'agent-selection/1',detected:discovery?.status==='ready'?[...discovery.detected]:[],discovery:discovery?.status??'unavailable'};
 if(explicit!==undefined){
  if(explicit==='all'&&discovery?.status!=='ready')return {...base,status:'required',method:'explicit',agents:[]};
  const agents=parse(explicit,defaults);return{...base,status:agents.length?'selected':explicit==='all'?'required':'skipped',method:'explicit',agents};
 }
 if(!interactive)return{...base,status:'required',method:'required',agents:[]};
 output.write('\n  Choose coding agents\n  Found supported agents are checked by default. This is a proposed selection.\n\n');
 ids.forEach((id,index)=>output.write(`  [${defaults.includes(id)?'x':' '}] ${index+1}. ${agentNames[id]} · ${defaults.includes(id)?'found':'not detected'}\n`));
 for(const id of base.detected.filter(id=>manualNames[id]))output.write(`      ${manualNames[id]} · found · manual connection\n`);
 if(base.discovery!=='ready')output.write('  Automatic discovery is unavailable. Choose the agents you have.\n');
 if(defaults.length===3)output.write('\n  This runtime cannot combine Cursor with both Codex and Claude skills.\n  You can change the selection; each setup conflict will be reported.\n');
 output.write('\n  Enter confirms checked agents. Type numbers such as 1,3 to change.\n  Type all for every found supported agent, or none for runtime only.\n');
 const query=`  Selection [${defaults.map(id=>ids.indexOf(id)+1).join(',')||'none'}]: `;
 for(;;){
  const answer=await (ask?ask(query):promptForAgents({output,query}));
  let agents;try{agents=parse(answer,defaults,true);}catch{output.write('  Choose numbers 1–3 separated by commas, all, or none.\n');continue;}
  output.write(`  Selected: ${agents.map(id=>agentNames[id]).join(', ')||'runtime only'}\n\n`);
  return{...base,status:agents.length?'selected':'skipped',method:'interactive',agents};
 }
}
export async function setupSelectedAgents(selection,configure){
 if(selection.status==='required')return{status:'guided_setup_required',reason:selection.discovery==='unavailable'?'AGENT_DISCOVERY_UNAVAILABLE':'AGENT_SELECTION_REQUIRED',detected:selection.detected??[]};
 if(!selection.agents.length)return{status:'skipped',reason:'USER_CHOSE_RUNTIME_ONLY'};
 const results=[];
 for(const agent of selection.agents){
  try{results.push(await configure(agent));}
  catch{results.push({status:'failed',agent,result:{status:'failed',reason:'RUNTIME_SETUP_FAILED'}});}
 }
 if(results.length===1)return results[0];
 return{schemaVersion:'agent-setup-batch/1',status:results.every(r=>r.status==='installed'&&r.result?.mcp==='ready')?'complete':'partial',results};
}
