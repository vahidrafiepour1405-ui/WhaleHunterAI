const EXCLUDED=new Set(["exchange","treasury","foundation","team","vesting","staking","bridge","lp","liquidity_pool","smart_contract","burn","cex"]);
export function isIndependentWhale(wallet){
 const tags=(wallet.tags||[]).map(x=>String(x).toLowerCase());
 return !tags.some(t=>EXCLUDED.has(t));
}
export function filterIndependent(wallets){return (wallets||[]).filter(isIndependentWhale);}