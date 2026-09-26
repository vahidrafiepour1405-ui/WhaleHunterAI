import {isIndependentWhale} from "../agents/independentWhaleFilter";
export function rankWhales(holders=[]){
 return holders.filter(isIndependentWhale).map(w=>({...w,netChangeUsd:Number(w.netChangeUsd||0),repeatedBuys:Number(w.repeatedBuys||0)})).sort((a,b)=>(b.netChangeUsd-a.netChangeUsd)||(b.repeatedBuys-a.repeatedBuys));
}