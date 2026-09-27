const base=process.env.CMC_API_BASE_URL||"https://pro-api.coinmarketcap.com";
async function get(path,params={}){
  const url=new URL(path.startsWith("http")?path:base+path);
  for(const [k,v] of Object.entries(params))if(v!==undefined&&v!==null)url.searchParams.set(k,String(v));
  const headers={"Accept":"application/json"};
  if(process.env.CMC_API_KEY)headers["X-CMC_PRO_API_KEY"]=process.env.CMC_API_KEY;
  const res=await fetch(url,{headers});
  if(!res.ok)throw new Error("CMC_"+res.status);
  const body=await res.json();
  if(body.status?.error_code)throw new Error("CMC_"+body.status.error_code+"_"+(body.status.error_message||""));
  return body.data||[];
}
export async function getListings(limit=500){
  const path=process.env.CMC_API_KEY?"/v3/cryptocurrency/listings/latest":"/public-api/v3/cryptocurrency/listings/latest";
  return get(path,{start:1,limit:Math.min(5000,Math.max(1,limit)),convert:"USD",sort:"market_cap"});
}
export async function getQuotesByIds(ids){
  if(!ids.length)return[];
  const path=process.env.CMC_API_KEY?"/v3/cryptocurrency/quotes/latest":"/public-api/v3/cryptocurrency/quotes/latest";
  return get(path,{id:ids.slice(0,250).join(","),convert:"USD"});
}
export async function getMarketPairs(id){
  if(!process.env.CMC_API_KEY)throw new Error("CMC_MARKET_PAIRS_REQUIRES_KEY");
  return get("/v2/cryptocurrency/market-pairs/latest",{id,convert:"USD",limit:100});
}
export function normalizeCmcAsset(x){
  const q=x.quote?.USD||{};
  return{
    cmcId:Number(x.id),
    symbol:String(x.symbol||"").toUpperCase(),
    name:x.name||null,
    rank:Number(x.cmc_rank||0),
    priceUsd:Number(q.price||0),
    marketCapUsd:Number(q.market_cap||0),
    volume24hUsd:Number(q.volume_24h||0),
    change1h:Number(q.percent_change_1h||0),
    change24h:Number(q.percent_change_24h||0),
    change7d:Number(q.percent_change_7d||0),
    platform:x.platform||null,
    platformTokenAddress:x.platform?.token_address||null,
    platformName:x.platform?.name||null,
    dateAdded:x.date_added||null
  };
}
export function rankFusion(cmcAsset,geckoAsset,usdtPairs=0){
  const cmcRank=Number(cmcAsset?.rank||0);
  const cgRank=Number(geckoAsset?.market_cap_rank||0);
  const ranks=[cmcRank,cgRank].filter(x=>x>0);
  const rankConsensus=ranks.length?100-Math.min(100,((ranks.reduce((s,x)=>s+x,0)/ranks.length)/250)*100):0;
  const volume=Math.min(100,Math.log10(Math.max(1,Number(cmcAsset?.volume24hUsd||geckoAsset?.total_volume||0)))*8);
  const usdtBoost=Math.min(20,Math.max(0,usdtPairs)*5);
  return Math.max(0,Math.min(100,Math.round(rankConsensus*0.55+volume*0.25+usdtBoost)));
}
