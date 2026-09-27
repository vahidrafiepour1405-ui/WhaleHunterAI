export function buildMasterSignal(scan){
  const market=scan.market||{};
  const whale=scan.whale||{};
  const best=market.bestPair||{};
  const acc24=Array.isArray(whale.accumulating24h)?whale.accumulating24h:[];
  const acc7=Array.isArray(whale.accumulating7d)?whale.accumulating7d:[];
  const independent=Array.isArray(whale.independentWhales)?whale.independentWhales:[];
  const evidence=Number(scan.evidence?.score||0);
  const dexConfirmed=Boolean(scan.evidence?.confirmedDexBuyActivity);
  const liquidity=Number(best.liquidityUsd||0);
  const buys=Number(best.buys24h||0);
  const sells=Number(best.sells24h||0);
  const risk=[];
  if(!scan.dataQuality?.holderDiscoveryConfigured)risk.push("HOLDER_DATA_MISSING");
  if(liquidity<25000)risk.push("LOW_LIQUIDITY");
  if(sells>buys)risk.push("SELL_PRESSURE");
  if(!dexConfirmed)risk.push("NO_DEX_BUY_CONFIRMATION");
  if(acc24.length===0)risk.push("NO_24H_WHALE_NET_INFLOW");
  const confirmations=[];
  if(dexConfirmed)confirmations.push("DEX_BUY_ACTIVITY");
  if(acc24.length>=3)confirmations.push("MULTIPLE_WHALES_NET_INFLOW_24H");
  if(acc7.length>=3)confirmations.push("MULTIPLE_WHALES_NET_INFLOW_7D");
  if(independent.length>=10)confirmations.push("BROAD_INDEPENDENT_HOLDER_BASE");
  if(liquidity>=100000)confirmations.push("HEALTHY_LIQUIDITY");
  let state="INSUFFICIENT_EVIDENCE";
  if(evidence>=70&&confirmations.length>=3&&risk.length<=1)state="STRONG_EVIDENCE";
  else if(evidence>=45&&confirmations.length>=2&&risk.length<=2)state="WATCH";
  else if(evidence>=25)state="MIXED_EVIDENCE";
  return {
    state,
    evidenceScore:evidence,
    confirmations,
    risks:risk,
    note:"Evidence strength is not a probability of a future pump and is not investment advice."
  };
}
