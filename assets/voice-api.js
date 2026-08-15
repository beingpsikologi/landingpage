/* BEING VOICE API — FIX 6.2.1
   GET untuk membaca formulir, POST untuk mengirim jawaban/upload.
   Tidak menyentuh pembayaran maupun Native.
*/
(function(){
  const cfg = window.BEING_CONFIG || window.CONFIG || {};
  const API_URL =
    cfg.VOICE_API_URL ||
    cfg.API_URL ||
    cfg.VOICE_URL ||
    window.VOICE_API_URL ||
    "";

  function endpoint(){
    if(!API_URL) throw new Error("VOICE_API_URL belum diatur di assets/config.js");
    return API_URL;
  }

  async function get(action, payload){
    const u = new URL(endpoint());
    u.searchParams.set("action", action);
    u.searchParams.set("_v", "6.2.1");
    u.searchParams.set("_t", String(Date.now()));

    Object.entries(payload || {}).forEach(([k,v])=>{
      if(v !== undefined && v !== null && v !== "")
        u.searchParams.set(k, String(v));
    });

    const r = await fetch(u.toString(), {
      method:"GET",
      cache:"no-store",
      redirect:"follow"
    });

    if(!r.ok) throw new Error("Server formulir tidak merespons.");
    const j = await r.json();
    if(!j.ok) throw new Error(j.message || "Permintaan gagal.");
    return j.data;
  }

  async function post(action, payload){
    const r = await fetch(endpoint(), {
      method:"POST",
      cache:"no-store",
      redirect:"follow",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({
        action:action,
        payload:payload || {}
      })
    });

    if(!r.ok) throw new Error("Server formulir tidak merespons.");
    const j = await r.json();
    if(!j.ok) throw new Error(j.message || "Permintaan gagal.");
    return j.data;
  }

  window.BVAPI = {
    call: function(action, payload){
      if(action === "public.listSurveys" || action === "public.getSurvey"){
        return get(action, payload || {});
      }
      return post(action, payload || {});
    },
    listSurveys: function(){
      return get("public.listSurveys", {});
    },
    getSurvey: function(surveyId, accessKey, accessCode){
      return get("public.getSurvey", {
        surveyId: surveyId,
        accessKey: accessKey || "",
        accessCode: accessCode || ""
      });
    },
    submitResponse: function(payload){
      return post("public.submitResponse", payload);
    },
    uploadFile: function(payload){
      return post("public.uploadFile", payload);
    }
  };
})();
