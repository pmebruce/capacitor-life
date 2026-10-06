import {calculateLoss} from './loss-calc.mjs?v=1.1';
const $=id=>document.getElementById(id),fields=['method','current','esr','frequency','spectrum','capacitance','tand','drive','tand-current','voltage','dc-voltage','leak-current','theta'];
const defaults=Object.fromEntries(fields.map(id=>[id,$('loss-'+id).value]));let result=null;
const f=(n,d=4)=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:d}).format(n);
const help={esr:'以單顆電容 RMS 電流與同條件 ESR 計算。頻率是 ESR 的資料條件，不會自動修正 ESR。',spectrum:'分別計算每個頻率的電流與 ESR 損耗，再加總。適合低頻紋波與開關頻率同時存在。',tand:'以同頻率、同溫度的電容量與 tanδ 取得 ESR；可輸入電流，或單頻電容端 AC 電壓。'};
function showTab(name){const loss=name==='loss';for(const key of ['life','loss']){const active=(key==='loss')===loss;$('panel-'+key).hidden=!active;$('tab-'+key).setAttribute('aria-selected',String(active));$('tab-'+key).tabIndex=active?0:-1;}history.replaceState(null,'','#'+(loss?'loss':'life'));}
for(const name of ['life','loss']){$('tab-'+name).addEventListener('click',()=>showTab(name));$('tab-'+name).addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'life':e.key==='End'?'loss':name==='life'?'loss':'life';showTab(next);$('tab-'+next).focus();}});}
window.addEventListener('hashchange',()=>showTab(location.hash==='#loss'?'loss':'life'));showTab(location.hash==='#loss'?'loss':'life');
try{const saved=JSON.parse(localStorage.getItem('cap-loss-v1')||'null');if(saved){for(const id of fields)if(saved[id]!==undefined)$('loss-'+id).value=saved[id];$('loss-leak-enabled').checked=saved.leakEnabled===true;}}catch{}
function update(){
 const method=$('loss-method').value,drive=$('loss-drive').value;
 $('loss-single').hidden=method!=='esr';$('loss-frequency-field').hidden=method==='spectrum';$('loss-spectrum-fields').hidden=method!=='spectrum';$('loss-tand-fields').hidden=method!=='tand';$('loss-tand-current-field').hidden=drive!=='current';$('loss-voltage-field').hidden=drive!=='voltage';$('loss-leak-fields').hidden=!$('loss-leak-enabled').checked;$('loss-help').textContent=help[method]||'';
 try{localStorage.setItem('cap-loss-v1',JSON.stringify({...Object.fromEntries(fields.map(id=>[id,$('loss-'+id).value])),leakEnabled:$('loss-leak-enabled').checked}));}catch{}
 result=null;$('loss-transfer').disabled=true;$('loss-breakdown').replaceChildren();
 try{
 result=calculateLoss({method,drive,current:$('loss-'+(method==='tand'?'tand-current':'current')).value,esr:$('loss-esr').value,frequency:$('loss-frequency').value,spectrum:$('loss-spectrum').value,capacitance:$('loss-capacitance').value,tand:$('loss-tand').value,voltage:$('loss-voltage').value,leakEnabled:$('loss-leak-enabled').checked,dcVoltage:$('loss-dc-voltage').value,leakCurrent:$('loss-leak-current').value,theta:$('loss-theta').value});
 $('loss-errors').hidden=true;$('loss-results').hidden=false;
 $('loss-total').textContent=f(result.total);$('loss-milli').textContent=f(result.total*1000,2)+' mW';$('loss-ac').textContent=f(result.ac);$('loss-dc').textContent=f(result.dc);$('loss-details').textContent='AC RMS 電流 '+f(result.irms)+' A'+(result.esr!==null?' · ESR '+f(result.esr*1000)+' mΩ':' · '+result.parts.length+' 個頻率成分');
 $('loss-delta').textContent=result.delta===null?'未提供熱阻':f(result.delta,2)+' °C';
 $('loss-transfer-help').textContent=result.delta===null?'填入可信內部熱點熱阻後可估算溫升。':result.delta>100?'溫升超過壽命分頁 0～100°C 輸入範圍，請核對熱設計。':'可將此穩態溫升套用至「自熱溫升修正」模式；請核對該模式的規格適用條件。';$('loss-transfer').disabled=result.delta===null||result.delta>100;
 if(result.parts.length){const wrap=document.createElement('div');wrap.className='loss-table-scroll';const table=document.createElement('table');table.innerHTML='<thead><tr><th>Hz</th><th>A rms</th><th>ESR mΩ</th><th>損耗 W</th></tr></thead>';const body=document.createElement('tbody');for(const p of result.parts){const tr=document.createElement('tr');for(const value of [p.frequency,p.current,p.esr*1000,p.power]){const td=document.createElement('td');td.textContent=f(value);tr.append(td);}body.append(tr);}table.append(body);wrap.append(table);$('loss-breakdown').append(wrap);}
 }catch(e){$('loss-errors').textContent=e.message;$('loss-errors').hidden=false;$('loss-results').hidden=true;}
}
fields.forEach(id=>$('loss-'+id).addEventListener('input',update));$('loss-leak-enabled').addEventListener('change',update);
$('loss-reset').addEventListener('click',()=>{for(const [id,value] of Object.entries(defaults))$('loss-'+id).value=value;$('loss-leak-enabled').checked=false;update();});
$('loss-transfer').addEventListener('click',()=>{if(result?.delta===null||!result||result.delta>100)return;$('heat').value=String(Number(result.delta.toFixed(6)));const radio=document.querySelector('input[name=mode][value=measured]');radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));showTab('life');$('heat').focus();});
update();
