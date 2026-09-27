const dexBase=process.env.DEXSCREENER_BASE_URL||"https://api.dexscreener.com";

export async function getDexPairs(chain,address){
  const url=dexBase+"/latest/dex/tokens/"+encodeURIComponent(address);
  const res=await fetch(url);
  if(!res.ok)throw new Error("DEXSCREENER_"+res.status);
  const data=await res.json();
  return (data.pairs||[]).filter(p=>!chain||normalizeChain(p.chainId)===normalizeChain(chain));
}

export function normalizeChain(chain){
  const c=String(chain||"").toLowerCase();
  const map={ethereum:"ethereum",eth:"ethereum","eth-mainnet":"ethereum",polygon:"polygon",arbitrum:"arbitrum",arb:"arbitrum",base:"base",solana:"solana"};
  return map[c]||c;
}

export function providerStatus(){
  return {
    dexScreener:true,
    holderDiscovery:Boolean(process.env.BITQUERY_API_KEY),
    addressLabels:Boolean(process.env.BITQUERY_API_KEY)
  };
}