import {getDexPairs,normalizeChain,providerStatus} from "./providers.js";
import {getTopHolders,getHolderFlows,rankAccumulation} from "./holderProvider.js";
import {classifyAddress} from "./addressClassifier.js";
import {getAddressLabels,isNonIndependentLabel} from "./addressLabels.js";
import {getWalletTokenBuys,aggregateWalletBuys} from "./dexTradeProvider.js";
import {buildConfidence} from "./confidenceEngine.js";
import {getNansenHolders,getNansenWhoBoughtSold,getNansenFlowIntelligence,normalizeNansenHolder,normalizeNansenBuyer,summarizeNansenFlow} from "./nansenProvider.js";
import {analyzeTokenStructure} from "./tokenAnalysisEngine.js";
import {getListings,normalizeCmcAsset,getMarketPairs,rankFusion} from "./coinMarketCapProvider.js";
import {analyzeTechnical} from "./technicalProvider.js";
import {getCmcDexHolders} from "./cmcHolderProvider.js";

const CEX_HINTS=["binance","coinbase","kraken","okx","bybit","kucoin","gate","bitget","crypto.com"];

function addressLooksLike(a){return /^0x[a-fA-F0-9]{40}$/.test(a)||/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)}

function classifyPair(p){
  const txns=p.txns||{};
  const buys=Number(txns.buys||0);
  const sells=Number(txns.sells||0);
  const baseSymbol=String(p.baseToken?.symbol||"").toUpperCase();
  const quoteSymbol=String(p.quoteToken?.symbol||"").toUpperCase();
  const stableQuote=["USDT","USDC","DAI","FDUSD","USDP","TUSD","USD"].includes(quoteSymbol);
  const usdtQuote=quoteSymbol==="USDT";
  const pairPreferenceScore=(usdtQuote?40:stableQuote?25:0)+(Number(p.liquidity?.usd||0)>100000?15:0)+(Number(p.volume?.h24||0)>100000?15:0);
  return {
    dex:p.dexId||"unknown",
    pairAddress:p.pairAddress,
    baseSymbol,
    quoteSymbol,
    stableQuote,
    usdtQuote,
    pairPreferenceScore,
    priceUsd:p.priceUsd?Number(p.priceUsd):null,
    liquidityUsd:Number(p.liquidity?.usd||0),
    volume24hUsd:Number(p.volume?.h24||0),
    buys24h:buys,
    sells24h:sells,
    confirmedDexSpotBuyActivity:buys>0&&buys>sells
  };
}

