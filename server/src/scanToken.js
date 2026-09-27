import {getDexPairs,getAlchemyTransfers,normalizeChain} from "./providers.js";

const CEX_HINTS=["binance","coinbase","kraken","okx","bybit","kucoin","gate","bitget","crypto.com"];

function addressLooksLike(a){return /^0x[a-fA-F0-9]{40}$/.test(a)||/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a)}

function classifyPair(p){
  const txns=p.txns||{};
  const buys=Number(txns.buys||0);
  const sells=Number(txns.sells||0);
  return {
    dex:p.dexId||"unknown",
    pairAddress:p.pairAddress,
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
  const pairData=pairs.map(classifyPair).sort((a,b)=>b.volume24hUsd-a.volume24hUsd);
  const best=pairData[0]||null;

  let transfers=[];
  const network=normalized==="ethereum"?"eth-mainnet":normalized==="polygon"?"polygon-mainnet":normalized==="arbitrum"?"arb-mainnet":normalized==="base"?"base-mainnet":null;
  if(network&&process.env.ALCHEMY_API_KEY)transfers=await getAlchemyTransfers({network,address});

  const cexHints=transfers.filter(t=>CEX_HINTS.some(x=>String(t.to||"").toLowerCase().includes(x)||String(t.from||"").toLowerCase().includes(x)));
  const confirmedDexBuys=pairData.filter(x=>x.confirmedDexSpotBuyActivity).length;

  const evidence=Math.max(0,Math.min(100,
    (confirmedDexBuys>0?35:0)+
    (best?.liquidityUsd>=100000?20:best?.liquidityUsd>=25000?10:0)+
    (best?.buys24h>best?.sells24h?20:0)+
    (best?.volume24hUsd>=100000?15:best?.volume24hUsd>=25000?8:0))-
    (cexHints.length>0?10:0)
  ));

  return {
    ok:true,
    timestamp:new Date().toISOString(),
    chain:normalized,
    address,
    dataQuality:{
      dexPairsFound:pairData.length,
      transferHistoryConfigured:Boolean(process.env.ALCHEMY_API_KEY),
      holderDiscoveryConfigured:false,
      note:"Transfer activity alone is never classified as a confirmed buy."
    },
    market:{bestPair:best,pairs:pairData.slice(0,20)},
    whale:{status:"HOLDER_PROVIDER_REQUIRED",independentWhales:[],accumulating:[],excluded:[]},
    flows:{transferCount:transfers.length,cexHintCount:cexHints.length},
    evidence:{score:evidence,confirmedDexBuyActivity:confirmedDexBuys>0},
    limitations:[
      "Top-holder discovery requires a holder/indexing provider.",
      "DEX pair buy/sell counts are market-level activity, not proof that a specific whale bought.",
      "CEX labels require a maintained address-label dataset."
    ]
  };
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
  results.sort((a,b)=>(b.evidence?.score||0)-(a.evidence?.score||0));
  return {ok:true,timestamp:new Date().toISOString(),count:results.length,results};
}
