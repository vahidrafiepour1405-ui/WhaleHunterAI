import {createDataProvider} from "../providerContract";
const demo=[
{chainId:1,address:"0x232ce3bd40fcd6f80f3d55a522d03f25df784ee2",symbol:"LIT",name:"LIT",priceUsd:1,marketCapUsd:0,liquidityUsd:0,volume24hUsd:0},
{chainId:1,address:"0x57e114b691db790c35207b2e685d4a43181e6061",symbol:"ENA",name:"Ethena",priceUsd:0,marketCapUsd:0,liquidityUsd:0,volume24hUsd:0}
];
export const mockProvider=createDataProvider("mock",{async getTrendingTokens(limit=50){return demo.slice(0,limit)},async getTokenHolders(){return[]},async getTokenTransfers(){return[]},async getWalletTransfers(){return[]},async getTokenMarketData(){return{}}});