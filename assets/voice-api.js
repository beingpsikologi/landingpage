/* BEING VOICE API — FIX v6.2.3
   PENTING: doGet() Voice membaca parameter payload JSON.
   Karena itu getSurvey HARUS mengirim payload, bukan surveyId langsung.
*/
(function(){
  "use strict";

  const C = window.BEING_CONFIG || window.CONFIG || {};
  const API_URL = C.VOICE_API_URL || window.VOICE_API_URL || "";

  function endpoint(){
    if(!API_URL) throw new Error("VOICE_API_URL belum diatur di assets/config.js");
    return API_URL;
  }

  function get(action, payload){
    return new Promise((resolve,reject)=>{
      const cb = "beingVoice_" + Date.now() + "_" +
        Math.random().toString(36).slice(2);

      const script = document.createElement("script");
      const u = new URL(endpoint());

      u.searchParams.set("action", action);
      u.searchParams.set("payload", JSON.stringify(payload || {}));
      u.searchParams.set("callback", cb);
      u.searchParams.set("_v", "6.2.3");
      u.searchParams.set("_t", String(Date.now()));

      let finished = false;

      const timer = setTimeout(()=>{
        if(finished) return;
        finished = true;
        cleanup();
        reject(new Error("Server formulir tidak merespons."));
      },20000);

      function cleanup(){
        clearTimeout(timer);
        try{ delete window[cb]; }catch(_){}
        script.remove();
      }

      window[cb] = function(resp){
        if(finished) return;
        finished = true;
        cleanup();

        if(!resp || !resp.ok){
          reject(new Error(
            resp && resp.message
              ? resp.message
              : "Permintaan formulir gagal."
          ));
          return;
        }

        resolve(resp.data);
      };

      script.onerror = ()=>{
        if(finished) return;
        finished = true;
        cleanup();
        reject(new Error("Gagal terhubung ke server formulir."));
      };

      script.src = u.toString();
      document.head.appendChild(script);
    });
  }

  function post(action,payload){
    return new Promise((resolve,reject)=>{
      const target =
        "beingPost_" + Date.now() + "_" +
        Math.random().toString(36).slice(2);

      const iframe = document.createElement("iframe");
      iframe.name = target;
      iframe.style.display = "none";

      const form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint();
      form.target = target;
      form.style.display = "none";

      function hidden(name,value){
        const i = document.createElement("input");
        i.type = "hidden";
        i.name = name;
        i.value =
          typeof value === "string"
            ? value
            : JSON.stringify(value);
        form.appendChild(i);
      }

      hidden("action", action);
      hidden("payload", payload || {});
      hidden("_v", "6.2.3");

      let done = false;

      const finish = ()=>{
        if(done) return;
        done = true;
        clearTimeout(timer);
        form.remove();
        setTimeout(()=>iframe.remove(),1200);
        resolve({submitted:true});
      };

      const timer = setTimeout(finish,3000);
      iframe.onload = finish;

      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    });
  }

  window.BVAPI = {
    call:(action,payload)=>{
      if(action === "public.listSurveys" ||
         action === "public.getSurvey"){
        return get(action,payload || {});
      }
      return post(action,payload || {});
    },

    listSurveys:()=>get("public.listSurveys",{}),

    getSurvey:(surveyId,accessKey,accessCode)=>{
      return get("public.getSurvey",{
        surveyId: surveyId || "",
        accessKey: accessKey || "",
        accessCode: accessCode || ""
      });
    },

    submitResponse:payload =>
      post("public.submitResponse",payload),

    uploadFile:payload =>
      post("public.uploadFile",payload)
  };
})();
