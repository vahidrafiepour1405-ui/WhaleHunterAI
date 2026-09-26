export function buildWhaleProfiles(holders=[]){
 return holders.filter(h=>h?.address).map((h,i)=>{
  const buy=Number(h.buyUsd||0),sell=Number(h.sellUsd||0),net=Number(h.netChangeUsd||buy-sell);
  const activity=buy+sell;
  const accumulation=activity>0?Math.round((Math.max(0,net)/activity)*100):0;
  return {...h,index:i+1,netBuyUsd:net,activityUsd:activity,accumulationPct:accumulation,behavior:net>0?"ACCUMULATING":net<0?"DISTRIBUTING":"NEUTRAL"};
 }).sort((a,b)=>Number(b.netBuyUsd||0)-Number(a.netBuyUsd||0));
}
export function summarizeWhales(profiles=[]){
 const totalBuy=profiles.reduce((n,x)=>n+Number(x.buyUsd||0),0);
 const totalSell=profiles.reduce((n,x)=>n+Number(x.sellUsd||0),0);
 const positive=profiles.filter(x=>Number(x.netBuyUsd||0)>0);
 return {count:profiles.length,positiveCount:positive.length,totalBuyUsd:totalBuy,totalSellUsd:totalSell,netBuyUsd:totalBuy-totalSell,independentCount:profiles.filter(x=>x.independent!==false).length};
}