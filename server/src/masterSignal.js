export function buildMasterSignal(scan){
  const market=scan.market||{}, whale=scan.whale||{}, best=market.bestPair||{};
  const acc24=Array.isArray(whale.accumulating24h)?whale.accumulating24h:[];
  const acc7=Array.isArray(whale.accumulating7d)?whale.accumulating7d:[];
  const confirmedBuys=Array.isArray(whale.confirmedDexBuys24h)?whale.confirmedDexBuys24h:[];
  const independent=Array.isArray(whale.independentWhales)?whale.independentWhales:[];
  const evidence=Number(scan.evidence?.score||0), qualityScore=Number(scan.analysis?.whaleSignalQuality?.score||0);
  const confidence=Number(scan.confidence?.confidence||0), dexConfirmed=Boolean(scan.evidence?.confirmedDexBuyActivity);
  const liquidity=Number(best.liquidityUsd||0), buys=Number(best.buys24h||0), sells=Number(best.sells24h||0);
  const technical=String(scan.technical?.state||"");
  const risks=[];
  if(!scan.dataQuality?.holderDiscoveryConfigured)risks.push("HOLDER_DATA_MISSING");
  if(liquidity<25000)risks.push("LOW_LIQUIDITY");
  if(sells>buys)risks.push("SELL_PRESSURE");
  if(!dexConfirmed)risks.push("NO_MARKET_BUY_CONFIRMATION");
  if(acc24.length===0)risks.push("NO_24H_WHALE_NET_INFLOW");
  if(qualityScore<50)risks.push("LOW_WHALE_SIGNAL_QUALITY");
  if(confirmedBuys.length===0)risks.push("NO_WHALE_DEX_BUY_CONFIRMATION");
  if(scan.confidence?.contradictions?.length)risks.push("CROSS_SOURCE_CONTRADICTION");
  if(technical==="BEARISH_CONFIRMATION")risks.push("TECHNICAL_STRUCTURE_NEGATIVE");
  const confirmations=[];
  if(dexConfirmed)confirmations.push("DEX_BUY_ACTIVITY");
  if(confirmedBuys.length>0)confirmations.push("WHALE_DEX_BUY_CONFIRMED");
  if(acc24.length>=3)confirmations.push("MULTIPLE_WHALES_NET_INFLOW_24H");
  if(acc7.length>=3)confirmations.push("MULTIPLE_WHALES_NET_INFLOW_7D");
  if(independent.length>=10)confirmations.push("BROAD_INDEPENDENT_HOLDER_BASE");
  if(liquidity>=100000)confirmations.push("HEALTHY_LIQUIDITY");
  if((scan.confidence?.independentSourceCount||0)>=3)confirmations.push("MULTI_ONCHAIN_SOURCE_CONFIRMATION");
  if(Number(market.usdtPairCount||0)>0)confirmations.push("USDT_PAIR_LIQUIDITY_PATH");
  if(Number(market.cmc?.spotUsdtPairs||0)>0)confirmations.push("CMC_SPOT_USDT_CONFIRMATION");
  if(technical==="BULLISH_CONFIRMATION")confirmations.push("TECHNICAL_STRUCTURE_SUPPORT");
  if(qualityScore>=70)confirmations.push("HIGH_WHALE_SIGNAL_QUALITY");
  else if(qualityScore>=50)confirmations.push("ACCEPTABLE_WHALE_SIGNAL_QUALITY");
  let state="INSUFFICIENT_EVIDENCE";
  if(confidence>=80&&qualityScore>=70&&confirmedBuys.length>=2&&confirmations.length>=5&&risks.length<=1)state="STRONG_EVIDENCE";
  else if(confidence>=60&&qualityScore>=50&&confirmedBuys.length>=1&&confirmations.length>=3&&risks.length<=2)state="WATCH";
  else if(confidence>=40)state="MIXED_EVIDENCE";
  const buyScore=Math.min(100,Math.round(confidence*.35+qualityScore*.25+Math.min(30,acc24.length*5)+Math.min(15,confirmedBuys.length*5)+(technical==="BULLISH_CONFIRMATION"?15:0)-risks.length*6));
  const sellScore=Math.min(100,Math.round((sells>buys?20:0)+(technical==="BEARISH_CONFIRMATION"?35:0)+Math.max(0,50-qualityScore)*.35+Math.min(25,Math.max(0,risks.length-1)*8)));
  let action="WAIT";
  if(buyScore>=72&&buyScore>sellScore+10&&risks.length<=2)action="BUY_SIGNAL";
  else if(sellScore>=65&&sellScore>buyScore+8)action="SELL_SIGNAL";
  return {state,action,actionLabel:action==="BUY_SIGNAL"?"BUY":action==="SELL_SIGNAL"?"SELL":"WAIT",
    signalScore:Math.max(buyScore,sellScore),buyScore,sellScore,evidenceScore:evidence,confidence,
    confidenceLabel:scan.confidence?.label||"INSUFFICIENT",dataCompleteness:Number(scan.confidence?.dataCompleteness||0),
    independentSources:Number(scan.confidence?.independentSourceCount||0),confirmedWhaleBuys24h:confirmedBuys.length,
    whaleSignalQuality:qualityScore,confirmations,risks,calibration:scan.confidence?.calibration||null,
    note:"Signal is evidence-based, not a guarantee. Confidence measures evidence strength, not future price probability."};
}