
/**
 * BEING ADMIN TERPADU v5.0 NATIVE
 * Apps Script HTMLService + google.script.run
 * Tidak memakai fetch / JSONP / cross-origin API dari browser.
 *
 * Pasang project ini sebagai Apps Script TERIKAT ke spreadsheet "being voice".
 * Jalankan setupBeingAdminNative() sekali dari editor.
 */

const BEING_ADMIN = {
  VERSION: '5.0',
  BANGDIR_SPREADSHEET_ID: '1jzx2Sna9p0a3wbhxAcqubxqGBcHEo585Ku34AInfG14',
  DEFAULT_PIN: 'being123456',
  PUBLIC_BANGDIR_URL: 'https://bangdir.beingpsikologi.com/'
};

const BANG_HEADERS = {
  PROGRAM:['ProgramID','Nama','Kategori','Deskripsi','Status','PricingType','Price','TanggalMulai','TanggalAkhir','Tanggal','MediaURL','MediaType'],
  PESERTA:['PesertaID','ProgramID','Nama','Email','WA','Instansi','Catatan','Status','PaymentStatus','AccessToken','TanggalDaftar','TanggalAktif'],
  SESI:['SesiID','ProgramID','Judul','Deskripsi','TanggalSesi','JamSesi','ZoomURL','ZoomAktif','Status','Tanggal'],
  MATERI:['MateriID','ProgramID','SesiID','Judul','Deskripsi','Link','Status','Tanggal'],
  PEMBAYARAN:['PaymentID','PesertaID','ProgramID','Nama','Email','Amount','ProofURL','Status','TanggalKirim','TanggalVerifikasi','Catatan'],
  KONTAK:['ContactID','Nama','Email','WA','Instansi','Sumber','PertamaMasuk','TerakhirAktif','TotalInteraksi','ProgramIDs','FormulirIDs']
};

const VOICE_HEADERS = {
  SURVEYS:["id","title","description","category","identityMode","status","startDate","endDate","accessMode","accessCode","shareKey","createdAt","updatedAt"],
  QUESTIONS:["id","surveyId","text","type","required","optionsJson","sortOrder","createdAt","updatedAt"],
  RESPONSES:["id","surveyId","timestamp","respondentName","respondentContact","respondentEmail","respondentWA","respondentInstitution","answersJson","userAgent"]
};

