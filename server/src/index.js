import "dotenv/config";
import express from "express";
import cors from "cors";
import { health } from "./health.js";
import { scanToken, discoverAndScanMarket } from "./scanToken.js";
import { buildMasterSignal } from "./masterSignal.js";

const app=express();
app.use(cors({origin:process.env.CORS_ORIGIN||"*"}));
app.use(express.json({limit:"256kb"}));

app.get("/health",(_,res)=>res.json(health()));
app.get("/api/v1/status",(_,res)=>res.json(health()));

app.get("/api/v1/token/:chain/:address",async(req,res)=>{
  try{
    const result=await scanToken({chain:req.params.chain,address:req.params.address});
    result.masterSignal=buildMasterSignal(result);
    res.json(result);
  }catch(error){
    res.status(502).json({ok:false,error:error.message||"UPSTREAM_ERROR"});
  }
});

app.get("/api/v1/scan-market",async(req,res)=>{
  try{res.json(await discoverAndScanMarket(Math.min(Number(req.query.limit||20),20)));}
  catch(error){res.status(502).json({ok:false,error:error.message||"UPSTREAM_ERROR"});}
});

app.get("/api/v1/scan",async(req,res)=>{
  const address=String(req.query.address||"");
  const chain=String(req.query.chain||"ethereum");
  if(!address)return res.status(400).json({ok:false,error:"ADDRESS_REQUIRED"});
  try{
    const result=await scanToken({chain,address});
    result.masterSignal=buildMasterSignal(result);
    res.json(result);
  }catch(error){
    res.status(502).json({ok:false,error:error.message||"UPSTREAM_ERROR"});
  }
});

const port=Number(process.env.PORT||8080);
app.listen(port,()=>console.log("Whale Hunter API listening on "+port));
