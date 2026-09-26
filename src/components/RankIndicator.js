import React from "react";
import {View,Text,StyleSheet} from "react-native";
export default function RankIndicator({rankPercent=0,rank=0,band=""}){
 return <View style={s.box}><View style={s.row}><Text style={s.label}>RANK STRENGTH</Text><Text style={s.pct}>{rankPercent}%</Text></View><View style={s.track}><View style={[s.fill,{width:Math.max(0,Math.min(100,rankPercent))+"%"}]}/></View><Text style={s.meta}>Rank #{rank} • {band}</Text></View>
}
const s=StyleSheet.create({box:{backgroundColor:"#0e1422",padding:14,borderRadius:15,borderWidth:1,borderColor:"#26385c",marginTop:10},row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},label:{color:"#9aa9c5",fontSize:11,fontWeight:"800",letterSpacing:1.5},pct:{color:"#70e1ff",fontSize:22,fontWeight:"900"},track:{height:8,backgroundColor:"#202b42",borderRadius:8,overflow:"hidden",marginTop:10},fill:{height:"100%",backgroundColor:"#70e1ff",borderRadius:8},meta:{color:"#71809e",fontSize:10,marginTop:7}});