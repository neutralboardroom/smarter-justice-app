(()=>{
  'use strict';
  function apply(){
    if(document.body.dataset.sjPage!=='owner-password-reset')return;
    const availability=document.querySelector('#ownerPasswordResetAvailability');
    const request=document.querySelector('#ownerPasswordResetRequestForm');
    const emergency=document.querySelector('#ownerEmergencyRecovery');
    const button=request?.querySelector('button[type="submit"],button.primary');
    const text=String(availability?.textContent||'').toLowerCase();
    const unavailable=/not configured|unavailable|not available/.test(text);
    request?.classList.toggle('recovery-unavailable',unavailable);
    if(button){button.disabled=unavailable;button.textContent=unavailable?'Email reset unavailable':'Send reset link';}
    const heading=emergency?.querySelector('h2');if(heading&&/render recovery/i.test(heading.textContent))heading.textContent='One-time hosting recovery';
  }
  function run(){apply();const node=document.querySelector('#ownerPasswordResetAvailability');if(node)new MutationObserver(apply).observe(node,{subtree:true,childList:true,characterData:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
