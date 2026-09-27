const ZERO="0x0000000000000000000000000000000000000000";
const knownHints=["uniswap","pancake","sushi","router","pool","lp","staking","bridge","multisig","treasury","vesting","burn","dead","null"];
export function classifyAddress(address,{tokenAddress="",pairAddresses=[]}={}){
  const a=String(address||"").toLowerCase();
  if(!a)return {excluded:false,reason:null};
  if(a===ZERO||a==="0x000000000000000000000000000000000000dead")return {excluded:true,reason:"BURN_OR_NULL"};
  if(a===String(tokenAddress).toLowerCase())return {excluded:true,reason:"TOKEN_CONTRACT"};
  if(pairAddresses.map(x=>String(x).toLowerCase()).includes(a))return {excluded:true,reason:"DEX_PAIR_OR_LP"};
  return {excluded:false,reason:null};
}
