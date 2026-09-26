import {calculateEvidenceScore} from "./evidenceScore";
import {detectFalseSignal} from "./falseSignal";
export function buildMasterReport(input={}){
 const evidenceScore=calculateEvidenceScore(input);
 const falseSignal=detectFalseSignal(input);
 const buyEvidence=Number(input.confirmedDexBuyUsd||0)>0||Number(input.confirmedDexBuyEvents||0)>0;
 const whaleAccum=Number(input.positiveWhales||0)>=3&&Number(input.netChangeUsd||0)>0;
 const distribution=Number(input.cexInflowUsd||0)>Number(input.cexOutflowUsd||0)&&Number(input.cexInflowUsd||0)>0;
 let signal="NEUTRAL";
 if(!distribution&&(buyEvidence&&whaleAccum||evidenceScore>=70&&falseSignal.falseSignalRisk==="LOW"))signal="BUY_SIGNAL";
 else if(distribution||(!buyEvidence&&Number(input.cexInflowEvents||0)>Number(input.cexOutflowEvents||0)))signal="SELL_SIGNAL";
 let label="NO_CLEAR_SIGNAL";
 if(signal==="BUY_SIGNAL")label="BUY SIGNAL — MULTI-WHALE EVIDENCE";
 else if(signal==="SELL_SIGNAL")label="SELL SIGNAL — DISTRIBUTION EVIDENCE";
 else if(evidenceScore>=45)label="WATCH — NEEDS CONFIRMATION";
 return {signal,label,evidenceScore,falseSignalRisk:falseSignal.falseSignalRisk,falseSignalReasons:falseSignal.reasons,disclaimer:"Signals are evidence-based alerts, not guarantees or financial advice."};
}