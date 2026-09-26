import React from"react";
import{View,Text,StyleSheet}from"react-native";
export default function WhaleProfile({whale}){
 if(!whale)return null;
 const net=Number(whale.netBuyUsd||0);
 return <View style={s.box}><View style={s.row}><Text style={s.addr}>{String(whale.address).slice(0,6)+"…"+String(whale.address).slice(-4)}</Text><Text style={net>=0?s.buy:s.sell}>{whale.behavior}</Text></View><View style={s.stats}><Text style={s.stat}>BUY $ {fmt(whale.buyUsd)}</Text><Text style={s.stat}>SELL $ {fmt(whale.sellUsd)}</Text><Text style={s.stat}>NET $ {fmt(net)}</Text></View><Text style={s.meta}>Avg buy $ {fmt(whale.avgBuyPriceUsd)} • Accumulation {whale.accumulationPct}% • {whale.buyCount||0} buys / {whale.sellCount||0} sells</Text></View>
}
function fmt(v){const n=Number(v||0);if(n>=1000000)return(n/1000000).toFixed(2)+"M";if(n>=1000)return(n/1000).toFixed(1)+"K";return n.toFixed(0)}
const s=StyleSheet.create({box:{backgroundColor:"#0b1120",padding:13,borderRadius:14,borderWidth:1,borderColor:"#26385c",marginTop:8},row:{flexDirection:"row",justifyContent:"space-between"},addr:{color:"#dce7f7",fontWeight:"800"},buy:{color:"#62e6a2",fontWeight:"900",fontSize:10},sell:{color:"#ff7187",fontWeight:"900",fontSize:10},stats:{flexDirection:"row",justifyContent:"space-between",marginTop:10},stat:{color:"#91a2c0",fontSize:9,fontWeight:"800"},meta:{color:"#687894",fontSize:9,marginTop:9}});
