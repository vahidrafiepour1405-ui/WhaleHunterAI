export function health(){
  return {
    ok:true,
    service:"whale-hunter-ai-api",
    version:"1.0.0",
    timestamp:new Date().toISOString(),
    providers:{
      alchemy:Boolean(process.env.ALCHEMY_API_KEY),
      coingecko:Boolean(process.env.COINGECKO_API_KEY),
      dexscreener:true
    }
  };
}