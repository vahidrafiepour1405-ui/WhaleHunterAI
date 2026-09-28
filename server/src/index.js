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