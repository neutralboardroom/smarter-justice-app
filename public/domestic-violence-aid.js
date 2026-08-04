'use strict';
(()=>{
  const EXIT_URL='https://www.google.com/';
  function quickExit(){
    try { window.location.replace(EXIT_URL); }
    catch { window.location.href=EXIT_URL; }
  }
  for(const button of document.querySelectorAll('[data-quick-exit]')) button.addEventListener('click',quickExit);
  const status=document.querySelector('[data-dv-status]');
  if(!status) return;
  fetch('/api/portals/domestic-violence-aid',{headers:{Accept:'application/json'},cache:'no-store',referrerPolicy:'no-referrer'})
    .then(async response=>({ok:response.ok,body:await response.json()}))
    .then(({ok,body})=>{
      if(!ok||!body.ok||!body.portal) throw new Error('Status unavailable');
      status.textContent=body.portal.availabilityMessage||'Safety and staging acceptance remain required before a live portal connection.';
    })
    .catch(()=>{ status.textContent='Safety and staging acceptance remain required before a live portal connection.'; });
})();
