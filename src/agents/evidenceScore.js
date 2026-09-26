export function calculateEvidenceScore(x={}){
 let score=0;
 if(Number(x.confirmedDexBuyUsd||0)>0)score+=35;
 if(Number(x.independentWhales||0)>=3)score+=20;
 if(Number(x.positiveWhales||0)>=3)score+=15;
 if(Number(x.cexOutflowUsd||0)>0)score+=10;
 if(Number(x.repeatedBuyCount||0)>=2)score+=10;
 if(Number(x.concentrationPct||0)>35)score-=20;
 if(Number(x.cexInflowUsd||0)>Number(x.cexOutflowUsd||0))score-=10;
 return Math.max(0,Math.min(100,score));
}