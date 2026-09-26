export function combineAgentResults(results=[]){
 const valid=results.filter(Boolean);
 return {agents:valid,agentCount:valid.length,conflicts:valid.filter(x=>x.conflict===true),evidenceScore:Math.round(valid.reduce((s,x)=>s+Number(x.evidenceScore||0),0)/Math.max(valid.length,1))};
}