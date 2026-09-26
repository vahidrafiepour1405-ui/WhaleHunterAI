export function scoreAccumulation(events=[]){
 let confirmed=0,outflow=0,inflow=0;
 for(const e of events){
  if(e.type==="confirmed_dex_spot_buy")confirmed+=Number(e.usdValue||0);
  if(e.type==="cex_to_wallet")outflow+=Number(e.usdValue||0);
  if(e.type==="wallet_to_cex")inflow+=Number(e.usdValue||0);
 }
 const evidence=confirmed+outflow-inflow;
 return {confirmedDexBuyUsd:confirmed,cexOutflowUsd:outflow,cexInflowUsd:inflow,netEvidenceUsd:evidence,warning:confirmed===0&&outflow>0?"CEX outflow is not proof of a fresh purchase":"",};
}