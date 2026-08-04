(()=>{
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
  const params=new URLSearchParams(location.search);
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const steps=$$('.tour-step');
  const stepIndexById=new Map(steps.map((step,index)=>[step.id,index]));
  let requestedPractice=params.get('practice')||'divorce';
  let current=null;
  let mode=params.get('mode')==='presenter'?'presenter':'self-guided';
  let activeStep=Math.max(0,Math.min(steps.length-1,(Number.parseInt(params.get('step')||'1',10)||1)-1));

  function setActivePractice(selected){
    $$('[data-tour-practice]').forEach(button=>{
      const active=button.dataset.tourPractice===selected;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }

  function updateUrl(){
    const next=new URL(location.href);
    next.searchParams.set('practice',current?.selected?.query||requestedPractice||'divorce');
    if(mode==='presenter'){
      next.searchParams.set('mode','presenter');
      next.searchParams.set('step',String(activeStep+1));
    }else{
      next.searchParams.delete('mode');
      next.searchParams.delete('step');
    }
    history.replaceState({},'',next.pathname+'?'+next.searchParams.toString()+next.hash);
  }

  function focusStep(step){
    const heading=$('h2',step);
    if(!heading)return;
    heading.setAttribute('tabindex','-1');
    heading.focus({preventScroll:true});
  }

  function setStep(index,{focus=true}={}){
    activeStep=Math.max(0,Math.min(steps.length-1,index));
    if(mode==='presenter')steps.forEach((step,i)=>{step.hidden=i!==activeStep;});
    const step=steps[activeStep];
    $('#tourProgress').textContent=`Step ${activeStep+1} of ${steps.length}`;
    $('#tourProgressLabel').textContent=$('h2',step)?.textContent||'';
    $('#tourPreviousStep').disabled=activeStep===0;
    $('#tourNextStep').disabled=activeStep===steps.length-1;
    $('#tourNextStep').textContent=activeStep===steps.length-1?'Tour Complete':'Next';
    updateUrl();
    if(focus){step.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});focusStep(step);}
  }

  function setMode(next,{focus=false}={}){
    mode=next==='presenter'?'presenter':'self-guided';
    document.body.classList.toggle('tour-presenter-mode',mode==='presenter');
    $$('[data-tour-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.tourMode===mode)));
    $('#tourPresenterControls').hidden=mode!=='presenter';
    $('#tourModeDescription').textContent=mode==='presenter'
      ?'Presenter mode shows one step at a time with previous and next controls.'
      :'The full tour shows every section on one page.';
    if(mode==='presenter')setStep(activeStep,{focus});
    else{
      steps.forEach(step=>{step.hidden=false;});
      updateUrl();
      if(focus)$('#tour-story')?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});
    }
  }

  function render(data){
    current=data;
    const selected=data.selected||{};
    requestedPractice=selected.query||'divorce';
    setActivePractice(requestedPractice);
    $('#tourPortalName').textContent=selected.portalName||'Focused legal portal';
    $('#tourPortalSummary').textContent=selected.specialtySummary||'';
    const status=selected.portalAvailability||{};
    const portalStatus=$('#tourPortalStatus');
    portalStatus.className=`tour-portal-status ${status.liveVerified?'verified':'fallback'}`;
    portalStatus.innerHTML=status.liveVerified
      ? `<strong>Verified live destination available</strong><p>${esc(status.message)}</p>`
      : `<strong>Demonstration fallback</strong><p>${esc(status.message)}</p>`;
    const portalLink=$('#tourPortalPrimary');
    portalLink.href=status.liveVerified?status.liveUrl:selected.specialtyRoute;
    portalLink.textContent=status.liveVerified?`Open ${selected.portalName}`:'Open Specialty Overview';

    const showcase=data.profileShowcase||{};
    $('#tourProfileStatuses').innerHTML=(showcase.statuses||[]).map(item=>`<span>${esc(item)}</span>`).join('');
    $('#tourProfileFields').innerHTML=(showcase.fields||[]).map(item=>`<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`).join('');

    $('#tourToolName').textContent=selected.tool?.label||'Public tool';
    $('#tourToolSummary').textContent=selected.tool?.summary||'';
    $('#tourToolLink').href=selected.tool?.route||'/free-tools.html';
    const safety=$('#tourSafetyNote');
    if(data.safetyBoundary){safety.hidden=false;safety.innerHTML=`<strong>Safety-specific demonstration boundary</strong><p>${esc(data.safetyBoundary)}</p>`;}else{safety.hidden=true;safety.textContent='';}

    const membership=data.membershipTruth||{};
    $('#tourMembershipHeading').textContent=membership.heading||'';
    $('#tourMembershipBenefits').innerHTML=(membership.benefits||[]).map(item=>`<li>${esc(item)}</li>`).join('');
    $('#tourMembershipDisclosure').textContent=membership.disclosure||'';

    const claimPath=data.continuation?.profilePath||'/attorney-launch.html?campaign=ATTORNEY-TOUR';
    $('#tourClaimProfile').href=claimPath;
    $('#tourContinueProfile').href=claimPath;

    const field=data.fieldKit||{};
    const fullShortUrl=`https://smarterjustice.com${field.shortPath||'/attorney-tour'}`;
    $('#tourShortPath').textContent=fullShortUrl.replace(/^https:\/\//,'');
    $('#tourQrCode').src=field.qrAsset||'/images/attorney-tour/divorce.svg';
    $('#tourQrCode').alt=`QR code for the ${selected.label||selected.portalName||'practice-specific'} Attorney Partner Tour`;
    $('#tourPrintCard').href=field.printPath||'/attorney-tour-follow-up.html';
    $('#tourPrintFollowUp').href=field.printPath||'/attorney-tour-follow-up.html';
    $('#copyTourLink').dataset.copyUrl=fullShortUrl;
    updateUrl();
  }

  async function load(selectedPractice){
    const status=$('#tourPortalStatus');
    status.className='tour-portal-status';
    status.innerHTML='<p>Checking the verified destination state…</p>';
    try{
      const response=await fetch(`/api/public/attorney-partner-tour?practice=${encodeURIComponent(selectedPractice)}`,{headers:{Accept:'application/json'}});
      const body=await response.json();
      if(!response.ok||!body.ok)throw new Error(body.error||'The tour configuration could not be loaded.');
      render(body.tour);
    }catch(error){
      status.className='tour-portal-status fallback';
      status.innerHTML=`<strong>Safe fallback</strong><p>${esc(error.message)} Use the Smarter Justice specialty overview and public profile paths instead.</p>`;
    }
  }

  $$('[data-tour-practice]').forEach(button=>button.addEventListener('click',()=>{
    load(button.dataset.tourPractice||'divorce');
    if(mode==='presenter')setStep(1,{focus:true});
    else $('#tour-portal')?.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'start'});
  }));

  $$('[data-tour-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.tourMode,{focus:true})));
  $('#startPresenterMode')?.addEventListener('click',()=>{activeStep=0;setMode('presenter',{focus:true});});
  $('#startSelfGuidedMode')?.addEventListener('click',()=>setMode('self-guided',{focus:false}));
  $('#tourPreviousStep')?.addEventListener('click',()=>{if(activeStep>0)setStep(activeStep-1);});
  $('#tourNextStep')?.addEventListener('click',()=>{if(activeStep<steps.length-1)setStep(activeStep+1);});

  $$('.tour-step-nav a,.tour-next-link').forEach(link=>link.addEventListener('click',event=>{
    const id=(link.getAttribute('href')||'').replace(/^#/,'');
    const index=stepIndexById.get(id);
    if(index===undefined)return;
    if(mode==='presenter'){event.preventDefault();setStep(index);}
  }));

  document.addEventListener('keydown',event=>{
    if(mode!=='presenter'||event.altKey||event.ctrlKey||event.metaKey)return;
    const tag=event.target?.tagName||'';
    if(['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(tag))return;
    if(event.key==='ArrowRight'&&activeStep<steps.length-1){event.preventDefault();setStep(activeStep+1);}
    if(event.key==='ArrowLeft'&&activeStep>0){event.preventDefault();setStep(activeStep-1);}
  });

  $('#copyTourLink')?.addEventListener('click',async event=>{
    const result=$('#copyTourLinkResult');
    const url=event.currentTarget.dataset.copyUrl||'https://smarterjustice.com/attorney-tour';
    try{await navigator.clipboard.writeText(url);result.textContent='Practice-specific tour link copied. It contains no client, matter, or tracking data.';}
    catch{result.textContent=`Copy this link: ${url}`;}
  });

  setMode(mode,{focus:false});
  load(requestedPractice);
})();
