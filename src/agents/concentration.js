export function concentrationStats(holders=[]){
 const vals=holders.map(x=>Math.max(0,Number(x.balanceUsd||0))).sort((a,b)=>b-a);
 const total=vals.reduce((a,b)=>a+b,0);
 const top1=total?vals[0]/total*100:0;
 const top5=total?vals.slice(0,5).reduce((a,b)=>a+b,0)/total*100:0;
 return {totalUsd:total,top1Pct:top1,top5Pct:top5,risk:top1>35?"HIGH":top5>60?"ELEVATED":"NORMAL"};
}