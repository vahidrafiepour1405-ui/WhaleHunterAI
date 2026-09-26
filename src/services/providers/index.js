import {createAlchemyProvider} from "./alchemyProvider";
import {mockProvider} from "./mockProvider";
import {ENV} from "../../config/env";
export function getProvider(){
 if(ENV.DATA_PROVIDER==="alchemy"&&ENV.ALCHEMY_API_KEY)return createAlchemyProvider({apiKey:ENV.ALCHEMY_API_KEY});
 return mockProvider;
}