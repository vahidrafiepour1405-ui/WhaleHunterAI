import {scanMarket} from "../services/marketScanner";
export async function runMarketScanner(provider){return scanMarket(provider,100);}