export async function scanToken({chain,address,cmcId=null}){
  if(!addressLooksLike(address))throw new Error("INVALID_ADDRESS");
  const normalized=normalizeChain(chain);
  const pairs=await getDexPairs(normalized,address);
  const pairData=pairs.map(classifyPair).sort((a,b)=>b.pairPreferenceScore-a.pairPreferenceScore||b.volume24hUsd-a.volume24hUsd);
  const best=pairData[0]||null;
  let cmcMarketPairs=null; let cmcMarketError=null;
  let technical=null; let technicalError=null;
  if(best?.pairAddress){try{technical=await analyzeTechnical({chain:normalized,pairAddress:best.pairAddress});}catch(error){technicalError=error.message||"TECHNICAL_ERROR";}}
  if(cmcId&&process.env.CMC_API_KEY){try{cmcMarketPairs=await getMarketPairs(cmcId);}catch(error){cmcMarketError=error.message||"CMC_MARKET_ERROR";}}

  const cexHints=[];
  const confirmedDexBuys=pairData.filter(x=>x.confirmedDexSpotBuyActivity).length;
  let holders=[]; let flows24=[]; let flows7=[]; let holderError=null;
  let cmcHolderRows=[]; let cmcHolderError=null;
  try{cmcHolderRows=await getCmcDexHolders({chain:normalized,address,tag:"tag_all"});}catch(error){cmcHolderError=error.message||"CMC_HOLDERS_ERROR";}
  if(process.env.BITQUERY_API_KEY){
    try{
      holders=await getTopHolders({chain:normalized,address,limit:100});
      flows24=await getHolderFlows({chain:normalized,address,hours:24,limit:5000});
      flows7=await getHolderFlows({chain:normalized,address,hours:168,limit:10000});
    }catch(error){holderError=error.message||"HOLDER_SCAN_ERROR";}
  }

  const pairAddresses=pairData.map(x=>x.pairAddress).filter(Boolean);
  let labelRows=[];  if(holders.length&&process.env.BITQUERY_API_KEY){try{labelRows=await getAddressLabels(holders.map(h=>h.Holder?.Address),normalized);}catch(error){holderError=holderError||error.message||"ADDRESS_LABEL_ERROR";}}  const labelMap=new Map();  for(const row of labelRows){const key=String(row.Address||"").toLowerCase();if(!labelMap.has(key))labelMap.set(key,[]);labelMap.get(key).push(row);}  const classified=holders.map(h=>{const holderAddress=h.Holder?.Address;const labels=labelMap.get(String(holderAddress||"").toLowerCase())||[];const labelExcluded=labels.some(isNonIndependentLabel);return {...h,address:holderAddress,labels:labels.map(x=>x.Label),classify:labelExcluded?{excluded:true,reason:"LABELED_NON_INDEPENDENT"}:classifyAddress(holderAddress,{tokenAddress:address,pairAddresses})};});
  const activeHolders=classified.filter(x=>!x.classify.excluded);
  const minWhaleUsd=Math.max(0,Number(process.env.MIN_WHALE_USD||100000));
  const whaleHolders=activeHolders.filter(x=>Number(x.Balance?.AmountInUSD||0)>=minWhaleUsd);
  const cmcQualifiedWhales=cmcHolderRows.filter(x=>Number(x.balanceUsd||0)>=minWhaleUsd);
  const whaleAnalysisHolders=whaleHolders;
  const accum24=rankAccumulation(whaleAnalysisHolders,flows24);
  const accum7=rankAccumulation(whaleAnalysisHolders,flows7);
  const realAccum24=accum24.filter(x=>x.netFlow>0);
  const realAccum7=accum7.filter(x=>x.netFlow>0);
  const cmcAccumulating=cmcQualifiedWhales.filter(x=>Number(x.netBuyAmount||0)>0).sort((a,b)=>Number(b.buyUsd||0)-Number(a.buyUsd||0));
  const activeSet=new Set(activeHolders.map(x=>String(x.address||"").toLowerCase()).filter(Boolean));
  const internalHolderTransfers24h=flows24.reduce((n,row)=>{const t=row.Transfer||{};return n+(activeSet.has(String(t.Sender||"").toLowerCase())&&activeSet.has(String(t.Receiver||"").toLowerCase())?1:0);},0);
  let nansenHolders=[]; let nansenBuyers=[]; let nansenFlow1d=null; let nansenFlow7d=null; let nansenError=null;
  if(process.env.NANSEN_API_KEY){
    try{
      const [nh,nb,n1,n7]=await Promise.all([
        getNansenHolders({chain:normalized,address,limit:100}),
        getNansenWhoBoughtSold({chain:normalized,address,hours:24}),
        getNansenFlowIntelligence({chain:normalized,address,timeframe:"1d"}),
        getNansenFlowIntelligence({chain:normalized,address,timeframe:"7d"})
      ]);
      nansenHolders=nh.rows.map(normalizeNansenHolder);
      nansenBuyers=nb.rows.map(normalizeNansenBuyer);
      nansenFlow1d=summarizeNansenFlow(n1.rows);
      nansenFlow7d=summarizeNansenFlow(n7.rows);
    }catch(error){nansenError=error.message||"NANSEN_ERROR";}
  }

  let walletBuys24=[]; let tradeError=null;
  if(holders.length&&process.env.BITQUERY_API_KEY){try{const rows=await getWalletTokenBuys({chain:normalized,address,holderAddresses:activeHolders.map(x=>x.address),hours:24});walletBuys24=aggregateWalletBuys(rows);}catch(error){tradeError=error.message||"DEX_TRADE_ERROR";}}
  const buyMap=new Map(walletBuys24.map(x=>[String(x.address).toLowerCase(),x]));
  const confirmedWhaleBuys24=realAccum24.map(x=>({...x,dexBuy:buyMap.get(String(x.address).toLowerCase())||null})).filter(x=>x.dexBuy&&x.dexBuy.buys>0);
  const evidence=Math.max(0,Math.min(100,
    (confirmedDexBuys>0?35:0)+
    (best?.liquidityUsd>=100000?20:best?.liquidityUsd>=25000?10:0)+
    (best?.buys24h>best?.sells24h?20:0)+
    (best?.volume24hUsd>=100000?15:best?.volume24hUsd>=25000?8:0))-
    (cexHints.length>0?10:0)
  );

  const output={
    ok:true,
    timestamp:new Date().toISOString(),
    chain:normalized,
    address,
    dataQuality:{
      dexPairsFound:pairData.length,
      transferHistoryConfigured:Boolean(process.env.BITQUERY_API_KEY),
      holderDiscoveryConfigured:true,
      providers:{...providerStatus(),coingecko:Boolean(process.env.COINGECKO_API_KEY),arkham:Boolean(process.env.ARKHAM_API_KEY)},
      holderRows:holders.length,
      cmcHolderRows:cmcHolderRows.length,
      cmcQualifiedWhaleRows:cmcQualifiedWhales.length,
      cmcHolderError,
      qualifiedWhaleRows:whaleAnalysisHolders.length,
      whaleThresholdMet:whaleHolders.length>0,
      minWhaleUsd,
      labeledRows:labelRows.length,
      whaleDexBuyRows:confirmedWhaleBuys24.length,
      tradeError,
      holderError,
      nansenRows:nansenHolders.length,
      nansenBuyerRows:nansenBuyers.length,
      nansenFlow1d,
      nansenFlow7d,
      nansenError,
      technicalError,
      note:"No wallet-level accumulation is inferred until a holder/indexing provider and address-label source are configured."
    },
    technical:technical||{score:0,state:"UNAVAILABLE",candles:[],ema20:null,ema50:null,rsi14:null,volumeRatio:null,change24h:null,change7d:null,note:"Technical analysis unavailable."},
    market:{
      bestPair:best,
      pairs:pairData.slice(0,20),
      usdtPairCount:pairData.filter(x=>x.usdtQuote).length,
      stableQuotePairCount:pairData.filter(x=>x.stableQuote).length,
      cmc:{marketPairCount:Number(cmcMarketPairs?.num_market_pairs||0),usdtPairs:Array.isArray(cmcMarketPairs?.market_pairs)?cmcMarketPairs.market_pairs.filter(x=>String(x.market_pair_quote?.currency_symbol||"").toUpperCase()==="USDT").length:null,spotUsdtPairs:Array.isArray(cmcMarketPairs?.market_pairs)?cmcMarketPairs.market_pairs.filter(x=>String(x.market_pair_quote?.currency_symbol||"").toUpperCase()==="USDT"&&String(x.category||"").toLowerCase()==="spot").length:null,error:cmcMarketError}
    },
    nansen:{holders:nansenHolders.slice(0,100),buyers24h:nansenBuyers.slice(0,100),flow1d:nansenFlow1d,flow7d:nansenFlow7d},
    cmcHolders:{rows:cmcQualifiedWhales.slice(0,100),accumulating:cmcAccumulating.slice(0,100)},
    whale:{status:holders.length||nansenHolders.length||cmcHolderRows.length?"LIVE_HOLDERS":"HOLDER_PROVIDER_REQUIRED",minWhaleUsd,qualifiedWhaleCount:Math.max(whaleAnalysisHolders.length,cmcQualifiedWhales.length),independentWhales:whaleAnalysisHolders.slice(0,100).map(x=>({address:x.address,balance:x.Balance?.Amount||null,balanceUsd:x.Balance?.AmountInUSD||null})),accumulating24h:realAccum24.length?realAccum24.slice(0,100):cmcAccumulating.map(x=>({address:x.address,balance:x.balance,balanceUsd:x.balanceUsd,netFlow:x.netBuyAmount,buyUsd:x.buyUsd,sellUsd:x.sellUsd,source:"CMC_Dex_Holders"})).slice(0,100),accumulating7d:realAccum7.slice(0,100),confirmedDexBuys24h:confirmedWhaleBuys24.slice(0,100),excluded:classified.filter(x=>x.classify.excluded).map(x=>({address:x.address,reason:x.classify.reason}))},
    flows:{transferCount24h:flows24.length,transferCount7d:flows7.length,internalHolderTransfers24h,cexHintCount:0},
    evidence:{
      score:evidence,
      confirmedDexBuyActivity:confirmedDexBuys>0,
      nansenWhaleNetFlow24hUsd:Number(nansenFlow1d?.whaleNetFlowUsd||0),
      nansenWhaleNetFlow7dUsd:Number(nansenFlow7d?.whaleNetFlowUsd||0),
      nansenBuyerCount24h:nansenBuyers.length,
      cmcHolderNetBuyCount:cmcAccumulating.length,
      cmcHolderBuyUsd:cmcAccumulating.reduce((s,x)=>s+Number(x.buyUsd||0),0),
      technicalScore:Number(technical?.score||0),
      technicalState:technical?.state||"UNAVAILABLE",
      crossSourceWhaleFlowAgreement:
        (nansenFlow1d && realAccum24.length>0)
          ? Math.sign(Number(nansenFlow1d.whaleNetFlowUsd||0))===Math.sign(realAccum24.reduce((s,x)=>s+Number(x.netFlow||0),0))
          : null
    },
    confidence:null,
    limitations:[
      "Top-holder discovery requires a holder/indexing provider.",
      "DEX pair buy/sell counts are market-level activity, not proof that a specific whale bought.",
      "CEX labels require a maintained address-label dataset.",
      "Nansen data is cross-check evidence when its API key and chain coverage are active.",
      "Confidence is evidence strength unless historical backtest calibration is available."
    ]
  };
  output.analysis=analyzeTokenStructure(output);
  output.confidence=buildConfidence(output);
  return output;
}

