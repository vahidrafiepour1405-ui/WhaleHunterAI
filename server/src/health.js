export function health(){
  return {
    ok:true,
    service:"whale-hunter-ai-api",
    version:"1.0.0",
    timestamp:new Date().toISOString(),
    providers:{
      alchemy:Boolean(process.env.ALCHEMY_API_KEY),
      coingecko:Boolean(process.env.COINGECKO_API_KEY),
      dexscreener:true,bitquery:Boolean(process.env.BITQUERY_API_KEY),nansen:Boolean(process.env.NANSEN_API_KEY),coinmarketcap:Boolean(process.env.CMC_API_KEY),arkham:Boolean(process.env.ARKHAM_API_KEY)
    }
  };
}