const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const norm=a=>String(a||"").toLowerCase();

export function analyzeTokenStructure(scan){
  const market=scan.market||{};
  const best=market.bestPair||{};
  const holders=Array.isArray(scan.whale?.independentWhales)?scan.whale.independentWhales:[];
  const acc24=Array.isArray(scan.whale?.accumulating24h)?scan.whale.accumulating24h:[];
  const acc7=Array.isArray(scan.whale?.accumulating7d)?scan.whale.accumulating7d:[];
  const confirmed=Array.isArray(scan.whale?.confirmedDexBuys24h)?scan.whale.confirmedDexBuys24h:[];
  const nansen=scan.nansen||{};
  const nansenBuyers=Array.isArray(nansen.buyers24h)?nansen.buyers24h:[];
  const balances=holders.map(x=>Number(x.balanceUsd||0)).filter(Number.isFinite).sort((a,b)=>b-a);
  const totalTop100=balances.reduce((s,x)=>s+x,0);
  const top10=balances.slice(0,10).reduce((s,x)=>s+x,0);
  const top1=balances[0]||0;
  const concentrationTop10Pct=totalTop100?top10/totalTop100*100:null;
  const concentrationTop1Pct=totalTop100?top1/totalTop100*100:null;

  const flow24=acc24.reduce((s,x)=>s+Number(x.netFlow||0),0);
  const flow7=acc7.reduce((s,x)=>s+Number(x.netFlow||0),0);
  const price=Number(best.priceUsd||0);
  const flow24Usd=price?flow24*price:null;
  const flow7Usd=price?flow7*price:null;
  const buyUsd=nansenBuyers.reduce((s,x)=>s+Math.max(0,Number(x.boughtVolumeUsd||0)),0);
  const sellUsd=nansenBuyers.reduce((s,x)=>s+Math.max(0,Number(x.soldVolumeUsd||0)),0);
  const netBuyUsd=buyUsd-sellUsd;
  const buyShare=buyUsd+sellUsd?buyUsd/(buyUsd+sellUsd)*100:null;

  const transfers24=Number(scan.flows?.transferCount24h||0);
  const internalHolderTransfers=Number(scan.flows?.internalHolderTransfers24h||0);
  const internalRatio=transfers24?internalHolderTransfers/transfers24*100:0;
  const marketBuys=Number(best.buys24h||0);
  const marketSells=Number(best.sells24h||0);
  const marketBuyShare=marketBuys+marketSells?marketBuys/(marketBuys+marketSells)*100:null;
  const liquidity=Number(best.liquidityUsd||0);
  const volume=Number(best.volume24hUsd||0);
  const volumeLiquidityRatio=liquidity?volume/liquidity:null;

  const redFlags=[];
  if(concentrationTop10Pct!==null&&concentrationTop10Pct>70)redFlags.push("TOP10_CONCENTRATION_HIGH");
  if(concentrationTop1Pct!==null&&concentrationTop1Pct>35)redFlags.push("TOP1_CONCENTRATION_HIGH");
  if(internalRatio>35)redFlags.push("HIGH_INTERNAL_HOLDER_TRANSFER_RATIO");
  if(marketSells>marketBuys*1.25)redFlags.push("MARKET_SELL_DOMINANCE");
  if(liquidity>0&&volumeLiquidityRatio>40)redFlags.push("EXTREME_VOLUME_TO_LIQUIDITY");
  if(nansenBuyers.length>0&&netBuyUsd<0)redFlags.push("NANSEN_BUY_SET_NET_NEGATIVE");

  const confirmations=[];
  if(confirmed.length>0)confirmations.push("WALLET_LEVEL_DEX_BUYS");
  if(flow24>0)confirmations.push("POSITIVE_24H_NET_FLOW");
  if(flow7>0)confirmations.push("POSITIVE_7D_NET_FLOW");
  if(nansen.flow1d?.whaleNetFlowUsd>0)confirmations.push("NANSEN_WHALE_FLOW_POSITIVE_1D");
  if(nansen.flow7d?.whaleNetFlowUsd>0)confirmations.push("NANSEN_WHALE_FLOW_POSITIVE_7D");
  if(scan.evidence?.crossSourceWhaleFlowAgreement===true)confirmations.push("BITQUERY_NANSEN_FLOW_AGREEMENT");
  if(nansenBuyers.length>=3&&netBuyUsd>0)confirmations.push("MULTIPLE_NANSEN_NET_BUYERS");
  if(marketBuyShare!==null&&marketBuyShare>55)confirmations.push("MARKET_BUY_SHARE_POSITIVE");

  const washHeuristic=clamp(Math.round(
    (internalRatio>50?35:internalRatio>35?22:internalRatio>20?10:0)+
    (marketBuys+marketSells>1000&&liquidity>0&&volume/liquidity>50?30:0)+
    (confirmed.length>0&&nansenBuyers.length>0?0:10)
  ));

  return{
    holderStructure:{
      top1Usd:top1,
      top10Usd:top10,
      top100Usd:totalTop100,
      top1ConcentrationPct:concentrationTop1Pct,
      top10ConcentrationPct:concentrationTop10Pct,
      independentHolderCount:holders.length
    },
    flowQuality:{
      netFlow24hTokens:flow24,
      netFlow7dTokens:flow7,
      estimatedNetFlow24hUsd:flow24Usd,
      estimatedNetFlow7dUsd:flow7Usd,
      internalHolderTransferRatioPct:internalRatio
    },
    marketQuality:{
      buySharePct:marketBuyShare,
      liquidityUsd:liquidity,
      volume24hUsd:volume,
      volumeToLiquidityRatio:volumeLiquidityRatio
    },
    crossSource:{
      nansenBuyerCount24h:nansenBuyers.length,
      nansenNetBuyUsd:netBuyUsd,
      nansenBuySharePct:buyShare,
      nansenWhaleNetFlow1dUsd:Number(nansen.flow1d?.whaleNetFlowUsd||0),
      nansenWhaleNetFlow7dUsd:Number(nansen.flow7d?.whaleNetFlowUsd||0),
      flowAgreement:scan.evidence?.crossSourceWhaleFlowAgreement??null
    },
    manipulationRisk:{
      heuristicScore:washHeuristic,
      label:washHeuristic>=70?"HIGH":washHeuristic>=40?"MODERATE":"LOW",
      flags:redFlags
    },
    confirmations,
    redFlags
  };
}
