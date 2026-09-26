import {FLOW_TYPES,classifyFlow} from "./providers";
const ZERO="0x0000000000000000000000000000000000000000";
export function normalizeAddress(a){return String(a||"").toLowerCase();}
export function analyzeTransfer(t){
 const from=normalizeAddress(t.from),to=normalizeAddress(t.to);
 if(!from||!to)return {type:FLOW_TYPES.UNKNOWN,reason:"missing_address"};
 if(to===ZERO)return {type:"burn",reason:"burn_address"};
 if(t.dexSwap===true)return {type:FLOW_TYPES.DEX_BUY,reason:"confirmed_swap"};
 if(t.fromType==="cex"&&t.toType==="wallet")return {type:FLOW_TYPES.CEX_OUTFLOW,reason:"cex_to_wallet"};
 if(t.fromType==="wallet"&&t.toType==="cex")return {type:FLOW_TYPES.CEX_INFLOW,reason:"wallet_to_cex"};
 if(from===to)return {type:FLOW_TYPES.INTERNAL,reason:"same_address"};
 if(t.fromType==="wallet"&&t.toType==="wallet")return {type:FLOW_TYPES.INTERNAL,reason:"wallet_transfer"};
 return {type:classifyFlow(t.type),reason:"unclassified"};
}
export function evidenceLabel(type){
 if(type===FLOW_TYPES.DEX_BUY)return "CONFIRMED DEX SPOT BUY";
 if(type===FLOW_TYPES.CEX_OUTFLOW)return "CEX→WALLET FLOW";
 if(type===FLOW_TYPES.CEX_INFLOW)return "WALLET→CEX FLOW";
 if(type===FLOW_TYPES.INTERNAL)return "INTERNAL TRANSFER";
 return "UNKNOWN";
}