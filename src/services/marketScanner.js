import{filterIndependent}from"../agents/independentWhaleFilter";
import{analyzeTransfer}from"./flowEngine";
import{buildWhaleProfiles,summarizeWhales}from"../agents/whaleProfile";
export async function scanToken(provider,token){
 const holders=await provider.getTokenHolders(token);
 const independent=filterIndependent(holders||[]).map(w=>({...w,independent:true}));
 const profiles=buildWhaleProfiles(independent);
 const whaleSummary=summarizeWhales(profiles);
 const transfers=await provider.getTokenTransfers(token);
 const events=(transfers||[]).map(analyzeTransfer);
 const confirmed=events.filter(x=>x.type==="confirmed_dex_spot_buy").length;
 const cexOut=events.filter(x=>x.type==="cex_to_wallet").length;
 const cexIn=events.filter(x=>x.type==="wallet_to_cex").length;
 return{token,independentWhales:independent.length,whaleProfiles:profiles.slice(0,20),whaleSummary,confirmedDexBuyEvents:confirmed,cexOutflowEvents:cexOut,cexInflowEvents:cexIn,status:confirmed>0?"DEX BUY EVIDENCE":whaleSummary.positiveCount>=3?"MULTI-WHALE ACCUMULATION EVIDENCE":cexOut>0?"ACCUMULATION-SIDE FLOW":"NO_CLEAR_ACCUMULATION"};
}
export async function scanMarket(provider,limit=50){
 const tokens=await provider.getTrendingTokens(limit);const results=[];
 for(const token of tokens||[]){try{results.push(await scanToken(provider,token));}catch(error){results.push({token,status:"ERROR",error:String(error.message||error)})}}
 return results;
}