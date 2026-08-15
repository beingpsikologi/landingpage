/* BEING VOICE PUBLIC — FIX 6.2.1
   Memuat formulir dari API Voice yang sudah terbukti mengembalikan JSON.
   Mendukung:
   text, textarea, radio, checkbox, select, yesno, scale5, scale10, file.
   Link:
     ?survey=ID
     ?survey=ID&key=SHARE_KEY
     ?survey=ID&code=KODE
*/
(function(){
  "use strict";

  const $ = id => document.getElementById(id);
  let currentSurvey = null;
  let currentLink = {survey:"", key:"", code:""};

  function esc(v){
    return String(v == null ? "" : v)
      .replace(/&/g,"&amp;")
      .replace(/</g,"&lt;")
      .replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;")
      .replace(/'/g,"&#039;");
  }

  function params(){
    const u = new URL(location.href);
    return {
      survey: u.searchParams.get("survey") || u.searchParams.get("surveyId") || "",
      key: u.searchParams.get("key") || u.searchParams.get("accessKey") || "",
      code: u.searchParams.get("code") || u.searchParams.get("accessCode") || ""
    };
  }

  function setNotice(html, bad){
    const n = $("submitNotice");
    if(!n) return;
    n.innerHTML = html || "";
    n.style.display = html ? "block" : "none";
    n.className = bad ? "notice error" : "notice success";
  }

  function openModal(){
    const m = $("surveyModal");
    if(!m) return;
    m.classList.add("open");
    m.setAttribute("aria-hidden","false");
  }

  function closeModal(){
    const m = $("surveyModal");
    if(!m) return;
    m.classList.remove("open");
    m.setAttribute("aria-hidden","true");
    currentSurvey = null;
  }

  function fieldWrap(q, inner){
    return `<div class="form-field survey-question" data-question="${esc(q.id)}">
      <label><b>${esc(q.text)}</b>${q.required ? ' <span style="color:#b42318">*</span>' : ''}</label>
      ${inner}
    </div>`;
  }

  function optionList(q){
    let o = q.options;
    if(!Array.isArray(o)){
      try { o = JSON.parse(q.optionsJson || "[]"); } catch(_) { o=[]; }
    }
    return o || [];
  }

  function renderQuestion(q){
    const type = String(q.type || "text").toLowerCase();
    const required = q.required ? "required" : "";
    const name = "q_" + q.id;
    const opts = optionList(q);

    if(type === "textarea"){
      return fieldWrap(q,
        `<textarea class="form-control" name="${esc(name)}" ${required}></textarea>`
      );
    }

    if(type === "radio" || type === "yesno"){
      const values = type === "yesno" ? ["Ya","Tidak"] : opts;
      return fieldWrap(q,
        `<div class="survey-options">${
          values.map((v,i)=>`
            <label class="option-row">
              <input type="radio" name="${esc(name)}" value="${esc(v)}" ${required && i===0 ? required : ""}>
              <span>${esc(v)}</span>
            </label>`).join("")
        }</div>`
      );
    }

    if(type === "checkbox"){
      return fieldWrap(q,
        `<div class="survey-options">${
          opts.map(v=>`
            <label class="option-row">
              <input type="checkbox" name="${esc(name)}" value="${esc(v)}">
              <span>${esc(v)}</span>
            </label>`).join("")
        }</div>`
      );
    }

    if(type === "select"){
      return fieldWrap(q,
        `<select class="form-control" name="${esc(name)}" ${required}>
          <option value="">Pilih...</option>
          ${opts.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("")}
        </select>`
      );
    }

    if(type === "scale5" || type === "scale10"){
      const max = type === "scale5" ? 5 : 10;
      return fieldWrap(q,
        `<div class="scale-options">${
          Array.from({length:max},(_,i)=>i+1).map(v=>`
            <label class="scale-item">
              <input type="radio" name="${esc(name)}" value="${v}" ${required && v===1 ? required : ""}>
              <span>${v}</span>
            </label>`).join("")
        }</div>`
      );
    }

    if(type === "file"){
      const cfg = (opts && opts[0] && typeof opts[0] === "object") ? opts[0] : {};
      const maxMb = Number(cfg.maxMb || 5);
      return fieldWrap(q,
        `<input class="form-control survey-file" type="file"
                name="${esc(name)}"
                data-question="${esc(q.id)}"
                ${required}>
         <small>Maksimal ${maxMb} MB.</small>
         <div class="file-status" id="fileStatus_${esc(q.id)}"></div>`
      );
    }

    return fieldWrap(q,
      `<input class="form-control" type="text" name="${esc(name)}" ${required}>`
    );
  }

  function renderIdentity(s){
    const box = $("identityFields");
    if(!box) return;

    const mode = String(s.identityMode || "anonymous").toLowerCase();

    if(mode === "anonymous"){
      box.innerHTML = "";
      return;
    }

    const req = mode === "required" ? "required" : "";

    box.innerHTML = `
      <div class="identity-box">
        <h3>Identitas Responden</h3>
        <div class="form-field">
          <label>Nama${req ? ' <span style="color:#b42318">*</span>' : ''}</label>
          <input class="form-control" name="respondentName" type="text" ${req}>
        </div>
        <div class="form-field">
          <label>Email</label>
          <input class="form-control" name="respondentEmail" type="email">
        </div>
        <div class="form-field">
          <label>WhatsApp</label>
          <input class="form-control" name="respondentWA" type="tel">
        </div>
        <div class="form-field">
          <label>Instansi / Sekolah</label>
          <input class="form-control" name="respondentInstitution" type="text">
        </div>
      </div>`;
  }

  function renderSurvey(s){
    currentSurvey = s;

    if($("modalCategory")) $("modalCategory").textContent = s.category || "FORMULIR BEING";
    if($("modalTitle")) $("modalTitle").textContent = s.title || "Formulir BEING";
    if($("modalDescription")) $("modalDescription").textContent = s.description || "";
    if($("surveyId")) $("surveyId").value = s.id;

    renderIdentity(s);

    if($("questionFields")){
      $("questionFields").innerHTML =
        (s.questions || []).map(renderQuestion).join("") ||
        `<div class="loading-state">Belum ada pertanyaan.</div>`;
    }

    setNotice("");
    openModal();
  }

  function card(s){
    return `
      <article class="survey-card">
        <div class="survey-card-body">
          <span class="voice-kicker">${esc(s.category || "FORMULIR BEING")}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description || "")}</p>
          <div class="survey-meta">
            <span>${Number(s.questionCount || 0)} pertanyaan</span>
          </div>
          <button class="voice-btn primary" type="button" data-open-survey="${esc(s.id)}">
            Isi Formulir
          </button>
        </div>
      </article>`;
  }

  async function loadList(){
    const box = $("surveyList");
    if(!box) return;

    box.innerHTML = `<div class="loading-state">Memuat formulir BEING…</div>`;

    try{
      const list = await window.BVAPI.listSurveys();

      if(!Array.isArray(list) || !list.length){
        box.innerHTML = `<div class="loading-state">Belum ada formulir aktif.</div>`;
        return;
      }

      box.innerHTML = list.map(card).join("");

      box.querySelectorAll("[data-open-survey]").forEach(btn=>{
        btn.addEventListener("click",()=>{
          loadOne(
            btn.getAttribute("data-open-survey"),
            "",
            ""
          );
        });
      });
    }catch(err){
      console.error(err);
      box.innerHTML =
        `<div class="loading-state">Formulir belum dapat dimuat.<br>
          <small>${esc(err.message || "Silakan coba kembali.")}</small>
        </div>`;
    }
  }

  async function loadOne(id,key,code){
    try{
      setNotice("");
      const s = await window.BVAPI.getSurvey(id,key,code);
      renderSurvey(s);
    }catch(err){
      console.error(err);

      const msg = String(err.message || "");

      if(msg.indexOf("KODE_AKSES_DIPERLUKAN") >= 0){
        const codeInput = prompt("Masukkan kode akses formulir:");
        if(codeInput){
          try{
            const s = await window.BVAPI.getSurvey(id,key,codeInput);
            currentLink.code = codeInput;
            renderSurvey(s);
            return;
          }catch(e){}
        }
      }

      alert(msg || "Formulir tidak dapat dibuka.");
    }
  }

  async function fileToBase64(file){
    return new Promise((resolve,reject)=>{
      const r = new FileReader();
      r.onload = ()=>resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function collectAnswers(form){
    const answers = {};

    (currentSurvey.questions || []).forEach(q=>{
      const name = "q_" + q.id;
      const type = String(q.type || "text").toLowerCase();

      if(type === "checkbox"){
        answers[q.id] =
          Array.from(form.querySelectorAll(
            `input[name="${CSS.escape(name)}"]:checked`
          )).map(x=>x.value);
        return;
      }

      if(type === "file"){
        return; // diisi setelah upload
      }

      const el = form.querySelector(`[name="${CSS.escape(name)}"]`);
      answers[q.id] = el ? el.value : "";
    });

    return answers;
  }

  async function uploadFiles(form, answers){
    const files = Array.from(
      form.querySelectorAll("input[type=file][data-question]")
    );

    for(const input of files){
      const file = input.files && input.files[0];
      if(!file) continue;

      const qid = input.getAttribute("data-question");
      const status = $("fileStatus_" + qid);
      if(status) status.textContent = "Mengunggah…";

      const dataUrl = await fileToBase64(file);
      const m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);

      if(!m) throw new Error("File tidak dapat dibaca.");

      const result = await window.BVAPI.uploadFile({
        surveyId: currentSurvey.id,
        questionId: qid,
        accessKey: currentLink.key || "",
        accessCode: currentLink.code || "",
        fileName: file.name,
        mimeType: file.type,
        base64: m[2]
      });

      answers[qid] = result.url || result.name || "";

      if(status) status.innerHTML =
        `<span>✓ ${esc(result.name || file.name)}</span>`;
    }
  }

  async function submit(e){
    e.preventDefault();

    if(!currentSurvey) return;

    const form = e.currentTarget;
    const btn = $("submitSurvey");

    if(btn) {
      btn.disabled = true;
      btn.textContent = "Mengirim…";
    }

    try{
      const answers = await collectAnswers(form);

      const identity = {
        respondentName:
          (form.querySelector('[name="respondentName"]') || {}).value || "",
        respondentEmail:
          (form.querySelector('[name="respondentEmail"]') || {}).value || "",
        respondentWA:
          (form.querySelector('[name="respondentWA"]') || {}).value || "",
        respondentInstitution:
          (form.querySelector('[name="respondentInstitution"]') || {}).value || ""
      };

      await uploadFiles(form, answers);

      await window.BVAPI.submitResponse({
        surveyId: currentSurvey.id,
        accessKey: currentLink.key || "",
        accessCode: currentLink.code || "",
        answers: answers,
        respondentName: identity.respondentName,
        respondentEmail: identity.respondentEmail,
        respondentWA: identity.respondentWA,
        respondentInstitution: identity.respondentInstitution,
        respondentContact:
          identity.respondentEmail || identity.respondentWA || "",
        userAgent: navigator.userAgent
      });

      setNotice("<b>Terima kasih.</b><br>Formulir berhasil dikirim.");
      form.reset();

      if(btn){
        btn.disabled = false;
        btn.textContent = "Terkirim";
      }
    }catch(err){
      console.error(err);
      setNotice(
        "<b>Belum berhasil.</b><br>" +
        esc(err.message || "Silakan coba kembali."),
        true
      );

      if(btn){
        btn.disabled = false;
        btn.textContent = "Kirim Formulir";
      }
    }
  }

  function init(){
    currentLink = params();

    const form = $("surveyForm");
    if(form) form.addEventListener("submit",submit);

    if($("closeModal"))
      $("closeModal").addEventListener("click",closeModal);

    if($("cancelSurvey"))
      $("cancelSurvey").addEventListener("click",closeModal);

    const modal = $("surveyModal");
    if(modal){
      modal.addEventListener("click",e=>{
        if(e.target === modal) closeModal();
      });
    }

    /* Link khusus dari Studio: langsung buka formulir. */
    if(currentLink.survey){
      const box = $("surveyList");
      if(box)
        box.innerHTML = `<div class="loading-state">Membuka formulir…</div>`;

      loadOne(
        currentLink.survey,
        currentLink.key,
        currentLink.code
      );
    }else{
      loadList();
    }
  }

  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded",init);
  else
    init();

})();
