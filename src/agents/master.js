import {calculateEvidenceScore} from "./evidenceScore";
import {detectFalseSignal} from "./falseSignal";
export function buildMasterReport(input={}){
 const evidenceScore=calculateEvidenceScore(input);
 const falseSignal=detectFalseSignal(input);
 let label="NO_CLEAR_SIGNAL";
 if(evidenceScore>=70&&falseSignal.falseSignalRisk==="LOW")label="MULTI-WHALE ACCUMULATION EVIDENCE";
 else if(evidenceScore>=45)label="EARLY ACCUMULATION — NEEDS CONFIRMATION";
 return {label,evidenceScore,falseSignalRisk:falseSignal.falseSignalRisk,falseSignalReasons:falseSignal.reasons,disclaimer:"Evidence score measures evidence quality, not probability of price increase."};
}