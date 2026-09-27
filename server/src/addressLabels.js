const endpoint=process.env.BITQUERY_LABELS_GRAPHQL_URL||"https://streaming.bitquery.io/graphql";
async function gql(query,variables={}){
  if(!process.env.BITQUERY_API_KEY)throw new Error("ADDRESS_LABEL_PROVIDER_NOT_CONFIGURED");
  const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.BITQUERY_API_KEY},body:JSON.stringify({query,variables})});
  if(!res.ok)throw new Error("BITQUERY_LABELS_"+res.status);
  const body=await res.json();
  if(body.errors?.length)throw new Error("BITQUERY_LABELS_GRAPHQL_"+body.errors[0].message);
  return body.data;
}
export async function getAddressLabels(addresses,chain){
  const list=[...new Set(addresses.map(a=>String(a||"").toLowerCase()).filter(Boolean))].slice(0,100);
  if(!list.length)return [];
  const query=`query($addresses:[String!],$chain:String!){
    Metadata{
      Labels(
        where:{Address:{in:$addresses},Chain:{is:$chain}}
        limitBy:{by:[Address,Chain,Label_Type],count:1}
        orderBy:{descending:RecordedAt}
      ){
        Address
        Chain
        Label{Type Value}
        RecordedAt
      }
    }
  }`;
  const data=await gql(query,{addresses:list,chain});
  return data.Metadata?.Labels||[];
}
export function isNonIndependentLabel(label){
  const type=String(label?.Label?.Type||"").toLowerCase();
  const value=String(label?.Label?.Value||"").toLowerCase();
  if(["cex-hot-wallet","cex-cold-wallet","cex-deposit-address","token-contract","token-clone","gambling"].includes(type))return true;
  if(type==="contract"&&/(bridge|staking|treasury|vesting|router|pool|multisig|liquidity|project|issuer|foundation)/.test(value))return true;
  if(/^issuer-blocked/.test(type))return true;
  return false;
}
