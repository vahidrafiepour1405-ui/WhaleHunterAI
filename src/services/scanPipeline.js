import {calculateEvidenceScore} from "../agents/evidenceScore";
import {detectFalseSignal} from "../agents/falseSignal";
import {concentrationStats} from "../agents/concentration";
export function finalizeScan({holders=[],metrics={}}){
 const concentration=concentrationStats(holders);
 const input={...metrics,concentrationPct:concentration.top1Pct};
 const evidenceScore=calculateEvidenceScore(input);
 const falseSignal=detectFalseSignal(input);
 return {...input,concentration,evidenceScore,falseSignal};
}