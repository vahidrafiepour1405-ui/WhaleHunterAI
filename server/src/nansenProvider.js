const base=process.env.NANSEN_BASE_URL||"https://api.nansen.ai";
async function post(path,body){
  if(!process.env.NANSEN_API_KEY)throw new Error("NANSEN_NOT_CONFIGURED");
  const res=await fetch(base+path,{method:"POST",headers:{"apiKey":process.env.NANSEN_API_KEY,"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(body)});
  if(!res.ok){let detail="";try{detail=await res.text()}catch{}throw new Error("NANSEN_"+res.status+(detail?"_"+detail.slice(0,160):""));}
  return res.json();
}
function rangeHours(hours){const to=new Date();const from=new Date(to.getTime()-hours*3600*1000);return{from:from.toISOString(),to:to.toISOString()};}
export async function getNansenHolders({chain,address,limit=100}){
  const body={chain,token_address:address,aggregate_by_entity:false,label_type:"all_holders",pagination:{page:1,per_page:Math.min(100,Math.max(1,limit))},order_by:[{field:"value_usd",direction:"DESC"}]};
  const out=await post("/api/v1/tgm/holders",body);
  return{rows:Array.isArray(out.data)?out.data:[],rawPagination:out.pagination||null,warnings:out.warnings||[]};
}
export async function getNansenWhoBoughtSold({chain,address,hours=24}){
  const date=rangeHours(hours);
  const body={chain,token_address:address,buy_or_sell:"BUY",date,pagination:{page:1,per_page:100},filters:{trade_volume_usd:{min:1}},order_by:[{field:"bought_volume_usd",direction:"DESC"}]};
  const out=await post("/api/v1/tgm/who-bought-sold",body);
  return{rows:Array.isArray(out.data)?out.data:[],warnings:out.warnings||[]};
}
export async function getNansenFlowIntelligence({chain,address,timeframe="1d"}){
  const out=await post("/api/v1/tgm/flow-intelligence",{chain,token_address:address,timeframe});
  return{rows:Array.isArray(out.data)?out.data:[],warnings:out.warnings||[]};
}
export function normalizeNansenHolder(row){
  return{
    address:row.address||null,
    label:row.address_label||null,
    tokenAmount:Number(row.token_amount||0),
    valueUsd:Number(row.value_usd||0),
    ownershipPct:Number(row.ownership_percentage||0),
    inflow:Number(row.total_inflow||0),
    outflow:Number(row.total_outflow||0),
    balanceChange24h:Number(row.balance_change_24h||0),
    balanceChange7d:Number(row.balance_change_7d||0)
  };
}
export function normalizeNansenBuyer(row){
  return{
    address:row.address||null,
    label:row.address_label||null,
    boughtVolumeUsd:Number(row.bought_volume_usd||0),
    soldVolumeUsd:Number(row.sold_volume_usd||0),
    netVolumeUsd:Number(row.bought_volume_usd||0)-Number(row.sold_volume_usd||0),
    boughtToken:Number(row.bought_token_volume||0),
    soldToken:Number(row.sold_token_volume||0)
  };
}
export function summarizeNansenFlow(rows){
  const r=rows[0]||{};
  return{
    whaleNetFlowUsd:Number(r.whale_net_flow_usd||0),
    whaleAvgFlowUsd:Number(r.whale_avg_flow_usd||0),
    whaleWalletCount:Number(r.whale_wallet_count||0),
    smartTraderNetFlowUsd:Number(r.smart_trader_net_flow_usd||0),
    smartTraderAvgFlowUsd:Number(r.smart_trader_avg_flow_usd||0),
    smartTraderWalletCount:Number(r.smart_trader_wallet_count||0),
    exchangeNetFlowUsd:Number(r.exchange_net_flow_usd||0),
    freshWalletsNetFlowUsd:Number(r.fresh_wallets_net_flow_usd||0)
  };
}
