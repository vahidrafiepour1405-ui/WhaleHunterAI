const endpoint=process.env.CMC_API_BASE_URL||"https://pro-api.coinmarketcap.com";
const PLATFORM={ethereum:"ethereum",polygon:"polygon",arbitrum:"arbitrum",base:"base",bsc:"binance-smart-chain"};
async function getCandles({chain,pairAddress,interval="1h",limit=72}){
  const platform=PLATFORM[chain];
  if(!platform||!pairAddress)throw new Error("CMC_KLINE_INPUT_UNSUPPORTED");
  const to=Math.floor(Date.now()/1000);
  const from=to-Math.max(10,Math.min(500,Number(limit)||72))*3600;
  const url=new URL((process.env.CMC_API_KEY?endpoint:endpoint+"/public-api")+"/v1/k-line/candles");
  url.searchParams.set("platform",platform);
  url.searchParams.set("address",pairAddress);
  url.searchParams.set("interval",interval);
  url.searchParams.set("from",String(from));
  url.searchParams.set("to",String(to));
  url.searchParams.set("limit",String(Math.min(500,Math.max(20,Number(limit)||72))));
  const headers={Accept:"application/json"};
  if(process.env.CMC_API_KEY)headers["X-CMC_PRO_API_KEY"]=process.env.CMC_API_KEY;
  const res=await fetch(url,{headers});
  if(!res.ok)throw new Error("CMC_KLINE_"+res.status);
  const body=await res.json();
  if(body.status?.error_code)throw new Error("CMC_KLINE_"+body.status.error_code);
  return Array.isArray(body.data)?body.data:[];
}
function ema(values,period){
  if(values.length<period)return null;
  const k=2/(period+1);
  let e=values.slice(0,period).reduce((s,x)=>s+x,0)/period;
  for(let i=period;i<values.length;i++)e=values[i]*k+e*(1-k);
  return e;
}
function rsi(values,period=14){
  if(values.length<=period)return null;
  let gains=0,losses=0;
  for(let i=1;i<=period;i++){const d=values[i]-values[i-1];if(d>=0)gains+=d;else losses-=d;}
  let avgGain=gains/period,avgLoss=losses/period;
  for(let i=period+1;i<values.length;i++){const d=values[i]-values[i-1];const g=Math.max(0,d),l=Math.max(0,-d);avgGain=(avgGain*(period-1)+g)/period;avgLoss=(avgLoss*(period-1)+l)/period;}
  if(avgLoss===0)return 100;
  const rs=avgGain/avgLoss;
  return 100-(100/(1+rs));
}
export async function analyzeTechnical({chain,pairAddress}){
  const rows=await getCandles({chain,pairAddress,interval:"1h",limit:72});
  const candles=rows.map(r=>({open:Number(r[0]),high:Number(r[1]),low:Number(r[2]),close:Number(r[3]),volume:Number(r[4]),timestamp:Number(r[5]),traders:Number(r[6]||0)})).filter(x=>Number.isFinite(x.close)&&x.close>0);
  if(candles.length<20)throw new Error("CMC_KLINE_TOO_SHORT");
  const closes=candles.map(x=>x.close);
  const volumes=candles.map(x=>x.volume||0);
  const last=closes.at(-1),prev=closes.at(-2);
  const ema20=ema(closes,20),ema50=ema(closes,50);
  const r=rsi(closes,14);
  const avgVol=volumes.slice(-21,-1).reduce((s,x)=>s+x,0)/Math.max(1,Math.min(20,volumes.length-1));
  const volumeRatio=avgVol?volumes.at(-1)/avgVol:null;
  const change1h=prev?((last/prev)-1)*100:null;
  const change24h=closes.length>=25?((last/closes.at(-25))-1)*100:null;
  const trend=ema20!==null?(last>ema20?1:-1):0;
  const longTrend=ema50!==null?(ema20>ema50?1:-1):0;
  let score=50;
  if(trend>0)score+=12;else if(trend<0)score-=12;
  if(longTrend>0)score+=10;else if(longTrend<0)score-=10;
  if(r!==null){if(r>=55&&r<=70)score+=10;else if(r>75)score-=8;else if(r<40)score-=5;}
  if(volumeRatio!==null){if(volumeRatio>=2)score+=10;else if(volumeRatio>=1.3)score+=5;}
  if(change24h!==null){if(change24h>0)score+=5;else if(change24h<-5)score-=5;}
  score=Math.max(0,Math.min(100,Math.round(score)));
  return{
    candles: candles.slice(-72),
    indicators:{lastPrice:last,ema20,ema50,rsi14:r,volumeRatio24h:volumeRatio,change1h,change24h},
    score,
    state:score>=70?"BULLISH_CONFIRMATION":score<=35?"BEARISH_CONFIRMATION":"NEUTRAL",
    note:"Technical confirmation describes current market structure; it is not a forecast of future price."
  };
}
