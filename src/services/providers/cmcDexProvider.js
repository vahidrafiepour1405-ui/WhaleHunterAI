const BASE="https://pro-api.coinmarketcap.com/public-api";
const NETWORKS={ethereum:"ethereum",base:"base",arbitrum:"arbitrum",polygon:"polygon",bsc:"bsc"};
async function request(path,options={}){
 const url=BASE+path;
 const res=await fetch(url,{...options,headers:{"content-type":"application/json",...(options.headers||{})}});
 const json=await res.json();
 if(!res.ok)throw new Error("CMC_"+res.status);
 return json?.data??json;
}
export function createCmcDexProvider({network="ethereum"}={}){
 const networkSlug=NETWORKS[network]||network;
 return{
  name:"cmc-dex-public",
  async getTrendingTokens(limit=50){
   const qs="?network_slug="+encodeURIComponent(networkSlug)+"&sort=volume_24h";
   const data=await request("/v4/dex/spot-pairs/latest"+qs);
   const rows=Array.isArray(data)?data:(data?.data||data?.pairs||[]);
   const seen=new Set();const out=[];
   for(const row of rows){
    const address=row?.base_asset_contract_address||row?.baseAssetContractAddress||row?.base_asset?.address;
    if(!address||seen.has(address.toLowerCase()))continue;
    seen.add(address.toLowerCase());
    out.push({chainId:networkSlug,address,symbol:row?.base_asset_symbol||row?.base_asset?.symbol||"UNKNOWN",name:row?.base_asset_name||row?.base_asset?.name||"Unknown",priceUsd:Number(row?.price||0),liquidityUsd:Number(row?.liquidity_usd||row?.liquidity||0),volume24hUsd:Number(row?.volume_24h||row?.volume24h||0)});
    if(out.length>=limit)break;
   }
   return out;
  },
  async getTokenHolders(token){
   const body=JSON.stringify({tokenAddress:token.address,platform:networkSlug,tag:"tag_all"});
   const data=await request("/v1/dex/holders/list",{method:"POST",body});
   const rows=Array.isArray(data)?data:(data?.holders||[]);
   return rows.map(h=>({address:h.walletAddress||h.wallet_address,balance:Number(h.balance||h.actualBalance||0),usdValue:Number(h.spotPosition||0),netChangeUsd:Number(h.buyUsd||0)-Number(h.sellUsd||0),avgBuyPriceUsd:Number(h.avgBuyPriceUsd||0),tags:Array.isArray(h.tags)?h.tags:[],name:h.publicName||h.name||""})).filter(x=>x.address);
  },
  async getTokenTransfers(token){
   const path="/v1/dex/tokens/transactions?platform="+encodeURIComponent(networkSlug)+"&address="+encodeURIComponent(token.address);
   const data=await request(path);
   return Array.isArray(data)?data:(data?.transactions||data?.txs||[]);
  },
  async getWalletTransfers(){return[]},
  async getTokenMarketData(token){
   const data=await request("/v1/dex/token/price?platform="+encodeURIComponent(networkSlug)+"&address="+encodeURIComponent(token.address));
   return Array.isArray(data)?data[0]||{}:data;
  }
 };
}