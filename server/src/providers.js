const dexBase=process.env.DEXSCREENER_BASE_URL||"https://api.dexscreener.com";

export async function getDexPairs(chain,address){
  const url=dexBase+"/latest/dex/tokens/"+encodeURIComponent(address);
  const res=await fetch(url);
  if(!res.ok)throw new Error("DEXSCREENER_"+res.status);
  const data=await res.json();
  return (data.pairs||[]).filter(p=>!chain||normalizeChain(p.chainId)===normalizeChain(chain));
}

export async function getAlchemyTransfers({network,address}){
  if(!process.env.ALCHEMY_API_KEY)return [];
  const host="https://"+network+".g.alchemy.com/v2/"+process.env.ALCHEMY_API_KEY;
  const body={jsonrpc:"2.0",id:1,method:"alchemy_getAssetTransfers",params:[{
    fromBlock:"0x0",toBlock:"latest",fromAddress:address,
    category:["erc20"],withMetadata:true,maxCount:"0x64"
  }]};
  const res=await fetch(host,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
  if(!res.ok)throw new Error("ALCHEMY_"+res.status);
  const data=await res.json();
  if(data.error)throw new Error(data.error.message||"ALCHEMY_ERROR");
  return data.result?.transfers||[];
}

export function normalizeChain(chain){
  const c=String(chain||"").toLowerCase();
  const map={ethereum:"ethereum",eth:"ethereum","eth-mainnet":"ethereum",polygon:"polygon",arbitrum:"arbitrum",arb:"arbitrum",base:"base",solana:"solana"};
  return map[c]||c;
}
