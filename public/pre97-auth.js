(()=>{
  'use strict';
  function enhance(form){
    if(!form)return;
    form.querySelectorAll('button.primary:not([type]),button.secondary:not([type])').forEach(button=>button.type='submit');
    form.querySelectorAll('input[type="password"]').forEach(input=>{
      if(input.dataset.pre97Toggle)return;
      input.dataset.pre97Toggle='1';
      const wrap=document.createElement('div');wrap.className='password-control-wrap';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
      const button=document.createElement('button');button.type='button';button.className='password-visibility-toggle';button.textContent='Show';button.setAttribute('aria-label','Show password');button.addEventListener('click',()=>{const visible=input.type==='text';input.type=visible?'password':'text';button.textContent=visible?'Show':'Hide';button.setAttribute('aria-label',visible?'Show password':'Hide password');input.focus({preventScroll:true});});wrap.appendChild(button);
    });
  }
  function run(){[
    '#ownerLoginForm','#professionalLoginForm','#controlCenterTokenForm',
    '#ownerPasswordResetConfirmForm','#ownerEmergencyRecoveryForm',
    '#professionalPasswordResetConfirmForm'
  ].forEach(selector=>enhance(document.querySelector(selector)));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
