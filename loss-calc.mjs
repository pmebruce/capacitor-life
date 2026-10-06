function number(v,label,min=0,strict=false){if(String(v??'').trim()==='')throw Error('請填寫'+label+'。');const n=Number(v);if(!Number.isFinite(n)||(strict?n<=min:n<min))throw Error(label+'請輸入'+(strict?'大於':'不小於')+min+'的有效數字。');return n;}
export function calculateLoss(v){
 let ac=0,esr=null,irms=0,parts=[];
 if(v.method==='esr'){
  const i=number(v.current,'紋波 RMS 電流'),r=number(v.esr,'ESR');number(v.frequency,'頻率',0,true);
  esr=r/1000;irms=i;ac=i*i*esr;
 }else if(v.method==='spectrum'){
  const lines=String(v.spectrum??'').trim().split(/\r?\n/).filter(l=>l.trim());if(!lines.length||lines.length>64)throw Error('頻率表請填入 1～64 列。');const seen=new Set();
  parts=lines.map((line,j)=>{const a=line.trim().split(/[\s,，;；]+/);if(a.length!==3)throw Error('第 '+(j+1)+' 列須為：Hz、A rms、ESR mΩ。');const f=number(a[0],'第 '+(j+1)+' 列頻率',0,true),i=number(a[1],'第 '+(j+1)+' 列 RMS 電流'),r=number(a[2],'第 '+(j+1)+' 列 ESR')/1000;if(seen.has(f))throw Error('頻率不可重複；同頻成分請先合成後再輸入。');seen.add(f);return{frequency:f,current:i,esr:r,power:i*i*r};});
  ac=parts.reduce((s,p)=>s+p.power,0);irms=Math.sqrt(parts.reduce((s,p)=>s+p.current*p.current,0));
 }else if(v.method==='tand'){
  const c=number(v.capacitance,'電容量',0,true)*1e-6,f=number(v.frequency,'頻率',0,true),d=number(v.tand,'tanδ');const xc=1/(2*Math.PI*f*c);esr=d*xc;
  if(v.drive==='current')irms=number(v.current,'紋波 RMS 電流');
  else if(v.drive==='voltage')irms=number(v.voltage,'AC RMS 電壓')/Math.hypot(esr,xc);
  else throw Error('請選擇電流或電壓輸入。');
  ac=irms*irms*esr;
 }else throw Error('請選擇損耗算法。');
 const dc=v.leakEnabled?number(v.dcVoltage,'DC 電壓')*number(v.leakCurrent,'漏電流')*1e-6:0;
 const total=ac+dc,theta=String(v.theta??'').trim()===''?null:number(v.theta,'熱阻',0,true),delta=theta===null?null:theta*total;
 if(![ac,dc,total,irms,esr??0,delta??0].every(Number.isFinite))throw Error('計算範圍過大，請調整輸入數值。');
 return{ac,dc,total,esr,irms,parts,theta,delta};
}
