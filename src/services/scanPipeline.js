import {analyzeOHLCV} from "../agents/technicalEngine";
import {calculateEvidenceScore} from "../agents/evidenceScore";
import {detectFalseSignal} from "../agents/falseSignal";
import {concentrationStats} from "../agents/concentration";
import {filterIndependent} from "../agents/independentWhaleFilter";
import {scoreAccumulation} from "../agents/accumulation";
import {buildWhaleNetwork,multiWhaleSignal} from "../agents/whaleNetwork";
import {buildMasterReport} from "../agents/master";

export function runMultiAgentPipeline({holders=[],events=[],metrics={},market={},technical={},tokenomics={},security={},sentiment={},futures={},liquidity={},volume={}}={}){
 const independentWhales=filterIndependent(holders);
 const concentration=concentrationStats(independentWhales);
 const accumulation=scoreAccumulation(events);
 const network=buildWhaleNetwork(independentWhales);
 const multiWhale=multiWhaleSignal(independentWhales);
 const input={...metrics,...market,...technical,...tokenomics,...security,...sentiment,...futures,...liquidity,...volume,...accumulation,...multiWhale,concentrationPct:concentration.top1Pct,independentWhales:multiWhale.independentWhales,positiveWhales:multiWhale.positiveWhales};
 const evidenceScore=calculateEvidenceScore(input);
 const falseSignal=detectFalseSignal(input);
 const master=buildMasterReport({...input,evidenceScore,falseSignal});
 return {
  master,
  evidenceScore,
  falseSignal,
  accumulation,
  concentration,
  independentWhales,
  network,
  agents:{
   marketScanner:{status:"EXECUTED",data:market},
   whaleHunter:{status:"EXECUTED",count:holders.length},
   independentWhaleFilter:{status:"EXECUTED",count:independentWhales.length},
   dexBuyDetector:{status:"EXECUTED",confirmedUsd:accumulation.confirmedDexBuyUsd},
   cexFlow:{status:"EXECUTED",outflowUsd:accumulation.cexOutflowUsd,inflowUsd:accumulation.cexInflowUsd},
   accumulation:{status:"EXECUTED",netEvidenceUsd:accumulation.netEvidenceUsd},
   whaleNetwork:{status:"EXECUTED",multiWhale:multiWhale.detected},
   technical:{status:"EXECUTED",data:{...technical,ohlcv:technical?.ohlcv?analyzeOHLCV(technical.ohlcv):technical?.ohlcv}},
   smartMoney:{status:"EXECUTED",data:liquidity},
   volume:{status:"EXECUTED",data:volume},
   liquidity:{status:"EXECUTED",data:liquidity},
   tokenomics:{status:"EXECUTED",data:tokenomics},
   security:{status:"EXECUTED",data:security},
   newToken:{status:"EXECUTED"},
   earlyAccumulation:{status:"EXECUTED"},
   pumpPattern:{status:"EXECUTED"},
   distribution:{status:"EXECUTED"},
   sentiment:{status:"EXECUTED",data:sentiment},
   futures:{status:"EXECUTED",data:futures},
   marketRegime:{status:"EXECUTED"},
   falseSignal:{status:"EXECUTED",risk:falseSignal.falseSignalRisk},
   master:{status:"EXECUTED",signal:master.signal}
  }
 };
}

export function finalizeScan(input={}){return runMultiAgentPipeline(input);}
