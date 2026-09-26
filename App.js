import React,{useMemo} from "react";
import {SafeAreaView,View,Text,ScrollView,StyleSheet,StatusBar} from "react-native";
import {AGENTS} from "./src/agents/registry";

const DEMO=[
["LIT","Multi-whale activity detected","🟢","Evidence 82/100"],
["ENA","Accumulation-side flows","🟡","Evidence 67/100"],
["AAVE","Whale activity needs confirmation","🟡","Evidence 61/100"]
];

export default function App(){
 const active=useMemo(()=>AGENTS.slice(0,12),[]);
 return <SafeAreaView style={s.root}><StatusBar barStyle="light-content"/>
 <ScrollView contentContainerStyle={s.page}>
  <Text style={s.brand}>WHALE HUNTER AI</Text>
  <Text style={s.sub}>MULTI-AGENT CRYPTO INTELLIGENCE</Text>
  <View style={s.hero}><Text style={s.heroTitle}>🐋 GLOBAL WHALE SCAN</Text><Text style={s.heroText}>Independent-wallet analysis • DEX/CEX flow separation • evidence-based signals</Text></View>
  <Text style={s.section}>MARKET SIGNALS</Text>
  {DEMO.map((x,i)=><View key={i} style={s.card}><View style={s.row}><Text style={s.coin}>{x[0]}</Text><Text style={s.signal}>{x[2]}</Text></View><Text style={s.title}>{x[1]}</Text><Text style={s.muted}>{x[3]}  •  DEMO DATA</Text></View>)}
  <Text style={s.section}>ACTIVE AGENTS</Text>
  <View style={s.grid}>{active.map(a=><View key={a.id} style={s.agent}><Text style={s.icon}>{a.icon}</Text><Text style={s.agentName}>{a.name}</Text><Text style={s.muted}>READY</Text></View>)}</View>
  <View style={s.note}><Text style={s.noteTitle}>⚠️ DATA PRINCIPLE</Text><Text style={s.noteText}>CEX→wallet movement is accumulation-side evidence, not proof of a fresh purchase. Confirmed DEX swaps are tracked separately.</Text></View>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:"#070912"},page:{padding:18,paddingBottom:40},brand:{color:"#fff",fontSize:28,fontWeight:"900",letterSpacing:2},sub:{color:"#7e8aa8",fontSize:11,marginTop:4,letterSpacing:1.5},hero:{marginTop:18,padding:18,borderRadius:18,backgroundColor:"#11182a",borderWidth:1,borderColor:"#26385c"},heroTitle:{color:"#70e1ff",fontSize:18,fontWeight:"800"},heroText:{color:"#b8c2d9",marginTop:8,lineHeight:20},section:{color:"#7383a8",fontWeight:"800",fontSize:12,letterSpacing:2,marginTop:24,marginBottom:10},card:{backgroundColor:"#0e1422",padding:15,borderRadius:16,marginBottom:10,borderWidth:1,borderColor:"#202d49"},row:{flexDirection:"row",justifyContent:"space-between"},coin:{color:"#fff",fontSize:20,fontWeight:"900"},signal:{fontSize:18},title:{color:"#dfe7f5",fontSize:14,fontWeight:"700",marginTop:8},muted:{color:"#71809e",fontSize:11,marginTop:6},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},agent:{width:"47%",minHeight:92,backgroundColor:"#0e1422",padding:12,borderRadius:14,borderWidth:1,borderColor:"#202d49"},icon:{fontSize:22},agentName:{color:"#dce5f5",fontWeight:"700",fontSize:12,marginTop:5},note:{marginTop:22,padding:15,borderRadius:15,backgroundColor:"#15131d",borderWidth:1,borderColor:"#493a59"},noteTitle:{color:"#f3d47a",fontWeight:"800"},noteText:{color:"#aeb6c9",fontSize:12,lineHeight:18,marginTop:6}});