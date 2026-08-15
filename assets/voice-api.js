/* BEING VOICE API — v6.2.2 FINAL
   GET  = JSONP (aman dari CORS)
   POST = hidden HTML form + iframe (tanpa fetch/CORS)
*/
(function(){
  "use strict";
  const C = window.BEING_CONFIG || window.CONFIG || {};
  const API_URL = C.VOICE_API_URL || window.VOICE_API_URL || "";

  function url(){
    if(!API_URL) throw new Error("VOICE_API_URL belum diatur di assets/config.js");
    return API_URL;
  }

  function get(action, payload){
    return new Promise((resolve,reject)=>{
      const cb="beingVoice_"+Date.now()+"_"+Math.random().toString(36).slice(2);
      const script=document.createElement("script");
      const u=new URL(url());

      u.searchParams.set("action",action);
      u.searchParams.set("callback",cb);
      u.searchParams.set("_v","6.2.2");
      u.searchParams.set("_t",Date.now());

      Object.entries(payload||{}).forEach(([k,v])=>{
        if(v!==undefined && v!==null && v!=="")
          u.searchParams.set(k,String(v));
      });

      let finished=false;
      const timer=setTimeout(()=>{
        if(finished)return;
        finished=true; cleanup();
        reject(new Error("Server formulir tidak merespons."));
      },20000);

      function cleanup(){
        clearTimeout(timer);
        try{delete window[cb]}catch(_){}
        script.remove();
      }

      window[cb]=function(resp){
        if(finished)return;
        finished=true; cleanup();
        if(!resp || !resp.ok)
          return reject(new Error(resp && resp.message || "Permintaan formulir gagal."));
        resolve(resp.data);
      };

      script.onerror=()=>{
        if(finished)return;
        finished=true; cleanup();
        reject(new Error("Gagal terhubung ke server formulir."));
      };

      script.src=u.toString();
      document.head.appendChild(script);
    });
  }

  function post(action,payload){
    return new Promise((resolve,reject)=>{
      const target="beingPost_"+Date.now()+"_"+Math.random().toString(36).slice(2);
      const iframe=document.createElement("iframe");
      iframe.name=target;
      iframe.style.display="none";

      const form=document.createElement("form");
      form.method="POST";
      form.action=url();
      form.target=target;
      form.style.display="none";

      function hidden(name,value){
        const i=document.createElement("input");
        i.type="hidden"; i.name=name;
        i.value=typeof value==="string" ? value : JSON.stringify(value);
        form.appendChild(i);
      }

      hidden("action",action);
      hidden("payload",payload||{});
      hidden("_v","6.2.2");

      let done=false;
      const finish=()=>{
        if(done)return;
        done=true;
        clearTimeout(timer);
        form.remove();
        setTimeout(()=>iframe.remove(),1200);
        resolve({submitted:true});
      };

      const timer=setTimeout(finish,3000);
      iframe.onload=finish;

      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    });
  }

  window.BVAPI={
    call:(action,payload)=>{
      if(action==="public.listSurveys" || action==="public.getSurvey")
        return get(action,payload||{});
      return post(action,payload||{});
    },
    listSurveys:()=>get("public.listSurveys",{}),
    getSurvey:(surveyId,key,code)=>get("public.getSurvey",{
      surveyId:surveyId||"",
      accessKey:key||"",
      accessCode:code||""
    }),
    submitResponse:payload=>post("public.submitResponse",payload),
    uploadFile:payload=>post("public.uploadFile",payload)
  };
})();
