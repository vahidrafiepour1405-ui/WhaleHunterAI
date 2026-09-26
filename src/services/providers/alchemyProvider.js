const CHAINS={ethereum:"eth-mainnet",base:"base-mainnet",polygon:"polygon-mainnet",arbitrum:"arb-mainnet",optimism:"opt-mainnet"};
export function createAlchemyProvider({apiKey,chain="ethereum"}){
 if(!apiKey)throw new Error("ALCHEMY_API_KEY_REQUIRED");
 const network=CHAINS[chain]||chain;
 const url="https://"+network+".g.alchemy.com/v2/"+apiKey;
 async function rpc(method,params){
  const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
  const j=await r.json();if(j.error)throw new Error(j.error.message||"ALCHEMY_ERROR");return j.result;
 }
 async function transfers(params,maxPages=10){
  let out=[],pageKey;
  for(let page=0;page<maxPages;page++){
   const p={...params,maxCount:"0x3e8"};if(pageKey)p.pageKey=pageKey;
   const result=await rpc("alchemy_getAssetTransfers",[p]);out.push(...(result?.transfers||[]));pageKey=result?.pageKey;
   if(!pageKey)break;
  }
  return out;
 }
 return{
  name:"alchemy",
  async getTokenTransfers(token){return transfers({fromBlock:"0x0",toBlock:"latest",contractAddresses:[token.address],category:["erc20"],excludeZeroValue:true,withMetadata:true,order:"desc"});},
  async getWalletTransfers(wallet,fromBlock="0x0"){return transfers({fromBlock,toBlock:"latest",fromAddress:wallet,category:["external","erc20","internal"],excludeZeroValue:true,withMetadata:true,order:"desc"});},
  async getTokenHolders(){return[];},
  async getTrendingTokens(){return[];},
  async getTokenMarketData(){return{};}
 };
}