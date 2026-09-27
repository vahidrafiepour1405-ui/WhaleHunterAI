const endpoint=process.env.BITQUERY_GRAPHQL_URL||"https://graphql.bitquery.io";
const NETWORKS={ethereum:"eth",polygon:"matic",arbitrum:"arbitrum",base:"base",bsc:"bsc"};
function networkOf(chain){const n=NETWORKS[chain];if(!n)throw new Error("TRADE_CHAIN_UNSUPPORTED");return n;}
async function gql(query,variables={}){
  if(!process.env.BITQUERY_API_KEY)throw new Error("TRADE_PROVIDER_NOT_CONFIGURED");
  const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.BITQUERY_API_KEY},body:JSON.stringify({query,variables})});
  if(!res.ok)throw new Error("BITQUERY_TRADES_"+res.status);
  const body=await res.json();
  if(body.errors?.length)throw new Error("BITQUERY_TRADES_GRAPHQL_"+body.errors[0].message);
  return body.data;
}
export async function getWalletTokenBuys({chain,address,holderAddresses=[],hours=24}){
  const network=networkOf(chain);
  const wallets=[...new Set(holderAddresses.map(x=>String(x||"").toLowerCase()).filter(Boolean))].slice(0,100);
  if(!wallets.length)return [];
  const query="query($token:String!,$wallets:[String!],$hours:Int!){EVM(dataset:realtime,network:"+network+"){DEXTrades(where:{Block:{Time:{since_relative:{hours_ago:$hours}}},Trade:{Sell:{Currency:{SmartContract:{is:$token}},Buyer:{in:$wallets}}}} orderBy:{descending:Block_Time} limit:{count:10000}){Block{Time} Trade{Sell{Buyer Amount AmountInUSD Currency{SmartContract Symbol}} Dex{ProtocolName SmartContract}} Transaction{Hash}}}}";
  const data=await gql(query,{token:address,hours:Math.max(1,Math.min(Number(hours)||24,168)),wallets});
  return data.EVM?.DEXTrades||[];
}
export function aggregateWalletBuys(rows){
  const map=new Map();
  for(const row of rows){const t=row.Trade?.Sell||{};const a=String(t.Buyer||"").toLowerCase();if(!a)continue;const x=map.get(a)||{address:t.Buyer,buys:0,buyVolumeUsd:0,lastBuy:null,txHashes:[]};x.buys++;x.buyVolumeUsd+=Number(t.AmountInUSD||0);x.lastBuy=row.Block?.Time||x.lastBuy;if(row.Transaction?.Hash)x.txHashes.push(row.Transaction.Hash);map.set(a,x);}
  return [...map.values()].map(x=>({...x,txHashes:[...new Set(x.txHashes)].slice(0,20)})).sort((a,b)=>b.buyVolumeUsd-a.buyVolumeUsd);
}