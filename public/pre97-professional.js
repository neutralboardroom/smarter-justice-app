(()=>{
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  function addPasswordToggle(input){
    if(!input||input.dataset.pre97PasswordToggle==='1')return;
    input.dataset.pre97PasswordToggle='1';
    const wrap=document.createElement('div');
    wrap.className='password-control-wrap';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);
    const button=document.createElement('button');
    button.type='button';
    button.className='password-visibility-toggle';
    button.textContent='Show';
    button.setAttribute('aria-label','Show password');
    button.addEventListener('click',()=>{
      const showing=input.type==='text';
      input.type=showing?'password':'text';
      button.textContent=showing?'Show':'Hide';
      button.setAttribute('aria-label',showing?'Show password':'Hide password');
      input.focus({preventScroll:true});
    });
    wrap.appendChild(button);
  }
  function improveSignup(){
    const form=$('#professionalSignupForm');
    if(!form)return;
    addPasswordToggle(form.elements.password);
    addPasswordToggle(form.elements.confirmPassword);
    const params=new URLSearchParams(location.search);
    const details=$('#signupProfileDetails');
    const claimName=String(params.get('name')||'').trim();
    const claimId=String(params.get('claim')||params.get('claimFirm')||'').trim();
    if(details && (claimId||claimName)){
      /* PRE96 auto-opened the enormous optional profile section for claims.
         PRE97 keeps account creation first and lets the professional open details deliberately. */
      details.open=false;
      const summary=details.querySelector('summary');
      if(summary){
        const small=summary.querySelector('small');
        if(small)small.textContent='Optional now. You can finish profile details securely after account creation.';
      }
      const fieldset=form.querySelector('.signup-account-section');
      if(fieldset && !fieldset.querySelector('.claim-context-note')){
        const note=document.createElement('div');
        note.className='claim-context-note';
        note.innerHTML=`<strong>${claimName?'Claiming: '+claimName:'Existing profile selected'}</strong><br><span>Your selected source-backed record will stay connected to this signup. Create the account first; identity and authority review remain separate.</span>`;
        const intro=fieldset.querySelector('.signup-section-intro');
        (intro||fieldset.firstChild).after?.(note);
        if(!note.isConnected)fieldset.insertBefore(note,fieldset.children[2]||null);
      }
    }
    /* Make illustrative placeholders unmistakable. */
    const examples={
      jurisdictions:'Example: New York\nExample: New Jersey',
      languages:'Example: English\nExample: Spanish',
      serviceRegions:'Example: New York City\nExample: Statewide New York',
      practiceAreas:'Example: Divorce and family law\nExample: Personal injury'
    };
    for(const [name,value] of Object.entries(examples)){
      const field=form.elements[name];
      if(field)field.placeholder=value;
    }
    const office=form.elements.officeLocation;
    if(office)office.placeholder='Example: street, suite, city, state, ZIP';
    const website=form.elements.website;
    if(website)website.placeholder='Example: https://yourfirm.com';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',improveSignup,{once:true});
  else improveSignup();
})();
