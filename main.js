import {calculate} from './calc.mjs';

const ids=['lo','to','tx','bt','targetYears','hoursDay','daysYear','heat','ratedHeat','ripple','ratedRipple'];
const fields=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
const defaults=Object.fromEntries(ids.map(id=>[id,fields[id].value]));
const $=id=>document.getElementById(id);
const format=(n,d=0)=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:d,minimumFractionDigits:d}).format(n);
let mode='simple';
const help={
  simple:'以 10°C 壽命約加倍的經驗式估算。尚未計入紋波（ripple）電流造成的內部溫升。',
  measured:'適用於耐久規格以額定電壓定義（未含額定紋波（ripple））的液態鋁電解貼片／引線電容。',
  rated:'適用於耐久規格明示疊加額定紋波（ripple）的液態鋁電解貼片／引線電容。'
};
try{const saved=JSON.parse(localStorage.getItem('cap-life-v1')||'null');if(saved){for(const id of ids){if(saved[id]!==undefined)fields[id].value=saved[id]}if(['simple','measured','rated'].includes(saved.mode))mode=saved.mode}}catch{}
document.querySelector(`input[name=mode][value="${mode}"]`).checked=true;
function validate(v){
  if(ids.some(id=>!Number.isFinite(v[id])))return '請填寫所有可見欄位，輸入有效數字。';
  if(v.lo<=0||v.bt<=1||v.bt>4||v.targetYears<=0||v.hoursDay<=0||v.hoursDay>24||v.daysYear<=0||v.daysYear>365)return '請確認耐久壽命、倍率、目標年數與每日／每年運轉時數。';
  if(v.to<40||v.to>150||v.tx< -40||v.tx>150)return '請確認溫度範圍（−40～150°C）；規格最高溫度至少 40°C。';
  if(mode==='measured'&&(v.heat<0||v.heat>100))return '內部溫升 ΔT 請輸入 0～100°C。';
  if(mode==='rated'&&(v.ratedHeat<0||v.ratedHeat>100||v.ripple<0||v.ratedRipple<=0))return '請確認額定自熱、實際紋波（ripple）及大於零的額定紋波（ripple）。';
  return '';
}
function update(){
  $('measuredFields').hidden=mode!=='measured';$('ratedFields').hidden=mode!=='rated';$('modeHelp').textContent=help[mode];
  const v={mode,...Object.fromEntries(ids.map(id=>[id,Number(fields[id].value)]))};
  // Hidden mode fields are irrelevant; blank hidden inputs must not prevent calculation.
  const relevant=mode==='simple'?['lo','to','tx','bt','targetYears','hoursDay','daysYear']:mode==='measured'?['lo','to','tx','bt','targetYears','hoursDay','daysYear','heat']:ids;
  const missing=relevant.some(id=>fields[id].value.trim()==='');
  const error=missing?'請填寫目前計算方式的所有欄位。':validate({...v,heat:mode==='measured'?v.heat:0,ratedHeat:mode==='rated'?v.ratedHeat:0,ripple:mode==='rated'?v.ripple:0,ratedRipple:mode==='rated'?v.ratedRipple:1});
  $('errors').hidden=!error;$('errors').textContent=error;
  $('resultContent').style.opacity=error?'.3':'1';
  if(error)return;
  const r=calculate(v);
  if(!Number.isFinite(r.life)||!Number.isFinite(r.maxTemp)||r.life<=0){$('errors').hidden=false;$('errors').textContent='計算範圍過大，請調整輸入條件。';return}
  $('lifeHours').textContent=format(r.life);
  $('lifeYears').textContent=`相當於 ${format(r.years,2)} 年（依所填運轉時數）`;
  $('required').textContent=format(r.required);
  $('maxTemp').textContent=format(r.maxTemp,2);
  const meets=r.ratio>=1;
  $('verdict').className='verdict '+(meets?'good':'bad');
  $('verdict').textContent=meets?`達到目標 · 估算壽命為需求的 ${format(r.ratio,2)} 倍`:`未達目標 · 尚需 ${format(1/r.ratio,2)} 倍壽命`;
  let notes=[];
  if(v.tx<40)notes.push('周圍溫度低於 40°C，已依廠商估算指引以 40°C 代入壽命計算。');
  if(mode!=='simple')notes.push(`目前紋波（ripple）造成的內部溫升 ΔT ≈ ${format(r.delta,2)}°C。`);
  if(r.life>15*365*24)notes.push(`原式外推為 ${format(r.life)} 小時；依 Nippon Chemi-Con 指引，工程判讀最多考慮 15 年（約 ${format(r.capped)} 小時），不宜直接採用外推年數。`);
  if(r.maxTemp<40)notes.push('要達到目標所需溫度低於 40°C；超出此經驗式的建議外推範圍。');
  if(r.maxTemp>v.to)notes.push('反推溫度高於元件最高類別溫度；實際使用仍不得超出料號額定範圍。');
  if(mode==='rated'&&v.ripple>v.ratedRipple)notes.push('實際紋波（ripple）高於額定值；應核對該系列在使用溫度下允許的紋波（ripple）與內部溫升限制。');
  $('context').replaceChildren(...notes.map(s=>{const p=document.createElement('p');p.textContent=s;return p}));
  try{localStorage.setItem('cap-life-v1',JSON.stringify({mode,...Object.fromEntries(ids.map(id=>[id,fields[id].value]))}))}catch{}
}
document.querySelectorAll('input[name=mode]').forEach(el=>el.addEventListener('change',()=>{mode=el.value;update()}));
ids.forEach(id=>fields[id].addEventListener('input',update));
$('reset').addEventListener('click',()=>{mode='simple';document.querySelector('input[name=mode][value=simple]').checked=true;for(const id of ids)fields[id].value=defaults[id];update()});
update();
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
