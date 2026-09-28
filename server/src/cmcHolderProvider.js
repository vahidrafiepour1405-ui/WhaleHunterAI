const base=process.env.CMC_API_BASE_URL||"https://pro-api.coinmarketcap.com";
const PLATFORM={ethereum:"ethereum",base:"base",arbitrum:"arbitrum",polygon:"polygon",bsc:"bsc",solana:"solana"};
async function post(path,body){
 const url=base+(process.env.CMC_API_KEY?path:"/public-api"+path);
 const headers={"Accept":"application/json","Content-Type":"application/json"};
 if(process.env.CMC_API_KEY)headers["X-CMC_PRO_API_KEY"]=process.env.CMC_API_KEY;
 const res=await fetch(url,{method:"POST",headers,body:JSON.stringify(body)});
 if(!res.ok)throw new Error("CMC_HOLDERS_"+res.status);
 const json=await res.json();
 if(json.status?.error_code)throw new Error("CMC_HOLDERS_"+json.status.error_code+"_"+(json.status.error_message||""));
 return json.data||json;
}
export async function getCmcDexHolders({chain,address,tag="tag_all"}){
 const platform=PLATFORM[chain];
 if(!platform||!address)throw new Error("CMC_HOLDERS_INPUT_UNSUPPORTED");
 const out=await post("/v1/dex/holders/list",{tokenAddress:address,platform,tag});
 const rows=Array.isArray(out?.holders)?out.holders:[];
 return rows.map(x=>({
  address:x.walletAddress||null,
  balance:Number(x.balance||x.actualBalance||0),
  balanceUsd:Number(x.actualBalance||0)*Number(x.price||0),
  priceUsd:Number(x.price||0),
  netBuyAmount:Number(x.netBuyAmount||0),
  buyUsd:Number(x.buyUsd||0),
  sellUsd:Number(x.sellUsd||0),
  buyCount:Number(x.buyCount||0),
  sellCount:Number(x.sellCount||0),
  ownershipPct:Number(x.percent||0),
  tags:x.tags||null,
  riskLevelFlag:Number(x.riskLevelFlag||0),
  blacklistFlag:Number(x.blackListFlag||0),
  lowLiquidityFlag:Number(x.lowLiquidityFlag||0)
 })).filter(x=>x.address);
}
