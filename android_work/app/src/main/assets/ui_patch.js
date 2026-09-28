(()=>{
const style=document.createElement('style');
style.textContent=`
:root{--bg:#020817;--panel:#071426;--panel2:#0a1d34;--cyan:#00e5ff;--gold:#f6c85f;--violet:#8b5cf6;--green:#36e6a1;--red:#ff5c7a}
html,body{background:radial-gradient(circle at 15% 0,#17395a 0,#071321 32%,#02050d 76%)!important}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(135deg,rgba(0,229,255,.025),transparent 35%,rgba(246,200,95,.025));z-index:-1}
.card{background:linear-gradient(145deg,rgba(9,27,48,.96),rgba(3,11,23,.98));border-color:#1c4261;box-shadow:0 12px 35px rgba(0,0,0,.35)}
.hero{border-color:#315a75!important;background:radial-gradient(circle at 90% 0,rgba(246,200,95,.12),rgba(7,20,35,.96) 45%)!important}
.brand{font-size:22px;letter-spacing:.4px;color:#f7fbff;text-shadow:0 0 18px rgba(0,229,255,.25)}
.sub{color:#7d9ab8}
.tab.active{border-color:#00bcd4;background:linear-gradient(135deg,#10364b,#182342)}
.btn{background:linear-gradient(90deg,#087f9b,#6d43d8,#b07b19)!important}
.metric{background:linear-gradient(145deg,#071426,#091d32);border-color:#1b3d5a}
.asset,.agent,.whaleRow,.signalRow{background:linear-gradient(145deg,#071525,#06101f);border-color:#1c3b57}
.asset:active,.signalRow:active,.agent:active{transform:scale(.99)}
.chartBox{background:#020913;border-color:#20445d}
.aiAnalysis{margin-top:9px;padding:10px;border:1px solid #294d68;border-radius:12px;background:linear-gradient(135deg,rgba(0,229,255,.06),rgba(139,92,246,.06))}
.aiAnalysis b{color:#f6c85f}.aiKey{display:inline-block;margin:3px 3px 0 0;padding:4px 7px;border-radius:7px;background:#0d2940;color:#a9d9e8;font-size:8px}
.chartPro{position:relative}.chartPro svg{height:270px!important}.chartLabel{font-size:8px;fill:#9bb0c7}.liqDot{filter:drop-shadow(0 0 5px rgba(246,200,95,.8))}
.zoneLegend{display:flex;gap:8px;flex-wrap:wrap;font-size:8px;color:#9bb0c7;padding:5px 2px}.zoneLegend span{padding:4px 7px;border-radius:7px;background:#0a1b2d}
`;
document.head.appendChild(style);
const brand=document.querySelector('.brand');if(brand)brand.innerHTML='◉ WHALE HUNTER <span style="color:#f6c85f">AI</span>';
const sub=document.querySelector('.sub');if(sub)sub.textContent='SMART MONEY • WHALE FLOW • LIQUIDITY MAP • MULTI-AGENT';
const update=document.getElementById('updateHint');if(update)update.textContent='نسخه 17.0 • Whale Hunter AI';
function aiAnalysis(t){
 const buy=Number(t.buys||0),sell=Number(t.sells||0),score=Number(t.score||0),p=Number(t.p24||0);
 let title='نیاز به تأیید',tone='warn';
 if(buy>sell*1.25&&score>=50){title='انباشت احتمالی';tone='up'}else if(sell>buy*1.25||score<25&&p<0){title='فشار توزیع/فروش';tone='down'}
 const clues=[];
 if(buy>sell)clues.push('Buy-side غالب');if(sell>buy)clues.push('Sell-side غالب');
 if(Number(t.top1||0)<35)clues.push('تمرکز Top1 کنترل‌شده');else if(t.top1)clues.push('تمرکز Top1 بالا');
 if(Number(t.top5||0)<60)clues.push('Top5 متعادل');else if(t.top5)clues.push('Top5 متمرکز');
 if(Number(t.liquidity||0)>0)clues.push('نقدینگی '+money(t.liquidity));
 return '<div class="aiAnalysis"><b>🤖 تحلیل اسکن: '+title+'</b><div class="small">'+(clues.join(' • ')||'شواهد کافی برای نتیجه‌گیری قوی وجود ندارد.')+' • تغییر 24h: '+p.toFixed(2)+'% • Evidence: '+score+'/100</div></div>';
}
window.renderResult=function(t){
 const label=t.buys>t.sells&&t.top1<35?'ACCUMULATION WATCH':t.sells>t.buys?'DISTRIBUTION WATCH':'NEEDS CONFIRMATION';
 const cl=label[0]==='A'?'':label[0]==='D'?'red':'warn';
 return '<div class="card" style="margin:7px 0;padding:12px;cursor:pointer" onclick="showAsset('+JSON.stringify(t).replace(/</g,'\\u003c')+')"><div class="row"><span class="coin">'+esc(t.symbol)+'</span><span class="pill '+cl+'">'+label+'</span></div><div class="small">'+esc(t.chain||'multi')+' • '+short(t.address||'')+'</div><div class="bar"><i style="width:'+t.score+'%"></i></div><div class="small">Evidence '+t.score+'/100 • Top1 '+pct(t.top1)+'% • Top5 '+pct(t.top5)+'%</div><div class="grid" style="margin-top:7px"><div class="metric"><b>'+money(t.volume)+'</b><span>Volume 24h</span></div><div class="metric"><b>'+money(t.liquidity)+'</b><span>Liquidity</span></div><div class="metric"><b>'+t.buys+'</b><span>Buys</span></div><div class="metric"><b>'+t.sells+'</b><span>Sells</span></div></div>'+aiAnalysis(t)+'<div class="small" style="margin-top:7px;color:#67e8f9">👆 لمس تحلیل = باز شدن چارت + حمایت/مقاومت + نقاط نقدینگی</div></div>'
};
function levels(rows){
 const p=rows.map(x=>Number(x[4]||0)).filter(Number.isFinite),v=rows.map(x=>Number(x[5]||0));
 if(!p.length)return null;
 const sorted=p.slice().sort((a,b)=>a-b),q=(a,k)=>a[Math.max(0,Math.min(a.length-1,Math.floor((a.length-1)*k)))];
 const lo=q(sorted,.12),hi=q(sorted,.88),range=hi-lo||Math.max(...p)-Math.min(...p)||1;
 const lows=[],highs=[];
 for(let i=2;i<p.length-2;i++){if(p[i]<=p[i-1]&&p[i]<=p[i+1]&&p[i]<=p[i-2]&&p[i]<=p[i+2])lows.push({i,p:p[i],vol:v[i]||0});if(p[i]>=p[i-1]&&p[i]>=p[i+1]&&p[i]>=p[i-2]&&p[i]>=p[i+2])highs.push({i,p:p[i],vol:v[i]||0})}
 const support=lows.sort((a,b)=>(b.vol-a.vol)).slice(0,2).map(x=>x.p).sort((a,b)=>a-b)[0]||lo;
 const resistance=highs.sort((a,b)=>(b.vol-a.vol)).slice(0,2).map(x=>x.p).sort((a,b)=>b-a)[0]||hi;
 const avg=v.reduce((a,b)=>a+b,0)/(v.length||1);
 const liq=rows.map((x,i)=>({i,p:Number(x[4]||0),vol:Number(x[5]||0)})).filter(x=>x.vol>avg*1.8).sort((a,b)=>b.vol-a.vol).slice(0,6);
 return {min:Math.min(...p),max:Math.max(...p),support,resistance,liq,avg,range};
}
window.loadChartTf=async function(t,tf){
 const host=document.getElementById('chartHost');if(!host||!t.pair)return;
 CURRENT_TF=tf;
 try{
  const s=TF_MAP[tf]||TF_MAP['1H'],u='https://api.geckoterminal.com/api/v2/networks/'+chainForGecko(t.chain)+'/pools/'+encodeURIComponent(t.pair)+'/ohlcv/'+s[0]+'?aggregate='+s[1]+'&limit=120&currency=usd';
  const j=await json(u),rows=(j?.data?.attributes?.ohlcv_list||[]).slice().reverse();
  if(!rows.length){host.innerHTML='<div class="empty">نمودار برای این تایم‌فریم موجود نیست.</div>';return}
  const z=levels(rows),p=rows.map(x=>Number(x[4]||0)),W=760,H=270,P=38,rg=(z.max-z.min)||1;
  const xy=(val,i)=>({x:P+i*(W-2*P)/Math.max(1,p.length-1),y:H-P-(val-z.min)/rg*(H-2*P)});
  const pts=p.map((x,i)=>{const q=xy(x,i);return q.x.toFixed(1)+','+q.y.toFixed(1)}).join(' ');
  const y=(val)=>xy(val,0).y.toFixed(1);
  const liq=(z.liq||[]).map(x=>{const q=xy(x.p,x.i);return '<circle class="liqDot" cx="'+q.x.toFixed(1)+'" cy="'+q.y.toFixed(1)+'" r="5" fill="#f6c85f"/><text x="'+(q.x+7).toFixed(1)+'" y="'+(q.y-7).toFixed(1)+'" class="chartLabel">LIQ</text>'}).join('');
  host.innerHTML='<div class="chartBox chartPro"><svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none"><line x1="'+P+'" x2="'+(W-P)+'" y1="'+y(z.resistance)+'" y2="'+y(z.resistance)+'" stroke="#ff5c7a" stroke-width="2" stroke-dasharray="8 5"/><line x1="'+P+'" x2="'+(W-P)+'" y1="'+y(z.support)+'" y2="'+y(z.support)+'" stroke="#36e6a1" stroke-width="2" stroke-dasharray="8 5"/><polyline fill="none" stroke="#00e5ff" stroke-width="3" points="'+pts+'"/>'+liq+'<text x="'+(W-P-2)+'" y="'+(Number(y(z.resistance))-6)+'" text-anchor="end" class="chartLabel">R '+z.resistance.toPrecision(6)+'</text><text x="'+(W-P-2)+'" y="'+(Number(y(z.support))-6)+'" text-anchor="end" class="chartLabel">S '+z.support.toPrecision(6)+'</text></svg><div class="zoneLegend"><span style="color:#36e6a1">● حمایت: '+z.support.toPrecision(6)+'</span><span style="color:#ff5c7a">● مقاومت: '+z.resistance.toPrecision(6)+'</span><span style="color:#f6c85f">● نقدینگی/حجم غیرعادی</span></div><div class="chartLegend">'+esc(tf)+' • '+rows.length+' کندل • GeckoTerminal • سطوح و LIQ برآورد الگوریتمی هستند، نه Order Book زنده</div></div>';
 }catch(e){host.innerHTML='<div class="empty">نمودار موقتاً در دسترس نیست.</div>'}
};
const oldShow=window.showAsset;
window.showAsset=async function(t){await oldShow(t);};
})();
