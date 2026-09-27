import React,{useMemo,useState}from"react";
import{SafeAreaView,View,Text,ScrollView,StyleSheet,StatusBar,Pressable,ActivityIndicator}from"react-native";
import{AGENTS}from"./src/agents/registry";
import RankIndicator from"./src/components/RankIndicator";
import WhaleProfile from"./src/components/WhaleProfile";
import{getProvider}from"./src/services/providers";
import{scanMarket}from"./src/services/marketScanner";
import{calculateRankIndicator}from"./src/agents/rankIndicator";
import{buildMasterReport}from"./src/agents/master";\nimport{isOnlineApiConfigured,onlineMarketScan}from"./src/services/api";

const DEMO=[
{symbol:"LIT",label:"Multi-whale accumulation evidence",icon:"🟢",evidence:82,rank:91,position:3,band:"TOP 10%"},
{symbol:"ENA",label:"Accumulation-side flow — needs confirmation",icon:"🟡",evidence:67,rank:76,position:8,band:"TOP 25%"},
{symbol:"AAVE",label:"Whale activity — needs confirmation",icon:"🟡",evidence:61,rank:68,position:14,band:"TOP 50%"}
];

export default function App(){
 const agents=useMemo(()=>AGENTS,[]);
 const[signals,setSignals]=useState(DEMO);
 const[scanning,setScanning]=useState(false);
 const[status,setStatus]=useState("DEMO DATA • PROVIDER NOT CONFIGURED");
 const runScan=async()=>{if(scanning)return;setScanning(true);setStatus("SCANNING MARKET…");try{if(isOnlineApiConfigured()){const remote=await onlineMarketScan(20);const ranked=remote.results||[];if(ranked.length){setSignals(ranked.slice(0,10).map((r,i)=>({symbol:r.symbol||r.token?.symbol||"UNKNOWN",label:r.status||"NO_CLEAR_SIGNAL",icon:r.evidence?.score>=70?"🟢":r.evidence?.score>=45?"🟡":"⚪",signal:r.master?.signal||"WATCH",evidence:r.evidence?.score||0,rank:r.rank||0,position:i+1,band:r.band||"LIVE"})));setStatus("ONLINE SCAN COMPLETE • "+ranked.length+" ASSETS")}else setStatus("ONLINE API RETURNED NO ASSETS");return;}const results=await scanMarket(getProvider(),50);const ranked=calculateRankIndicator(results.map((r,i)=>{const report=buildMasterReport({...r,positiveWhales:r.whaleSummary?.positiveCount||0,netChangeUsd:r.whaleSummary?.netBuyUsd||0});return {...r,...report,evidenceScore:report.evidenceScore,netChangeUsd:r.whaleSummary?.netBuyUsd||0}}));if(ranked.length){setSignals(ranked.slice(0,10).map((r,i)=>({symbol:r.token?.symbol||"UNKNOWN",label:r.status||"NO_CLEAR_SIGNAL",icon:r.signal==="BUY_SIGNAL"?"🟢":r.signal==="SELL_SIGNAL"?"🔴":"🟡",signal:r.signal||"NEUTRAL",evidence:r.evidenceScore||0,rank:r.rankPercent||0,position:r.rank||i+1,band:r.rankBand||"LOWER 50%"})));setStatus("SCAN COMPLETE • "+ranked.length+" ASSETS")}else setStatus("NO MARKET DATA • ADD PROVIDER KEY")}catch(e){setStatus("SCAN ERROR • "+String(e.message||e))}finally{setScanning(false)}};
 return <SafeAreaView style={s.root}><StatusBar barStyle="light-content"/>
 <ScrollView contentContainerStyle={s.page}>
 <Text style={s.brand}>WHALE HUNTER AI</Text><Text style={s.sub}>MULTI-AGENT CRYPTO INTELLIGENCE</Text>
 <View style={s.hero}><Text style={s.heroTitle}>🐋 GLOBAL WHALE SCAN</Text><Text style={s.heroText}>Independent whales • DEX/CEX separation • evidence + ranking</Text><Pressable style={s.scan} onPress={runScan}><Text style={s.scanText}>{scanning?"SCANNING…":"SCAN MARKET"}</Text></Pressable><Text style={s.status}>{scanning?<ActivityIndicator size="small" color="#70e1ff"/>:status}</Text></View>
 <Text style={s.section}>TOP SIGNALS</Text>
 {signals.map(x=><View key={x.symbol} style={s.card}><View style={s.row}><Text style={s.coin}>{x.symbol}</Text><Text style={s.signal}>{x.icon}</Text></View><Text style={s.title}>{x.label}</Text><View style={s.signalRow}><Text style={s.signalBadge}>{x.signal==="BUY_SIGNAL"?"🟢 BUY SIGNAL":x.signal==="SELL_SIGNAL"?"🔴 SELL SIGNAL":"🟡 WATCH"}</Text></View><View style={s.metrics}><Text style={s.metric}>Evidence <Text style={s.value}>{x.evidence}/100</Text></Text><Text style={s.metric}>Rank <Text style={s.value}>{x.rank}%</Text></Text></View><RankIndicator rankPercent={x.rank} rank={x.position} band={x.band}/>{x.whaleProfiles?.slice(0,3).map(w=><WhaleProfile key={w.address} whale={w}/>)}</View>)}
 <Text style={s.section}>ACTIVE AGENTS • {agents.length}</Text><View style={s.grid}>{agents.map(a=><View key={a.id} style={s.agent}><Text style={s.icon}>{a.icon}</Text><Text style={s.agentName}>{a.name}</Text><Text style={s.ready}>READY</Text></View>)}</View>
 <View style={s.note}><Text style={s.noteTitle}>⚠️ EVIDENCE RULE</Text><Text style={s.noteText}>CEX→wallet is not proof of a fresh purchase. Confirmed DEX swaps are separated from transfer-only activity.</Text></View>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:"#070912"},page:{padding:18,paddingBottom:50},brand:{color:"#fff",fontSize:28,fontWeight:"900",letterSpacing:2},sub:{color:"#7e8aa8",fontSize:11,marginTop:4,letterSpacing:1.5},hero:{marginTop:18,padding:18,borderRadius:20,backgroundColor:"#11182a",borderWidth:1,borderColor:"#26385c"},heroTitle:{color:"#70e1ff",fontSize:19,fontWeight:"900"},heroText:{color:"#b8c2d9",marginTop:8,lineHeight:20},scan:{marginTop:15,backgroundColor:"#17354b",padding:13,borderRadius:12,alignItems:"center"},scanText:{color:"#8eeaff",fontWeight:"900",letterSpacing:1.5},status:{color:"#71809e",fontSize:9,marginTop:9,textAlign:"center",minHeight:13},section:{color:"#7383a8",fontWeight:"800",fontSize:12,letterSpacing:2,marginTop:24,marginBottom:10},card:{backgroundColor:"#0e1422",padding:15,borderRadius:17,marginBottom:12,borderWidth:1,borderColor:"#202d49"},row:{flexDirection:"row",justifyContent:"space-between"},coin:{color:"#fff",fontSize:21,fontWeight:"900"},signal:{fontSize:19},signalRow:{marginTop:10},signalBadge:{color:"#fff",fontWeight:"900",fontSize:12},title:{color:"#dfe7f5",fontSize:14,fontWeight:"700",marginTop:8},metrics:{flexDirection:"row",justifyContent:"space-between",marginTop:10},metric:{color:"#71809e",fontSize:11},value:{color:"#dce7f7",fontWeight:"800"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},agent:{width:"47%",minHeight:88,backgroundColor:"#0e1422",padding:12,borderRadius:14,borderWidth:1,borderColor:"#202d49"},icon:{fontSize:22},agentName:{color:"#dce5f5",fontWeight:"700",fontSize:12,marginTop:5},ready:{color:"#63d8a3",fontSize:9,fontWeight:"900",marginTop:7},note:{marginTop:22,padding:15,borderRadius:15,backgroundColor:"#15131d",borderWidth:1,borderColor:"#493a59"},noteTitle:{color:"#f3d47a",fontWeight:"800"},noteText:{color:"#aeb6c9",fontSize:12,lineHeight:18,marginTop:6}});
