(()=>{
  const q=new URLSearchParams(location.search);
  const raw=String(q.get('campaign')||'').trim().toUpperCase();
  let campaign=/^[A-Z0-9][A-Z0-9_-]{1,79}$/.test(raw)?raw:'';
  const inviteToken=String(q.get('invite')||'').trim().slice(0,300);
  const portals=new Set();
  const form=document.querySelector('#attorneyLaunchInterestForm');
  const invitePanel=document.querySelector('#attorneyLaunchInvitation');
  const event=(eventType)=>campaign&&fetch('/api/public/launch-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({campaignCode:campaign,eventType,audience:'professional'})}).catch(()=>{});
  const apply=()=>{
    const params=new URLSearchParams();if(campaign)params.set('campaign',campaign);for(const p of portals)params.append('portal',p);
    const suffix=params.toString()?`?${params}`:'';
    const create=document.querySelector('#attorneyLaunchCreate');const find=document.querySelector('#attorneyLaunchFind');
    if(create)create.href='/professional-signup.html'+suffix;if(find)find.href='/professionals.html'+(campaign?`?campaign=${encodeURIComponent(campaign)}`:'');
    const note=document.querySelector('#attorneyLaunchCampaign');if(note)note.textContent=campaign?`Outreach reference: ${campaign}. This reference does not change profile eligibility, verification, organic ordering, or price.`:'No outreach reference was attached to this visit.';
  };
  const selectPortals=(ids=[])=>{for(const id of ids)portals.add(id);document.querySelectorAll('[name="portal"]').forEach(el=>{el.checked=portals.has(el.value);});document.querySelectorAll('[name="interestPortal"]').forEach(el=>{el.checked=portals.has(el.value);});apply();};
  document.querySelectorAll('[name="portal"]').forEach(el=>el.addEventListener('change',()=>{el.checked?portals.add(el.value):portals.delete(el.value);apply();document.querySelectorAll(`[name="interestPortal"][value="${CSS.escape(el.value)}"]`).forEach(x=>x.checked=el.checked);}));
  document.querySelector('#attorneyLaunchPortalForm')?.addEventListener('submit',e=>{e.preventDefault();location.href=document.querySelector('#attorneyLaunchCreate').href;});
  async function loadInvitation(){
    if(!inviteToken){event('attorney-launch-view');return;}
    try{
      const response=await fetch(`/api/public/launch-invitation?token=${encodeURIComponent(inviteToken)}`,{headers:{Accept:'application/json'}});const body=await response.json();if(!response.ok||!body.ok)throw new Error(body.error||'This invitation could not be verified.');
      const invitation=body.invitation||{};campaign=invitation.campaignCode||campaign;
      if(form){if(invitation.professionalName)form.elements.name.value=invitation.professionalName;if(invitation.firmName)form.elements.firmName.value=invitation.firmName;form.elements.campaignCode.value=campaign;}
      selectPortals(invitation.portalIds||[]);
      if(invitePanel){invitePanel.hidden=false;invitePanel.className='notice success';invitePanel.innerHTML=`<strong>Personalized free-profile invitation confirmed.</strong><p>${String(invitation.message||'')}</p><p class="fine-print">Expires: ${String(invitation.expiresAt||'Not stated')}</p>`;}
      await fetch('/api/public/launch-invitation/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:inviteToken})}).catch(()=>{});
      try{const cleanUrl=new URL(location.href);cleanUrl.searchParams.delete('invite');history.replaceState({},'',cleanUrl.pathname+(cleanUrl.searchParams.toString()?`?${cleanUrl.searchParams}`:'')+cleanUrl.hash);}catch{}
      event('attorney-launch-view');
    }catch(error){if(invitePanel){invitePanel.hidden=false;invitePanel.className='notice';invitePanel.innerHTML=`<strong>Invitation needs attention.</strong><p>${String(error.message||'Request a new link.')}</p>`;}event('attorney-launch-view');}
  }
  apply();loadInvitation();
  if(!form)return;
  const result=document.querySelector('#attorneyLaunchInterestResult');
  if(!form.elements.campaignCode.value)form.elements.campaignCode.value=campaign||'ATTORNEY-LAUNCH-WEB';
  form.addEventListener('submit',async eventSubmit=>{
    eventSubmit.preventDefault();result.hidden=false;result.className='result-panel';result.textContent='Recording your request…';
    const data=Object.fromEntries(new FormData(form));data.portalIds=[...form.querySelectorAll('[name="interestPortal"]:checked')].map(x=>x.value);data.consentToContact=form.elements.consentToContact.checked;data.sourceChannel=inviteToken?'personalized invitation':(campaign?'website or QR signup':'website');if(inviteToken)data.inviteToken=inviteToken;
    try{const response=await fetch('/api/professional-launch-interest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const body=await response.json();if(!response.ok||body.ok===false)throw new Error(body.error||'Could not record your request.');result.className='result-panel success';result.textContent=`Request recorded. ${String(body.message||'We will follow up using the professional contact information you provided.')} Confirmation: ${String(body.confirmationId||'')}`;form.elements.consentToContact.checked=false;}
    catch(error){result.className='result-panel error';result.textContent=error.message;}
  });
})();
