import {isIndependentWhale} from "./independentWhaleFilter";
export function buildWhaleNetwork(wallets=[]){
 const independent=wallets.filter(isIndependentWhale);
 const edges=[];
 for(let i=0;i<independent.length;i++)for(let j=i+1;j<independent.length;j++){
  const a=independent[i],b=independent[j];
  const overlap=(a.sharedTokens||[]).filter(t=>(b.sharedTokens||[]).includes(t));
  if(overlap.length)edges.push({a:a.address,b:b.address,sharedTokens:overlap});
 }
 return {wallets:independent,edges,independentCount:independent.length};
}
export function multiWhaleSignal(wallets=[]){
 const n=wallets.filter(isIndependentWhale).length;
 const positive=wallets.filter(w=>isIndependentWhale(w)&&Number(w.netChangeUsd||0)>0);
 return {independentWhales:n,positiveWhales:positive.length,detected:positive.length>=3};
}