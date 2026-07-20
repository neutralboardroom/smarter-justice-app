(()=>{
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money=cents=>cents==null?'Price set by professional':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents)/100);
  const list=value=>Array.isArray(value)?value:String(value||'').split(/\r?\n|,/).map(item=>item.trim()).filter(Boolean);
  const titleCase=value=>String(value||'').replace(/[-_]/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
  function setMeta(selector,attribute,value){
    let node=document.querySelector(selector);
    if(!node){ node=document.createElement('meta'); const match=selector.match(/meta\[(name|property)=\"([^\"]+)\"\]/); if(match)node.setAttribute(match[1],match[2]); document.head.appendChild(node); }
    node.setAttribute(attribute,value);
  }
  function setCanonical(url){
    let link=document.querySelector('link[rel="canonical"]');
    if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link);}
    link.href=url;
  }
  function setStructuredData(data){
    let node=document.querySelector('script[data-profile-structured-data]');
    if(!node){node=document.createElement('script');node.type='application/ld+json';node.dataset.profileStructuredData='';document.head.appendChild(node);}
    node.textContent=JSON.stringify(data);
  }
  const PORTAL_LABELS={
    'general-smarter-justice-start':'General Smarter Justice directory',
    'immigration-oasis':'Immigration Oasis',
    'justice-tax-solutions':'Tax help',
    'estate-planning-probate':'Estate planning and probate',
    'business-launch-desk':'Business launch and compliance',
    'contract-creator':'Contracts and business documents',
    'bankruptcy-debt-help':'Bankruptcy and debt',
    'disability-benefits-help':'Disability and benefits',
    'housing-tenant-help':'Housing and landlord/tenant',
    'accident-injury-help':'Accident and injury',
    'name-records-employment':'Employment, records, and related help',
    'intellectual-property-desk':'Intellectual property'
  };

  async function api(url,options={}){
    const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const data=await response.json().catch(()=>({ok:false,error:'We could not read the response. Please try again.'}));
    if(!response.ok&&!data.error)data.error=`The request could not be completed (${response.status}).`;
    return data;
  }
  function notice(element,message,kind=''){
    if(!element)return;
    element.hidden=false;
    element.className=`result-panel ${kind}`.trim();
    element.innerHTML=`<p>${esc(message)}</p>`;
    element.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function formMessage(form,message,kind=''){
    let node=form.querySelector('[data-form-message]');
    if(!node){node=document.createElement('div');node.dataset.formMessage='';node.setAttribute('aria-live','polite');form.appendChild(node);}
    node.className=`result-panel ${kind}`.trim();
    node.innerHTML=`<p>${esc(message)}</p>`;
  }
  function profileLabel(profile){
    if(profile.verified)return 'Verified profile';
    if(profile.claimed)return 'Claimed profile';
    return 'Unclaimed public-information profile';
  }
  function professionalCard(profile){
    const sponsored=profile.sponsorship?.active?'<span class="status-pill sponsored-pill">Sponsored</span>':'';
    const appointment=profile.consultationEligible?'<span class="availability-label">Accepting Smarter Justice appointment requests</span>':'';
    return `<article class="card professional-card">
      <div class="professional-card-head"><div><p class="eyebrow">${esc(titleCase(profile.professionalType))}</p><h2><a href="/professional-profile.html?id=${encodeURIComponent(profile.id)}">${esc(profile.displayName)}</a></h2><p>${esc(profile.firm?.name||'Firm affiliation not yet confirmed')}</p></div>${sponsored}</div>
      <div class="profile-label-row"><span class="status-pill">${esc(profileLabel(profile))}</span>${appointment}</div>
      <p><strong>Practice areas:</strong> ${esc((profile.practiceAreas||[]).slice(0,6).join(' · ')||'Not yet confirmed')}</p>
      <p><strong>Office:</strong> ${esc((profile.officeLocations||[])[0]||'Not listed')}</p>
      <div class="button-row"><a class="secondary button-link" href="/professional-profile.html?id=${encodeURIComponent(profile.id)}">View Profile</a>${!profile.claimed?`<a class="text-link" href="/professional-signup.html?claim=${encodeURIComponent(profile.recordId)}&name=${encodeURIComponent(profile.displayName)}">Claim This Profile</a>`:''}</div>
    </article>`;
  }
  function firmLabel(firm){
    if(firm.participating)return 'Participating firm';
    if(firm.claimed)return 'Claimed firm profile';
    return 'Unclaimed public-information firm profile';
  }
  function firmCard(firm){
    return `<article class="card professional-card firm-card">
      <div class="professional-card-head"><div><p class="eyebrow">Law firm or professional firm</p><h2><a href="/firm-profile.html?id=${encodeURIComponent(firm.id)}">${esc(firm.name)}</a></h2></div></div>
      <div class="profile-label-row"><span class="status-pill">${esc(firmLabel(firm))}</span></div>
      <p><strong>Practice areas represented:</strong> ${esc((firm.practiceAreas||[]).slice(0,8).join(' · ')||'Not yet confirmed')}</p>
      <p><strong>Office:</strong> ${esc((firm.locations||[])[0]||'Not listed')}</p>
      <p><strong>Professionals shown:</strong> ${esc(firm.professionalCount||0)}</p>
      <div class="button-row"><a class="secondary button-link" href="/firm-profile.html?id=${encodeURIComponent(firm.id)}">View Firm Profile</a>${!firm.claimed?`<a class="text-link" href="/professional-signup.html?account=firm&claimFirm=${encodeURIComponent(firm.recordId)}&name=${encodeURIComponent(firm.name)}">Claim This Firm Profile</a>`:''}</div>
    </article>`;
  }

  async function loadDirectory(){
    const form=$('#professionalSearchForm');
    const results=$('#professionalResults');
    const firms=$('#firmResults');
    const summary=$('#professionalSearchSummary');
    const loadMoreProfessionals=$('#loadMoreProfessionals');
    const loadMoreFirms=$('#loadMoreFirms');
    const clearFilters=$('#clearProfessionalFilters');
    const pageParams=new URLSearchParams(location.search);
    for(const name of ['q','practice','borough']) if(pageParams.get(name)&&form.elements[name]) form.elements[name].value=pageParams.get(name);
    const pageSize=24;
    let professionalOffset=0;
    let firmOffset=0;
    let professionalTotal=0;
    let firmTotal=0;

    function filterParams(){
      const query=new URLSearchParams();
      for(const [key,value] of new FormData(form)) if(String(value).trim())query.set(key,String(value).trim());
      return query;
    }
    function currentQuery(offset=0){
      const query=filterParams();
      query.set('limit',String(pageSize));
      query.set('offset',String(offset));
      return query;
    }
    function updateDirectoryUrl(){
      const query=filterParams();
      history.replaceState({},'',`${location.pathname}${query.toString()?`?${query}`:''}#directorySearch`);
    }
    async function run({updateUrl=false}={}){
      professionalOffset=0;
      firmOffset=0;
      results.innerHTML='<p>Searching professional profiles…</p>';
      firms.innerHTML='<p>Searching firm profiles…</p>';
      if(updateUrl)updateDirectoryUrl();
      const [professionalData,firmData]=await Promise.all([
        api('/api/public/professionals?'+currentQuery(professionalOffset)),
        api('/api/public/firms?'+currentQuery(firmOffset))
      ]);
      if(!professionalData.ok){
        results.innerHTML=`<div class="card"><p class="error">${esc(professionalData.error)}</p></div>`;
        professionalTotal=0;
      } else {
        professionalTotal=professionalData.total;
        results.innerHTML=professionalData.professionals.map(professionalCard).join('')||'<div class="card"><h2>No matching individual profiles yet</h2><p>Try a broader name, practice area, or location. New York attorneys can also search the public registration records below.</p></div>';
        professionalOffset=professionalData.professionals.length;
      }
      if(!firmData.ok){
        firms.innerHTML=`<div class="card"><p class="error">${esc(firmData.error)}</p></div>`;
        firmTotal=0;
      } else {
        firmTotal=firmData.total;
        firms.innerHTML=firmData.firms.map(firmCard).join('')||'<div class="card"><h2>No matching firm profiles yet</h2><p>Try a broader firm name, practice area, or location.</p></div>';
        firmOffset=firmData.firms.length;
      }
      summary.textContent=`${professionalTotal} individual professional profile${professionalTotal===1?'':'s'} and ${firmTotal} firm profile${firmTotal===1?'':'s'} found. Profile labels show what has been claimed, verified, or approved for appointments.`;
      loadMoreProfessionals.hidden=professionalOffset>=professionalTotal;
      loadMoreFirms.hidden=firmOffset>=firmTotal;
    }
    form.addEventListener('submit',event=>{event.preventDefault();run({updateUrl:true});});
    clearFilters?.addEventListener('click',()=>{
      form.reset();
      history.replaceState({},'',`${location.pathname}#directorySearch`);
      run();
      form.elements.q?.focus();
    });
    loadMoreProfessionals?.addEventListener('click',async()=>{
      loadMoreProfessionals.disabled=true;
      const data=await api('/api/public/professionals?'+currentQuery(professionalOffset));
      if(data.ok){
        results.insertAdjacentHTML('beforeend',data.professionals.map(professionalCard).join(''));
        professionalOffset+=data.professionals.length;
        loadMoreProfessionals.hidden=professionalOffset>=data.total||!data.professionals.length;
      } else results.insertAdjacentHTML('beforeend',`<p class="error">${esc(data.error)}</p>`);
      loadMoreProfessionals.disabled=false;
    });
    loadMoreFirms?.addEventListener('click',async()=>{
      loadMoreFirms.disabled=true;
      const data=await api('/api/public/firms?'+currentQuery(firmOffset));
      if(data.ok){
        firms.insertAdjacentHTML('beforeend',data.firms.map(firmCard).join(''));
        firmOffset+=data.firms.length;
        loadMoreFirms.hidden=firmOffset>=data.total||!data.firms.length;
      } else firms.insertAdjacentHTML('beforeend',`<p class="error">${esc(data.error)}</p>`);
      loadMoreFirms.disabled=false;
    });
    $$('[data-directory-place]').forEach(button=>button.addEventListener('click',()=>{
      form.elements.borough.value=button.dataset.directoryPlace||'';
      form.elements.q.value=button.dataset.directoryQuery||'';
      form.requestSubmit();
    }));
    await run();

    const official=$('#officialAttorneySearchForm');
    if(official){
      const out=$('#officialAttorneyResults');
      const officialSummary=$('#officialAttorneySearchSummary');
      const loadMoreOfficial=$('#loadMoreOfficialAttorneys');
      const clearOfficial=$('#clearOfficialAttorneyFilters');
      const officialPageSize=25;
      let officialOffset=0;
      let lastOfficialCount=0;
      function officialQuery(offset=0){
        const query=new URLSearchParams();
        for(const [key,value] of new FormData(official)) if(String(value).trim())query.set(key,String(value).trim());
        query.set('limit',String(officialPageSize));
        query.set('offset',String(offset));
        return query;
      }
      function officialCards(rows=[]){
        return rows.map(profile=>`<article class="marketplace-record official-result-card"><h3>${esc(profile.displayName)}</h3><p>${esc((profile.officeLocations||[])[0]||'No public business address listed')}</p><p><strong>Registration status shown by New York:</strong> ${esc(profile.publicFacts?.registrationStatus||'Not provided')}</p><p><strong>Registration number:</strong> ${esc(profile.publicFacts?.registrationNumber||'Not provided')} · <strong>Year admitted:</strong> ${esc(profile.publicFacts?.yearAdmitted||'Not provided')}</p><a class="primary button-link" href="/professional-signup.html?officialRegistration=${encodeURIComponent(profile.publicFacts?.registrationNumber||'')}&name=${encodeURIComponent(profile.displayName)}">Create Account and Request This Profile</a></article>`).join('');
      }
      async function runOfficial({append=false}={}){
        if(!append){
          officialOffset=0;
          lastOfficialCount=0;
          out.innerHTML='<p>Checking New York public registration records…</p>';
          officialSummary.textContent='';
        }
        loadMoreOfficial.hidden=true;
        loadMoreOfficial.disabled=true;
        const data=await api('/api/public/nys-attorneys?'+officialQuery(officialOffset));
        if(!data.ok){
          if(append)out.insertAdjacentHTML('beforeend',`<p class="error">${esc(data.error)}</p>`); else out.innerHTML=`<p class="error">${esc(data.error)}</p>`;
          officialSummary.textContent='The official source could not be searched right now.';
          loadMoreOfficial.disabled=false;
          return;
        }
        const rows=data.professionals||[];
        lastOfficialCount=rows.length;
        if(append)out.insertAdjacentHTML('beforeend',officialCards(rows));
        else out.innerHTML=officialCards(rows)||'<p>No public registration records matched those filters.</p>';
        officialOffset+=rows.length;
        officialSummary.textContent=rows.length?`Showing ${officialOffset} New York public registration record${officialOffset===1?'':'s'} for this search.`:'No New York public registration records matched this search.';
        loadMoreOfficial.hidden=rows.length<officialPageSize;
        loadMoreOfficial.disabled=false;
      }
      official.addEventListener('submit',event=>{event.preventDefault();runOfficial();});
      loadMoreOfficial?.addEventListener('click',()=>runOfficial({append:true}));
      clearOfficial?.addEventListener('click',()=>{
        official.reset();
        officialOffset=0;
        lastOfficialCount=0;
        out.innerHTML='';
        officialSummary.textContent='';
        loadMoreOfficial.hidden=true;
        official.elements.firstName?.focus();
      });
      $$('[data-official-city]').forEach(button=>button.addEventListener('click',()=>{
        official.reset();
        official.elements.city.value=button.dataset.officialCity||'';
        official.elements.streetAddress.value=button.dataset.officialStreet||'';
        official.requestSubmit();
      }));
    }
  }

  async function loadProfile(){
    const id=new URLSearchParams(location.search).get('id');
    const box=$('#professionalProfile');
    if(!id){box.innerHTML='<div class="card"><p class="error">No profile was selected.</p><a href="/professionals.html">Return to directory</a></div>';return;}
    const data=await api('/api/public/professionals/'+encodeURIComponent(id));
    if(!data.ok){box.innerHTML=`<div class="card"><p class="error">${esc(data.error)}</p><a href="/professionals.html">Return to directory</a></div>`;return;}
    const profile=data.professional;
    const profileTitle=`${profile.displayName} | Smarter Justice Professional Profile`;
    const profileDescription=`Review public professional information, profile status, practice areas, and sources for ${profile.displayName}.`;
    const canonicalUrl=`${location.origin}/professional-profile.html?id=${encodeURIComponent(profile.id)}`;
    document.title=profileTitle;
    setMeta('meta[name="description"]','content',profileDescription);
    setMeta('meta[property="og:title"]','content',profileTitle);
    setMeta('meta[property="og:description"]','content',profileDescription);
    setMeta('meta[property="og:url"]','content',canonicalUrl);
    setCanonical(canonicalUrl);
    setStructuredData({
      '@context':'https://schema.org','@type':'Person',name:profile.displayName,
      jobTitle:titleCase(profile.professionalType),url:canonicalUrl,
      worksFor:profile.firm?.name?{'@type':'Organization',name:profile.firm.name}:undefined,
      address:(profile.officeLocations||[])[0]||undefined,
      telephone:profile.phone||undefined,
      sameAs:profile.website?[profile.website]:undefined,
      knowsAbout:(profile.practiceAreas||[]).slice(0,20)
    });
    const portalNames=(profile.portalEligibility||[]).map(id=>PORTAL_LABELS[id]||titleCase(id));
    box.innerHTML=`
      <nav class="profile-breadcrumb" aria-label="Breadcrumb"><a href="/professionals.html">Professional directory</a><span aria-hidden="true">›</span><span>${esc(profile.displayName)}</span></nav>
      <div class="profile-hero card"><div class="section-heading"><div><p class="eyebrow">${esc(titleCase(profile.professionalType))}</p><h1>${esc(profile.displayName)}</h1><p class="lead">${esc(profile.firm?.name||'Firm affiliation not yet confirmed')}</p></div>${profile.sponsorship?.active?'<span class="status-pill sponsored-pill">Sponsored</span>':''}</div><div class="profile-label-row"><span class="status-pill">${esc(profileLabel(profile))}</span>${profile.consultationEligible?'<span class="availability-label">Accepting Smarter Justice appointment requests</span>':''}</div><p>${esc(profile.publicSourceDisclaimer||'')}</p></div>
      <div class="split profile-detail-grid">
        <section class="card"><h2>Professional information</h2><p><strong>Practice areas:</strong> ${esc((profile.practiceAreas||[]).join(', ')||'Not confirmed')}</p><p><strong>Jurisdictions:</strong> ${esc((profile.jurisdictions||[]).join(', ')||'Not confirmed')}</p><p><strong>Languages:</strong> ${esc((profile.languages||[]).join(', ')||'Not listed')}</p><p><strong>Office:</strong> ${esc((profile.officeLocations||[]).join(' · ')||'Not listed')}</p>${profile.phone?`<p><strong>Public phone:</strong> <a href="tel:${esc(profile.phone)}">${esc(profile.phone)}</a></p>`:''}${profile.website?`<p><a class="secondary button-link" href="${esc(profile.website)}" target="_blank" rel="nofollow noopener">Visit Professional Website</a></p>`:''}${profile.biography?`<div class="profile-biography"><h3>About</h3><p>${esc(profile.biography)}</p></div>`:''}</section>
        <section class="card"><h2>Smarter Justice participation</h2><p>${profile.consultationEligible?'This professional has completed the current requirements for the active services shown below.':'This profile is not currently accepting appointments through Smarter Justice.'}</p><p class="fine-print">Membership, sponsorship, or listing does not make a professional the best choice for a particular person or matter.</p>${portalNames.length?`<h3>Relevant Smarter Justice areas</h3><p>${esc(portalNames.join(' · '))}</p>`:''}${(profile.services||[]).map(service=>`<div class="service-card"><h3>${esc(service.title||titleCase(service.serviceType))}</h3><p>${esc(titleCase(service.serviceType))} · ${esc(service.durationMinutes)} minutes · ${esc(money(service.priceCents))}</p><p>${esc((service.modes||[]).map(titleCase).join(', '))}</p></div>`).join('')||'<p>No appointment or review services are currently published.</p>'}${!profile.claimed?`<div class="claim-profile-callout"><a class="primary button-link" href="/professional-signup.html?claim=${encodeURIComponent(profile.recordId)}&name=${encodeURIComponent(profile.displayName)}">Claim and Manage This Profile</a><p class="fine-print">Claiming a profile is free. A paid membership is required only for participating in future Smarter Justice appointment and service opportunities.</p></div>`:''}</section>
      </div>
      <section class="card public-sources-card"><h2>Sources supporting this profile</h2><p>Each source supports only the public facts listed beside it. Smarter Justice does not copy third-party ratings or treat a listing as an endorsement.</p><ul>${(profile.sourceRecords||[]).map(source=>`<li><a href="${esc(source.sourceUrl)}" target="_blank" rel="nofollow noopener">${esc(source.sourceName)}</a> — ${esc((source.factsSupported||[]).join(', '))} <small>Reviewed ${esc((source.retrievedAt||'').slice(0,10)||'date not recorded')}</small></li>`).join('')||'<li>No public source details are currently displayed.</li>'}</ul></section>
      <div class="notice"><strong>Choose carefully.</strong><p>${esc(profile.disclosure)}</p></div>`;
  }

  async function loadFirmProfile(){
    const id=new URLSearchParams(location.search).get('id');
    const box=$('#firmProfile');
    if(!id){box.innerHTML='<div class="card"><p class="error">No firm profile was selected.</p><a href="/professionals.html">Return to directory</a></div>';return;}
    const data=await api('/api/public/firms/'+encodeURIComponent(id));
    if(!data.ok){box.innerHTML=`<div class="card"><p class="error">${esc(data.error)}</p><a href="/professionals.html">Return to directory</a></div>`;return;}
    const firm=data.firm;
    const firmTitle=`${firm.name} | Smarter Justice Firm Profile`;
    const firmDescription=`Review public information, office locations, listed professionals, and sources for ${firm.name}.`;
    const canonicalUrl=`${location.origin}/firm-profile.html?id=${encodeURIComponent(firm.id)}`;
    document.title=firmTitle;
    setMeta('meta[name="description"]','content',firmDescription);
    setMeta('meta[property="og:title"]','content',firmTitle);
    setMeta('meta[property="og:description"]','content',firmDescription);
    setMeta('meta[property="og:url"]','content',canonicalUrl);
    setCanonical(canonicalUrl);
    setStructuredData({
      '@context':'https://schema.org','@type':'Organization',name:firm.name,url:canonicalUrl,
      address:(firm.locations||[])[0]||undefined,telephone:firm.phone||undefined,
      sameAs:firm.website?[firm.website]:undefined,
      knowsAbout:(firm.practiceAreas||[]).slice(0,20),
      member:(firm.professionals||[]).slice(0,50).map(profile=>({'@type':'Person',name:profile.displayName,url:`${location.origin}/professional-profile.html?id=${encodeURIComponent(profile.id)}`}))
    });
    const portalNames=(firm.portalEligibility||[]).map(id=>PORTAL_LABELS[id]||titleCase(id));
    box.innerHTML=`
      <nav class="profile-breadcrumb" aria-label="Breadcrumb"><a href="/professionals.html">Professional directory</a><span aria-hidden="true">›</span><span>${esc(firm.name)}</span></nav>
      <div class="profile-hero card"><div class="section-heading"><div><p class="eyebrow">Law firm or professional firm</p><h1>${esc(firm.name)}</h1><p class="lead">${esc((firm.locations||[])[0]||'Public office location not listed')}</p></div></div><div class="profile-label-row"><span class="status-pill">${esc(firmLabel(firm))}</span></div><p>${esc(firm.disclosure||'')}</p></div>
      <div class="split profile-detail-grid">
        <section class="card"><h2>Firm information</h2><p><strong>Practice areas represented:</strong> ${esc((firm.practiceAreas||[]).join(', ')||'Not yet confirmed')}</p><p><strong>Jurisdictions:</strong> ${esc((firm.jurisdictions||[]).join(', ')||'Not confirmed')}</p><p><strong>Office locations:</strong> ${esc((firm.locations||[]).join(' · ')||'Not listed')}</p>${firm.phone?`<p><strong>Public phone:</strong> <a href="tel:${esc(firm.phone)}">${esc(firm.phone)}</a></p>`:''}${firm.website?`<p><a class="secondary button-link" href="${esc(firm.website)}" target="_blank" rel="nofollow noopener">Visit Firm Website</a></p>`:''}${portalNames.length?`<h3>Relevant Smarter Justice areas</h3><p>${esc(portalNames.join(' · '))}</p>`:''}</section>
        <section class="card"><h2>Professionals shown with this firm</h2>${(firm.professionals||[]).map(profile=>`<div class="service-card"><h3><a href="/professional-profile.html?id=${encodeURIComponent(profile.id)}">${esc(profile.displayName)}</a></h3><p>${esc(titleCase(profile.professionalType))}</p><p>${esc((profile.practiceAreas||[]).join(' · ')||'Practice areas not yet confirmed')}</p></div>`).join('')||'<p>No individual professional profiles are currently displayed for this firm.</p>'}${!firm.claimed?`<div class="claim-profile-callout"><a class="primary button-link" href="/professional-signup.html?account=firm&claimFirm=${encodeURIComponent(firm.recordId)}&name=${encodeURIComponent(firm.name)}">Claim and Manage This Firm Profile</a><p class="fine-print">Claiming a firm profile is free. Paid firm membership is required only for future platform appointment and service opportunities.</p></div>`:''}</section>
      </div>
      <section class="card public-sources-card"><h2>Sources supporting this firm profile</h2><p>Each source supports only the public facts listed beside it. Smarter Justice does not copy third-party ratings or treat a listing as an endorsement.</p><ul>${(firm.sourceRecords||[]).map(source=>`<li><a href="${esc(source.sourceUrl)}" target="_blank" rel="nofollow noopener">${esc(source.sourceName)}</a> — ${esc((source.factsSupported||[]).join(', '))} <small>Reviewed ${esc((source.retrievedAt||'').slice(0,10)||'date not recorded')}</small></li>`).join('')||'<li>No public source details are currently displayed.</li>'}</ul></section>
      <div class="notice"><strong>Choose carefully.</strong><p>Confirm the firm’s current attorneys, credentials, service scope, fees, and engagement terms directly before hiring the firm.</p></div>`;
  }

  function setSignupAccountType(form,type){
    const firm=type==='firm';
    const individualFields=$('[data-individual-fields]',form);
    const firmFields=$('[data-firm-fields]',form);
    individualFields.hidden=firm;
    firmFields.hidden=!firm;
    $$('input,select,textarea',individualFields).forEach(control=>control.disabled=firm);
    $$('input,select,textarea',firmFields).forEach(control=>control.disabled=!firm);
    const submit=$('button[type="submit"]',form);
    if(submit)submit.textContent=firm?'Create Firm Account and Continue':'Create Account and Continue';
  }

  async function signup(){
    const form=$('#professionalSignupForm');
    const result=$('#professionalSignupResult');
    const params=new URLSearchParams(location.search);
    if(params.get('claim'))$('#claimProfessionalId').value=params.get('claim');
    if(params.get('claimFirm'))$('#claimFirmId').value=params.get('claimFirm');
    if(params.get('officialRegistration'))$('#officialRegistrationNumber').value=params.get('officialRegistration');
    const requestedType=params.get('account')==='firm'?'firm':'individual';
    const requestedSeats=Math.max(1,Math.min(500,Number(params.get('seats')||0)||0));
    if(requestedSeats&&form.elements.seatCount)form.elements.seatCount.value=String(requestedSeats);
    if(params.get('name')){
      if(requestedType==='firm'&&form.elements.firmName)form.elements.firmName.value=params.get('name');
      else form.elements.displayName.value=params.get('name');
    }
    const campaign=String(params.get('campaign')||'').trim();
    if(campaign&&$('#professionalCampaignCode'))$('#professionalCampaignCode').value=campaign.slice(0,80);
    const accountRadio=form.querySelector(`[name="accountType"][value="${requestedType}"]`);
    if(accountRadio)accountRadio.checked=true;
    setSignupAccountType(form,requestedType);
    $$('[name="accountType"]',form).forEach(radio=>radio.addEventListener('change',()=>setSignupAccountType(form,radio.value)));

    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!form.reportValidity())return;
      if(String(form.elements.password?.value||'')!==String(form.elements.confirmPassword?.value||'')){
        form.elements.confirmPassword.setCustomValidity('The passwords do not match.');
        form.elements.confirmPassword.reportValidity();
        form.elements.confirmPassword.addEventListener('input',()=>form.elements.confirmPassword.setCustomValidity(''),{once:true});
        return;
      }
      const submit=$('button[type="submit"]',form);
      submit.disabled=true;
      submit.textContent='Creating your account…';
      const formData=new FormData(form);
      const body=Object.fromEntries(formData.entries());
      delete body.confirmPassword;
      body.acceptTerms=formData.has('acceptTerms');
      body.acceptPrivacy=formData.has('acceptPrivacy');
      body.practiceAreas=list(body.practiceAreas);
      body.portalEligibility=formData.getAll('portalEligibility').filter(Boolean);
      body.website=body.accountType==='firm'?(body.firmWebsite||''):body.website;
      body.seatCount=Number(body.seatCount||1);
      const billingCadence=String(formData.get('billingCadence')||'monthly');
      const startMembership=formData.has('startMembership');
      const data=await api('/api/professional/auth/signup',{method:'POST',body:JSON.stringify(body)});
      if(!data.ok){notice(result,data.error,'error');submit.disabled=false;submit.textContent='Create Account and Continue';return;}
      const claim=$('#claimProfessionalId').value;
      if(claim){
        const claimResult=await api('/api/professional/claim-profile',{method:'POST',body:JSON.stringify({professionalId:claim})});
        if(!claimResult.ok){notice(result,claimResult.error,'error');submit.disabled=false;submit.textContent='Continue to Dashboard';return;}
      }
      const claimFirm=$('#claimFirmId')?.value||'';
      if(claimFirm){
        const claimResult=await api('/api/professional/claim-firm',{method:'POST',body:JSON.stringify({firmId:claimFirm})});
        if(!claimResult.ok){notice(result,claimResult.error,'error');submit.disabled=false;submit.textContent='Continue to Dashboard';return;}
      }
      if(startMembership&&data.account?.membershipTarget){
        submit.textContent='Opening secure checkout…';
        const target=data.account.membershipTarget;
        const checkout=await api('/api/professional/membership/checkout',{method:'POST',body:JSON.stringify({kind:target.kind,id:target.id,planId:target.planId,seatCount:Number(target.seatCount||1),billingCadence})});
        if(checkout.checkoutUrl){location.href=checkout.checkoutUrl;return;}
        sessionStorage.setItem('professionalWelcomeMessage',checkout.message||'Your account was created. Membership checkout can be completed from your dashboard.');
      }
      location.href='/professional-dashboard.html?welcome=1';
    });
  }

  async function login(){
    const form=$('#professionalLoginForm');
    const result=$('#professionalLoginResult');
    const resetRequest=$('#professionalPasswordResetRequestForm');
    const resetConfirm=$('#professionalPasswordResetConfirmForm');
    const resetResult=$('#professionalPasswordResetResult');
    const resetToken=new URLSearchParams(location.hash.replace(/^#/, '')).get('reset_token')||new URLSearchParams(location.search).get('reset_token')||'';
    if(resetToken&&resetConfirm){ resetConfirm.hidden=false; resetConfirm.querySelector('[name="token"]').value=resetToken; $('#professionalPasswordReset')?.setAttribute('open',''); if(location.hash)history.replaceState({},'',location.pathname); }
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const submit=$('button[type="submit"]',form); submit.disabled=true; submit.textContent='Signing in…';
      const data=await api('/api/professional/auth/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});
      if(!data.ok){ notice(result,data.error,'error'); if(data.mfaRequired) $('#professionalMfaField input')?.focus(); submit.disabled=false;submit.textContent='Sign In';return; }
      location.href='/professional-dashboard.html';
    });
    resetRequest?.addEventListener('submit',async event=>{ event.preventDefault(); const data=await api('/api/professional/auth/password-reset/request',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(resetRequest)))}); notice(resetResult,data.message||data.error,data.ok?'success':'error'); });
    resetConfirm?.addEventListener('submit',async event=>{ event.preventDefault(); const data=await api('/api/professional/auth/password-reset/confirm',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(resetConfirm)))}); notice(resetResult,data.message||data.error,data.ok?'success':'error'); if(data.ok){ resetConfirm.hidden=true; history.replaceState({},'',location.pathname); } });
  }

  function portalCheckboxes(selected=[]){
    const set=new Set(selected||[]);
    return Object.entries(PORTAL_LABELS).map(([value,label])=>`<label class="check"><input type="checkbox" name="portalEligibility" value="${esc(value)}" ${set.has(value)?'checked':''}> ${esc(label)}</label>`).join('');
  }
  function profileEditor(profile){
    const membership=titleCase(profile.membership?.status||'not active');
    const verification=titleCase(profile.verificationStatus||'not started');
    const publicLink=profile.publicProfileEnabled?`<a class="text-link" href="/professional-profile.html?id=${encodeURIComponent(profile.publicProfileSlug||profile.id)}" target="_blank" rel="noopener">View Public Profile</a>`:'';
    return `<article class="card professional-dashboard-card"><div class="section-heading"><div><p class="eyebrow">${esc(titleCase(profile.profileStatus))}</p><h2>${esc(profile.displayName)}</h2></div><div class="profile-card-actions"><span class="status-pill">${profile.eligibility?.consultationEligible?'Appointment-ready':'Setup incomplete'}</span>${publicLink}</div></div><div class="dashboard-status-grid"><div><strong>Membership</strong><span>${esc(membership)}</span></div><div><strong>Verification</strong><span>${esc(verification)}</span></div><div><strong>Smarter Justice appointments</strong><span>${profile.eligibility?.consultationEligible?'Eligible':'Not yet eligible'}</span></div></div>${!profile.eligibility?.consultationEligible?`<details class="details-card"><summary>What still needs to be completed?</summary><ul>${(profile.eligibility?.reasons||[]).map(reason=>`<li>${esc(reason.replace('Owner marketplace approval','Smarter Justice approval').replace('Smarter Justice portal','Smarter Justice service area'))}</li>`).join('')}</ul></details>`:''}<form class="professionalProfileEdit" data-id="${esc(profile.id)}"><div class="form-grid two"><label>Public display name<input name="displayName" autocomplete="name" value="${esc(profile.displayName)}"></label><label>Telephone<input name="phone" type="tel" autocomplete="tel" inputmode="tel" value="${esc(profile.phone||'')}"></label><label>Website<input name="website" type="url" autocomplete="url" value="${esc(profile.website||'')}"></label></div><label>Professional biography<textarea name="biography" rows="5">${esc(profile.biography||'')}</textarea></label><label>Office locations — one per line<textarea name="officeLocations" rows="3" autocomplete="street-address">${esc((profile.officeLocations||[]).join('\n'))}</textarea></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="4">${esc((profile.practiceAreas||[]).join('\n'))}</textarea></label><label>Languages — one per line<textarea name="languages" rows="3">${esc((profile.languages||[]).join('\n'))}</textarea></label><fieldset class="portal-choice-fieldset"><legend>Smarter Justice areas where this profile may appear</legend><div class="checkbox-grid">${portalCheckboxes(profile.portalEligibility)}</div></fieldset><button class="secondary">Save Profile Changes</button></form></article>`;
  }
  function firmEditor(firm){
    const publicLink=firm.publicProfileEnabled?`<a class="text-link" href="/firm-profile.html?id=${encodeURIComponent(firm.publicProfileSlug||firm.id)}" target="_blank" rel="noopener">View Public Firm Profile</a>`:'';
    return `<article class="card professional-dashboard-card"><div class="section-heading"><div><p class="eyebrow">Firm account</p><h2>${esc(firm.name)}</h2></div><div class="profile-card-actions"><span class="status-pill">${esc(firm.seatCount)} professional seat${Number(firm.seatCount)===1?'':'s'}</span>${publicLink}</div></div><p><strong>Membership:</strong> ${esc(titleCase(firm.membership?.status||'not active'))} · <strong>Current founding discount:</strong> ${esc(firm.quote?.discountPercent||0)}%</p><form class="professionalFirmEdit" data-id="${esc(firm.id)}"><div class="form-grid two"><label>Firm name<input name="name" autocomplete="organization" value="${esc(firm.name)}"></label><label>Telephone<input name="phone" type="tel" autocomplete="tel" inputmode="tel" value="${esc(firm.phone||'')}"></label><label>Website<input name="website" type="url" autocomplete="url" value="${esc(firm.website||'')}"></label><label>Covered professional seats<input name="seatCount" type="number" min="1" max="10000" inputmode="numeric" value="${esc(firm.seatCount)}"></label></div><label>Office locations — one per line<textarea name="locations" rows="3" autocomplete="street-address">${esc((firm.locations||[]).join('\n'))}</textarea></label><button class="secondary">Save Firm Changes</button></form><details class="details-card"><summary>Add a professional to this firm</summary><form class="firmProfessionalAdd" data-id="${esc(firm.id)}"><label>Professional name<input name="displayName" autocomplete="name" required></label><label>Professional category<select name="professionalType"><option value="attorney">Attorney</option><option value="tax attorney">Tax attorney</option><option value="CPA">CPA</option><option value="enrolled agent">Enrolled agent</option><option value="accountant">Accountant</option><option value="registered patent attorney">Registered patent attorney</option><option value="registered patent agent">Registered patent agent</option><option value="other approved professional">Other approved professional</option></select></label><label>Email address<input name="email" type="email" autocomplete="email"></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="3"></textarea></label><fieldset class="portal-choice-fieldset"><legend>Smarter Justice areas for this professional</legend><div class="checkbox-grid">${portalCheckboxes(['general-smarter-justice-start'])}</div></fieldset><button class="secondary">Add Professional Profile</button></form></details></article>`;
  }
  function setupChecklist(data){
    const connected=(data.professionals||[]).length+(data.firms||[]).length;
    const pending=(data.pendingClaimProfiles||[]).length+(data.pendingClaimFirms||[]).length;
    const detailsComplete=[...(data.professionals||[]).map(p=>Boolean((p.practiceAreas||[]).length&&(p.officeLocations||[]).length)),...(data.firms||[]).map(f=>Boolean((f.locations||[]).length))].some(Boolean);
    const membershipActive=[...(data.professionals||[]).map(p=>p.membership?.status),...(data.firms||[]).map(f=>f.membership?.status)].some(status=>status==='active');
    const opportunityReady=(data.professionals||[]).some(p=>p.eligibility?.consultationEligible);
    const steps=[
      {label:'Central account created',done:true,detail:'Your Smarter Justice professional login is active.'},
      {label:'Profile or firm connected',done:connected>0||pending>0,detail:connected>0?'At least one profile is connected to this account.':pending>0?'A profile request is being reviewed.':'Find your public profile or create a new professional record.'},
      {label:'Profile control approved',done:connected>0,detail:connected>0?'You can manage the approved profile information below.':'Public profile claims remain read-only until identity and authority review is completed.'},
      {label:'Public information completed',done:detailsComplete,detail:detailsComplete?'Core practice-area and office information has been added.':'Add practice areas, office information, biography, and contact details after approval.'},
      {label:'Founding membership active',done:membershipActive,detail:membershipActive?'An active membership is recorded.':'Select monthly or annual membership after profile control is approved.'},
      {label:'Professional opportunity requirements completed',done:opportunityReady,detail:opportunityReady?'At least one profile currently satisfies the recorded opportunity requirements.':'Membership is only one requirement. Credentials, agreements, services, availability, and approval remain separate.'}
    ];
    const complete=steps.filter(x=>x.done).length;
    return `<section class="card professional-setup-checklist"><div class="section-heading"><div><p class="eyebrow">Account setup</p><h2>${complete} of ${steps.length} setup steps completed</h2><p>Use this checklist to see what is finished and what still needs attention.</p></div><span class="status-pill">${Math.round(complete/steps.length*100)}%</span></div><div class="setup-progress" aria-label="Professional setup progress"><span style="width:${Math.round(complete/steps.length*100)}%"></span></div><ol class="setup-checklist">${steps.map(step=>`<li class="${step.done?'complete':'pending'}"><span aria-hidden="true">${step.done?'✓':'○'}</span><div><strong>${esc(step.label)}</strong><p>${esc(step.detail)}</p></div></li>`).join('')}</ol></section>`;
  }

  function professionalSecurityCard(account={}){
    return `<section class="card professional-security-card"><div class="section-heading"><div><p class="eyebrow">Account security</p><h2>Sign-in protection</h2></div><span class="status-pill">${account.mfaEnabled?'MFA enabled':'MFA available'}</span></div><p>Use an authenticator app for stronger account protection. Recovery codes are shown only when MFA is enabled or replaced.</p>${account.mfaEnabled?`<div class="card-actions"><button class="secondary" id="professionalRevokeSessions" type="button">Sign Out Other Sessions</button></div><details class="details-card"><summary>Disable authenticator MFA</summary><form id="professionalDisableMfaForm"><label>Current password<input name="password" type="password" autocomplete="current-password" required></label><label>Authenticator or recovery code<input name="code" autocomplete="one-time-code" required></label><button class="secondary">Disable MFA</button></form></details>`:`<button class="secondary" id="professionalBeginMfa" type="button">Set Up Authenticator MFA</button><div hidden id="professionalMfaEnrollment"></div>`}<div id="professionalSecurityResult" hidden aria-live="polite"></div></section>`;
  }

  function membershipCalculator(){
    const form=$('#firmSavingsCalculator');
    if(!form)return;
    const seats=$('#firmSavingsSeats');
    const cadence=$('#firmSavingsCadence');
    const result=$('#firmSavingsResult');
    const signupLink=$('#firmSavingsSignupLink');
    function discountFor(count){
      if(count>=25)return 25;
      if(count>=10)return 20;
      if(count>=5)return 15;
      if(count>=2)return 10;
      return 0;
    }
    function update(){
      const count=Math.max(2,Math.min(500,Number(seats.value)||2));
      seats.value=String(count);
      const annual=cadence.value==='annual';
      const basePerSeat=annual?150:15;
      const discount=discountFor(count);
      const regular=basePerSeat*count;
      const total=regular*(1-discount/100);
      const savings=regular-total;
      const period=annual?'year':'month';
      result.innerHTML=`<strong>${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(total)} per ${period}</strong><span>${discount}% founding firm discount · ${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(savings)} estimated savings per ${period}</span>`;
      signupLink.href=`/professional-signup.html?account=firm&campaign=NYC-FOUNDING-WEB&seats=${encodeURIComponent(count)}`;
    }
    form.addEventListener('input',update);
    form.addEventListener('change',update);
    update();
  }

  async function dashboard(){
    const out=$('#professionalDashboardWorkspace');
    const params=new URLSearchParams(location.search);
    let paymentMessage='';
    if(params.get('session_id')){
      const confirmation=await api('/api/professional/membership/confirm?session_id='+encodeURIComponent(params.get('session_id')));
      paymentMessage=confirmation.message||confirmation.error||'';
      history.replaceState({},'',location.pathname+'?membership=updated');
    }
    const data=await api('/api/professional/dashboard');
    if(!data.ok){location.href='/professional-login.html';return;}
    $('#professionalAccountName').textContent=data.account.displayName;
    const welcome=sessionStorage.getItem('professionalWelcomeMessage');
    sessionStorage.removeItem('professionalWelcomeMessage');
    const message=paymentMessage||welcome||(params.get('welcome')?'Your account was created. Complete the items below to prepare your profile and membership.':'');
    const membershipOptions=`${data.professionals.map(profile=>`<option value="professional|${esc(profile.id)}|nyc-founding-professional|1">${esc(profile.displayName)} — individual membership</option>`).join('')}${data.firms.map(firm=>`<option value="firm|${esc(firm.id)}|nyc-founding-firm|${esc(firm.seatCount)}">${esc(firm.name)} — ${esc(firm.seatCount)} seats</option>`).join('')}`;
    const membershipCard=membershipOptions
      ? `<section class="card membership-checkout-card"><p class="eyebrow">Founding membership</p><h2>Activate or update membership</h2><p>An active paid membership is required for future appointment opportunities. Professional approval and service readiness are reviewed separately.</p><form id="membershipCheckoutForm"><div class="form-grid two"><label>Membership for<select name="target" required>${membershipOptions}</select></label><label>Billing frequency<select name="billingCadence"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label></div><button class="primary">Continue to Secure Checkout</button></form><div id="membershipCheckoutResult" hidden aria-live="polite"></div><p class="fine-print"><a href="/professional-membership-terms.html">Review Professional Membership Terms</a></p></section>`
      : `<section class="card membership-checkout-card"><p class="eyebrow">Founding membership</p><h2>Membership checkout will appear after profile approval</h2><p>Your profile or firm request is still being reviewed. Once control is approved, you can select that profile here and continue to secure recurring-membership checkout.</p><p class="fine-print"><a href="/professional-membership-terms.html">Review Professional Membership Terms</a></p></section>`;
    out.innerHTML=`${message?`<div class="result-panel success"><p>${esc(message)}</p></div>`:''}
      ${setupChecklist(data)}
      <section><div class="section-heading"><div><p class="eyebrow">Profiles</p><h2>Your professional profiles</h2></div><a class="secondary button-link" href="/professionals.html">Find Another Profile</a></div>${data.professionals.map(profileEditor).join('')||'<div class="card"><p>No professional profile is linked yet. Search the directory and request control of your profile.</p><a class="primary button-link" href="/professionals.html">Find My Profile</a></div>'}</section>
      ${(data.pendingClaimProfiles||[]).length?`<section><h2>Professional profile requests being reviewed</h2>${data.pendingClaimProfiles.map(profile=>`<article class="card"><h3>${esc(profile.displayName)}</h3><p>Your request is recorded. This profile remains read-only until identity and authority review is completed.</p></article>`).join('')}</section>`:''}
      ${(data.pendingClaimFirms||[]).length?`<section><h2>Firm profile requests being reviewed</h2>${data.pendingClaimFirms.map(firm=>`<article class="card"><h3>${esc(firm.name)}</h3><p>Your firm claim is recorded. The firm profile remains read-only until identity and authority review is completed.</p></article>`).join('')}</section>`:''}
      <section><p class="eyebrow">Firm management</p><h2>Your firm accounts</h2>${data.firms.map(firmEditor).join('')||'<div class="card"><p>No approved firm profile is linked to this login.</p><a class="secondary button-link" href="/professionals.html">Find a Firm Profile</a></div>'}</section>
      ${professionalSecurityCard(data.account)}
      ${membershipCard}
      <section class="card"><h2>Profile requests</h2>${(data.profileRequests||[]).map(request=>`<p><strong>${esc(titleCase(request.requestType))}</strong> — ${esc(titleCase(request.status))}</p>`).join('')||'<p>No open profile requests.</p>'}</section>`;

    $$('.professionalProfileEdit').forEach(form=>form.addEventListener('submit',async event=>{
      event.preventDefault();
      const formData=new FormData(form);
      const body=Object.fromEntries(formData.entries());
      for(const key of ['officeLocations','practiceAreas','languages'])body[key]=list(body[key]);
      body.portalEligibility=formData.getAll('portalEligibility').filter(Boolean);
      const response=await api('/api/professional/profiles/'+encodeURIComponent(form.dataset.id),{method:'POST',body:JSON.stringify(body)});
      formMessage(form,response.ok?'Profile changes saved. Some public changes may remain subject to review.':response.error,response.ok?'success':'error');
    }));
    $$('.professionalFirmEdit').forEach(form=>form.addEventListener('submit',async event=>{
      event.preventDefault();
      const body=Object.fromEntries(new FormData(form));
      body.locations=list(body.locations); body.seatCount=Number(body.seatCount);
      const response=await api('/api/professional/firms/'+encodeURIComponent(form.dataset.id),{method:'POST',body:JSON.stringify(body)});
      formMessage(form,response.ok?'Firm changes saved.':response.error,response.ok?'success':'error');
    }));
    $$('.firmProfessionalAdd').forEach(form=>form.addEventListener('submit',async event=>{
      event.preventDefault();
      const formData=new FormData(form);
      const body=Object.fromEntries(formData.entries());
      body.practiceAreas=list(body.practiceAreas);
      body.portalEligibility=formData.getAll('portalEligibility').filter(Boolean);
      const response=await api('/api/professional/firms/'+encodeURIComponent(form.dataset.id)+'/professionals',{method:'POST',body:JSON.stringify(body)});
      if(response.ok){formMessage(form,'Professional profile added to the firm workspace.','success');setTimeout(()=>location.reload(),450);}else formMessage(form,response.error||'The professional profile could not be added.','error');
    }));
    $('#membershipCheckoutForm')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const formData=new FormData(event.currentTarget);
      const [kind,id,planId,seatCount]=String(formData.get('target')).split('|');
      const response=await api('/api/professional/membership/checkout',{method:'POST',body:JSON.stringify({kind,id,planId,seatCount:Number(seatCount),billingCadence:formData.get('billingCadence')})});
      if(response.checkoutUrl)location.href=response.checkoutUrl;else notice($('#membershipCheckoutResult'),response.message||response.error,response.ok?'success':'error');
    });
    $('#professionalBeginMfa')?.addEventListener('click',async()=>{ const response=await api('/api/professional/auth/mfa/begin',{method:'POST'}); const panel=$('#professionalMfaEnrollment'); if(!response.ok){ notice($('#professionalSecurityResult'),response.error,'error'); return; } panel.hidden=false; panel.innerHTML=`<div class="notice"><strong>Add this account to your authenticator app</strong><p>Manual secret: <code class="wrap-code">${esc(response.secret)}</code></p><p class="fine-print">Authenticator URI: <code class="wrap-code">${esc(response.otpAuthUri)}</code></p></div><form id="professionalMfaConfirmForm"><label>Six-digit authenticator code<input name="code" autocomplete="one-time-code" inputmode="numeric" required></label><button class="primary">Confirm MFA</button></form>`; $('#professionalMfaConfirmForm')?.addEventListener('submit',async event=>{ event.preventDefault(); const data=await api('/api/professional/auth/mfa/confirm',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))}); if(!data.ok){notice($('#professionalSecurityResult'),data.error,'error');return;} const target=$('#professionalSecurityResult'); target.hidden=false; target.className='result-panel success'; target.innerHTML=`<p><strong>MFA enabled. Save these one-time recovery codes now.</strong></p><pre class="wrap-code">${esc((data.recoveryCodes||[]).join('\n'))}</pre>`; target.scrollIntoView({behavior:'smooth',block:'center'}); }); });
    $('#professionalDisableMfaForm')?.addEventListener('submit',async event=>{ event.preventDefault(); const data=await api('/api/professional/auth/mfa/disable',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))}); notice($('#professionalSecurityResult'),data.ok?'Authenticator MFA was disabled.':data.error,data.ok?'success':'error'); if(data.ok)setTimeout(()=>location.reload(),800); });
    $('#professionalRevokeSessions')?.addEventListener('click',async()=>{ const data=await api('/api/professional/auth/sessions/revoke-others',{method:'POST'}); notice($('#professionalSecurityResult'),data.ok?'Other professional sessions were signed out.':data.error,data.ok?'success':'error'); });
    $('#professionalLogout')?.addEventListener('click',async()=>{await api('/api/professional/auth/logout',{method:'POST'});location.href='/professional-login.html';});
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(document.body.classList.contains('professional-directory-page'))loadDirectory();
    if(document.body.classList.contains('professional-profile-page'))loadProfile();
    if(document.body.classList.contains('firm-profile-page'))loadFirmProfile();
    if(document.body.classList.contains('professional-signup-page'))signup();
    if(document.body.classList.contains('professional-login-page'))login();
    if(document.body.classList.contains('professional-dashboard-page'))dashboard();
    membershipCalculator();
  });
})();
