export const FLOW_TYPES={DEX_BUY:"confirmed_dex_spot_buy",CEX_OUTFLOW:"cex_to_wallet",CEX_INFLOW:"wallet_to_cex",INTERNAL:"internal_transfer",UNKNOWN:"unknown"};
export const PROVIDERS={blockchain:"provider-abstraction",dex:"provider-abstraction",market:"provider-abstraction"};
export function classifyFlow(type){return Object.values(FLOW_TYPES).includes(type)?type:FLOW_TYPES.UNKNOWN;}