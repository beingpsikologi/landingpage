const BV={
 sheets:{SURVEYS:"SURVEYS",QUESTIONS:"QUESTIONS",RESPONSES:"RESPONSES"},
 headers:{
  SURVEYS:["id","title","description","category","identityMode","status","startDate","endDate","accessMode","accessCode","shareKey","createdAt","updatedAt"],
  QUESTIONS:["id","surveyId","text","type","required","optionsJson","sortOrder","createdAt","updatedAt"],
  RESPONSES:["id","surveyId","timestamp","respondentName","respondentContact","respondentEmail","respondentWA","respondentInstitution","answersJson","userAgent"]
 }
};

function setupBeingVoice(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();
 PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID",ss.getId());
 ensureSchema_();
 const p=PropertiesService.getScriptProperties();if(!p.getProperty("ADMIN_PIN"))p.setProperty("ADMIN_PIN","being123");
 if(!p.getProperty("MASTER_SPREADSHEET_ID"))p.setProperty("MASTER_SPREADSHEET_ID","1jzx2Sna9p0a3wbhxAcqubxqGBcHEo585Ku34AInfG14");
 return "BEING Formulir siap. Data lama tetap dipertahankan.";
}
function upgradeBeingVoiceV12(){ensureSchema_();return "Upgrade BEING Voice v1.2 selesai tanpa menghapus data."}

