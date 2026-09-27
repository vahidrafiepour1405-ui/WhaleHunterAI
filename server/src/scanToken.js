import {getDexPairs,normalizeChain,providerStatus} from "./providers.js";
import {getTopHolders,getHolderFlows,rankAccumulation} from "./holderProvider.js";
import {classifyAddress} from "./addressClassifier.js";
import {getAddressLabels,isNonIndependentLabel} from "./addressLabels.js";
import {getWalletTokenBuys,aggregateWalletBuys} from "./dexTradeProvider.js";
import {buildConfidence} from "./confidenceEngine.js";
import {getNansenHolders,getNansenWhoBoughtSold,getNansenFlowIntelligence,normalizeNansenHolder,normalizeNansenBuyer,summarizeNansenFlow} from "./nansenProvider.js";
import {analyzeTokenStructure} from "./tokenAnalysisEngine.js";
import {getListings,normalizeCmcAsset,getMarketPairs,rankFusion} from "./coinMarketCapProvider.js";

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

export async function scanToken({chain,address}){
  if(!addressLooksLike(address))throw new Error("INVALID_ADDRESS");
  const normalized=normalizeChain(chain);
  const pairs=await getDexPairs(normalized,address);
  const pairData=pairs.map(classifyPair).sort((a,b)=>b.pairPreferenceScore-a.pairPreferenceScore||b.volume24hUsd-a.volume24hUsd);
  const best=pairData[0]||null;

  const cexHints=[];
  const confirmedDexBuys=pairData.filter(x=>x.confirmedDexSpotBuyActivity).length;
  let holders=[]; let flows24=[]; let flows7=[]; let holderError=null;
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
  const accum24=rankAccumulation(activeHolders,flows24);
  const accum7=rankAccumulation(activeHolders,flows7);
  const realAccum24=accum24.filter(x=>x.netFlow>0);
  const realAccum7=accum7.filter(x=>x.netFlow>0);
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
  ));

  const output={
    ok:true,
    timestamp:new Date().toISOString(),
    chain:normalized,
    address,
    dataQuality:{
      dexPairsFound:pairData.length,
      transferHistoryConfigured:Boolean(process.env.BITQUERY_API_KEY),
      holderDiscoveryConfigured:Boolean(process.env.BITQUERY_API_KEY),
      providers:{...providerStatus(),coingecko:Boolean(process.env.COINGECKO_API_KEY),arkham:Boolean(process.env.ARKHAM_API_KEY)},
      holderRows:holders.length,      labeledRows:labelRows.length,
      whaleDexBuyRows:confirmedWhaleBuys24.length,
      tradeError,
      holderError,
      nansenRows:nansenHolders.length,
      nansenBuyerRows:nansenBuyers.length,
      nansenFlow1d,
      nansenFlow7d,
      nansenError,
      note:"No wallet-level accumulation is inferred until a holder/indexing provider and address-label source are configured."
    },
    market:{bestPair:best,pairs:pairData.slice(0,20),usdtPairCount:pairData.filter(x=>x.usdtQuote).length,stableQuotePairCount:pairData.filter(x=>x.stableQuote).length},
    nansen:{holders:nansenHolders.slice(0,100),buyers24h:nansenBuyers.slice(0,100),flow1d:nansenFlow1d,flow7d:nansenFlow7d},
    whale:{status:holders.length||nansenHolders.length?"LIVE_HOLDERS":"HOLDER_PROVIDER_REQUIRED",independentWhales:activeHolders.slice(0,100).map(x=>({address:x.address,balance:x.Balance?.Amount||null,balanceUsd:x.Balance?.AmountInUSD||null})),accumulating24h:realAccum24.slice(0,100),accumulating7d:realAccum7.slice(0,100),confirmedDexBuys24h:confirmedWhaleBuys24.slice(0,100),excluded:classified.filter(x=>x.classify.excluded).map(x=>({address:x.address,reason:x.classify.reason}))},
    flows:{transferCount24h:flows24.length,transferCount7d:flows7.length,internalHolderTransfers24h,cexHintCount:0},
    evidence:{
      score:evidence,
      confirmedDexBuyActivity:confirmedDexBuys>0,
      nansenWhaleNetFlow24hUsd:Number(nansenFlow1d?.whaleNetFlowUsd||0),
      nansenWhaleNetFlow7dUsd:Number(nansenFlow7d?.whaleNetFlowUsd||0),
      nansenBuyerCount24h:nansenBuyers.length,
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

export async function discoverAndScanMarket(limit=20){
  const key=process.env.COINGECKO_API_KEY;
  const url=new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency","usd");
  url.searchParams.set("order","volume_desc");
  url.searchParams.set("per_page",String(limit));
  url.searchParams.set("page","1");
  url.searchParams.set("sparkline","false");
  const headers=key?{"x-cg-demo-api-key":key}:{};
  const response=await fetch(url,{headers});
  if(!response.ok)throw new Error("COINGECKO_"+response.status);
  const coins=await response.json();
  const results=[];
  for(const coin of coins){
    const address=coin.platforms?.ethereum||coin.platforms?.["arbitrum-one"]||coin.platforms?.base||coin.platforms?.["polygon-pos"];
    if(!address)continue;
    try{
      const result=await scanToken({chain:coin.platforms?.ethereum?"ethereum":coin.platforms?.base?"base":coin.platforms?.["arbitrum-one"]?"arbitrum":"polygon",address});
      results.push({...result,symbol:coin.symbol?.toUpperCase(),name:coin.name,coingeckoId:coin.id,priceChange24h:coin.price_change_percentage_24h});
    }catch(error){results.push({ok:false,symbol:coin.symbol?.toUpperCase(),name:coin.name,error:error.message||"SCAN_ERROR"});}
  }
  for(const result of results){if(result.ok)result.confidence=buildConfidence(result);}
  results.sort((a,b)=>(b.confidence?.confidence||0)-(a.confidence?.confidence||0));
  return {ok:true,timestamp:new Date().toISOString(),count:results.length,results};
}