export async function discoverAndScanMarket(limit=100){
  const deepMax=Math.min(100,Math.max(1,Number(limit)||100));
  const surveillanceTop=500;
  const discoveryUniverse=5000;
  const rotationBatch=Math.min(100,Math.max(1,Number(process.env.TOP500_DEEP_SCAN_BATCH||100)));
  const rotationOffset=Math.floor(Date.now()/3600000)%Math.max(1,Math.ceil(surveillanceTop/rotationBatch));
  const [cmcRes,geckoRes]=await Promise.allSettled([
    getListings(discoveryUniverse),
    (async()=>{
      const key=process.env.COINGECKO_API_KEY;
      const headers=key?{"x-cg-demo-api-key":key}:{};
      const pages=await Promise.all([1,2].map(async page=>{
        const url=new URL("https://api.coingecko.com/api/v3/coins/markets");
        url.searchParams.set("vs_currency","usd");
        url.searchParams.set("order","market_cap_desc");
        url.searchParams.set("per_page","250");
        url.searchParams.set("page",String(page));
        url.searchParams.set("sparkline","false");
        const response=await fetch(url,{headers});
        if(!response.ok)throw new Error("COINGECKO_"+response.status);
        return response.json();
      }));
      return pages.flat().slice(0,surveillanceTop);
    })()  ]);
  const cmc=cmcRes.status==="fulfilled"?cmcRes.value.map(normalizeCmcAsset):[];
  const gecko=geckoRes.status==="fulfilled"?geckoRes.value:[];
  const cgMap=new Map(gecko.map(x=>[String(x.id||"").toLowerCase(),x]));
  const cgByContract=new Map();
  for(const g of gecko){
    for(const [platform,address] of Object.entries(g.platforms||{})){
      if(address)cgByContract.set(String(platform).toLowerCase()+":"+String(address).toLowerCase(),g);
    }
  }
  const platformChain=name=>{
    const n=String(name||"").toLowerCase();
    if(n.includes("ethereum"))return"ethereum";
    if(n.includes("arbitrum"))return"arbitrum";
    if(n.includes("base"))return"base";
    if(n.includes("polygon"))return"polygon";
    if(n.includes("solana"))return"solana";
    return null;
  };
  const major=["BTC","ETH","BNB","SOL","XRP","ADA","DOGE","AVAX","LINK","TRX","TON","DOT","MATIC","POL","LTC","BCH","ATOM","UNI","AAVE","NEAR"];
  const candidates=new Map();
  for(const a of cmc){
    if(!a.symbol)continue;
    const key="cmc:"+String(a.cmcId);
    const platformKey=platformChain(a.platformName);
    const cg=cgByContract.get(String(platformKey||"").toLowerCase()+":"+String(a.platformTokenAddress||"").toLowerCase())||gecko.find(g=>String(g.symbol||"").toUpperCase()===a.symbol&&String(g.name||"").toLowerCase()===String(a.name||"").toLowerCase())||null;
    const priority=major.includes(a.symbol)?1000:(a.rank>0?Math.max(0,500-a.rank):0);
    const address=cg?.platforms?.ethereum||cg?.platforms?.["arbitrum-one"]||cg?.platforms?.base||cg?.platforms?.["polygon-pos"]||cg?.platforms?.solana||a.platformTokenAddress||null;
    const chain=cg?.platforms?.ethereum?"ethereum":cg?.platforms?.base?"base":cg?.platforms?.["arbitrum-one"]?"arbitrum":cg?.platforms?.["polygon-pos"]?"polygon":cg?.platforms?.solana?"solana":platformKey;
    if(address&&chain)candidates.set(key,{address,chain,cmcAsset:a,cgAsset:cg,priority});
  }
  for(const g of gecko){
    const sym=String(g.symbol||"").toUpperCase();
    if(!sym)continue;
    const cmcAsset=cmc.find(x=>x.symbol===sym&&String(x.name||"").toLowerCase()===String(g.name||"").toLowerCase())||null;
    const address=g.platforms?.ethereum||g.platforms?.["arbitrum-one"]||g.platforms?.base||g.platforms?.["polygon-pos"]||g.platforms?.solana||null;
    const chain=g.platforms?.ethereum?"ethereum":g.platforms?.base?"base":g.platforms?.["arbitrum-one"]?"arbitrum":g.platforms?.["polygon-pos"]?"polygon":g.platforms?.solana?"solana":null;
    if(address&&chain){
      const key=sym+":"+String(g.name||"").toLowerCase();
      const priority=major.includes(sym)?1000:(Number(g.market_cap_rank)>0?Math.max(0,500-Number(g.market_cap_rank)):0);
      if(!candidates.has(key))candidates.set(key,{address,chain,cmcAsset, cgAsset:g,priority});
    }
  }
  const majorMarketWatch=major.map(symbol=>{
    const ca=cmc.find(x=>x.symbol===symbol)||null;
    const ga=gecko.find(x=>String(x.symbol||"").toUpperCase()===symbol)||null;
    if(!ca&&!ga)return null;
    return{
      symbol,
      name:ca?.name||ga?.name||symbol,
      cmc:ca,
      coingecko:ga?{
        id:ga.id,
        marketCapRank:ga.market_cap_rank,
        marketCapUsd:ga.market_cap,
        priceUsd:ga.current_price,
        volume24hUsd:ga.total_volume,
        change24h:ga.price_change_percentage_24h
      }:null,
      watchReason:"MAJOR_MARKET_ASSET"
    };
  }).filter(Boolean);
  const allCandidates=[...candidates.values()].sort((a,b)=>b.priority-a.priority);
  const top500=allCandidates.filter(x=>Number(x.cmcAsset?.rank||x.cgAsset?.market_cap_rank||999999)<=surveillanceTop).slice(0,surveillanceTop);
  const outsideTop500=allCandidates.filter(x=>Number(x.cmcAsset?.rank||x.cgAsset?.market_cap_rank||999999)>surveillanceTop);
  const prioritySet=top500.slice(0,deepMax);
  const rotatedSet=top500.slice(rotationOffset*rotationBatch,(rotationOffset+1)*rotationBatch);
  const discoveryOffset=Math.floor(Date.now()/86400000)%Math.max(1,Math.ceil(Math.max(1,outsideTop500.length)/20));
  const outsideDiscovery=outsideTop500.slice(discoveryOffset*20,discoveryOffset*20+20);
  const scoredTop500=top500.map(x=>{
    const a=x.cmcAsset||{};
    const g=x.cgAsset||{};
    const volume=Number(a.volume24hUsd||g.total_volume||0);
    const usdtMarketCount=Number(a.usdtPairCount||0);
    const change=Math.abs(Number(a.change24h??g.price_change_percentage_24h??0));
    const marketRank=Number(a.rank||g.market_cap_rank||500);
    const usdtHint=(String(a.symbol||"")?1:0);
    return {...x,scanPriority:
      (marketRank<=50?35:marketRank<=100?25:marketRank<=250?18:10)+
      Math.min(25,Math.log10(Math.max(1,volume))*2)+
      Math.min(15,change)+
      (usdtHint?3:0)};
  }).sort((a,b)=>b.scanPriority-a.scanPriority);
  const prioritySet2=scoredTop500.slice(0,deepMax);
  const rotatedSet2=top500.slice(rotationOffset*rotationBatch,(rotationOffset+1)*rotationBatch);
  const top500Slots=Math.max(1,Math.min(deepMax,Math.ceil(deepMax*0.8)));
  const outsideSlots=Math.max(0,deepMax-top500Slots);
  const top500Mix=[...new Map([...prioritySet2.slice(0,top500Slots),...rotatedSet2.slice(0,top500Slots)].map(x=>[x.cmcAsset?.cmcId||x.cgAsset?.id||x.address,x])).values()].slice(0,top500Slots);
  const list=[...top500Mix,...outsideDiscovery.slice(0,outsideSlots)];
  const results=[];
  for(const candidate of list){
    try{
      const result=await scanToken({chain:candidate.chain,address:candidate.address,cmcId:candidate.cmcAsset?.cmcId||null});
      result.marketDiscovery={
        surveillanceTier:(candidate.cmcAsset?.rank||candidate.cgAsset?.market_cap_rank||999)<=500?"TOP500":"OUTSIDE_TOP500",
        cmc:candidate.cmcAsset,
        coingecko:candidate.cgAsset?{
          id:candidate.cgAsset.id,
          marketCapRank:candidate.cgAsset.market_cap_rank,
          marketCapUsd:candidate.cgAsset.market_cap,
          priceUsd:candidate.cgAsset.current_price,
          volume24hUsd:candidate.cgAsset.total_volume,
          change24h:candidate.cgAsset.price_change_percentage_24h
        }:null,
        fusionScore:rankFusion(candidate.cmcAsset,candidate.cgAsset,result.market?.usdtPairCount||0),
        usdtPriority:Boolean((result.market?.usdtPairCount||0)>0||major.includes(candidate.cmcAsset?.symbol||String(candidate.cgAsset?.symbol||"").toUpperCase()))
      };
      result.symbol=candidate.cmcAsset?.symbol||String(candidate.cgAsset?.symbol||"").toUpperCase();
      result.name=candidate.cmcAsset?.name||candidate.cgAsset?.name||null;
      results.push(result);
    }catch(error){
      results.push({ok:false,symbol:candidate.cmcAsset?.symbol||String(candidate.cgAsset?.symbol||"").toUpperCase(),name:candidate.cmcAsset?.name||candidate.cgAsset?.name||null,error:error.message||"SCAN_ERROR"});
    }
  }
  for(const result of results){if(result.ok)result.confidence=buildConfidence(result);}
  results.sort((a,b)=>(b.marketDiscovery?.fusionScore||0)-(a.marketDiscovery?.fusionScore||0)||(b.confidence?.confidence||0)-(a.confidence?.confidence||0));
  return {
    ok:true,
    timestamp:new Date().toISOString(),
    count:results.length,
    universe:{
      requestedDeepScans:deepMax,
      surveillanceUniverseSize:Math.min(surveillanceTop,allCandidates.length),
      discoveryUniverseSize:allCandidates.length,
      outsideTop500Discoverable:outsideTop500.length,
      surveillanceUniverse:"TOP_500_BY_MARKET_CAP_CROSS_CHECKED",
      cmcAvailable:cmc.length>0,
      coingeckoAvailable:gecko.length>0,
      majorAssetWatchlist:major,
      majorMarketWatch,
      usdtFirst:true,
      coverageModel:"TOP500_PRIORITY_PLUS_ROTATING_DEEP_SCAN_PLUS_OUTSIDE_TOP500_ROTATING_DISCOVERY",
      discoveryBatchSize:outsideDiscovery.length,
      discoveryBatchIndex:discoveryOffset,
      rotation:{batchSize:rotationBatch,batchIndex:rotationOffset,deepScannedCount:list.length,top500DeepScannedCount:top500Mix.length,outsideTop500DeepScannedCount:Math.min(outsideSlots,outsideDiscovery.length)}
    },
    results
  };
}
