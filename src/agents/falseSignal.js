export function detectFalseSignal(x={}){
 const reasons=[];
 if(Number(x.cexOutflowUsd||0)>0&&Number(x.confirmedDexBuyUsd||0)===0)reasons.push("CEX_OUTFLOW_WITHOUT_CONFIRMED_DEX_BUY");
 if(Number(x.concentrationPct||0)>35)reasons.push("WALLET_CONCENTRATION_HIGH");
 if(Number(x.positiveWhales||0)<3)reasons.push("NOT_MULTI_WHALE");
 if(Number(x.cexInflowUsd||0)>Number(x.cexOutflowUsd||0))reasons.push("CEX_INFLOW_DOMINATES");
 return {falseSignalRisk:reasons.length>=2?"HIGH":reasons.length===1?"MEDIUM":"LOW",reasons};
}