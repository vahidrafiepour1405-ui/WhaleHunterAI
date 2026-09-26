export function createDataProvider(name,methods){
 const required=["getTrendingTokens","getTokenHolders","getTokenTransfers","getWalletTransfers","getTokenMarketData"];
 for(const key of required)if(typeof methods?.[key]!=="function")throw new Error(name+" missing "+key);
 return {name,...methods};
}