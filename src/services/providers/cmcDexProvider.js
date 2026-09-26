const BASE="https://pro-api.coinmarketcap.com/public-api";
const NETWORKS={ethereum:"ethereum",base:"base",arbitrum:"arbitrum",polygon:"polygon",bsc:"bsc",solana:"solana"};
async function request(path,options={}){
 const res=await fetch(BASE+path,{...options,headers:{"content-type":"application/json",...(options.headers||{})}});
 const json=await res.json();
 if(!res.ok)throw new Error("CMC_"+res.status);
 return json?.data??json;
}
function arr(data,keys=[]){if(Array.isArray(data))return data;for(const k of keys)if(Array.isArray(data?.[k]))return data[k];return[]}
export function createCmcDexProvider({network="ethereum"}={}){
 const platform=NETWORKS[network]||network;
 return{
  name:"cmc-dex-public",
  async getTrendingTokens(limit=50){
   const data=await request("/v4/dex/spot-pairs/latest?network_slug="+encodeURIComponent(platform));
   const rows=arr(data,["pairs","list","data"]);
   const seen=new Set(),out=[];
   for(const row of rows){
    const address=row?.base_asset_contract_address||row?.baseAssetContractAddress||row?.base_asset?.address;
    if(!address||seen.has(String(address).toLowerCase()))continue;
    seen.add(String(address).toLowerCase());
    out.push({chainId:platform,address,symbol:row?.base_asset_symbol||row?.base_asset?.symbol||"UNKNOWN",name:row?.base_asset_name||row?.base_asset?.name||"Unknown",priceUsd:Number(row?.price||row?.quote_price||0),liquidityUsd:Number(row?.liquidity_usd||row?.liquidity||0),volume24hUsd:Number(row?.volume_24h||row?.volume24h||0)});
    if(out.length>=limit)break;
   }
   return out;
  },
  async getTokenHolders(token){
   const data=await request("/v1/dex/holders/list",{method:"POST",body:JSON.stringify({tokenAddress:token.address,platform,tag:"tag_all"})});
   return arr(data,["holders"]).map(h=>({address:h.walletAddress,balance:Number(h.balance||h.actualBalance||0),usdValue:Number(h.spotPosition||0),netChangeUsd:Number(h.buyUsd||0)-Number(h.sellUsd||0),netBuyAmount:Number(h.netBuyAmount||0),buyUsd:Number(h.buyUsd||0),sellUsd:Number(h.sellUsd||0),buyCount:Number(h.buyCount||0),sellCount:Number(h.sellCount||0),avgBuyPriceUsd:Number(h.avgBuyPriceUsd||0),tags:Array.isArray(h.tags)?h.tags:[],name:h.publicName||h.name||"",percent:Number(h.percent||0),riskLevelFlag:Number(h.riskLevelFlag||0),addressExplorerUrl:h.addressExplorerUrl||""})).filter(x=>x.address);
  },
  async getTokenTransfers(token){
   const data=await request("/v1/dex/tokens/transactions?platform="+encodeURIComponent(platform)+"&address="+encodeURIComponent(token.address)+"&limit=100");
   return arr(data,["swaps"]).map(t=>{const tp=Number(t.tp);return{...t,from:t.ma||t.maker||"",to:t.t0a||t.t1a||"",maker:t.ma||"",volumeUsd:Number(t.v||t.q||0),side:tp===0?"buy":tp===1?"sell":"unknown",dexSwap:true,type:tp===0?"confirmed_dex_spot_buy":tp===1?"dex_sell":"unknown"};});
  },
  async getWalletTransfers(){return[]},
  async getTokenMarketData(token){
   const data=await request("/v1/dex/token/price?platform="+encodeURIComponent(platform)+"&address="+encodeURIComponent(token.address));
   return Array.isArray(data)?data[0]||{}:data||{};
  }
 };
}