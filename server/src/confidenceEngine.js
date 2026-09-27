const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
function sourceStatus(name,configured,available,evidence=0){
  return {name,configured:Boolean(configured),available:Boolean(available),evidence:clamp(Number(evidence)||0)};
}
export function buildConfidence(scan){
  const market=scan.market||{};
  const whale=scan.whale||{};
  const dq=scan.dataQuality||{};
  const evidence=scan.evidence||{};
  const best=market.bestPair||{};
  const acc24=Array.isArray(whale.accumulating24h)?whale.accumulating24h:[];
  const acc7=Array.isArray(whale.accumulating7d)?whale.accumulating7d:[];
  const confirmed=Array.isArray(whale.confirmedDexBuys24h)?whale.confirmedDexBuys24h:[];
  const independent=Array.isArray(whale.independentWhales)?whale.independentWhales:[];
  const providers=dq.providers||{};
  const sources=[
    sourceStatus("dexscreener",true,Number(dq.dexPairsFound||0)>0,(Number(dq.dexPairsFound||0)>0?18:0)),
    sourceStatus("bitquery",Boolean(providers.holderDiscovery),Boolean(dq.holderRows||0)>0,Number(dq.holderRows||0)>0?22:0),
    sourceStatus("address_labels",Boolean(providers.addressLabels),Number(dq.labeledRows||0)>0,Number(dq.labeledRows||0)>0?12:0),
    sourceStatus("wallet_dex_trades",Boolean(providers.walletDexTrades),Number(dq.whaleDexBuyRows||0)>0,Number(dq.whaleDexBuyRows||0)>0?25:0),
    sourceStatus("coingecko",Boolean(providers.coingecko),Boolean(scan.marketDiscovery?.coingecko||scan.coingeckoId),scan.marketDiscovery?.coingecko?8:scan.coingeckoId?8:0),
    sourceStatus("coinmarketcap",Boolean(providers.coinmarketcap),Boolean(scan.marketDiscovery?.cmc),scan.marketDiscovery?.cmc?10:0),
    sourceStatus("nansen",Boolean(providers.nansen),Boolean(dq.nansenRows||0)>0,Number(dq.nansenRows||0)>0?10:0),
    sourceStatus("arkham",Boolean(providers.arkham),Boolean(dq.arkhamRows||0)>0,Number(dq.arkhamRows||0)>0?5:0)
  ];
  const active=sources.filter(x=>x.available);
  const independentSourceCount=active.filter(x=>["bitquery","address_labels","wallet_dex_trades","nansen","arkham"].includes(x.name)).length;
  const marketSourceCount=active.filter(x=>["coinmarketcap","coingecko"].includes(x.name)).length;
  const contradictions=[];
  if(Number(best.sells24h||0)>Number(best.buys24h||0))contradictions.push("MARKET_SELL_PRESSURE");
  if(acc24.length===0&&confirmed.length===0)contradictions.push("NO_WHALE_ACCUMULATION_CONFIRMATION");
  if(dq.tradeError)contradictions.push("WALLET_TRADE_PROVIDER_ERROR");
  if(dq.holderError)contradictions.push("HOLDER_OR_LABEL_PROVIDER_ERROR");
  let raw=0;
  raw+=confirmed.length>0?30:0;
  raw+=acc24.length>=3?15:acc24.length>0?8:0;
  raw+=acc7.length>=3?10:acc7.length>0?5:0;
  raw+=independent.length>=10?10:independent.length>0?5:0;
  raw+=Number(best.buys24h||0)>Number(best.sells24h||0)?10:0;
  raw+=Number(best.liquidityUsd||0)>=100000?10:Number(best.liquidityUsd||0)>=25000?5:0;
  raw+=Number(best.volume24hUsd||0)>=100000?5:Number(best.volume24hUsd||0)>=25000?3:0;
  raw-=contradictions.length*7;
  const analysis=scan.analysis||{};
  const manipulationRisk=Number(analysis.manipulationRisk?.heuristicScore||0);
  if(manipulationRisk>=70)raw-=15;
  else if(manipulationRisk>=40)raw-=7;
  if(scan.evidence?.crossSourceWhaleFlowAgreement===true)raw+=8;
  if(scan.evidence?.crossSourceWhaleFlowAgreement===false)raw-=8;
  if(Number(scan.evidence?.nansenWhaleNetFlow24hUsd||0)>0)raw+=5;
  if(Number(scan.evidence?.nansenWhaleNetFlow7dUsd||0)>0)raw+=4;
  const coverage=active.length?active.reduce((s,x)=>s+x.evidence,0)/Math.max(1,sources.reduce((s,x)=>s+(x.configured?1:0),0)*1):0;
  const agreementBonus=(independentSourceCount>=5?10:independentSourceCount>=4?8:independentSourceCount>=3?5:independentSourceCount>=2?3:0)+(marketSourceCount>=2?3:marketSourceCount>=1?1:0);
  const sourceCap=independentSourceCount>=5?100:independentSourceCount===4?90:independentSourceCount===3?80:independentSourceCount===2?65:independentSourceCount===1?50:25;
  const confidence=clamp(Math.min(sourceCap,Math.round(raw+agreementBonus)));
  const dataCompleteness=clamp(Math.round((active.length/Math.max(1,sources.length))*100));
  const calibrated=Boolean(scan.validation?.backtest?.sampleSize>=100);
  return {
    confidence,
    label:confidence>=80?"HIGH":confidence>=60?"MODERATE":confidence>=40?"LOW":"INSUFFICIENT",
    dataCompleteness,
    independentSourceCount,
    marketSourceCount,
    sources,
    contradictions,
    calibrated,
    calibration:{
      sampleSize:Number(scan.validation?.backtest?.sampleSize||0),
      accuracy:calibrated?Number(scan.validation.backtest.accuracy):null,
      note:calibrated?"Empirical accuracy from stored historical outcomes.":"Not yet calibrated: this percentage is evidence confidence, not historical prediction accuracy."
    },
    formula:{
      evidenceScore:Number(evidence.score||0),
      coverage:Math.round(coverage),
      agreementBonus,
      rawEvidence:clamp(raw)
    }
  };
}
