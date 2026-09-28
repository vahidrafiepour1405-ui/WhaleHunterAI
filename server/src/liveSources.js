import {providerStatus} from "./providers.js";
function ok(name,configured,details=null){return {name,configured:Boolean(configured),live:Boolean(configured),details};}
export function liveSourceMatrix(){
  const p=providerStatus();
  return {
    generatedAt:new Date().toISOString(),
    mode:"LIVE_MULTI_SOURCE",
    refreshSeconds:20,
    sources:[
      ok("CoinMarketCap",true,"market listings, quotes, market pairs, K-lines"),
      ok("CoinGecko",true,"market discovery and cross-check"),
      ok("DEX Screener",true,"DEX pairs, liquidity, volume, buy/sell activity"),
      ok("Bitquery",p.holderDiscovery,"holders, transfers, wallet-level DEX trades, labels"),
      ok("Nansen",p.nansen,"holders, who-bought/sold, flow intelligence"),
      ok("Arkham",p.arkham,"configured for future cross-check when API key is supplied")
    ],
    providers:p,
    note:"LIVE means fresh provider requests on each scan. It does not mean every website on the internet is scraped; only configured APIs/providers are queried."
  };
}