function doGet(){
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('BEING Admin Terpadu')
    .addMetaTag('viewport','width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupBeingAdminNative(){
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Jalankan setup dari Apps Script yang terikat ke spreadsheet being voice.');
  const p = PropertiesService.getScriptProperties();
  p.setProperty('VOICE_SPREADSHEET_ID', active.getId());
  if (!p.getProperty('ADMIN_PIN')) p.setProperty('ADMIN_PIN', BEING_ADMIN.DEFAULT_PIN);

  ensureSheets_(active, VOICE_HEADERS);
  ensureSheets_(SpreadsheetApp.openById(BEING_ADMIN.BANGDIR_SPREADSHEET_ID), BANG_HEADERS);
  return {
    ok:true,
    voiceSpreadsheetId:active.getId(),
    bangdirSpreadsheetId:BEING_ADMIN.BANGDIR_SPREADSHEET_ID,
    version:BEING_ADMIN.VERSION
  };
}

function setAdminPin(pin){
  pin=String(pin||'').trim();
  if(pin.length<6) throw new Error('PIN minimal 6 karakter.');
  PropertiesService.getScriptProperties().setProperty('ADMIN_PIN',pin);
  return 'PIN admin diperbarui.';
}

function loginAdmin(pin){
  const ok = String(pin||'') === String(PropertiesService.getScriptProperties().getProperty('ADMIN_PIN')||BEING_ADMIN.DEFAULT_PIN);
  if(!ok) return {ok:false,message:'PIN admin tidak valid.'};
  return {ok:true,version:BEING_ADMIN.VERSION};
}

function getDashboard(pin){
  requirePin_(pin);
  const programs=getPrograms_(), participants=getParticipants_(), payments=getPayments_(), sessions=getSessions_(), materials=getMaterials_(), contacts=getContacts_(), forms=getForms_();
  return {
    ok:true,
    stats:{
      contacts:contacts.length,
      programs:programs.length,
      participants:participants.length,
      payments:payments.length,
      sessions:sessions.length,
      materials:materials.length,
      forms:forms.length,
      responses:countRows_(voiceSS_(),'RESPONSES')
    },
    programs,participants,payments,sessions,materials,contacts,forms
  };
}

// ---------- Program ----------
function saveProgram(pin,b){
  requirePin_(pin);
  b=b||{};
  if(b.programId) return updateProgram_(b);
  const nama=String(b.nama||'').trim();
  if(!nama) throw new Error('Nama program wajib diisi.');
  const type=pricing_(b.pricingType), price=type==='GRATIS'?0:Number(b.price||0);
  if(type==='BERBAYAR'&&price<=0) throw new Error('Program berbayar harus memiliki harga.');
  const tm=String(b.tanggalMulai||''), ta=String(b.tanggalAkhir||'');
  if(tm&&ta&&ta<tm) throw new Error('Sampai tanggal tidak boleh lebih awal dari tanggal kegiatan.');
  appendObject_(bangSheet_('PROGRAM'),{
    ProgramID:id_('PRG'),Nama:nama,Kategori:normalizeCategory_(b.kategori),Deskripsi:String(b.deskripsi||''),
    Status:String(b.status||'BUKA').toUpperCase(),PricingType:type,Price:price,TanggalMulai:tm,TanggalAkhir:ta,Tanggal:new Date(),
    MediaURL:String(b.mediaUrl||''),MediaType:inferMediaType_(b.mediaUrl,b.mediaType)
  });
  return {ok:true,message:'Program berhasil dibuat.'};
}

function updateProgram_(b){
  const id=String(b.programId||'').trim();
  if(!id) throw new Error('ProgramID tidak ada.');
  const type=pricing_(b.pricingType), price=type==='GRATIS'?0:Number(b.price||0);
  if(type==='BERBAYAR'&&price<=0) throw new Error('Program berbayar harus memiliki harga.');
  const tm=String(b.tanggalMulai||''), ta=String(b.tanggalAkhir||'');
  if(tm&&ta&&ta<tm) throw new Error('Sampai tanggal tidak boleh lebih awal.');
  const s=bangSheet_('PROGRAM');
  updateById_(s,'ProgramID',id,{
    Nama:String(b.nama||''),Kategori:normalizeCategory_(b.kategori),Deskripsi:String(b.deskripsi||''),
    PricingType:type,Price:price,TanggalMulai:tm,TanggalAkhir:ta,
    MediaURL:String(b.mediaUrl||''),MediaType:inferMediaType_(b.mediaUrl,b.mediaType)
  });
  return {ok:true,message:'Program diperbarui.'};
}

function setProgramStatus(pin,id,status){
  requirePin_(pin); updateById_(bangSheet_('PROGRAM'),'ProgramID',id,{Status:String(status||'').toUpperCase()});
  return {ok:true,message:'Status program diperbarui.'};
}

function deleteProgram(pin,id){
  requirePin_(pin);
  const deps=['PESERTA','SESI','MATERI','PEMBAYARAN'].map(n=>rows_(bangSheet_(n)).filter(r=>String(r.ProgramID)===String(id)).length);
  if(deps.some(Boolean)) throw new Error(`Program masih terhubung dengan ${deps[0]} peserta, ${deps[1]} sesi, ${deps[2]} materi, ${deps[3]} pembayaran.`);
  deleteById_(bangSheet_('PROGRAM'),'ProgramID',id);
  return {ok:true,message:'Program dihapus.'};
}

// ---------- Peserta ----------
function deleteParticipant(pin,id){
  requirePin_(pin);
  rows_(bangSheet_('PEMBAYARAN')).filter(r=>String(r.PesertaID)===String(id)).forEach(r=>deleteById_(bangSheet_('PEMBAYARAN'),'PaymentID',r.PaymentID));
  deleteById_(bangSheet_('PESERTA'),'PesertaID',id);
  return {ok:true,message:'Peserta dihapus.'};
}

function sendAccessEmail(pin,pesertaId){
  requirePin_(pin);
  const p=getParticipants_().find(x=>x.pesertaId===String(pesertaId));
  if(!p) throw new Error('Peserta tidak ditemukan.');
  if(p.status!=='AKTIF'||!p.accessToken) throw new Error('Peserta belum aktif / belum punya kode akses.');
  MailApp.sendEmail({
    to:p.email,
    name:'BEING Biro Psikologi',
    subject:'Akses MyBeing - '+p.programNama,
    htmlBody:`<p>Halo <b>${escapeHtml_(p.nama)}</b>,</p><p>Akses MyBeing untuk <b>${escapeHtml_(p.programNama)}</b>:</p>
      <p>Kode akses: <b>${escapeHtml_(p.accessToken)}</b></p>
      <p><a href="${accessUrl_(p.accessToken)}">Buka MyBeing</a></p><p>Salam,<br>BEING Biro Psikologi</p>`
  });
  return {ok:true,message:'Email akses terkirim.'};
}

// ---------- Pembayaran ----------
function approvePayment(pin,id){
  requirePin_(pin);
  const pay=getPayments_().find(x=>x.paymentId===String(id));
  if(!pay) throw new Error('Pembayaran tidak ditemukan.');
  updateById_(bangSheet_('PEMBAYARAN'),'PaymentID',id,{Status:'LUNAS',TanggalVerifikasi:new Date()});
  updateById_(bangSheet_('PESERTA'),'PesertaID',pay.pesertaId,{Status:'AKTIF',PaymentStatus:'LUNAS',TanggalAktif:new Date()});
  try{sendAccessEmail(pin,pay.pesertaId)}catch(_){}
  return {ok:true,message:'Pembayaran diset LUNAS dan peserta diaktifkan.'};
}

function rejectPayment(pin,id,note){
  requirePin_(pin);
  const pay=getPayments_().find(x=>x.paymentId===String(id));
  if(!pay) throw new Error('Pembayaran tidak ditemukan.');
  updateById_(bangSheet_('PEMBAYARAN'),'PaymentID',id,{Status:'DITOLAK',TanggalVerifikasi:new Date(),Catatan:String(note||'')});
  updateById_(bangSheet_('PESERTA'),'PesertaID',pay.pesertaId,{Status:'BUKTI_DITOLAK',PaymentStatus:'DITOLAK'});
  return {ok:true,message:'Pembayaran ditolak.'};
}

function deletePayment(pin,id){
  requirePin_(pin); deleteById_(bangSheet_('PEMBAYARAN'),'PaymentID',id); return {ok:true,message:'Pembayaran dihapus.'};
}

// ---------- Sesi ----------
function saveSession(pin,b){
  requirePin_(pin); b=b||{};
  if(!b.programId||!b.judul||!b.tanggalSesi) throw new Error('Program, judul, tanggal wajib.');
  if(b.sessionId){
    updateById_(bangSheet_('SESI'),'SesiID',b.sessionId,{
      ProgramID:String(b.programId),Judul:String(b.judul),Deskripsi:String(b.deskripsi||''),TanggalSesi:String(b.tanggalSesi),
      JamSesi:String(b.jamSesi||''),ZoomURL:String(b.zoomUrl||'')
    });
    return {ok:true,message:'Sesi diperbarui.'};
  }
  appendObject_(bangSheet_('SESI'),{SesiID:id_('SES'),ProgramID:String(b.programId),Judul:String(b.judul),Deskripsi:String(b.deskripsi||''),
    TanggalSesi:String(b.tanggalSesi),JamSesi:String(b.jamSesi||''),ZoomURL:String(b.zoomUrl||''),ZoomAktif:'TIDAK',Status:'PUBLIKASI',Tanggal:new Date()});
  return {ok:true,message:'Sesi dibuat.'};
}

function setSessionStatus(pin,id,status){
  requirePin_(pin); updateById_(bangSheet_('SESI'),'SesiID',id,{Status:String(status||'').toUpperCase()}); return {ok:true,message:'Status sesi diperbarui.'};
}
function toggleSessionZoom(pin,id,on){
  requirePin_(pin); updateById_(bangSheet_('SESI'),'SesiID',id,{ZoomAktif:on?'YA':'TIDAK'}); return {ok:true,message:'Zoom diperbarui.'};
}
function deleteSession(pin,id){
  requirePin_(pin);
  const ms=bangSheet_('MATERI'), map=headerMap_(ms);
  for(let r=2;r<=ms.getLastRow();r++) if(String(ms.getRange(r,map.SesiID).getValue())===String(id)) ms.getRange(r,map.SesiID).setValue('');
  deleteById_(bangSheet_('SESI'),'SesiID',id);
  return {ok:true,message:'Sesi dihapus. Materi terkait menjadi Materi Umum.'};
}

// ---------- Materi ----------
function saveMaterial(pin,b){
  requirePin_(pin); b=b||{};
  if(!b.programId||!b.judul||!b.link) throw new Error('Program, judul, link wajib.');
  if(b.sesiId){
    const s=getSessions_().find(x=>x.sesiId===String(b.sesiId));
    if(!s||s.programId!==String(b.programId)) throw new Error('Sesi tidak sesuai program.');
  }
  if(b.materialId){
    updateById_(bangSheet_('MATERI'),'MateriID',b.materialId,{
      ProgramID:String(b.programId),SesiID:String(b.sesiId||''),Judul:String(b.judul),Deskripsi:String(b.deskripsi||''),Link:String(b.link)
    });
    return {ok:true,message:'Materi diperbarui.'};
  }
  appendObject_(bangSheet_('MATERI'),{MateriID:id_('MAT'),ProgramID:String(b.programId),SesiID:String(b.sesiId||''),Judul:String(b.judul),
    Deskripsi:String(b.deskripsi||''),Link:String(b.link),Status:'PUBLIKASI',Tanggal:new Date()});
  return {ok:true,message:'Materi dibuat.'};
}
function setMaterialStatus(pin,id,status){
  requirePin_(pin); updateById_(bangSheet_('MATERI'),'MateriID',id,{Status:String(status||'').toUpperCase()}); return {ok:true,message:'Status materi diperbarui.'};
}
function deleteMaterial(pin,id){
  requirePin_(pin); deleteById_(bangSheet_('MATERI'),'MateriID',id); return {ok:true,message:'Materi dihapus.'};
}

// ---------- Formulir ----------
function saveForm(pin,b){
  requirePin_(pin); b=b||{};
  const s=voiceSheet_('SURVEYS'), id=String(b.id||'')||id_('S');
  const current=rows_(s).find(x=>String(x.id)===id);
  const obj={
    id,title:String(b.title||'').trim(),description:String(b.description||''),category:String(b.category||''),
    identityMode:String(b.identityMode||'anonymous'),status:String(b.status||'draft'),
    startDate:String(b.startDate||''),endDate:String(b.endDate||''),accessMode:String(b.accessMode||'public'),
    accessCode:String(b.accessCode||''),shareKey:String(b.shareKey||Utilities.getUuid().slice(0,8)),
    createdAt:current?current.createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  };
  if(!obj.title) throw new Error('Judul formulir wajib.');
  if(current) updateById_(s,'id',id,obj); else appendObject_(s,obj);
  return {ok:true,message:'Formulir disimpan.',id};
}
function deleteForm(pin,id){
  requirePin_(pin);
  deleteById_(voiceSheet_('SURVEYS'),'id',id);
  deleteWhere_(voiceSheet_('QUESTIONS'),'surveyId',id);
  deleteWhere_(voiceSheet_('RESPONSES'),'surveyId',id);
  return {ok:true,message:'Formulir dan data terkait dihapus.'};
}
function getFormDetails(pin,id){
  requirePin_(pin);
  return {
    questions:getQuestions_(id),
    responses:getResponses_(id)
  };
}
function saveQuestion(pin,b){
  requirePin_(pin); b=b||{};
  const s=voiceSheet_('QUESTIONS'), id=String(b.id||'')||id_('Q');
  const current=rows_(s).find(x=>String(x.id)===id);
  const obj={
    id,surveyId:String(b.surveyId||''),text:String(b.text||''),type:String(b.type||'text'),
    required:!!b.required,optionsJson:JSON.stringify(b.options||[]),
    sortOrder:current?Number(current.sortOrder||0):(getQuestions_(b.surveyId).length+1),
    createdAt:current?current.createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  };
  if(!obj.surveyId||!obj.text) throw new Error('Formulir dan pertanyaan wajib.');
  if(current) updateById_(s,'id',id,obj); else appendObject_(s,obj);
  return {ok:true,message:'Pertanyaan disimpan.'};
}
function deleteQuestion(pin,id){
  requirePin_(pin); deleteById_(voiceSheet_('QUESTIONS'),'id',id); return {ok:true,message:'Pertanyaan dihapus.'};
}
function deleteResponse(pin,id){
  requirePin_(pin); deleteById_(voiceSheet_('RESPONSES'),'id',id); return {ok:true,message:'Respons dihapus.'};
}

// ---------- Kontak ----------
function syncParticipantsToContacts(pin){
  requirePin_(pin);
  const peserta=rows_(bangSheet_('PESERTA'));
  peserta.forEach(r=>upsertContact_({
    nama:r.Nama,email:r.Email,wa:r.WA,instansi:r.Instansi,sumber:'PENGEMBANGAN DIRI',programId:r.ProgramID
  }));
  return {ok:true,message:peserta.length+' peserta disinkronkan.'};
}
function deleteContact(pin,id){
  requirePin_(pin); deleteById_(bangSheet_('KONTAK'),'ContactID',id); return {ok:true,message:'Kontak dihapus.'};
}

// ---------- Readers ----------
function getPrograms_(){return rows_(bangSheet_('PROGRAM')).map(r=>({
  programId:String(r.ProgramID||''),nama:String(r.Nama||''),kategori:normalizeCategory_(r.Kategori),deskripsi:String(r.Deskripsi||''),
  status:String(r.Status||'').toUpperCase(),pricingType:pricing_(r.PricingType),price:Number(r.Price||0),
  tanggalMulai:dateOnly_(r.TanggalMulai),tanggalAkhir:dateOnly_(r.TanggalAkhir),mediaUrl:String(r.MediaURL||''),mediaType:String(r.MediaType||'')
}));}
function getParticipants_(){
  const pm=Object.fromEntries(getPrograms_().map(p=>[p.programId,p]));
  return rows_(bangSheet_('PESERTA')).map(r=>{const p=pm[String(r.ProgramID)]||{};return{
    pesertaId:String(r.PesertaID||''),programId:String(r.ProgramID||''),programNama:p.nama||'-',kategori:p.kategori||'-',
    pricingType:p.pricingType||'GRATIS',price:Number(p.price||0),nama:String(r.Nama||''),email:String(r.Email||''),wa:String(r.WA||''),
    institution:String(r.Instansi||''),status:String(r.Status||'').toUpperCase(),paymentStatus:String(r.PaymentStatus||''),
    accessToken:String(r.AccessToken||''),tanggalDaftar:dateOnly_(r.TanggalDaftar),tanggalAktif:dateOnly_(r.TanggalAktif)
  }}).reverse();
}
function getPayments_(){
  const pm=Object.fromEntries(getPrograms_().map(p=>[p.programId,p]));
  return rows_(bangSheet_('PEMBAYARAN')).map(r=>{const p=pm[String(r.ProgramID)]||{};return{
    paymentId:String(r.PaymentID||''),pesertaId:String(r.PesertaID||''),programId:String(r.ProgramID||''),programNama:p.nama||'-',
    nama:String(r.Nama||''),email:String(r.Email||''),amount:Number(r.Amount||0),proofUrl:String(r.ProofURL||''),
    status:String(r.Status||'').toUpperCase(),tanggalKirim:dateOnly_(r.TanggalKirim),catatan:String(r.Catatan||'')
  }}).reverse();
}
function getSessions_(){
  const pm=Object.fromEntries(getPrograms_().map(p=>[p.programId,p]));
  return rows_(bangSheet_('SESI')).map(r=>{const p=pm[String(r.ProgramID)]||{};return{
    sesiId:String(r.SesiID||''),programId:String(r.ProgramID||''),programNama:p.nama||'-',judul:String(r.Judul||''),deskripsi:String(r.Deskripsi||''),
    tanggalSesi:dateOnly_(r.TanggalSesi),jamSesi:String(r.JamSesi||''),zoomUrl:String(r.ZoomURL||''),
    zoomAktif:String(r.ZoomAktif||'').toUpperCase()==='YA',status:String(r.Status||'').toUpperCase()
  }}).sort((a,b)=>(a.tanggalSesi+' '+a.jamSesi).localeCompare(b.tanggalSesi+' '+b.jamSesi));
}
function getMaterials_(){
  const pm=Object.fromEntries(getPrograms_().map(p=>[p.programId,p])), sm=Object.fromEntries(getSessions_().map(s=>[s.sesiId,s.judul]));
  return rows_(bangSheet_('MATERI')).map(r=>{const p=pm[String(r.ProgramID)]||{};return{
    materiId:String(r.MateriID||''),programId:String(r.ProgramID||''),programNama:p.nama||'-',sesiId:String(r.SesiID||''),
    sesiNama:sm[String(r.SesiID)]||'',judul:String(r.Judul||''),deskripsi:String(r.Deskripsi||''),link:String(r.Link||''),
    status:String(r.Status||'').toUpperCase(),tanggal:dateOnly_(r.Tanggal)
  }}).reverse();
}
function getContacts_(){
  return rows_(bangSheet_('KONTAK')).map(r=>({
    contactId:String(r.ContactID||''),nama:String(r.Nama||''),email:String(r.Email||''),wa:String(r.WA||''),instansi:String(r.Instansi||''),
    sumber:String(r.Sumber||''),terakhirAktif:dateOnly_(r.TerakhirAktif),totalInteraksi:Number(r.TotalInteraksi||0)
  })).reverse();
}
function getForms_(){
  const qs=rows_(voiceSheet_('QUESTIONS')), rs=rows_(voiceSheet_('RESPONSES'));
  return rows_(voiceSheet_('SURVEYS')).map(s=>({
    id:String(s.id||''),title:String(s.title||''),description:String(s.description||''),category:String(s.category||''),
    identityMode:String(s.identityMode||'anonymous'),status:String(s.status||'draft'),accessMode:String(s.accessMode||'public'),
    accessCode:String(s.accessCode||''),shareKey:String(s.shareKey||''),endDate:String(s.endDate||''),
    questionCount:qs.filter(q=>String(q.surveyId)===String(s.id)).length,
    responseCount:rs.filter(r=>String(r.surveyId)===String(s.id)).length
  })).reverse();
}
function getQuestions_(surveyId){
  return rows_(voiceSheet_('QUESTIONS')).filter(q=>String(q.surveyId)===String(surveyId)).map(q=>({
    id:String(q.id),surveyId:String(q.surveyId),text:String(q.text||''),type:String(q.type||'text'),required:String(q.required).toLowerCase()==='true'||q.required===true,
    options:parseJson_(q.optionsJson,[])
  })).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0));
}
function getResponses_(surveyId){
  return rows_(voiceSheet_('RESPONSES')).filter(r=>String(r.surveyId)===String(surveyId)).map(r=>({
    id:String(r.id),timestamp:String(r.timestamp||''),respondentName:String(r.respondentName||''),respondentEmail:String(r.respondentEmail||''),
    respondentWA:String(r.respondentWA||''),respondentInstitution:String(r.respondentInstitution||''),answers:parseJson_(r.answersJson,{})
  })).reverse();
}

