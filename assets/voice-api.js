/* BEING Voice API Client — FORM FIX v6.2 */
(function(){
  const C = window.BEING_CONFIG || window.CONFIG || {};
  const API_URL =
    C.VOICE_API_URL ||
    window.VOICE_API_URL ||
    '';

  function getUrl(){
    if(!API_URL) throw new Error('VOICE_API_URL belum diatur.');
    return API_URL;
  }

  async function request(action, payload){
    const url = new URL(getUrl());
    url.searchParams.set('action', action);
    url.searchParams.set('_v', '6.2');
    url.searchParams.set('_t', Date.now());

    Object.entries(payload || {}).forEach(([k,v])=>{
      if(v !== undefined && v !== null && v !== ''){
        url.searchParams.set(k, String(v));
      }
    });

    const r = await fetch(url.toString(), {
      method:'GET',
      cache:'no-store',
      redirect:'follow'
    });

    if(!r.ok) throw new Error('Server formulir tidak merespons.');

    const j = await r.json();
    if(!j.ok) throw new Error(j.message || 'Permintaan gagal.');
    return j.data;
  }

  async function post(action, payload){
    const r = await fetch(getUrl(), {
      method:'POST',
      cache:'no-store',
      redirect:'follow',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({
        action:action,
        payload:payload || {}
      })
    });

    if(!r.ok) throw new Error('Server formulir tidak merespons.');

    const j = await r.json();
    if(!j.ok) throw new Error(j.message || 'Permintaan gagal.');
    return j.data;
  }

  window.BVAPI = {
    listSurveys:()=>request('public.listSurveys',{}),

    getSurvey:(surveyId, accessKey, accessCode)=>{
      return request('public.getSurvey',{
        surveyId:surveyId,
        accessKey:accessKey || '',
        accessCode:accessCode || ''
      });
    },

    submitResponse:(payload)=>
      post('public.submitResponse', payload),

    uploadFile:(payload)=>
      post('public.uploadFile', payload)
  };
})();
