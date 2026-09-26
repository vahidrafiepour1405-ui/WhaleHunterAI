export const TokenSchema={chainId:null,address:"",symbol:"",name:"",decimals:18,priceUsd:0,marketCapUsd:0,liquidityUsd:0,volume24hUsd:0};
export const WalletSchema={chainId:null,address:"",balanceUsd:0,tags:[],independent:false};
export const TransferSchema={chainId:null,txHash:"",tokenAddress:"",from:"",to:"",amount:0,usdValue:0,timestamp:0,fromType:"unknown",toType:"unknown",dexSwap:false};
export const WhaleSnapshotSchema={wallet:"",token:"",balanceUsd:0,net24hUsd:0,net7dUsd:0,net30dUsd:0,confirmedDexBuysUsd:0,cexOutflowUsd:0,cexInflowUsd:0,evidenceScore:0};