// ---------- Helpers ----------
function requirePin_(pin){
  const saved=PropertiesService.getScriptProperties().getProperty('ADMIN_PIN')||BEING_ADMIN.DEFAULT_PIN;
  if(String(pin||'')!==String(saved)) throw new Error('PIN admin tidak valid.');
}
function voiceSS_(){
  const id=PropertiesService.getScriptProperties().getProperty('VOICE_SPREADSHEET_ID');
  if(!id) throw new Error('VOICE_SPREADSHEET_ID belum diatur. Jalankan setupBeingAdminNative().');
  return SpreadsheetApp.openById(id);
}
function bangSS_(){return SpreadsheetApp.openById(BEING_ADMIN.BANGDIR_SPREADSHEET_ID);}
function bangSheet_(n){const s=bangSS_().getSheetByName(n);if(!s)throw new Error('Sheet '+n+' tidak ada.');return s;}
function voiceSheet_(n){const s=voiceSS_().getSheetByName(n);if(!s)throw new Error('Sheet '+n+' tidak ada.');return s;}
function ensureSheets_(ss,defs){Object.keys(defs).forEach(n=>{let s=ss.getSheetByName(n);if(!s)s=ss.insertSheet(n);ensureHeaders_(s,defs[n]);});}
function ensureHeaders_(s,required){
  if(s.getLastRow()===0){s.getRange(1,1,1,required.length).setValues([required]);s.setFrozenRows(1);return;}
  const current=s.getRange(1,1,1,Math.max(1,s.getLastColumn())).getValues()[0].map(v=>String(v).trim());
  required.forEach(h=>{if(!current.includes(h)){s.getRange(1,s.getLastColumn()+1).setValue(h);current.push(h);}});
  s.setFrozenRows(1);
}
function rows_(s){
  const v=s.getDataRange().getValues(); if(v.length<2)return[];
  const h=v.shift().map(x=>String(x).trim());
  return v.filter(r=>r.some(x=>x!==''&&x!==null)).map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]])));
}
function appendObject_(s,o){
  const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0].map(x=>String(x).trim());
  s.appendRow(h.map(k=>Object.prototype.hasOwnProperty.call(o,k)?o[k]:''));
}
function headerMap_(s){const h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0],m={};h.forEach((x,i)=>m[String(x).trim()]=i+1);return m;}
function updateById_(s,idHeader,idValue,obj){
  const m=headerMap_(s); if(!m[idHeader])throw new Error('Header '+idHeader+' tidak ada.');
  for(let r=2;r<=s.getLastRow();r++) if(String(s.getRange(r,m[idHeader]).getValue())===String(idValue)){
    Object.entries(obj).forEach(([k,v])=>{if(m[k])s.getRange(r,m[k]).setValue(v);}); return true;
  }
  throw new Error('Data tidak ditemukan.');
}
function deleteById_(s,idHeader,idValue){
  const m=headerMap_(s); if(!m[idHeader])throw new Error('Header '+idHeader+' tidak ada.');
  for(let r=2;r<=s.getLastRow();r++) if(String(s.getRange(r,m[idHeader]).getValue())===String(idValue)){s.deleteRow(r);return true;}
  return false;
}
function deleteWhere_(s,field,value){
  const m=headerMap_(s); if(!m[field])return;
  for(let r=s.getLastRow();r>=2;r--) if(String(s.getRange(r,m[field]).getValue())===String(value))s.deleteRow(r);
}
function countRows_(ss,n){const s=ss.getSheetByName(n);return s?Math.max(0,s.getLastRow()-1):0;}
function id_(p){return p+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase();}
function dateOnly_(v){if(!v)return'';const d=v instanceof Date?v:new Date(v);if(isNaN(d.getTime()))return String(v||'');return Utilities.formatDate(d,Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM-dd');}
function normalizeCategory_(v){const r=String(v||'').trim().toUpperCase();if(r==='BOOT CAMP')return'BOOTCAMP';if(r==='SERTIFIKASI'||r==='BNSP')return'SERTIFIKASI BNSP';return ['SHARING KNOWLEDGE','BOOTCAMP','SERTIFIKASI BNSP'].includes(r)?r:'SHARING KNOWLEDGE';}
function pricing_(v){return String(v||'GRATIS').trim().toUpperCase()==='BERBAYAR'?'BERBAYAR':'GRATIS';}
function inferMediaType_(url,exp){const t=String(exp||'').trim().toUpperCase();if(t)return t;const u=String(url||'').toLowerCase();if(/\.(jpg|jpeg|png|webp)(\?|$)/.test(u))return'IMAGE';if(/\.pdf(\?|$)/.test(u))return'PDF';return u?'LINK':'';}
function normalizeWA_(v){let r=String(v||'').replace(/\D/g,'');if(r.startsWith('62'))return r;if(r.startsWith('0'))return'62'+r.slice(1);if(r.startsWith('8'))return'62'+r;return r;}
function normalizeEmail_(v){return String(v||'').trim().toLowerCase();}
function mergePipe_(oldV,newV){return [...new Set((String(oldV||'')+'|'+String(newV||'')).split('|').map(x=>x.trim()).filter(Boolean))].join(' | ');}
function upsertContact_(d){
  const s=bangSheet_('KONTAK'),m=headerMap_(s),email=normalizeEmail_(d.email),wa=normalizeWA_(d.wa);let row=0;
  for(let r=2;r<=s.getLastRow();r++){const re=normalizeEmail_(s.getRange(r,m.Email).getValue()),rw=normalizeWA_(s.getRange(r,m.WA).getValue());if((email&&re===email)||(wa&&rw===wa)){row=r;break;}}
  if(!row){appendObject_(s,{ContactID:id_('CNT'),Nama:String(d.nama||''),Email:String(d.email||''),WA:String(d.wa||''),Instansi:String(d.instansi||''),Sumber:String(d.sumber||''),PertamaMasuk:new Date(),TerakhirAktif:new Date(),TotalInteraksi:1,ProgramIDs:String(d.programId||''),FormulirIDs:String(d.formulirId||'')});return;}
  if(String(d.nama||'').trim())s.getRange(row,m.Nama).setValue(String(d.nama).trim());
  if(String(d.email||'').trim())s.getRange(row,m.Email).setValue(String(d.email).trim());
  if(String(d.wa||'').trim())s.getRange(row,m.WA).setValue(String(d.wa).trim());
  if(String(d.instansi||'').trim())s.getRange(row,m.Instansi).setValue(String(d.instansi).trim());
  s.getRange(row,m.Sumber).setValue(mergePipe_(s.getRange(row,m.Sumber).getValue(),d.sumber));
  if(d.programId)s.getRange(row,m.ProgramIDs).setValue(mergePipe_(s.getRange(row,m.ProgramIDs).getValue(),d.programId));
  s.getRange(row,m.TerakhirAktif).setValue(new Date());
  s.getRange(row,m.TotalInteraksi).setValue(Number(s.getRange(row,m.TotalInteraksi).getValue()||0)+1);
}
function accessUrl_(t){return BEING_ADMIN.PUBLIC_BANGDIR_URL+'akses.html?access='+encodeURIComponent(String(t||''));}
function parseJson_(s,f){try{return JSON.parse(String(s||''))}catch(_){return f;}}
function escapeHtml_(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
