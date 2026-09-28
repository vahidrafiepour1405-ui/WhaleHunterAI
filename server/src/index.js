import "dotenv/config";
import express from "express";
import cors from "cors";
import {health} from "./health.js";
import {scanToken,discoverAndScanMarket} from "./scanToken.js";
import {buildMasterSignal} from "./masterSignal.js";
import {liveSourceMatrix} from "./liveSources.js";
import {getListings,normalizeCmcAsset} from "./coinMarketCapProvider.js";
const app=express();
app.use(cors({origin:process.env.CORS_ORIGIN||"*"}));
app.use(express.json({limit:"256kb"}));
app.get("/health",(_,res)=>res.json(health()));
app.get("/api/v1/status",(_,res)=>res.json(health()));
app.get("/api/v1/live-status",(_,res)=>res.json(liveSourceMatrix()));
app.get("/api/v1/market-live",async(req,res)=>{
  try{
    const limit=Math.min(500,Math.max(20,Number(req.query.limit||500)));
    const cmcRes=await getListings(limit);
    const cmc=cmcRes.map(normalizeCmcAsset);
    let gecko=[];
    try{
      const pages=Math.ceil(limit/250);
      for(let page=1;page<=pages;page++){
        const url=new URL("https://api.coingecko.com/api/v3/coins/markets");
        url.searchParams.set("vs_currency","usd");url.searchParams.set("order","market_cap_desc");
        url.searchParams.set("per_page","250");url.searchParams.set("page",String(page));url.searchParams.set("sparkline","false");
        const headers=process.env.COINGECKO_API_KEY?{"x-cg-demo-api-key":process.env.COINGECKO_API_KEY}:{};
        const rr=await fetch(url,{headers});if(!rr.ok)throw new Error("COINGECKO_"+rr.status);
        gecko.push(...await rr.json());
      }
    }catch(error){gecko=[]}
    res.json({ok:true,timestamp:new Date().toISOString(),refreshSeconds:20,cmc,coingecko:gecko.slice(0,limit),live:liveSourceMatrix()});
  }catch(error){res.status(502).json({ok:false,error:error.message||"MARKET_LIVE_ERROR",live:liveSourceMatrix()})}
});
app.get("/api/v1/chart/:chain/:address",async(req,res)=>{try{const {getCandles}=await import("./technicalProvider.js");const chain=String(req.params.chain||"");const address=String(req.params.address||"");const interval=String(req.query.interval||"1h");const limit=Math.min(240,Math.max(40,Number(req.query.limit||120)));const rows=await getCandles({chain,pairAddress:address,interval,limit});const candles=rows.map(r=>({open:Number(r[0]),high:Number(r[1]),low:Number(r[2]),close:Number(r[3]),volume:Number(r[4]),timestamp:Number(r[5]),traders:Number(r[6]||0)})).filter(x=>[x.open,x.high,x.low,x.close].every(Number.isFinite));if(candles.length<20)throw new Error("CHART_TOO_SHORT");const recent=candles.slice(-Math.min(80,candles.length));const lows=[],highs=[];for(let i=2;i<recent.length-2;i++){if(recent[i].low<=recent[i-1].low&&recent[i].low<=recent[i+1].low&&recent[i].low<=recent[i-2].low&&recent[i].low<=recent[i+2].low)lows.push(recent[i].low);if(recent[i].high>=recent[i-1].high&&recent[i].high>=recent[i+1].high&&recent[i].high>=recent[i-2].high&&recent[i].high>=recent[i+2].high)highs.push(recent[i].high);}const last=recent.at(-1).close;const nearest=(a,dir)=>{const z=a.filter(x=>dir==="above"?x>last:x<last);return z.length?z.reduce((p,x)=>Math.abs(x-last)<Math.abs(p-last)?x:p):null};const support=nearest(lows,"below")??Math.min(...recent.map(x=>x.low));const resistance=nearest(highs,"above")??Math.max(...recent.map(x=>x.high));const vols=recent.map(x=>x.volume||0);const avg=vols.slice(0,-1).reduce((a,b)=>a+b,0)/Math.max(1,vols.length-1);const flow=recent.slice(-12).map(x=>x.close>x.open?1:x.close<x.open?-1:0);const buyCandles=flow.filter(x=>x>0).length,sellCandles=flow.filter(x=>x<0).length;const flowImbalance=(buyCandles+sellCandles)?(buyCandles-sellCandles)/(buyCandles+sellCandles)*100:0;const highVolume=avg?recent.at(-1).volume/avg:0;const range=Math.max(1e-12,resistance-support);const longEntry=support+(resistance-support)*0.35;const longSL=Math.min(support-(range*0.08),last*0.97);const longTP1=longEntry+range*0.75;const longTP2=longEntry+range*1.25;const shortEntry=resistance-(range*0.35);const shortSL=Math.max(resistance+(range*0.08),last*1.03);const shortTP1=shortEntry-range*0.75;const shortTP2=shortEntry-range*1.25;const liquidityZones=[...lows,...highs].sort((a,b)=>Math.abs(a-last)-Math.abs(b-last)).slice(0,8);res.json({ok:true,candles,levels:{support,resistance,liquidityZones},orderFlow:{buyCandles,sellCandles,imbalancePct:flowImbalance,lastVolumeRatio:highVolume,windowCandles:12},tradePlan:{long:{entry:longEntry,stopLoss:longSL,takeProfit1:longTP1,takeProfit2:longTP2},short:{entry:shortEntry,stopLoss:shortSL,takeProfit1:shortTP1,takeProfit2:shortTP2},note:"Calculated scenario levels from recent structure and flow; not a guarantee or price forecast."}})}catch(error){res.status(502).json({ok:false,error:error.message||"CHART_ERROR"})}});
app.get("/api/v1/token/:chain/:address",async(req,res)=>{
  try{const result=await scanToken({chain:req.params.chain,address:req.params.address});result.masterSignal=buildMasterSignal(result);result.live=liveSourceMatrix();res.json(result);}
  catch(error){res.status(502).json({ok:false,error:error.message||"UPSTREAM_ERROR",live:liveSourceMatrix()});}
});
app.get("/api/v1/scan-market",async(req,res)=>{
  try{const data=await discoverAndScanMarket(Math.min(Number(req.query.limit||100),100));data.results=data.results.map(x=>({...x,masterSignal:buildMasterSignal(x)}));data.live=liveSourceMatrix();res.json(data);}
  catch(error){res.status(502).json({ok:false,error:error.message||"UPSTREAM_ERROR",live:liveSourceMatrix()});}
});
app.get("/api/v1/scan",async(req,res)=>{
  const address=String(req.query.address||"");const chain=String(req.query.chain||"ethereum");
  if(!address)return res.status(400).json({ok:false,error:"ADDRESS_REQUIRED"});
  try{const result=await scanToken({chain,address});result.masterSignal=buildMasterSignal(result);result.live=liveSourceMatrix();res.json(result);}
  catch(error){res.status(502).json({ok:false,error:error.message||"UPSTREAM_ERROR",live:liveSourceMatrix()});}
});
const port=Number(process.env.PORT||8080);
app.listen(port,()=>console.log("Whale Hunter API listening on "+port));