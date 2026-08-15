/* BEING Form Public Link Fix v6.2
   Bisa ditempel di awal voice-public.js jika file lama tidak membaca key/survey.
*/
(function(){
  const u = new URL(window.location.href);
  window.BEING_FORM_LINK = {
    surveyId:
      u.searchParams.get('survey') ||
      u.searchParams.get('surveyId') ||
      '',
    accessKey:
      u.searchParams.get('key') ||
      u.searchParams.get('accessKey') ||
      '',
    accessCode:
      u.searchParams.get('code') ||
      u.searchParams.get('accessCode') ||
      ''
  };
})();

(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let current=null, access={};

function qsAccess(){
 const u=new URL(location.href);
 return {surveyId:u.searchParams.get('survey')||'',key:u.searchParams.get('key')||'',code:u.searchParams.get('code')||''};
}
async function loadList(){
 try{
  const list=await BVAPI.call('public.listSurveys',{});
  $('#surveyList').innerHTML=(list||[]).map(s=>`<article class="survey-card"><span class="voice-kicker">${esc(s.category||'FORMULIR')}</span><h3>${esc(s.title)}</h3><p>${esc(s.description||'')}</p><button class="voice-btn primary" data-open="${s.id}">Isi Formulir</button></article>`).join('')||'<div class="loading-state">Belum ada formulir aktif.</div>';
  document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openSurvey(b.dataset.open,{}));
  const a=qsAccess(); if(a.surveyId)openSurvey(a.surveyId,a);
 }catch(e){$('#surveyList').innerHTML='<div class="loading-state">Formulir belum dapat dimuat.</div>'}
}
async function openSurvey(id,a={}){
 try{
  access=a||{};
  try{
   current=await BVAPI.call('public.getSurvey',{surveyId:id,accessKey:access.key||'',accessCode:access.code||''});
  }catch(e){
   if(String(e.message||'').includes('KODE_AKSES_DIPERLUKAN')){
    const code=prompt('Masukkan kode akses formulir dari admin BEING:','');
    if(code===null)return;
    access.code=String(code||'').trim();
    current=await BVAPI.call('public.getSurvey',{surveyId:id,accessKey:access.key||'',accessCode:access.code});
   }else throw e;
  }
  $('#surveyId').value=id;$('#modalCategory').textContent=current.category||'FORMULIR BEING';$('#modalTitle').textContent=current.title||'';$('#modalDescription').textContent=current.description||'';
  renderIdentity();renderQuestions();$('#surveyModal').classList.add('open');$('#surveyModal').setAttribute('aria-hidden','false');
 }catch(e){alert(e.message)}
}
function renderIdentity(){
 const mode=current.identityMode||'anonymous';if(mode==='anonymous'){$('#identityFields').innerHTML='';return}
 const req=mode==='required'?'required':'';
 $('#identityFields').innerHTML=`<div class="field"><label>Nama</label><input class="control" name="respondentName" ${req}></div><div class="field"><label>Email</label><input class="control" type="email" name="respondentEmail" ${req}></div><div class="field"><label>No. HP / WA</label><input class="control" name="respondentWA"></div><div class="field"><label>Instansi</label><input class="control" name="respondentInstitution"></div>`;
}
function fileAccept(q){
 const cfg=(q.options&&q.options[0])||{}, a=Array.isArray(cfg.accept)?cfg.accept:[];
 return a.join(',');
}
function renderQuestions(){
 $('#questionFields').innerHTML=(current.questions||[]).map((q,i)=>{
  const req=q.required?'required':'',n='q_'+q.id;
  if(q.type==='radio')return `<div class="field question"><label>${i+1}. ${esc(q.text)}${q.required?' *':''}</label>${(q.options||[]).map(o=>`<label><input type="radio" name="${n}" value="${esc(o)}" ${req}> ${esc(o)}</label>`).join('<br>')}</div>`;
  if(q.type==='checkbox')return `<div class="field question"><label>${i+1}. ${esc(q.text)}${q.required?' *':''}</label>${(q.options||[]).map(o=>`<label><input type="checkbox" name="${n}" value="${esc(o)}"> ${esc(o)}</label>`).join('<br>')}</div>`;
  if(q.type==='yesno')return `<div class="field question"><label>${i+1}. ${esc(q.text)}${q.required?' *':''}</label><select class="control" name="${n}" ${req}><option value="">Pilih</option><option>Ya</option><option>Tidak</option></select></div>`;
  if(q.type==='scale5'||q.type==='scale10'){const max=q.type==='scale5'?5:10;return `<div class="field question"><label>${i+1}. ${esc(q.text)}${q.required?' *':''}</label><select class="control" name="${n}" ${req}><option value="">Pilih</option>${Array.from({length:max},(_,x)=>`<option>${x+1}</option>`).join('')}</select></div>`}
  if(q.type==='textarea')return `<div class="field question"><label>${i+1}. ${esc(q.text)}${q.required?' *':''}</label><textarea class="control" name="${n}" ${req}></textarea></div>`;
  if(q.type==='file'){const cfg=(q.options&&q.options[0])||{};return `<div class="field question"><label>${i+1}. ${esc(q.text)}${q.required?' *':''}</label><input class="control" type="file" name="${n}" data-file-q="${q.id}" accept="${esc(fileAccept(q))}" ${req}><small class="mut">Maksimum ${Number(cfg.maxMb||5)} MB.</small><div id="fileStatus_${q.id}" class="mut"></div></div>`}
  return `<div class="field question"><label>${i+1}. ${esc(q.text)}${q.required?' *':''}</label><input class="control" name="${n}" ${req}></div>`;
 }).join('');
}
function fileToBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]||'');r.onerror=rej;r.readAsDataURL(file)})}
async function uploadOne(q,input){
 const file=input.files&&input.files[0];if(!file)return '';
 const cfg=(q.options&&q.options[0])||{}, max=Number(cfg.maxMb||5)*1024*1024;
 if(file.size>max)throw new Error(`File "${file.name}" melebihi ${Number(cfg.maxMb||5)} MB.`);
 const accept=Array.isArray(cfg.accept)?cfg.accept:[];if(accept.length&&!accept.includes(file.type))throw new Error(`Jenis file "${file.name}" tidak diizinkan.`);
 $('#fileStatus_'+q.id).textContent='Mengunggah '+file.name+'…';
 const base64=await fileToBase64(file);
 const x=await BVAPI.call('public.uploadFile',{surveyId:current.id,questionId:q.id,accessKey:access.key||'',accessCode:access.code||'',fileName:file.name,mimeType:file.type,base64});
 $('#fileStatus_'+q.id).textContent='Berkas terunggah: '+x.name;
 return x;
}
async function submit(e){
 e.preventDefault();const btn=$('#submitSurvey');btn.disabled=true;$('#submitNotice').innerHTML='<div class="notice">Mengirim formulir…</div>';
 try{
  const f=new FormData(e.currentTarget), answers={};
  for(const q of current.questions||[]){
   const n='q_'+q.id;
   if(q.type==='checkbox')answers[q.id]=f.getAll(n);
   else if(q.type==='file'){const input=document.querySelector(`[data-file-q="${q.id}"]`);const x=await uploadOne(q,input);answers[q.id]=x||''}
   else answers[q.id]=f.get(n)||'';
  }
  const p={surveyId:current.id,accessKey:access.key||'',accessCode:access.code||'',answers,userAgent:navigator.userAgent,respondentName:f.get('respondentName')||'',respondentEmail:f.get('respondentEmail')||'',respondentWA:f.get('respondentWA')||'',respondentInstitution:f.get('respondentInstitution')||''};
  await BVAPI.call('public.submitResponse',p);$('#submitNotice').innerHTML='<div class="notice">Terima kasih. Formulir berhasil dikirim.</div>';setTimeout(close,1200);
 }catch(e){$('#submitNotice').innerHTML='<div class="notice error">'+esc(e.message)+'</div>'}finally{btn.disabled=false}
}
function close(){$('#surveyModal').classList.remove('open');$('#surveyModal').setAttribute('aria-hidden','true');$('#surveyForm').reset();$('#submitNotice').innerHTML=''}
$('#surveyForm').addEventListener('submit',submit);$('#closeModal').onclick=close;$('#cancelSurvey').onclick=close;loadList();
})();
