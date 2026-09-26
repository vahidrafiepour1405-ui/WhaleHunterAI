const API_BASE="";
export async function apiGet(path){
 if(!API_BASE)throw new Error("DATA_PROVIDER_NOT_CONFIGURED");
 const res=await fetch(API_BASE+path);
 if(!res.ok)throw new Error("API_"+res.status);
 return res.json();
}