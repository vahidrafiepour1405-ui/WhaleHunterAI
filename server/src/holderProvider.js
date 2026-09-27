const endpoint=process.env.BITQUERY_GRAPHQL_URL||"https://graphql.bitquery.io";
const NETWORKS={ethereum:"eth",polygon:"matic",arbitrum:"arbitrum",base:"base",bsc:"bsc"};

function assertConfig(){if(!process.env.BITQUERY_API_KEY)throw new Error("HOLDER_PROVIDER_NOT_CONFIGURED");}
async function gql(query,variables={}){
  assertConfig();
  const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.BITQUERY_API_KEY},body:JSON.stringify({query,variables})});
  if(!res.ok)throw new Error("BITQUERY_"+res.status);
  const body=await res.json();
  if(body.errors?.length)throw new Error("BITQUERY_GRAPHQL_"+body.errors[0].message);
  return body.data;
}
function networkOf(chain){const n=NETWORKS[chain];if(!n)throw new Error("HOLDER_CHAIN_UNSUPPORTED");return n;}

export async function getTopHolders({chain,address,limit=100}){
  const network=networkOf(chain);
  const query=`query($address:String!,$limit:Int!){
    EVM(network:${network},dataset:combined){
      Holders(
        where:{Currency:{SmartContract:{is:$address}}}
        orderBy:{descending:Balance_Amount}
        limit:{count:$limit}
      ){
        Holder{Address}
        Balance{Amount(selectWhere:{gt:"0"}) AmountInUSD FirstChangeTime LastChangeTime UpdateCount}
      }
    }
  }`;
  const data=await gql(query,{address,limit:Math.min(Math.max(Number(limit)||100,1),100)});
  return data.EVM.Holders||[];
}

export async function getHolderFlows({chain,address,hours=24,limit=5000}){
  const network=networkOf(chain);
  const query=`query($address:String!,$hours:Int!,$limit:Int!){
    EVM(network:${network},dataset:realtime){
      Transfers(
        where:{
          Transfer:{Currency:{SmartContract:{is:$address}}},
          Block:{Time:{since_relative:{hours_ago:$hours}}}
        }
        orderBy:{descending:Block_Time}
        limit:{count:$limit}
      ){
        Transfer{Amount Sender Receiver}
        Block{Time}
        Transaction{Hash}
      }
    }
  }`;
  const data=await gql(query,{address,hours:Math.max(1,Math.min(Number(hours)||24,168)),limit:Math.min(Math.max(Number(limit)||5000,10000),10000)});
  return data.EVM.Transfers||[];
}

function norm(a){return String(a||"").toLowerCase();}
export function rankAccumulation(holders,transfers){
  const map=new Map();
  for(const h of holders){
    const a=norm(h.Holder?.Address);
    if(!a)continue;
    const balance=Number(h.Balance?.Amount||0);
    const usd=Number(h.Balance?.AmountInUSD||0);
    map.set(a,{address:h.Holder.Address,balance,balanceUsd:usd,inflow:0,outflow:0,txIn:0,txOut:0,lastChange:h.Balance?.LastChangeTime||null});
  }
  for(const row of transfers){
    const t=row.Transfer||{};
    const amount=Number(t.Amount||0);
    const from=norm(t.Sender),to=norm(t.Receiver);
    if(map.has(to)){const x=map.get(to);x.inflow+=amount;x.txIn++;}
    if(map.has(from)){const x=map.get(from);x.outflow+=amount;x.txOut++;}
  }
  return [...map.values()].map(x=>({...x,netFlow:x.inflow-x.outflow,flowRatio:x.balance?((x.inflow-x.outflow)/x.balance):0})).sort((a,b)=>b.netFlow-a.netFlow);
}