function doGet(e){
 try{
  ensureSchema_();
  const p=e&&e.parameter?e.parameter:{};
  const action=String(p.action||'').trim();
  if(!action)return output_({ok:true,data:{service:"BEING Voice API",version:"4.0-stabil"}});
  const payload=parseJson_(p.payload,{})||{};
  const token=String(p.token||'');
  const publicActions=["public.listSurveys","public.getSurvey","admin.login"];
  if(publicActions.indexOf(action)<0)requireAdmin_(token);
  let data;
  switch(action){
   case"public.listSurveys":data=publicListSurveys_();break;
   case"public.getSurvey":data=publicGetSurvey_(payload);break;
   case"admin.login":data=adminLogin_(payload.pin);break;
   case"admin.verify":data={valid:true};break;
   case"admin.listSurveys":data=adminListSurveys_();break;
   case"admin.saveSurvey":data=adminSaveSurvey_(payload);break;
   case"admin.deleteSurvey":data=adminDeleteSurvey_(payload.surveyId);break;
   case"admin.listQuestions":data=adminListQuestions_(payload.surveyId);break;
   case"admin.saveQuestion":data=adminSaveQuestion_(payload);break;
   case"admin.deleteQuestion":data=adminDeleteQuestion_(payload.questionId);break;
   case"admin.getResults":data=adminGetResults_(payload.surveyId);break;
   case"admin.deleteResponse":data=adminDeleteResponse_(payload.responseId);break;
   case"admin.syncOldResponses":data=adminSyncOldResponses_();break;
   default:throw new Error("Aksi GET API tidak dikenal.");
  }
  return output_({ok:true,data});
 }catch(err){return output_({ok:false,message:err.message||String(err)})}
}
function doPost(e){
 try{
  ensureSchema_();
  const req=JSON.parse((e.postData&&e.postData.contents)||"{}"),action=req.action||"",payload=req.payload||{},token=req.token||"";
  const publicActions=["public.listSurveys","public.getSurvey","public.submitResponse","public.uploadFile","admin.login"];
  if(publicActions.indexOf(action)<0)requireAdmin_(token);
  let data;
  switch(action){
   case"public.listSurveys":data=publicListSurveys_();break;
   case"public.getSurvey":data=publicGetSurvey_(payload);break;
   case"public.submitResponse":data=publicSubmitResponse_(payload);break;
   case"public.uploadFile":data=publicUploadFile_(payload);break;
   case"admin.login":data=adminLogin_(payload.pin);break;
   case"admin.verify":data={valid:true};break;
   case"admin.listSurveys":data=adminListSurveys_();break;
   case"admin.saveSurvey":data=adminSaveSurvey_(payload);break;
   case"admin.deleteSurvey":data=adminDeleteSurvey_(payload.surveyId);break;
   case"admin.listQuestions":data=adminListQuestions_(payload.surveyId);break;
   case"admin.saveQuestion":data=adminSaveQuestion_(payload);break;
   case"admin.deleteQuestion":data=adminDeleteQuestion_(payload.questionId);break;
   case"admin.getResults":data=adminGetResults_(payload.surveyId);break;
   case"admin.deleteResponse":data=adminDeleteResponse_(payload.responseId);break;
   case"admin.syncOldResponses":data=adminSyncOldResponses_();break;
   default:throw new Error("Aksi API tidak dikenal.");
  }
  return output_({ok:true,data:data});
 }catch(err){return output_({ok:false,message:err.message||String(err)})}
}
function output_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function ss_(){const id=PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");return id?SpreadsheetApp.openById(id):SpreadsheetApp.getActiveSpreadsheet()}
function ensureSchema_(){
 const ss=ss_();
 Object.keys(BV.sheets).forEach(k=>{
  const name=BV.sheets[k],need=BV.headers[k];let sh=ss.getSheetByName(name);
  if(!sh)sh=ss.insertSheet(name);
  const last=Math.max(1,sh.getLastColumn());
  let have=sh.getRange(1,1,1,last).getValues()[0].map(String).filter(Boolean);
  if(!have.length){sh.getRange(1,1,1,need.length).setValues([need]);have=need.slice()}
  const missing=need.filter(h=>have.indexOf(h)<0);
  if(missing.length)sh.getRange(1,have.length+1,1,missing.length).setValues([missing]);
  sh.getRange(1,1,1,sh.getLastColumn()).setFontWeight("bold").setBackground("#164f43").setFontColor("#fff");sh.setFrozenRows(1);
 });
}
function sh_(n){return ss_().getSheetByName(n)}
function headers_(n){return sh_(n).getRange(1,1,1,sh_(n).getLastColumn()).getValues()[0].map(String)}
function rows_(n){
 const sh=sh_(n),v=sh.getDataRange().getValues();if(v.length<2)return[];
 const h=v.shift().map(String);return v.filter(r=>r.some(x=>x!=="")).map((r,i)=>{const o={_row:i+2};h.forEach((x,j)=>o[x]=r[j]);return o});
}
function append_(n,o){const h=headers_(n);sh_(n).appendRow(h.map(x=>o[x]===undefined?"":o[x]))}
function updateRow_(n,row,o){const h=headers_(n);sh_(n).getRange(row,1,1,h.length).setValues([h.map(x=>o[x]===undefined?"":o[x])])}
function uid_(p){return p+"-"+Utilities.getUuid().split("-")[0].toUpperCase()}
function now_(){return new Date().toISOString()}
function clean_(o){const c=Object.assign({},o);delete c._row;return c}
function parseJson_(v,f){try{return JSON.parse(v||"")}catch(e){return f}}
function adminLogin_(pin){
 const stored=PropertiesService.getScriptProperties().getProperty("ADMIN_PIN")||"being123";
 if(String(pin)!==String(stored))throw new Error("PIN admin tidak sesuai.");
 const token=Utilities.getUuid();CacheService.getScriptCache().put("TOKEN_"+token,"1",21600);return{token}
}
function requireAdmin_(t){if(!t||!CacheService.getScriptCache().get("TOKEN_"+t))throw new Error("Sesi admin berakhir. Silakan masuk kembali.")}
function countMap_(){
 const q=rows_("QUESTIONS"),r=rows_("RESPONSES"),m={};
 q.forEach(x=>{m[x.surveyId]=m[x.surveyId]||{q:0,r:0};m[x.surveyId].q++});
 r.forEach(x=>{m[x.surveyId]=m[x.surveyId]||{q:0,r:0};m[x.surveyId].r++});return m;
}
function surveyView_(s,m){return Object.assign(clean_(s),{accessMode:s.accessMode||"public",questionCount:(m[s.id]||{}).q||0,responseCount:(m[s.id]||{}).r||0})}
function active_(s){return s&&s.status==="active"&&(!s.endDate||new Date(s.endDate)>=new Date())}
function authorized_(s,p){
 const mode=s.accessMode||"public";
 if(mode==="public")return true;
 if(mode==="link")return !!p.accessKey&&String(p.accessKey)===String(s.shareKey);
 if(mode==="code"){
  if(!p.accessCode)throw new Error("KODE_AKSES_DIPERLUKAN: Masukkan kode akses dari admin BEING.");
  return String(p.accessCode).trim().toLowerCase()===String(s.accessCode||"").trim().toLowerCase();
 }
 return false;
}
function publicListSurveys_(){
 const m=countMap_();return rows_("SURVEYS").filter(s=>active_(s)&&(s.accessMode||"public")==="public").map(s=>surveyView_(s,m));
}
function publicGetSurvey_(p){
 const s=rows_("SURVEYS").find(x=>x.id===p.surveyId);if(!active_(s))throw new Error("Formulir tidak tersedia atau sudah ditutup.");
 if(!authorized_(s,p))throw new Error("Akses formulir tidak valid.");
 const view=clean_(s);delete view.accessCode;delete view.shareKey;view.questions=adminListQuestions_(s.id);return view;
}
function publicSubmitResponse_(p){
 const s=rows_("SURVEYS").find(x=>x.id===p.surveyId);if(!active_(s))throw new Error("Formulir tidak aktif.");
 if(!authorized_(s,p))throw new Error("Akses formulir tidak valid.");
 const qs=adminListQuestions_(p.surveyId),ans=p.answers||{};
 qs.forEach(q=>{const v=ans[q.id];if(q.required&&((Array.isArray(v)&&!v.length)||(!Array.isArray(v)&&!String(v||"").trim())))throw new Error("Masih ada pertanyaan wajib yang belum dijawab.")});
 const email=String(p.respondentEmail||"").trim(),wa=String(p.respondentWA||"").trim(),instansi=String(p.respondentInstitution||"").trim();
 const legacy=String(p.respondentContact||email||wa||"").trim();
 append_("RESPONSES",{id:uid_("R"),surveyId:p.surveyId,timestamp:now_(),respondentName:p.respondentName||"",respondentContact:legacy,respondentEmail:email,respondentWA:wa,respondentInstitution:instansi,answersJson:JSON.stringify(ans),userAgent:p.userAgent||""});
 try{upsertMasterContact_({nama:p.respondentName||"",email:email,wa:wa,instansi:instansi,sumber:"FORMULIR",formulirId:p.surveyId})}catch(_){}
 return{saved:true};
}
function publicUploadFile_(p){
 const s=rows_("SURVEYS").find(x=>x.id===p.surveyId);if(!active_(s))throw new Error("Formulir tidak aktif.");
 if(!authorized_(s,p))throw new Error("Akses formulir tidak valid.");
 const q=adminListQuestions_(p.surveyId).find(x=>x.id===p.questionId);if(!q||q.type!=="file")throw new Error("Pertanyaan upload tidak ditemukan.");
 const cfg=(q.options&&q.options[0])||{},maxMb=Number(cfg.maxMb||5);
 const bytes=Utilities.base64Decode(String(p.base64||""));if(bytes.length>maxMb*1024*1024)throw new Error("Ukuran berkas melebihi batas.");
 const folderId=PropertiesService.getScriptProperties().getProperty("UPLOAD_FOLDER_ID")||"";
 const folder=folderId?DriveApp.getFolderById(folderId):DriveApp.getRootFolder();
 const safeName=String(p.fileName||"berkas").replace(/[\\/:*?"<>|]/g,"-");
 const f=folder.createFile(Utilities.newBlob(bytes,p.mimeType||"application/octet-stream",p.surveyId+" - "+safeName));
 try{f.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW)}catch(_){}
 return{name:safeName,url:f.getUrl(),mimeType:p.mimeType||"",size:bytes.length};
}
function adminListSurveys_(){const m=countMap_();return rows_("SURVEYS").sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).map(s=>surveyView_(s,m))}
function adminSaveSurvey_(p){
 if(!String(p.title||"").trim())throw new Error("Judul formulir wajib diisi.");
 const all=rows_("SURVEYS"),old=p.id?all.find(x=>x.id===p.id):null,n=now_(),mode=p.accessMode||"public";
 let code=String(p.accessCode||old&&old.accessCode||"").trim();
 if(mode==="code"&&!code)code="BEING"+Math.floor(1000+Math.random()*9000);
 const obj={id:old?old.id:uid_("S"),title:String(p.title).trim(),description:p.description||"",category:p.category||"",identityMode:p.identityMode||"anonymous",status:p.status||"draft",startDate:p.startDate||"",endDate:p.endDate||"",accessMode:mode,accessCode:mode==="code"?code:"",shareKey:old&&old.shareKey?old.shareKey:Utilities.getUuid().replace(/-/g,""),createdAt:old?old.createdAt:n,updatedAt:n};
 if(old)updateRow_("SURVEYS",old._row,obj);else append_("SURVEYS",obj);return clean_(obj);
}
function adminDeleteSurvey_(id){
 ["RESPONSES","QUESTIONS"].forEach(n=>{const sh=sh_(n);rows_(n).filter(x=>x.surveyId===id).sort((a,b)=>b._row-a._row).forEach(x=>sh.deleteRow(x._row))});
 const s=rows_("SURVEYS").find(x=>x.id===id);if(s)sh_("SURVEYS").deleteRow(s._row);return{deleted:true};
}
function adminListQuestions_(sid){return rows_("QUESTIONS").filter(x=>x.surveyId===sid).sort((a,b)=>Number(a.sortOrder)-Number(b.sortOrder)).map(x=>Object.assign(clean_(x),{required:String(x.required)==="true"||x.required===true,options:parseJson_(x.optionsJson,[])}))}
function adminSaveQuestion_(p){
 if(!p.surveyId||!String(p.text||"").trim())throw new Error("Formulir dan pertanyaan wajib diisi.");
 const all=rows_("QUESTIONS"),old=p.id?all.find(x=>x.id===p.id):null,n=now_(),order=old?old.sortOrder:all.filter(x=>x.surveyId===p.surveyId).length+1;
 const obj={id:old?old.id:uid_("Q"),surveyId:p.surveyId,text:String(p.text).trim(),type:p.type||"text",required:!!p.required,optionsJson:JSON.stringify(p.options||[]),sortOrder:order,createdAt:old?old.createdAt:n,updatedAt:n};
 if(old)updateRow_("QUESTIONS",old._row,obj);else append_("QUESTIONS",obj);return clean_(obj);
}
function adminDeleteQuestion_(id){const q=rows_("QUESTIONS").find(x=>x.id===id);if(q)sh_("QUESTIONS").deleteRow(q._row);return{deleted:true}}
function adminDeleteResponse_(id){const r=rows_("RESPONSES").find(x=>x.id===id);if(r)sh_("RESPONSES").deleteRow(r._row);return{deleted:true}}
function inferEmail_(v){const s=String(v||"").trim();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:""}
function inferWA_(v){const raw=String(v||"").trim();if(raw.indexOf("@")>=0)return"";let r=raw.replace(/\D/g,"");if(r.length<9)return"";if(r.startsWith("0"))r="62"+r.slice(1);return r}
function masterSs_(){const id=PropertiesService.getScriptProperties().getProperty("MASTER_SPREADSHEET_ID")||"";if(!id)throw new Error("MASTER_SPREADSHEET_ID belum diatur.");return SpreadsheetApp.openById(id)}
function ensureMasterContacts_(){
 const ss=masterSs_(),headers=["ContactID","Nama","Email","WA","Instansi","Sumber","PertamaMasuk","TerakhirAktif","TotalInteraksi","ProgramIDs","FormulirIDs"];let sh=ss.getSheetByName("KONTAK");if(!sh)sh=ss.insertSheet("KONTAK");
 if(sh.getLastRow()===0)sh.getRange(1,1,1,headers.length).setValues([headers]);
 const have=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),1)).getValues()[0].map(x=>String(x).trim());
 headers.forEach(h=>{if(have.indexOf(h)<0){sh.getRange(1,sh.getLastColumn()+1).setValue(h);have.push(h)}});sh.setFrozenRows(1);return sh
}
function masterMap_(sh){const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0],m={};h.forEach((x,i)=>m[String(x).trim()]=i+1);return m}
function mergePipeMaster_(a,b){return [...new Set((String(a||"")+"|"+String(b||"")).split("|").map(x=>x.trim()).filter(Boolean))].join(" | ")}
function normEmailMaster_(v){return String(v||"").trim().toLowerCase()}
function normWAMaster_(v){let r=String(v||"").replace(/\D/g,"");if(r.startsWith("0"))r="62"+r.slice(1);return r}
function upsertMasterContact_(d){
 const sh=ensureMasterContacts_(),m=masterMap_(sh),email=normEmailMaster_(d.email),wa=normWAMaster_(d.wa);if(!email&&!wa&&!String(d.nama||"").trim())return false;let row=0;
 for(let r=2;r<=sh.getLastRow();r++){const re=normEmailMaster_(sh.getRange(r,m.Email).getValue()),rw=normWAMaster_(sh.getRange(r,m.WA).getValue());if((email&&re===email)||(wa&&rw===wa)){row=r;break}}
 if(!row){sh.appendRow(Object.keys(m).sort((a,b)=>m[a]-m[b]).map(k=>({ContactID:"CNT-"+Utilities.getUuid().replace(/-/g,"").slice(0,10).toUpperCase(),Nama:d.nama||"",Email:d.email||"",WA:d.wa||"",Instansi:d.instansi||"",Sumber:d.sumber||"FORMULIR",PertamaMasuk:new Date(),TerakhirAktif:new Date(),TotalInteraksi:1,ProgramIDs:"",FormulirIDs:d.formulirId||""}[k]||"")));return true}
 if(String(d.nama||"").trim())sh.getRange(row,m.Nama).setValue(String(d.nama).trim());if(String(d.email||"").trim())sh.getRange(row,m.Email).setValue(String(d.email).trim());if(String(d.wa||"").trim())sh.getRange(row,m.WA).setValue(String(d.wa).trim());if(String(d.instansi||"").trim())sh.getRange(row,m.Instansi).setValue(String(d.instansi).trim());
 sh.getRange(row,m.Sumber).setValue(mergePipeMaster_(sh.getRange(row,m.Sumber).getValue(),d.sumber||"FORMULIR"));sh.getRange(row,m.FormulirIDs).setValue(mergePipeMaster_(sh.getRange(row,m.FormulirIDs).getValue(),d.formulirId));sh.getRange(row,m.TerakhirAktif).setValue(new Date());sh.getRange(row,m.TotalInteraksi).setValue(Number(sh.getRange(row,m.TotalInteraksi).getValue()||0)+1);return true
}
function adminSyncOldResponses_(){const rs=rows_("RESPONSES");let n=0;rs.forEach(r=>{const email=r.respondentEmail||inferEmail_(r.respondentContact),wa=r.respondentWA||inferWA_(r.respondentContact);if(r.respondentName||email||wa){try{if(upsertMasterContact_({nama:r.respondentName||"",email,wa,instansi:r.respondentInstitution||"",sumber:"FORMULIR",formulirId:r.surveyId}))n++}catch(_){}}});return{processed:rs.length,synced:n}}
function setUnifiedAdminPin(){PropertiesService.getScriptProperties().setProperty("ADMIN_PIN","being123456");return"PIN Formulir disamakan menjadi being123456"}
function setMasterSpreadsheetId(){PropertiesService.getScriptProperties().setProperty("MASTER_SPREADSHEET_ID","1jzx2Sna9p0a3wbhxAcqubxqGBcHEo585Ku34AInfG14");return"Master kontak diarahkan ke Spreadsheet Pengembangan Diri."}

