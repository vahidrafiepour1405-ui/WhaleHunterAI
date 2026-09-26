export function calculateRankIndicator(items=[]){
 const sorted=[...items].sort((a,b)=>(Number(b.evidenceScore||0)-Number(a.evidenceScore||0))||(Number(b.netChangeUsd||0)-Number(a.netChangeUsd||0)));
 const total=sorted.length;
 return sorted.map((item,index)=>({...item,rank:index+1,rankPercent:total<=1?100:Math.round((1-index/(total-1))*100),rankBand:index<Math.ceil(total*.1)?"TOP 10%":index<Math.ceil(total*.25)?"TOP 25%":index<Math.ceil(total*.5)?"TOP 50%":"LOWER 50%"}));
}
export function rankPercentForPosition(position,total){if(!total||position<1)return 0;return total<=1?100:Math.round((1-(position-1)/(total-1))*100);}