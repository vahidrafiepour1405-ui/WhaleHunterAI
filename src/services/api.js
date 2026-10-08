const DEFAULT_API_BASE="https://whale-hunter-ai-api.onrender.com";
const API_BASE=(process.env.EXPO_PUBLIC_API_BASE_URL||DEFAULT_API_BASE).replace(/\/$/,"");
export function isOnlineApiConfigured(){return Boolean(API_BASE);}
export async function apiGet(path){if(!API_BASE)throw new Error("ONLINE_API_NOT_CONFIGURED");const res=await fetch(API_BASE+path,{headers:{Accept:"application/json"}});if(!res.ok)throw new Error("API_"+res.status);return res.json();}
export async function onlineTokenScan(chain,address){return apiGet("/api/v1/token/"+encodeURIComponent(chain)+"/"+encodeURIComponent(address));}
export async function onlineMarketScan(limit=100){return apiGet("/api/v1/scan-market?limit="+encodeURIComponent(limit));}
export async function onlineChart(chain,pairAddress,interval="1h",limit=120){return apiGet("/api/v1/chart/"+encodeURIComponent(chain)+"/"+encodeURIComponent(pairAddress)+"?interval="+encodeURIComponent(interval)+"&limit="+encodeURIComponent(limit));}
