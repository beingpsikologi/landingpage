/* BEING VOICE PUBLIC — v6.2.2 FINAL */
(function(){
"use strict";
let currentSurvey=null;
let link={survey:"",key:"",code:""};
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");

function params(){
 const u=new URL(location.href);
 return {
  survey:u.searchParams.get("survey")||u.searchParams.get("surveyId")||"",
  key:u.searchParams.get("key")||u.searchParams.get("accessKey")||"",
  code:u.searchParams.get("code")||u.searchParams.get("accessCode")||""
 };
}
function notice(html,bad){
 const n=$("submitNotice");if(!n)return;
 n.innerHTML=html||"";n.style.display=html?"block":"none";n.className=bad?"notice error":"notice success";
}
function openModal(){const m=$("surveyModal");if(m){m.classList.add("open");m.setAttribute("aria-hidden","false");}}
function closeModal(){const m=$("surveyModal");if(m){m.classList.remove("open");m.setAttribute("aria-hidden","true");}}
function opts(q){
 if(Array.isArray(q.options))return q.options;
 try{return JSON.parse(q.optionsJson||"[]")||[];}catch(_){return[];}
}
function wrap(q,h){return `<div class="form-field survey-question" data-question="${esc(q.id)}"><label><b>${esc(q.text)}</b>${q.required?' <span style="color:#b42318">*</span>':''}</label>${h}</div>`;}
function renderQ(q){
 const t=String(q.type||"text").toLowerCase(),n="q_"+q.id,req=q.required?"required":"",o=opts(q);
 if(t==="textarea")return wrap(q,`<textarea class="form-control" name="${esc(n)}" ${req}></textarea>`);
 if(t==="select")return wrap(q,`<select class="form-control" name="${esc(n)}" ${req}><option value="">Pilih...</option>${o.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")}</select>`);
 if(t==="radio"||t==="yesno"){const a=t==="yesno"?["Ya","Tidak"]:o;return wrap(q,`<div class="survey-options">${a.map((v,i)=>`<label class="option-row"><input type="radio" name="${esc(n)}" value="${esc(v)}" ${req&&i===0?req:""}><span>${esc(v)}</span></label>`).join("")}</div>`);}
 if(t==="checkbox")return wrap(q,`<div class="survey-options">${o.map(v=>`<label class="option-row"><input type="checkbox" name="${esc(n)}" value="${esc(v)}"><span>${esc(v)}</span></label>`).join("")}</div>`);
 if(t==="scale5"||t==="scale10"){const max=t==="scale5"?5:10;return wrap(q,`<div class="scale-options">${Array.from({length:max},(_,i)=>i+1).map(v=>`<label class="scale-item"><input type="radio" name="${esc(n)}" value="${v}" ${req&&v===1?req:""}><span>${v}</span></label>`).join("")}</div>`);}
 if(t==="file"){const c=(o&&typeof o[0]==="object")?o[0]:{},mb=Number(c.maxMb||5);return wrap(q,`<input class="form-control survey-file" type="file" name="${esc(n)}" data-question="${esc(q.id)}" ${req}><small>Maksimal ${mb} MB.</small><div class="file-status" id="fileStatus_${esc(q.id)}"></div>`);}
 return wrap(q,`<input class="form-control" type="text" name="${esc(n)}" ${req}>`);
}
function identity(s){
 const b=$("identityFields");if(!b)return;
 if(String(s.identityMode||"anonymous").toLowerCase()==="anonymous"){b.innerHTML="";return;}
 const req=String(s.identityMode||"").toLowerCase()==="required"?"required":"";
 b.innerHTML=`<div class="identity-box"><h3>Identitas Responden</h3><div class="form-field"><label>Nama${req?' <span style="color:#b42318">*</span>':''}</label><input class="form-control" name="respondentName" ${req}></div><div class="form-field"><label>Email</label><input class="form-control" name="respondentEmail" type="email"></div><div class="form-field"><label>WhatsApp</label><input class="form-control" name="respondentWA"></div><div class="form-field"><label>Instansi / Sekolah</label><input class="form-control" name="respondentInstitution"></div></div>`;
}
function render(s){
 currentSurvey=s;
 if($("modalCategory"))$("modalCategory").textContent=s.category||"FORMULIR BEING";
 if($("modalTitle"))$("modalTitle").textContent=s.title||"Formulir BEING";
 if($("modalDescription"))$("modalDescription").textContent=s.description||"";
 if($("surveyId"))$("surveyId").value=s.id;
 identity(s);
 if($("questionFields"))$("questionFields").innerHTML=(s.questions||[]).map(renderQ).join("")||`<div class="loading-state">Belum ada pertanyaan.</div>`;
 notice("");openModal();
}
function openSurvey(id,key,code){
 return BVAPI.getSurvey(id,key,code).then(render).catch(e=>{
  if(String(e.message||"").indexOf("KODE_AKSES_DIPERLUKAN")>=0){
   const c=prompt("Masukkan kode akses formulir:");
   if(c)return BVAPI.getSurvey(id,key,c).then(s=>{link.code=c;render(s);});
  }
  alert(e.message||"Formulir tidak dapat dibuka.");
 });
}
function loadList(){
 const box=$("surveyList");if(!box)return;
 box.innerHTML=`<div class="loading-state">Memuat formulir BEING…</div>`;
 BVAPI.listSurveys().then(list=>{
  if(!Array.isArray(list)||!list.length){box.innerHTML=`<div class="loading-state">Belum ada formulir aktif.</div>`;return;}
  box.innerHTML=list.map(s=>`<article class="survey-card"><div class="survey-card-body"><span class="voice-kicker">${esc(s.category||"FORMULIR BEING")}</span><h3>${esc(s.title)}</h3><p>${esc(s.description||"")}</p><div class="survey-meta"><span>${Number(s.questionCount||0)} pertanyaan</span></div><button class="voice-btn primary" type="button" data-open="${esc(s.id)}">Isi Formulir</button></div></article>`).join("");
  box.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openSurvey(b.getAttribute("data-open"),"",""));
 }).catch(e=>{box.innerHTML=`<div class="loading-state">Formulir belum dapat dimuat.<br><small>${esc(e.message||"Silakan coba kembali.")}</small></div>`;});
}
function readFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
function val(form,name){const e=form.querySelector('[name="'+name.replace(/"/g,'\\"')+'"]');return e?e.value:"";}
async function submit(e){
 e.preventDefault();
 const form=e.currentTarget,btn=$("submitSurvey");
 if(btn){btn.disabled=true;btn.textContent="Mengirim…";}
 try{
  const answers={};
  for(const q of currentSurvey.questions||[]){
   const n="q_"+q.id,t=String(q.type||"text").toLowerCase();
   if(t==="checkbox")answers[q.id]=Array.from(form.querySelectorAll('input[name="'+n+'"]:checked')).map(x=>x.value);
   else if(t!=="file"){const x=form.querySelector('[name="'+n.replace(/"/g,'\\"')+'"]');answers[q.id]=x?x.value:"";}
  }
  for(const q of currentSurvey.questions||[]){
   if(String(q.type||"").toLowerCase()!=="file")continue;
   const x=form.querySelector('input[data-question="'+q.id+'"]'),f=x&&x.files&&x.files[0];if(!f)continue;
   const st=$("fileStatus_"+q.id);if(st)st.textContent="Mengunggah…";
   const d=String(await readFile(f)),m=d.match(/^data:([^;]+);base64,(.+)$/);if(!m)throw new Error("File tidak dapat dibaca.");
   const r=await BVAPI.uploadFile({surveyId:currentSurvey.id,questionId:q.id,accessKey:link.key,accessCode:link.code,fileName:f.name,mimeType:f.type,base64:m[2]});
   answers[q.id]=r.url||r.name||"";
   if(st)st.textContent="✓ "+(r.name||f.name);
  }
  await BVAPI.submitResponse({
   surveyId:currentSurvey.id,accessKey:link.key,accessCode:link.code,answers,
   respondentName:val(form,"respondentName"),respondentEmail:val(form,"respondentEmail"),
   respondentWA:val(form,"respondentWA"),respondentInstitution:val(form,"respondentInstitution"),
   respondentContact:val(form,"respondentEmail")||val(form,"respondentWA"),
   userAgent:navigator.userAgent
  });
  notice("<b>Terima kasih.</b><br>Formulir berhasil dikirim.");
  form.reset();
 }catch(e){notice("<b>Belum berhasil.</b><br>"+esc(e.message||"Silakan coba kembali."),true);}
 finally{if(btn){btn.disabled=false;btn.textContent="Kirim Formulir";}}
}
function init(){
 link=params();
 const f=$("surveyForm");if(f)f.addEventListener("submit",submit);
 if($("closeModal"))$("closeModal").onclick=closeModal;
 if($("cancelSurvey"))$("cancelSurvey").onclick=closeModal;
 if($("surveyModal"))$("surveyModal").onclick=e=>{if(e.target===$("surveyModal"))closeModal();};
 if(link.survey)openSurvey(link.survey,link.key,link.code);else loadList();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
