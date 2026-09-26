import{createAlchemyProvider}from"./alchemyProvider";
import{createCmcDexProvider}from"./cmcDexProvider";
import{mockProvider}from"./mockProvider";
import{ENV}from"../../config/env";
export function getProvider(){
 if(ENV.DATA_PROVIDER==="cmc")return createCmcDexProvider({network:ENV.CHAIN||"ethereum"});
 if(ENV.DATA_PROVIDER==="alchemy"&&ENV.ALCHEMY_API_KEY)return createAlchemyProvider({apiKey:ENV.ALCHEMY_API_KEY,chain:ENV.CHAIN||"ethereum"});
 return mockProvider;
}