function adminGetResults_(sid){
 const questions=adminListQuestions_(sid),responses=rows_("RESPONSES").filter(x=>x.surveyId===sid).map(r=>({id:r.id,timestamp:r.timestamp,respondentName:r.respondentName,respondentContact:r.respondentContact,respondentEmail:r.respondentEmail||inferEmail_(r.respondentContact),respondentWA:r.respondentWA||inferWA_(r.respondentContact),respondentInstitution:r.respondentInstitution||"",answers:parseJson_(r.answersJson,{})}));
 const summary=questions.map(q=>{
  const vals=responses.map(r=>r.answers[q.id]).filter(v=>v!==undefined&&v!==null&&v!=="");
  if(q.type==="text"||q.type==="textarea")return{question:q.text,type:q.type,answerCount:vals.length};
  const labels=q.type==="yesno"?["Ya","Tidak"]:q.type==="scale5"?["1","2","3","4","5"]:q.type==="scale10"?["1","2","3","4","5","6","7","8","9","10"]:q.options||[],counts={};
  labels.forEach(x=>counts[String(x)]=0);vals.forEach(v=>(Array.isArray(v)?v:[v]).forEach(x=>{x=String(x);counts[x]=(counts[x]||0)+1}));
  return{question:q.text,type:q.type,options:Object.keys(counts).map(k=>({label:k,count:counts[k]}))};
 });
 return{questions,responses,summary};
}

function auditBeingVoice(){
 ensureSchema_();
 return {
  version:"4.0",
  spreadsheetId:PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID")||"",
  masterSpreadsheetId:PropertiesService.getScriptProperties().getProperty("MASTER_SPREADSHEET_ID")||"",
  surveys:rows_("SURVEYS").length,
  questions:rows_("QUESTIONS").length,
  responses:rows_("RESPONSES").length,
  adminPinConfigured:!!PropertiesService.getScriptProperties().getProperty("ADMIN_PIN")
 };
}
