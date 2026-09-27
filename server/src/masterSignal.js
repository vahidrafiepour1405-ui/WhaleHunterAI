export function buildMasterSignal(scan){
  const market=scan.market||{};
  const whale=scan.whale||{};
  const best=market.bestPair||{};
  const acc24=Array.isArray(whale.accumulating24h)?whale.accumulating24h:[];
  const acc7=Array.isArray(whale.accumulating7d)?whale.accumulating7d:[];
  const confirmedBuys=Array.isArray(whale.confirmedDexBuys24h)?whale.confirmedDexBuys24h:[];
  const independent=Array.isArray(whale.independentWhales)?whale.independentWhales:[];
  const evidence=Number(scan.evidence?.score||0);
  const confidence=Number(scan.confidence?.confidence||0);
  const dexConfirmed=Boolean(scan.evidence?.confirmedDexBuyActivity);
  const liquidity=Number(best.liquidityUsd||0);
  const buys=Number(best.buys24h||0);
  const sells=Number(best.sells24h||0);
  const risks=[];
  if(!scan.dataQuality?.holderDiscoveryConfigured)risks.push("HOLDER_DATA_MISSING");
  if(liquidity<25000)risks.push("LOW_LIQUIDITY");
  if(sells>buys)risks.push("SELL_PRESSURE");
  if(!dexConfirmed)risks.push("NO_MARKET_BUY_CONFIRMATION");
  if(acc24.length===0)risks.push("NO_24H_WHALE_NET_INFLOW");
  if(confirmedBuys.length===0)risks.push("NO_WHALE_DEX_BUY_CONFIRMATION");
  if(scan.confidence?.contradictions?.length)risks.push("CROSS_SOURCE_CONTRADICTION");
  if(String(scan.technical?.state||"") === "BEARISH_CONFIRMATION")risks.push("TECHNICAL_STRUCTURE_NEGATIVE");
  const confirmations=[];
  if(dexConfirmed)confirmations.push("DEX_BUY_ACTIVITY");
  if(confirmedBuys.length>0)confirmations.push("WHALE_DEX_BUY_CONFIRMED");
  if(acc24.length>=3)confirmations.push("MULTIPLE_WHALES_NET_INFLOW_24H");
  if(acc7.length>=3)confirmations.push("MULTIPLE_WHALES_NET_INFLOW_7D");
  if(independent.length>=10)confirmations.push("BROAD_INDEPENDENT_HOLDER_BASE");
  if(liquidity>=100000)confirmations.push("HEALTHY_LIQUIDITY");
  if((scan.confidence?.independentSourceCount||0)>=3)confirmations.push("MULTI_ONCHAIN_SOURCE_CONFIRMATION");
  if(Number(scan.market?.usdtPairCount||0)>0)confirmations.push("USDT_PAIR_LIQUIDITY_PATH");
  if(Number(scan.market?.cmc?.spotUsdtPairs||0)>0)confirmations.push("CMC_SPOT_USDT_CONFIRMATION");
  if(String(scan.technical?.state||"") === "BULLISH_CONFIRMATION")confirmations.push("TECHNICAL_STRUCTURE_SUPPORT");
  let state="INSUFFICIENT_EVIDENCE";
  if(confidence>=80&&confirmedBuys.length>=2&&confirmations.length>=4&&risks.length<=1)state="STRONG_EVIDENCE";
  else if(confidence>=60&&confirmedBuys.length>=1&&confirmations.length>=2&&risks.length<=2)state="WATCH";
  else if(confidence>=40)state="MIXED_EVIDENCE";
  return {
    state,
    evidenceScore:evidence,
    confidence,
    confidenceLabel:scan.confidence?.label||"INSUFFICIENT",
    dataCompleteness:Number(scan.confidence?.dataCompleteness||0),
    independentSources:Number(scan.confidence?.independentSourceCount||0),
    confirmedWhaleBuys24h:confirmedBuys.length,
    confirmations,
    risks,
    calibration:scan.confidence?.calibration||null,
    note:"Confidence measures evidence strength. It is not a probability of a future price move; calibrated accuracy is shown only after historical backtesting."
  };
}
