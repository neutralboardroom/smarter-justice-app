(()=>{
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money=cents=>cents==null?'Price set by professional':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(cents)/100);
  const list=value=>Array.isArray(value)?value:String(value||'').split(/\r?\n|,/).map(item=>item.trim()).filter(Boolean);
  const titleCase=value=>String(value||'').replace(/[-_]/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
  let directoryCompareTokens=[];
  const compareKey=(kind,id)=>`${kind}:${id}`;
  function parseCompareTokens(value){
    const out=[];
    for(const raw of String(value||'').split(',')){
      const token=raw.trim();
      if(!/^(professional|firm):[a-z0-9][a-z0-9-]{0,119}$/i.test(token)||out.includes(token))continue;
      out.push(token);
      if(out.length===3)break;
    }
    return out;
  }
  const serializeCompareTokens=()=>directoryCompareTokens.join(',');
  function safeDirectoryReturn(){
    const here=`${location.pathname}${location.search}#directorySearch`;
    return here.startsWith('/professionals.html')?here:'/professionals.html#directorySearch';
  }
  function profileUrl(kind,id){
    const base=kind==='firm'?'/firm-profile.html':'/professional-profile.html';
    return `${base}?id=${encodeURIComponent(id)}&from=${encodeURIComponent(safeDirectoryReturn())}`;
  }
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
  const CONSULTATION_MODE_LABELS={
    video:'Video', phone:'Phone', telephone:'Phone', 'in person':'In person', messaging:'Secure messaging', 'secure message':'Secure messaging', document_review:'Document review', 'document review':'Document review'
  };
  const AVAILABILITY_OPTIONS=['not configured','available','limited availability','not accepting new matters','temporarily unavailable'];
  const SERVICE_ROLE_LABELS={
    'claimant or plaintiff':'Claimants or plaintiffs',
    'defendant or respondent':'Defendants or respondents',
    'criminal defense':'Criminal defense',
    employee:'Employees', employer:'Employers', tenant:'Tenants', landlord:'Landlords',
    'injured worker or claimant':'Injured workers or benefit claimants',
    'employer, carrier, or insurer defense':'Employer, carrier, or insurer defense',
    consumer:'Consumers',
    'business or organization':'Businesses or organizations',
    'government or agency':'Government or agency',
    'neutral, mediator, or collaborative professional':'Neutral, mediator, or collaborative role',
    'other role':'Other role'
  };
  const INITIAL_PILOT_PORTAL_TO_INTEREST={
    'divorce-law-aid':'digital-divorce',
    'estate-law-aid':'estate-planning-probate',
    'personal-injury-law-aid':'accident-injury-help'
  };
  const PORTAL_LABELS={
    'general-smarter-justice-start':'General Smarter Justice directory',
    'immigration-oasis':'Immigration Oasis — separate immigration-only platform',
    'justice-tax-solutions':'Justice Tax Solutions',
    'contract-creator':'Business and Contract Law — domain pending',
    'estate-planning-probate':'Estate Law Aid',
    'digital-divorce':'Divorce Law Aid',
    'criminal-law-help-center':'Criminal Law Aid',
    'accident-injury-help':'Personal Injury Law Aid',
    'motor-vehicle-personal-injury-help-center':'Personal Injury Law Aid',
    'disability-benefits-help':'Disability Law Aid',
    'social-security-disability-help-center':'Disability Law Aid',
    'housing-tenant-help':'Landlord Tenant Aid',
    'tenant-landlord-help-center':'Landlord Tenant Aid',
    'employment-labor-law-help-center':'Employment Law Aid',
    'name-records-employment':'Employment and related matters',
    'bankruptcy-debt-help':'Bankruptcy and debt',
    'bankruptcy-debt-help-center':'Bankruptcy and debt',
    'medical-malpractice-assistant-center':'Medical malpractice',
    'workers-comp-help-center':'Workers’ compensation',
    'business-launch-desk':'Business launch and compliance',
    'intellectual-property-desk':'Intellectual property, trademarks, and patents',
    'domestic-violence-safety-support':'Stop Sign Project — Domestic Violence Safety & Legal Help'
  };

  async function api(url,options={}){
    try{
      const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
      const data=await response.json().catch(()=>({ok:false,error:'We could not read the response. Please try again.'}));
      if(!response.ok&&!data.error)data.error=`The request could not be completed (${response.status}).`;
      return data;
    }catch{
      return {ok:false,error:'The service could not be reached. Check your connection and try again.'};
    }
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
    if(profile.participating)return 'Participating profile';
    if(profile.verified)return 'Credential-verified profile';
    if(profile.claimed)return 'Claimed profile';
    return 'Unclaimed public-information profile';
  }
  function sourceReviewLabel(value){
    if(!value || Number.isNaN(Date.parse(value)))return 'Review date not recorded';
    return `Public sources reviewed ${new Intl.DateTimeFormat('en-US',{year:'numeric',month:'short',day:'numeric'}).format(new Date(value))}`;
  }
  function locationSummary(row){
    const item=(row.locationData||[])[0];
    if(!item)return (row.officeLocations||row.locations||[])[0]||'Business office not listed';
    const short=[item.city,item.state,item.postalCode].filter(Boolean).join(', ').replace(/, ([A-Z]{2}), /,', $1 ');
    return short || item.address || 'Business office not listed';
  }
  function methodLabels(values=[]){return values.map(value=>CONSULTATION_MODE_LABELS[value]||titleCase(value)).join(' · ');}
  function professionalCard(profile){
    const sponsored=profile.sponsorship?.active?'<span class="status-pill sponsored-pill">Sponsored</span>':'';
    const appointment=profile.consultationEligible?'<span class="availability-label">Accepting Smarter Justice inquiry requests</span>':'';
    const languages=(profile.languages||[]).length?`<p><strong>Documented languages:</strong> ${esc(profile.languages.join(' · '))}</p>`:'';
    const methods=(profile.consultationModes||[]).length?`<p><strong>Documented service methods:</strong> ${esc(methodLabels(profile.consultationModes))}</p>`:'';
    return `<article class="card professional-card">
      <div class="professional-card-head"><div><p class="eyebrow">${esc(titleCase(profile.professionalType))}</p><h2><a data-directory-profile-link data-profile-kind="professional" data-profile-id="${esc(profile.id)}" href="${esc(profileUrl('professional',profile.id))}">${esc(profile.displayName)}</a></h2><p>${esc(profile.firm?.name||'Firm affiliation not yet confirmed')}</p></div>${sponsored}</div>
      <div class="profile-label-row"><span class="status-pill">${esc(profileLabel(profile))}</span>${appointment}</div>
      <p><strong>Practice areas:</strong> ${esc((profile.practiceAreas||[]).slice(0,6).join(' · ')||'Not yet confirmed')}</p>
      <p><strong>Business location:</strong> ${esc(locationSummary(profile))}</p>${languages}${methods}
      <p class="fine-print">${esc(sourceReviewLabel(profile.sourceReviewedAt))}</p>
      <label class="compare-profile-control"><input type="checkbox" data-compare-profile="professional" data-compare-id="${esc(profile.id)}" data-compare-name="${esc(profile.displayName)}" ${directoryCompareTokens.includes(compareKey('professional',profile.id))?'checked':''}> Add to comparison</label>
      <div class="button-row"><a class="secondary button-link" data-directory-profile-link data-profile-kind="professional" data-profile-id="${esc(profile.id)}" href="${esc(profileUrl('professional',profile.id))}">View Profile</a>${!profile.claimed?`<a class="text-link" href="/professional-signup.html?claim=${encodeURIComponent(profile.recordId)}&name=${encodeURIComponent(profile.displayName)}">Claim This Profile</a>`:''}</div>
    </article>`;
  }
  function firmLabel(firm){
    if(firm.participating)return 'Participating firm';
    if(firm.verified)return 'Credential-verified firm profile';
    if(firm.claimed)return 'Claimed firm profile';
    return 'Unclaimed public-information firm profile';
  }
  function firmCard(firm){
    const languages=(firm.languages||[]).length?`<p><strong>Documented languages:</strong> ${esc(firm.languages.join(' · '))}</p>`:'';
    const methods=(firm.serviceMethods||[]).length?`<p><strong>Documented service methods:</strong> ${esc(methodLabels(firm.serviceMethods))}</p>`:'';
    return `<article class="card professional-card firm-card">
      <div class="professional-card-head"><div><p class="eyebrow">Law firm or professional firm</p><h2><a data-directory-profile-link data-profile-kind="firm" data-profile-id="${esc(firm.id)}" href="${esc(profileUrl('firm',firm.id))}">${esc(firm.name)}</a></h2></div></div>
      <div class="profile-label-row"><span class="status-pill">${esc(firmLabel(firm))}</span></div>
      <p><strong>Documented practice areas:</strong> ${esc((firm.practiceAreas||[]).slice(0,8).join(' · ')||'Not yet confirmed')}</p>
      <p><strong>Business location:</strong> ${esc(locationSummary(firm))}</p>${languages}${methods}
      <p><strong>Professionals shown:</strong> ${esc(firm.professionalCount||0)}</p>
      <p class="fine-print">${esc(sourceReviewLabel(firm.sourceReviewedAt))}</p>
      <label class="compare-profile-control"><input type="checkbox" data-compare-profile="firm" data-compare-id="${esc(firm.id)}" data-compare-name="${esc(firm.name)}" ${directoryCompareTokens.includes(compareKey('firm',firm.id))?'checked':''}> Add to comparison</label>
      <div class="button-row"><a class="secondary button-link" data-directory-profile-link data-profile-kind="firm" data-profile-id="${esc(firm.id)}" href="${esc(profileUrl('firm',firm.id))}">View Firm Profile</a>${!firm.claimed?`<a class="text-link" href="/professional-signup.html?account=firm&claimFirm=${encodeURIComponent(firm.recordId)}&name=${encodeURIComponent(firm.name)}">Claim This Firm Profile</a>`:''}</div>
    </article>`;
  }

  async function loadDirectory(){
    const form=$('#professionalSearchForm');
    const results=$('#professionalResults');
    const firms=$('#firmResults');
    const professionalSection=$('#individualDirectorySection');
    const firmSection=$('#firmDirectorySection');
    const summary=$('#professionalSearchSummary');
    const activeFilters=$('#professionalActiveFilters');
    const loadMoreProfessionals=$('#loadMoreProfessionals');
    const loadMoreFirms=$('#loadMoreFirms');
    const clearFilters=$('#clearProfessionalFilters');
    const pageParams=new URLSearchParams(location.search);
    directoryCompareTokens=parseCompareTokens(pageParams.get('compare'));
    const compareSection=$('#compareProfiles');
    const compareResults=$('#profileComparisonResults');
    const compareStatus=$('#profileComparisonStatus');
    const clearComparison=$('#clearProfileComparison');
    const downloadComparison=$('#downloadProfileComparison');
    let comparisonRows=[];
    const supported=['q','practice','profileKind','postalCode','city','county','state','professionalType','language','serviceMethod','profileStatus','sourceFreshness','inquiryAvailability'];
    for(const name of supported){
      if(!pageParams.has(name)||!form.elements[name])continue;
      if(form.elements[name].type==='checkbox')form.elements[name].checked=pageParams.get(name)==='true';
      else form.elements[name].value=pageParams.get(name);
    }
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
      query.delete('profileKind');
      query.set('limit',String(pageSize));
      query.set('offset',String(offset));
      return query;
    }
    function updateDirectoryUrl(){
      const query=filterParams();
      if(directoryCompareTokens.length)query.set('compare',serializeCompareTokens());
      history.replaceState({},'',`${location.pathname}${query.toString()?`?${query}`:''}#directorySearch`);
      $$('[data-directory-profile-link]').forEach(link=>{link.href=profileUrl(link.dataset.profileKind,link.dataset.profileId);});
    }
    function zeroState(kind){
      const label=kind==='firm'?'firm':'individual professional';
      return `<div class="card directory-zero-state"><h2>No matching ${label} profiles</h2><p>Try clearing one filter, using a broader practice term, or searching another city or ZIP code. A physical office nearby does not prove jurisdictional eligibility.</p><button class="secondary" type="button" data-clear-directory-filters>Clear All Filters</button></div>`;
    }
    function renderActiveFilters(){
      const labels={q:'Search',practice:'Practice',profileKind:'Profile type',postalCode:'ZIP',city:'City',county:'County or region',state:'State',professionalType:'Professional type',language:'Language',serviceMethod:'Service method',profileStatus:'Status',sourceFreshness:'Source review',inquiryAvailability:'Inquiry availability'};
      const params=filterParams();
      if(!params.size){activeFilters.innerHTML='';return;}
      activeFilters.innerHTML=`<strong>Active filters:</strong> ${[...params].map(([key,value])=>`<span class="directory-filter-chip">${esc(labels[key]||key)}: ${esc(value==='true'?'Yes':value)}</span>`).join(' ')}`;
    }
    function bindZeroStateButtons(){
      $$('[data-clear-directory-filters]').forEach(button=>button.addEventListener('click',()=>clearFilters.click()));
    }
    function comparisonText(rows){
      const lines=['Smarter Justice public-profile comparison','', 'This is not a ranking, recommendation, credential check, or professional engagement.',''];
      for(const row of rows){
        lines.push(row.name);
        lines.push(`Profile type: ${row.kindLabel}`);
        lines.push(`Business location: ${row.location}`);
        lines.push(`Documented practices or services: ${row.practices.join(' · ')||'Not listed'}`);
        lines.push(`Jurisdictions: ${row.jurisdictions.join(' · ')||'Not listed'}`);
        lines.push(`Documented languages: ${row.languages.join(' · ')||'Not listed'}`);
        lines.push(`Documented service methods: ${row.methods.join(' · ')||'Not listed'}`);
        lines.push(`Profile label: ${row.status}`);
        lines.push(`Source review: ${row.sourceReview}`);
        lines.push(`Smarter Justice inquiries: ${row.inquiries}`);
        lines.push('');
      }
      return lines.join('\n');
    }
    function comparisonRow(kind,row){
      const isFirm=kind==='firm';
      return {
        kind,
        id:row.id,
        name:isFirm?row.name:row.displayName,
        kindLabel:isFirm?'Firm profile':titleCase(row.professionalType||'Professional profile'),
        location:locationSummary(row),
        practices:isFirm?(row.practiceAreas||[]):(row.practiceAreas||[]),
        jurisdictions:row.jurisdictions||[],
        languages:row.languages||[],
        methods:isFirm?(row.serviceMethods||[]):(row.consultationModes||[]).map(value=>CONSULTATION_MODE_LABELS[value]||titleCase(value)),
        status:isFirm?firmLabel(row):profileLabel(row),
        sourceReview:sourceReviewLabel(row.sourceReviewedAt),
        inquiries:(!isFirm&&row.consultationEligible)?'Currently enabled':'Not currently enabled',
        website:row.website||'',
        url:profileUrl(kind,row.id)
      };
    }
    function renderComparisonRows(rows){
      if(!rows.length){compareResults.innerHTML='';return;}
      const fields=[['Profile type','kindLabel'],['Business location','location'],['Documented practices or services','practices'],['Jurisdictions','jurisdictions'],['Documented languages','languages'],['Documented service methods','methods'],['Profile label','status'],['Public-source review','sourceReview'],['Smarter Justice inquiries','inquiries']];
      compareResults.innerHTML=`<div class="profile-comparison-table-wrap"><table class="profile-comparison-table"><caption>Side-by-side public profile facts</caption><thead><tr><th scope="col">Public fact</th>${rows.map(row=>`<th scope="col">${esc(row.name)}</th>`).join('')}</tr></thead><tbody>${fields.map(([label,key])=>`<tr><th scope="row">${esc(label)}</th>${rows.map(row=>{const value=Array.isArray(row[key])?row[key].join(' · '):row[key];return `<td>${esc(value||'Not listed')}</td>`;}).join('')}</tr>`).join('')}<tr><th scope="row">Profile</th>${rows.map(row=>`<td><a class="secondary button-link" href="${esc(row.url)}">View ${esc(row.name)}</a>${row.website?` <a class="text-link" href="${esc(row.website)}" target="_blank" rel="nofollow noopener">Official website</a>`:''}</td>`).join('')}</tr></tbody></table></div>`;
    }
    async function renderComparison(){
      compareSection.hidden=!directoryCompareTokens.length;
      comparisonRows=[];
      downloadComparison.hidden=true;
      if(!directoryCompareTokens.length){compareStatus.textContent='';compareResults.innerHTML='';return;}
      compareSection.hidden=false;
      compareResults.setAttribute('aria-busy','true');
      compareResults.innerHTML='<p>Loading selected public profiles…</p>';
      compareStatus.textContent=directoryCompareTokens.length===1?'One profile selected. Choose one or two more for a side-by-side comparison.':`${directoryCompareTokens.length} profiles selected.`;
      const responses=await Promise.all(directoryCompareTokens.map(async token=>{
        const [kind,id]=token.split(':');
        const data=await api(`/api/public/${kind==='firm'?'firms':'professionals'}/${encodeURIComponent(id)}`);
        return data.ok?comparisonRow(kind,kind==='firm'?data.firm:data.professional):null;
      }));
      comparisonRows=responses.filter(Boolean);
      compareResults.setAttribute('aria-busy','false');
      renderComparisonRows(comparisonRows);
      downloadComparison.hidden=comparisonRows.length<2;
      if(comparisonRows.length!==directoryCompareTokens.length)compareStatus.textContent='One or more selected profiles are no longer public. Clear the shortlist and select again.';
    }
    function bindComparisonControls(){
      $$('[data-compare-profile]').forEach(control=>{
        control.checked=directoryCompareTokens.includes(compareKey(control.dataset.compareProfile,control.dataset.compareId));
        control.addEventListener('change',()=>{
          const token=compareKey(control.dataset.compareProfile,control.dataset.compareId);
          if(control.checked){
            if(directoryCompareTokens.length>=3){control.checked=false;compareStatus.textContent='You can compare up to three profiles at a time.';compareSection.hidden=false;return;}
            if(!directoryCompareTokens.includes(token))directoryCompareTokens.push(token);
          }else directoryCompareTokens=directoryCompareTokens.filter(item=>item!==token);
          updateDirectoryUrl();
          bindComparisonControls();
          renderComparison();
        },{once:true});
      });
      $$('[data-directory-profile-link]').forEach(link=>{link.href=profileUrl(link.dataset.profileKind,link.dataset.profileId);});
    }
    async function run({updateUrl=false}={}){
      professionalOffset=0;
      firmOffset=0;
      const profileKind=form.elements.profileKind?.value||'';
      professionalSection.hidden=profileKind==='firm';
      firmSection.hidden=profileKind==='professional';
      if(!professionalSection.hidden){results.setAttribute('aria-busy','true');results.innerHTML='<p>Searching individual professional profiles…</p>';}
      if(!firmSection.hidden){firms.setAttribute('aria-busy','true');firms.innerHTML='<p>Searching firm profiles…</p>';}
      if(updateUrl)updateDirectoryUrl();
      renderActiveFilters();
      const professionalPromise=professionalSection.hidden?Promise.resolve({ok:true,total:0,professionals:[]}):api('/api/public/professionals?'+currentQuery(professionalOffset));
      const firmPromise=firmSection.hidden?Promise.resolve({ok:true,total:0,firms:[]}):api('/api/public/firms?'+currentQuery(firmOffset));
      const [professionalData,firmData]=await Promise.all([professionalPromise,firmPromise]);
      if(!professionalSection.hidden){
        results.setAttribute('aria-busy','false');
        if(!professionalData.ok){results.innerHTML=`<div class="card"><p class="error">${esc(professionalData.error)}</p></div>`;professionalTotal=0;}
        else{professionalTotal=professionalData.total;results.innerHTML=professionalData.professionals.map(professionalCard).join('')||zeroState('professional');professionalOffset=professionalData.professionals.length;}
      }else professionalTotal=0;
      if(!firmSection.hidden){
        firms.setAttribute('aria-busy','false');
        if(!firmData.ok){firms.innerHTML=`<div class="card"><p class="error">${esc(firmData.error)}</p></div>`;firmTotal=0;}
        else{firmTotal=firmData.total;firms.innerHTML=firmData.firms.map(firmCard).join('')||zeroState('firm');firmOffset=firmData.firms.length;}
      }else firmTotal=0;
      const metrics=professionalData.metrics||firmData.metrics;
      const totalText=profileKind==='firm'?`${firmTotal} firm profile${firmTotal===1?'':'s'}`:profileKind==='professional'?`${professionalTotal} individual profile${professionalTotal===1?'':'s'}`:`${professionalTotal} individual profile${professionalTotal===1?'':'s'} and ${firmTotal} firm profile${firmTotal===1?'':'s'}`;
      summary.textContent=`${totalText} found. ${metrics?`${metrics.qualifyingTotal} of ${metrics.publicTotal} public records currently meet the complete-profile counting rule. `:''}Organic results use neutral relevance and alphabetical ordering; payment does not improve placement.`;
      loadMoreProfessionals.hidden=professionalSection.hidden||professionalOffset>=professionalTotal;
      loadMoreFirms.hidden=firmSection.hidden||firmOffset>=firmTotal;
      bindZeroStateButtons();
      bindComparisonControls();
      await renderComparison();
    }
    form.addEventListener('submit',event=>{event.preventDefault();run({updateUrl:true});});
    clearFilters?.addEventListener('click',()=>{
      form.reset();
      const query=new URLSearchParams(); if(directoryCompareTokens.length)query.set('compare',serializeCompareTokens());
      history.replaceState({},'',`${location.pathname}${query.toString()?`?${query}`:''}#directorySearch`);
      run();
      form.elements.q?.focus();
    });
    loadMoreProfessionals?.addEventListener('click',async()=>{
      loadMoreProfessionals.disabled=true;
      const data=await api('/api/public/professionals?'+currentQuery(professionalOffset));
      if(data.ok){results.insertAdjacentHTML('beforeend',data.professionals.map(professionalCard).join(''));professionalOffset+=data.professionals.length;loadMoreProfessionals.hidden=professionalOffset>=data.total||!data.professionals.length;bindComparisonControls();}
      else results.insertAdjacentHTML('beforeend',`<p class="error">${esc(data.error)}</p>`);
      loadMoreProfessionals.disabled=false;
    });
    loadMoreFirms?.addEventListener('click',async()=>{
      loadMoreFirms.disabled=true;
      const data=await api('/api/public/firms?'+currentQuery(firmOffset));
      if(data.ok){firms.insertAdjacentHTML('beforeend',data.firms.map(firmCard).join(''));firmOffset+=data.firms.length;loadMoreFirms.hidden=firmOffset>=data.total||!data.firms.length;bindComparisonControls();}
      else firms.insertAdjacentHTML('beforeend',`<p class="error">${esc(data.error)}</p>`);
      loadMoreFirms.disabled=false;
    });
    $$('[data-directory-place],[data-directory-practice],[data-directory-county]').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.directoryPlace)form.elements.city.value=button.dataset.directoryPlace;
      if(button.dataset.directoryPostal)form.elements.postalCode.value=button.dataset.directoryPostal;
      if(button.dataset.directoryCounty&&form.elements.county)form.elements.county.value=button.dataset.directoryCounty;
      if(button.dataset.directoryState&&form.elements.state)form.elements.state.value=button.dataset.directoryState;
      if(button.dataset.directoryQuery)form.elements.q.value=button.dataset.directoryQuery;
      if(button.dataset.directoryPractice)form.elements.practice.value=button.dataset.directoryPractice;
      form.requestSubmit();
    }));
    clearComparison?.addEventListener('click',()=>{directoryCompareTokens=[];updateDirectoryUrl();bindComparisonControls();renderComparison();form.elements.q?.focus();});
    downloadComparison?.addEventListener('click',()=>{
      if(comparisonRows.length<2)return;
      const blob=new Blob([comparisonText(comparisonRows)],{type:'text/plain;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download='smarter-justice-profile-comparison.txt';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
    });
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

  function validatedDirectoryReturn(){
    const value=new URLSearchParams(location.search).get('from')||'';
    return value.startsWith('/professionals.html')?value:'/professionals.html';
  }
  async function loadProfile(){
    const id=new URLSearchParams(location.search).get('id');
    const directoryReturn=validatedDirectoryReturn();
    const box=$('#professionalProfile');
    if(!id){box.innerHTML=`<div class="card"><p class="error">No profile was selected.</p><a href="${esc(directoryReturn)}">Return to directory</a></div>`;return;}
    const data=await api('/api/public/professionals/'+encodeURIComponent(id));
    if(!data.ok){box.innerHTML=`<div class="card"><p class="error">${esc(data.error)}</p><a href="${esc(directoryReturn)}">Return to directory</a></div>`;return;}
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
      <nav class="profile-breadcrumb" aria-label="Breadcrumb"><a href="${esc(directoryReturn)}">Professional directory</a><span aria-hidden="true">›</span><span>${esc(profile.displayName)}</span></nav>
      <div class="profile-hero card"><div class="section-heading"><div><p class="eyebrow">${esc(titleCase(profile.professionalType))}</p><h1>${esc(profile.displayName)}</h1><p class="lead">${esc(profile.firm?.name||'Firm affiliation not yet confirmed')}</p></div>${profile.sponsorship?.active?'<span class="status-pill sponsored-pill">Sponsored</span>':''}</div><div class="profile-label-row"><span class="status-pill">${esc(profileLabel(profile))}</span>${profile.consultationEligible?'<span class="availability-label">Accepting Smarter Justice appointment requests</span>':''}</div><p>${esc(profile.publicSourceDisclaimer||'')}</p></div>
      <div class="split profile-detail-grid">
        <section class="card"><h2>Professional information</h2><p><strong>Practice areas:</strong> ${esc((profile.practiceAreas||[]).join(', ')||'Not confirmed')}</p><p><strong>Clients or sides served:</strong> ${esc((profile.serviceRoles||[]).map(role=>SERVICE_ROLE_LABELS[role]||titleCase(role)).join(', ')||'Not confirmed')}</p><p><strong>Jurisdictions:</strong> ${esc((profile.jurisdictions||[]).join(', ')||'Not confirmed')}</p><p><strong>Languages:</strong> ${esc((profile.languages||[]).join(', ')||'Not listed')}</p><p><strong>Office:</strong> ${esc((profile.officeLocations||[]).join(' · ')||'Not listed')}</p>${profile.phone?`<p><strong>Public phone:</strong> <a href="tel:${esc(profile.phone)}">${esc(profile.phone)}</a></p>`:''}${profile.website?`<p><a class="secondary button-link" href="${esc(profile.website)}" target="_blank" rel="nofollow noopener">Visit Professional Website</a></p>`:''}${profile.biography?`<div class="profile-biography"><h3>About</h3><p>${esc(profile.biography)}</p></div>`:''}<div class="profile-availability"><h3>Professional-supplied availability</h3><p><strong>Status:</strong> ${esc(titleCase(profile.availabilityStatus||'not set'))}</p><p><strong>Service regions:</strong> ${esc((profile.serviceRegions||[]).join(' · ')||'Not listed')}</p><p><strong>Consultation or service modes:</strong> ${esc((profile.consultationModes||[]).map(titleCase).join(' · ')||'Not listed')}</p>${profile.availabilityNote?`<p>${esc(profile.availabilityNote)}</p>`:''}<p class="fine-print">Availability is supplied by the professional and does not confirm suitability, engagement, conflict clearance, or appointment acceptance.</p></div></section>
        <section class="card"><h2>Smarter Justice participation</h2><p>${profile.consultationEligible?'This professional has completed the current requirements for the active services shown below.':'This profile is not currently accepting appointments through Smarter Justice.'}</p><p class="fine-print">Membership, sponsorship, or listing does not make a professional the best choice for a particular person or matter.</p>${portalNames.length?`<h3>Relevant Smarter Justice areas</h3><p>${esc(portalNames.join(' · '))}</p>`:''}${(profile.services||[]).map(service=>`<div class="service-card"><h3>${esc(service.title||titleCase(service.serviceType))}</h3><p>${esc(titleCase(service.serviceType))} · ${esc(service.durationMinutes)} minutes · ${esc(money(service.priceCents))}</p><p>${esc((service.modes||[]).map(titleCase).join(', '))}</p></div>`).join('')||'<p>No appointment or review services are currently published.</p>'}${!profile.claimed?`<div class="claim-profile-callout"><a class="primary button-link" href="/professional-signup.html?claim=${encodeURIComponent(profile.recordId)}&name=${encodeURIComponent(profile.displayName)}">Claim and Manage This Profile</a><p class="fine-print">Claiming, verifying, and editing the basic profile is free. Optional paid products may add clearly labeled sponsored visibility and access to case or attorney-review opportunities after independent verification, specialty approval, and compliance review.</p></div>`:''}</section>
      </div>
      <section class="card public-sources-card"><h2>Sources supporting this profile</h2><p>Each source supports only the public facts listed beside it. Smarter Justice does not copy third-party ratings or treat a listing as an endorsement.</p><ul>${(profile.sourceRecords||[]).map(source=>`<li><a href="${esc(source.sourceUrl)}" target="_blank" rel="nofollow noopener">${esc(source.sourceName)}</a> — ${esc((source.factsSupported||[]).join(', '))} <small>Reviewed ${esc((source.retrievedAt||'').slice(0,10)||'date not recorded')}</small></li>`).join('')||'<li>No public source details are currently displayed.</li>'}</ul><p><a href="/contact.html?topic=profile-correction&type=professional&profile=${encodeURIComponent(profile.recordId)}&name=${encodeURIComponent(profile.displayName)}">Report incorrect information or request a correction, duplicate review, removal, or suppression review</a>.</p></section>
      <div class="notice"><strong>Choose carefully.</strong><p>${esc(profile.disclosure)}</p></div>`;
  }

  async function loadFirmProfile(){
    const id=new URLSearchParams(location.search).get('id');
    const directoryReturn=validatedDirectoryReturn();
    const box=$('#firmProfile');
    if(!id){box.innerHTML=`<div class="card"><p class="error">No firm profile was selected.</p><a href="${esc(directoryReturn)}">Return to directory</a></div>`;return;}
    const data=await api('/api/public/firms/'+encodeURIComponent(id));
    if(!data.ok){box.innerHTML=`<div class="card"><p class="error">${esc(data.error)}</p><a href="${esc(directoryReturn)}">Return to directory</a></div>`;return;}
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
      <nav class="profile-breadcrumb" aria-label="Breadcrumb"><a href="${esc(directoryReturn)}">Professional directory</a><span aria-hidden="true">›</span><span>${esc(firm.name)}</span></nav>
      <div class="profile-hero card"><div class="section-heading"><div><p class="eyebrow">Law firm or professional firm</p><h1>${esc(firm.name)}</h1><p class="lead">${esc((firm.locations||[])[0]||'Public office location not listed')}</p></div></div><div class="profile-label-row"><span class="status-pill">${esc(firmLabel(firm))}</span></div><p>${esc(firm.disclosure||'')}</p></div>
      <div class="split profile-detail-grid">
        <section class="card"><h2>Firm information</h2><p><strong>Practice areas represented:</strong> ${esc((firm.practiceAreas||[]).join(', ')||'Not yet confirmed')}</p><p><strong>Jurisdictions:</strong> ${esc((firm.jurisdictions||[]).join(', ')||'Not confirmed')}</p><p><strong>Office locations:</strong> ${esc((firm.locations||[]).join(' · ')||'Not listed')}</p>${firm.phone?`<p><strong>Public phone:</strong> <a href="tel:${esc(firm.phone)}">${esc(firm.phone)}</a></p>`:''}${firm.website?`<p><a class="secondary button-link" href="${esc(firm.website)}" target="_blank" rel="nofollow noopener">Visit Firm Website</a></p>`:''}${portalNames.length?`<h3>Relevant Smarter Justice areas</h3><p>${esc(portalNames.join(' · '))}</p>`:''}</section>
        <section class="card"><h2>Professionals shown with this firm</h2>${(firm.professionals||[]).map(profile=>`<div class="service-card"><h3><a href="/professional-profile.html?id=${encodeURIComponent(profile.id)}&from=${encodeURIComponent(directoryReturn)}">${esc(profile.displayName)}</a></h3><p>${esc(titleCase(profile.professionalType))}</p><p>${esc((profile.practiceAreas||[]).join(' · ')||'Practice areas not yet confirmed')}</p></div>`).join('')||'<p>No individual professional profiles are currently displayed for this firm.</p>'}${!firm.claimed?`<div class="claim-profile-callout"><a class="primary button-link" href="/professional-signup.html?account=firm&claimFirm=${encodeURIComponent(firm.recordId)}&name=${encodeURIComponent(firm.name)}">Claim and Manage This Firm Profile</a><p class="fine-print">Claiming and editing the basic firm profile is free. Optional paid products may add clearly labeled sponsored visibility and access to case or attorney-review opportunities after all independent requirements are satisfied.</p></div>`:''}</section>
      </div>
      <section class="card public-sources-card"><h2>Sources supporting this firm profile</h2><p>Each source supports only the public facts listed beside it. Smarter Justice does not copy third-party ratings or treat a listing as an endorsement.</p><ul>${(firm.sourceRecords||[]).map(source=>`<li><a href="${esc(source.sourceUrl)}" target="_blank" rel="nofollow noopener">${esc(source.sourceName)}</a> — ${esc((source.factsSupported||[]).join(', '))} <small>Reviewed ${esc((source.retrievedAt||'').slice(0,10)||'date not recorded')}</small></li>`).join('')||'<li>No public source details are currently displayed.</li>'}</ul><p><a href="/contact.html?topic=profile-correction&type=firm&profile=${encodeURIComponent(firm.recordId)}&name=${encodeURIComponent(firm.name)}">Report incorrect information or request a correction, duplicate review, removal, or suppression review</a>.</p></section>
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
    if(form.elements.firmName)form.elements.firmName.required=firm;
    const submit=$('button[type="submit"]',form);
    if(submit)submit.textContent=firm?'Create Firm Account':'Create Attorney or Professional Account';
  }

  function updateSignupProgress(form){
    const accountReady=Boolean(form.elements.displayName?.value.trim()&&form.elements.email?.validity.valid&&String(form.elements.password?.value||'').length>=12&&form.elements.password?.value===form.elements.confirmPassword?.value);
    const profileControls=$$('#signupProfileDetails input:not([type="radio"]):not([type="checkbox"]),#signupProfileDetails textarea,#signupProfileDetails select',form);
    const profileStarted=profileControls.some(control=>String(control.value||'').trim()&& !['attorney','not set','2'].includes(String(control.value)));
    const agreementsReady=Boolean(form.elements.acceptTerms?.checked&&form.elements.acceptPrivacy?.checked);
    const states={account:accountReady,profile:profileStarted,agreement:agreementsReady};
    $$('[data-signup-progress]',document).forEach(node=>{
      const key=node.dataset.signupProgress;
      node.classList.toggle('complete',Boolean(states[key]));
      node.classList.toggle('active',!states[key]&&((key==='account')||((key==='profile')&&accountReady)||((key==='agreement')&&accountReady)));
    });
  }

  async function signup(){
    const form=$('#professionalSignupForm');
    const result=$('#professionalSignupResult');
    const params=new URLSearchParams(location.search);
    const profileDetails=$('#signupProfileDetails');
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
    const requestedPortal=String(params.get('portal')||'').trim();
    const requestedInterest=INITIAL_PILOT_PORTAL_TO_INTEREST[requestedPortal]||requestedPortal;
    const requestedIntent=['claim','create'].includes(String(params.get('intent')||'').trim())?String(params.get('intent')).trim():(params.get('claim')||params.get('claimFirm')?'claim':'create');
    if($('#entryPortalId'))$('#entryPortalId').value=INITIAL_PILOT_PORTAL_TO_INTEREST[requestedPortal]?requestedPortal:'';
    if($('#entryIntent'))$('#entryIntent').value=requestedIntent;
    if($('#entryProfileId'))$('#entryProfileId').value=String(params.get('profile')||params.get('claim')||params.get('claimFirm')||'').slice(0,180);
    if($('#entryReturnTo'))$('#entryReturnTo').value=String(params.get('return')||'').slice(0,500);
    if(requestedPortal){
      const portalControl=form.querySelector(`[name="portalEligibility"][value="${CSS.escape(requestedInterest)}"]`);
      if(portalControl)portalControl.checked=true;
      const portalName=PORTAL_LABELS[requestedInterest]||titleCase(requestedPortal);
      const note=document.createElement('div');
      note.className='notice portal-interest-note';
      note.innerHTML=`<strong>${esc(portalName)} added to your interests.</strong><p>You can choose additional areas below. Interest does not by itself approve publication, participation, or opportunities.</p>`;
      profileDetails?.insertAdjacentElement('beforebegin',note);
    }
    const accountRadio=form.querySelector(`[name="accountType"][value="${requestedType}"]`);
    if(accountRadio)accountRadio.checked=true;
    setSignupAccountType(form,requestedType);
    const hasProfileIntent=Boolean(params.get('claim')||params.get('claimFirm')||params.get('officialRegistration')||params.get('name')||requestedPortal||params.get('profile')||params.get('seats'));
    if(profileDetails&&(hasProfileIntent||requestedType==='firm'))profileDetails.open=true;
    $$('[name="accountType"]',form).forEach(radio=>radio.addEventListener('change',()=>{setSignupAccountType(form,radio.value);if(radio.value==='firm'&&profileDetails)profileDetails.open=true;updateSignupProgress(form);}));
    form.addEventListener('input',()=>updateSignupProgress(form));
    form.addEventListener('change',()=>updateSignupProgress(form));
    updateSignupProgress(form);

    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const submit=$('button[type="submit"]',form);
      const resetSubmitLabel=()=>setSignupAccountType(form,String(form.elements.accountType?.value||'individual'));
      if(!form.reportValidity()){
        const invalid=form.querySelector(':invalid');
        if(invalid&&profileDetails?.contains(invalid))profileDetails.open=true;
        invalid?.focus();
        notice(result,'Complete the highlighted required fields before creating the account.','error');
        return;
      }
      if(String(form.elements.password?.value||'')!==String(form.elements.confirmPassword?.value||'')){
        form.elements.confirmPassword.setCustomValidity('The passwords do not match.');
        form.elements.confirmPassword.reportValidity();
        form.elements.confirmPassword.addEventListener('input',()=>form.elements.confirmPassword.setCustomValidity(''),{once:true});
        return;
      }
      submit.disabled=true;
      submit.textContent='Creating your secure account…';
      const formData=new FormData(form);
      const body=Object.fromEntries(formData.entries());
      delete body.confirmPassword;
      body.acceptTerms=formData.has('acceptTerms');
      body.acceptPrivacy=formData.has('acceptPrivacy');
      body.practiceAreas=list(body.practiceAreas);
      body.jurisdictions=list(body.jurisdictions);
      body.languages=list(body.languages);
      body.serviceRegions=list(body.serviceRegions);
      body.consultationModes=formData.getAll('consultationModes').filter(Boolean);
      body.serviceRoles=formData.getAll('serviceRoles').filter(Boolean);
      body.portalEligibility=formData.getAll('portalEligibility').filter(Boolean);
      body.website=body.accountType==='firm'?(body.firmWebsite||''):body.website;
      body.seatCount=Math.max(1,Math.min(500,Number(body.seatCount||1)));
      body.startMembership=formData.has('startMembership');
      body.billingCadence=String(formData.get('billingCadence')||'monthly');
      const data=await api('/api/professional/auth/signup',{method:'POST',body:JSON.stringify(body)});
      if(!data.ok){
        notice(result,data.error||'The account could not be created.','error');
        submit.disabled=false;
        resetSubmitLabel();
        return;
      }
      sessionStorage.setItem('professionalVerificationEmail',String(body.email||''));
      sessionStorage.setItem('professionalWelcomeMessage',data.message||'Check your email and verify the address before signing in.');
      location.href='/professional-login.html?verification=pending';
    });
  }

  async function login(){
    const form=$('#professionalLoginForm');
    const result=$('#professionalLoginResult');
    const resetRequest=$('#professionalPasswordResetRequestForm');
    const resetConfirm=$('#professionalPasswordResetConfirmForm');
    const resetResult=$('#professionalPasswordResetResult');
    const verifyRequest=$('#professionalEmailVerificationRequestForm');
    const verifyResult=$('#professionalEmailVerificationResult');
    const hashParams=new URLSearchParams(location.hash.replace(/^#/, ''));
    const resetToken=hashParams.get('reset_token')||new URLSearchParams(location.search).get('reset_token')||'';
    const verifyToken=hashParams.get('verify_token')||new URLSearchParams(location.search).get('verify_token')||'';
    const pendingEmail=sessionStorage.getItem('professionalVerificationEmail')||'';
    if(pendingEmail&&verifyRequest?.elements.email)verifyRequest.elements.email.value=pendingEmail;
    const welcome=sessionStorage.getItem('professionalWelcomeMessage'); if(welcome){notice(result,welcome,'success');sessionStorage.removeItem('professionalWelcomeMessage');}
    if(verifyToken){
      notice(verifyResult||result,'Verifying your professional email address…');
      const verified=await api('/api/professional/auth/email-verification/confirm',{method:'POST',body:JSON.stringify({token:verifyToken})});
      if(verified.ok){ sessionStorage.removeItem('professionalVerificationEmail'); history.replaceState({},'',location.pathname); location.href='/professional-dashboard.html?verified=1'; return; }
      notice(verifyResult||result,verified.error||'The verification link could not be completed.','error');
      history.replaceState({},'',location.pathname);
    }
    if(resetToken&&resetConfirm){ resetConfirm.hidden=false; resetConfirm.querySelector('[name="token"]').value=resetToken; $('#professionalPasswordReset')?.setAttribute('open',''); if(location.hash)history.replaceState({},'',location.pathname); }
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const submit=$('button[type="submit"]',form); submit.disabled=true; submit.textContent='Signing in…';
      const data=await api('/api/professional/auth/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form)))});
      if(!data.ok){ notice(result,data.error,'error'); if(data.emailVerificationRequired){ $('#professionalEmailVerification')?.setAttribute('open',''); if(verifyRequest?.elements.email)verifyRequest.elements.email.value=String(form.elements.email?.value||''); } if(data.mfaRequired) $('#professionalMfaField input')?.focus(); submit.disabled=false;submit.textContent='Sign In';return; }
      location.href='/professional-dashboard.html';
    });
    verifyRequest?.addEventListener('submit',async event=>{ event.preventDefault(); const data=await api('/api/professional/auth/email-verification/request',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(verifyRequest)))}); notice(verifyResult,data.message||data.error,data.ok?'success':'error'); });
    resetRequest?.addEventListener('submit',async event=>{ event.preventDefault(); const data=await api('/api/professional/auth/password-reset/request',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(resetRequest)))}); notice(resetResult,data.message||data.error,data.ok?'success':'error'); });
    resetConfirm?.addEventListener('submit',async event=>{ event.preventDefault(); const data=await api('/api/professional/auth/password-reset/confirm',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(resetConfirm)))}); notice(resetResult,data.message||data.error,data.ok?'success':'error'); if(data.ok){ resetConfirm.hidden=true; history.replaceState({},'',location.pathname); } });
  }

  function portalCheckboxes(selected=[]){
    const set=new Set(selected||[]);
    const pilots=[['digital-divorce','Divorce Law Aid'],['estate-planning-probate','Estate Law Aid'],['accident-injury-help','Personal Injury Law Aid — includes vehicle accidents'],['domestic-violence-aid','Domestic Violence Aid — separate specialty and survivor-safety review']];
    return `<input type="hidden" name="portalEligibility" value="general-smarter-justice-start">${pilots.map(([value,label])=>`<label class="check"><input type="checkbox" name="portalEligibility" value="${esc(value)}" ${set.has(value)?'checked':''}> ${esc(label)}</label>`).join('')}<p class="fine-print">Workers’ Compensation remains a separate portal. Domestic Violence Aid participation requires separate specialty and survivor-safety review. Additional specialties can be requested after the initial four-portal launch is proven.</p>`;
  }
  function consultationModeCheckboxes(selected=[]){
    const set=new Set(selected||[]);
    return Object.entries(CONSULTATION_MODE_LABELS).map(([value,label])=>`<label class="check"><input type="checkbox" name="consultationModes" value="${esc(value)}" ${set.has(value)?'checked':''}> ${esc(label)}</label>`).join('');
  }
  function serviceRoleCheckboxes(selected=[]){
    const set=new Set(selected||[]);
    return Object.entries(SERVICE_ROLE_LABELS).map(([value,label])=>`<label class="check"><input type="checkbox" name="serviceRoles" value="${esc(value)}" ${set.has(value)?'checked':''}> ${esc(label)}</label>`).join('');
  }
  function profileCompleteness(profile){
    if(profile.profileReadiness)return {score:Number(profile.profileReadiness.completenessPercent||0),missing:[...(profile.profileReadiness.missingRequired||[]),...(profile.profileReadiness.missingRecommended||[])]};
    const checks=[
      ['Professional name',Boolean(profile.displayName)],
      ['Practice areas',Boolean((profile.practiceAreas||[]).length)],
      ['Office location',Boolean((profile.officeLocations||[]).length)],
      ['Jurisdiction',Boolean((profile.jurisdictions||[]).length)],
      ['Biography',String(profile.biography||'').trim().length>=80],
      ['Website or phone',Boolean(profile.website||profile.phone)],
      ['Language',Boolean((profile.languages||[]).length)],
      ['Service region',Boolean((profile.serviceRegions||[]).length)],
      ['Availability',Boolean(profile.availabilityStatus&&profile.availabilityStatus!=='not configured'&&profile.availabilityStatus!=='not set')],
      ['Relevant portal',Boolean((profile.portalEligibility||[]).length)]
    ];
    const complete=checks.filter(([,done])=>done).length;
    return {score:Math.round(complete/checks.length*100),missing:checks.filter(([,done])=>!done).map(([label])=>label)};
  }
  function profileEditor(profile){
    const membership=titleCase(profile.membership?.status||'not active');
    const verification=titleCase(profile.verificationStatus||'not started');
    const availability=titleCase(profile.availabilityStatus||'not configured');
    const publicLink=profile.publicProfileEnabled?`<a class="text-link" href="/professional-profile.html?id=${encodeURIComponent(profile.publicProfileSlug||profile.id)}" target="_blank" rel="noopener">View Public Profile</a>`:'';
    const eligibilityLabel=profile.eligibility?.consultationEligible?'Case opportunities eligible':'Basic profile access';
    const completeness=profileCompleteness(profile);
    const missingText=completeness.missing.length?`Next useful items: ${completeness.missing.slice(0,4).join(', ')}${completeness.missing.length>4?'…':''}`:'The main professional-supplied profile fields are complete.';
    return `<article class="card professional-dashboard-card profile-workspace-card" id="profile-${esc(profile.id)}">
      <div class="section-heading"><div><p class="eyebrow">${esc(titleCase(profile.professionalType||profile.profileStatus))}</p><h2>${esc(profile.displayName)}</h2><p>Manage professional-supplied information and participation preferences. Public-source facts, identity, credentials, and portal approval remain separately reviewed.</p></div><div class="profile-card-actions"><span class="status-pill">${esc(eligibilityLabel)}</span>${publicLink}</div></div>
      <div class="dashboard-status-grid four-status"><div><strong>Basic profile</strong><span>Free to claim and edit</span></div><div><strong>Paid growth</strong><span>${esc(membership)}</span></div><div><strong>Credential review</strong><span>${esc(verification)}</span></div><div><strong>Public profile</strong><span>${profile.publicProfileEnabled?'Visible':'Not published yet'}</span></div></div>
      <div class="profile-completeness" style="--profile-progress:${completeness.score}%"><div class="profile-completeness-score"><strong>${completeness.score}%</strong></div><div><h3>Professional profile completeness</h3><p>${esc(missingText)}</p></div></div>
      ${!profile.eligibility?.consultationEligible?`<details class="details-card"><summary>See separate eligibility requirements</summary><ul>${(profile.eligibility?.reasons||[]).map(reason=>`<li>${esc(reason.replace('Owner marketplace approval','Smarter Justice approval').replace('Smarter Justice portal','Smarter Justice service area'))}</li>`).join('')}</ul><p class="fine-print">Payment never replaces claim authority, credential, jurisdiction, specialty, conflict, availability, or owner review.</p></details>`:''}
      <form class="professionalProfileEdit" data-id="${esc(profile.id)}">
        <div class="profile-editor-sections">
          <details class="profile-editor-section" open><summary>Public identity and contact information</summary><div class="profile-editor-section-body"><div class="form-grid two"><label>Public display name<input name="displayName" autocomplete="name" required value="${esc(profile.displayName)}"></label><label>Telephone<input name="phone" type="tel" autocomplete="tel" inputmode="tel" value="${esc(profile.phone||'')}"></label><label>Website<input name="website" type="url" autocomplete="url" value="${esc(profile.website||'')}"></label><label>Photo URL<input name="photoUrl" type="url" value="${esc(profile.photoUrl||'')}"></label></div><label>Professional biography<textarea name="biography" rows="6" maxlength="8000" aria-describedby="bioHelp">${esc(profile.biography||'')}</textarea><small id="bioHelp">Describe experience and services factually. Do not include client names, confidential matters, unverified superlatives, or guarantees.</small></label></div></details>
          <details class="profile-editor-section" open><summary>Practice, offices, and languages</summary><div class="profile-editor-section-body"><div class="form-grid two"><label>Office locations — one per line<textarea name="officeLocations" rows="3" autocomplete="street-address">${esc((profile.officeLocations||[]).join('\n'))}</textarea></label><label>Jurisdictions — one per line<textarea name="jurisdictions" rows="3">${esc((profile.jurisdictions||[]).join('\n'))}</textarea></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="4">${esc((profile.practiceAreas||[]).join('\n'))}</textarea></label><label>Languages — one per line<textarea name="languages" rows="4">${esc((profile.languages||[]).join('\n'))}</textarea></label></div><fieldset class="portal-choice-fieldset"><legend>Clients or sides served</legend><p class="fine-print">These role preferences help prevent adverse-side confusion. They do not replace an individual conflict check or engagement decision.</p><div class="checkbox-grid">${serviceRoleCheckboxes(profile.serviceRoles)}</div></fieldset></div></details>
          <details class="profile-editor-section"><summary>Availability and service preferences</summary><div class="profile-editor-section-body"><div class="form-grid two"><label>Current availability<select name="availabilityStatus">${AVAILABILITY_OPTIONS.map(value=>`<option value="${esc(value)}" ${value===(profile.availabilityStatus||'not configured')?'selected':''}>${esc(titleCase(value))}</option>`).join('')}</select></label><label>Service regions — one per line<textarea name="serviceRegions" rows="3" placeholder="New York City&#10;New York State&#10;Remote nationwide where permitted">${esc((profile.serviceRegions||[]).join('\n'))}</textarea></label></div><fieldset class="portal-choice-fieldset"><legend>Consultation and service modes</legend><div class="checkbox-grid">${consultationModeCheckboxes(profile.consultationModes)}</div></fieldset><label>Availability note<textarea name="availabilityNote" rows="3" maxlength="1200" placeholder="Example: Limited availability for new consultations during August.">${esc(profile.availabilityNote||'')}</textarea></label><p class="fine-print">These preferences do not open public booking by themselves.</p></div></details>
          <details class="profile-editor-section" open><summary>License or credential for verification</summary><div class="profile-editor-section-body"><div class="form-grid three"><label>Credential type<input name="credentialType" value="${esc(profile.credentials?.[0]?.credentialType||'New York attorney registration')}" placeholder="New York attorney registration"></label><label>Credential jurisdiction<input name="credentialJurisdiction" value="${esc(profile.credentials?.[0]?.jurisdiction||'New York')}"></label><label>Registration or license number<input name="credentialIdentifier" value="${esc(profile.credentials?.[0]?.identifier||'')}" autocomplete="off"></label></div><label>Official verification page or source URL<input name="credentialVerificationSource" type="url" value="${esc(profile.credentials?.[0]?.verificationSource||'')}"></label><p class="fine-print">The number is stored privately for verification and is not included in micro-portal handoffs. You cannot mark your own credential verified.</p></div></details>
          <details class="profile-editor-section"><summary>Focused portal participation</summary><div class="profile-editor-section-body"><fieldset class="portal-choice-fieldset"><legend>Areas where this profile may appear after approval</legend><div class="checkbox-grid">${portalCheckboxes(profile.portalEligibility)}</div></fieldset><p class="fine-print">Each selected portal still requires individual practice evidence and approval. Payment does not create portal eligibility.</p></div></details>
        </div>
        <input type="hidden" name="expectedRevision" value="${esc(profile.profileRevision||1)}"><div class="profile-save-bar"><button class="primary">Save Professional Profile</button><button class="secondary profileSubmitReview" type="button" data-id="${esc(profile.id)}" ${profile.profileReadiness?.readyForReview?'':'disabled'}>Submit Current Revision for Review</button><span class="save-state" aria-live="polite">${profile.profileReadiness?.currentRevisionSubmitted?'Current revision submitted for review.':profile.profileReadiness?.staleAfterSubmission?'Changes require resubmission.':'No unsaved changes.'}</span></div>
      </form>
    </article>`;
  }
  function firmCompleteness(firm){
    const checks=[Boolean(firm.name),Boolean((firm.locations||[]).length),Boolean((firm.jurisdictions||[]).length),Boolean(firm.website||firm.phone),Boolean((firm.portalEligibility||[]).length),Number(firm.seatCount||0)>0];
    return Math.round(checks.filter(Boolean).length/checks.length*100);
  }
  function firmEditor(firm){
    const publicLink=firm.publicProfileEnabled?`<a class="text-link" href="/firm-profile.html?id=${encodeURIComponent(firm.publicProfileSlug||firm.id)}" target="_blank" rel="noopener">View Public Firm Profile</a>`:'';
    const activeSeats=Number(firm.activeSeatCount||0); const seats=Number(firm.seatCount||1); const completeness=firmCompleteness(firm);
    return `<article class="card professional-dashboard-card firm-workspace-card" id="firm-${esc(firm.id)}"><div class="section-heading"><div><p class="eyebrow">Firm workspace</p><h2>${esc(firm.name)}</h2><p>Manage the approved firm presence, covered seats, offices, and participation preferences.</p></div><div class="profile-card-actions"><span class="status-pill">${activeSeats} of ${seats} seats in use</span>${publicLink}</div></div><div class="dashboard-status-grid"><div><strong>Membership</strong><span>${esc(titleCase(firm.membership?.status||'not active'))}</span></div><div><strong>Verification</strong><span>${esc(titleCase(firm.verificationStatus||'not started'))}</span></div><div><strong>Seat pricing</strong><span>$15 firm + $15 per covered attorney monthly</span></div></div><div class="profile-completeness" style="--profile-progress:${completeness}%"><div class="profile-completeness-score"><strong>${completeness}%</strong></div><div><h3>Firm workspace completeness</h3><p>Complete firm identity, offices, jurisdictions, contact information, seats, and relevant portal preferences.</p></div></div><form class="professionalFirmEdit" data-id="${esc(firm.id)}"><div class="profile-editor-sections"><details class="profile-editor-section" open><summary>Firm identity, contact, and offices</summary><div class="profile-editor-section-body"><div class="form-grid two"><label>Firm name<input name="name" autocomplete="organization" required value="${esc(firm.name)}"></label><label>Telephone<input name="phone" type="tel" autocomplete="tel" inputmode="tel" value="${esc(firm.phone||'')}"></label><label>Website<input name="website" type="url" autocomplete="url" value="${esc(firm.website||'')}"></label><label>Covered professional seats<input name="seatCount" type="number" min="1" max="500" inputmode="numeric" value="${esc(firm.seatCount)}"></label></div><div class="form-grid two"><label>Office locations — one per line<textarea name="locations" rows="3" autocomplete="street-address">${esc((firm.locations||[]).join('\n'))}</textarea></label><label>Jurisdictions — one per line<textarea name="jurisdictions" rows="3">${esc((firm.jurisdictions||[]).join('\n'))}</textarea></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="3">${esc((firm.practiceAreas||[]).join('\n'))}</textarea></label><label>Languages — one per line<textarea name="languages" rows="3">${esc((firm.languages||[]).join('\n'))}</textarea></label><label>Service regions — one per line<textarea name="serviceRegions" rows="3">${esc((firm.serviceRegions||[]).join('\n'))}</textarea></label></div></div></details><details class="profile-editor-section"><summary>Focused portal participation</summary><div class="profile-editor-section-body"><fieldset class="portal-choice-fieldset"><legend>Relevant Smarter Justice areas for the firm</legend><div class="checkbox-grid">${portalCheckboxes(firm.portalEligibility)}</div></fieldset><p class="fine-print">Firm preferences do not automatically assign every practice area to every professional.</p></div></details></div><input type="hidden" name="expectedRevision" value="${esc(firm.profileRevision||1)}"><div class="profile-save-bar"><button class="primary">Save Firm Settings</button><button class="secondary firmSubmitReview" type="button" data-id="${esc(firm.id)}" ${firm.profileReadiness?.readyForReview?'':'disabled'}>Submit Firm for Review</button><span class="save-state" aria-live="polite">${firm.profileReadiness?.currentRevisionSubmitted?'Current revision submitted for review.':firm.profileReadiness?.staleAfterSubmission?'Changes require resubmission.':'No unsaved changes.'}</span></div></form><details class="details-card"><summary>Add a professional to an available firm seat</summary><form class="firmProfessionalAdd" data-id="${esc(firm.id)}"><label>Professional name<input name="displayName" autocomplete="name" required></label><label>Professional category<select name="professionalType"><option value="attorney">Attorney</option><option value="tax attorney">Tax attorney</option><option value="registered patent attorney">Registered patent attorney</option><option value="registered patent agent">Registered patent agent</option><option value="CPA">CPA</option><option value="enrolled agent">Enrolled agent</option><option value="accountant">Accountant</option><option value="other approved professional">Other approved professional</option></select></label><label>Email address<input name="email" type="email" autocomplete="email"></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="3"></textarea></label><fieldset class="portal-choice-fieldset"><legend>Smarter Justice areas for this professional</legend><div class="checkbox-grid">${portalCheckboxes(['general-smarter-justice-start'])}</div></fieldset><button class="secondary">Add Professional Profile</button><p class="fine-print">This creates a profile record inside the firm workspace. Invitation delivery, identity review, and credential review remain separate.</p></form></details></article>`;
  }

  function setupChecklist(data){
    const records=[...(data.professionals||[]),...(data.firms||[])];
    const pending=(data.pendingClaimProfiles||[]).length+(data.pendingClaimFirms||[]).length;
    const hasRecord=records.length>0||pending>0;
    const reviewReady=records.some(record=>record.profileReadiness?.readyForReview);
    const reviewSubmitted=records.some(record=>record.profileReadiness?.currentRevisionSubmitted);
    const membershipActive=records.some(record=>record.membership?.status==='active');
    const steps=[
      {label:'Create and verify one Smarter Justice account',done:Boolean(data.account?.emailVerified),detail:'One account controls identity, profile management, firm seats, billing, and support across qualifying portals.',href:'#professional-security'},
      {label:'Claim or create a private profile',done:hasRecord,detail:hasRecord?'A central professional or firm record is connected.':'Claim an existing listing or create a new private profile from scratch.',href:'#create-professional-profile'},
      {label:'Complete launch-required profile fields',done:reviewReady,detail:reviewReady?'At least one record has the required name, jurisdiction, practice, location, portal, and credential information.':'Complete the required profile items shown in the readiness checklist.',href:'#professional-profiles'},
      {label:'Submit the current profile revision for review',done:reviewSubmitted,detail:reviewSubmitted?'The current revision is awaiting or has completed Smarter Justice review.':'Save the profile, then submit that exact revision for review.',href:'#professional-profiles'},
      {label:'Apply and pay after approval',done:membershipActive,detail:membershipActive?'A central membership is active.':'One approved Smarter Justice membership covers the approved qualifying portal profiles; no separate portal subscription is required.',href:'#professional-billing'}
    ];
    const complete=steps.filter(step=>step.done).length;
    return `<section class="card professional-setup-checklist"><div class="section-heading"><div><p class="eyebrow">Launch essentials</p><h2>${complete} of ${steps.length} essential steps completed</h2><p>The first launch intentionally uses one simple sequence. Extra marketplace features can be added after real attorney onboarding is stable.</p></div><span class="status-pill">${Math.round(complete/steps.length*100)}%</span></div><div class="setup-progress"><span style="width:${Math.round(complete/steps.length*100)}%"></span></div><ol class="setup-checklist">${steps.map(step=>`<li class="${step.done?'complete':'pending'}"><span aria-hidden="true">${step.done?'✓':'○'}</span><div><strong>${esc(step.label)}</strong><p>${esc(step.detail)}</p>${!step.done?`<a class="text-link" href="${esc(step.href)}">Continue</a>`:''}</div></li>`).join('')}</ol></section>`;
  }

  function manualProfileCreationCard(data){
    const firmOptions=(data.firms||[]).map(firm=>`<option value="${esc(firm.id)}">${esc(firm.name)}</option>`).join('');
    return `<section class="card" id="create-professional-profile"><div class="section-heading"><div><p class="eyebrow">Create from scratch</p><h2>Create a private professional profile</h2><p>No prebuilt or claimable profile is required. Enter the attorney or professional information here, then complete verification and portal review separately.</p></div><span class="status-pill">Private draft</span></div><form id="manualProfessionalProfileForm"><div class="form-grid two"><label>Professional display name<input name="displayName" autocomplete="name" required></label><label>Professional category<select name="professionalType"><option value="attorney">Attorney</option><option value="tax attorney">Tax attorney</option><option value="registered patent attorney">Registered patent attorney</option><option value="registered patent agent">Registered patent agent</option><option value="CPA">CPA</option><option value="enrolled agent">Enrolled agent</option><option value="accountant">Accountant</option><option value="other approved professional">Other approved professional</option></select></label><label>Firm workspace<select name="firmId"><option value="">Independent professional</option>${firmOptions}</select></label><label>Office location<input name="officeLocation" autocomplete="street-address"></label><label>Telephone<input name="phone" type="tel" autocomplete="tel"></label><label>Website<input name="website" type="url" autocomplete="url"></label></div><div class="form-grid two"><label>Jurisdictions — one per line<textarea name="jurisdictions" rows="3">New York</textarea></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="3"></textarea></label></div><div class="form-grid three"><label>Credential type<input name="credentialType" value="New York attorney registration"></label><label>Credential jurisdiction<input name="credentialJurisdiction" value="New York"></label><label>Registration or license number<input name="credentialIdentifier" autocomplete="off"></label></div><fieldset class="portal-choice-fieldset"><legend>Focused portals requested for review</legend><div class="checkbox-grid">${portalCheckboxes([])}</div></fieldset><button class="primary">Create Private Professional Profile</button><p class="fine-print">The profile is immediately manageable in this account but is not public and is not distributed until verification and portal approval. Payment never publishes a profile.</p><div class="form-result" hidden aria-live="polite"></div></form></section>`;
  }
  function manualFirmCreationCard(){
    return `<section class="card" id="create-firm-workspace"><div class="section-heading"><div><p class="eyebrow">Create from scratch</p><h2>Create a private firm workspace</h2><p>Create a firm account even when Smarter Justice has not built a claimable firm listing.</p></div><span class="status-pill">Private draft</span></div><form id="manualFirmWorkspaceForm"><div class="form-grid two"><label>Firm name<input name="name" autocomplete="organization" required></label><label>Covered professional seats<input name="seatCount" type="number" min="1" max="500" value="1" required></label><label>Website<input name="website" type="url" autocomplete="url"></label><label>Office location<input name="officeLocation" autocomplete="street-address"></label></div><div class="form-grid two"><label>Jurisdictions — one per line<textarea name="jurisdictions" rows="3">New York</textarea></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="3"></textarea></label></div><fieldset class="portal-choice-fieldset"><legend>Focused portals requested for review</legend><div class="checkbox-grid">${portalCheckboxes([])}</div></fieldset><button class="primary">Create Private Firm Workspace</button><p class="fine-print">Firm identity, seats, payment, professional credentials, and portal publication remain separate controlled steps.</p><div class="form-result" hidden aria-live="polite"></div></form></section>`;
  }

  function dashboardOverview(data){
    const profiles=(data.professionals||[]).length; const firms=(data.firms||[]).length;
    const membershipActive=[...(data.professionals||[]).map(p=>p.membership?.status),...(data.firms||[]).map(f=>f.membership?.status)].some(status=>status==='active');
    const verified=(data.professionals||[]).filter(p=>p.verificationStatus==='verified').length;
    const enrollmentStatus=titleCase(data.pilotControls?.status||'not available');
    return `<section class="professional-command-center"><div class="command-center-heading"><div><p class="eyebrow">Professional command center</p><h2>Your account at a glance</h2><p>Central profile management: claim an existing record or create a private professional or firm profile from scratch, then manage account, payment, and portal requests here.</p></div><span class="pilot-state-badge">Membership enrollment: ${esc(enrollmentStatus)}</span></div><div class="command-metric-grid"><div><small>Connected profiles</small><strong>${profiles}</strong><span>${verified} credential-verified</span></div><div><small>Firm workspaces</small><strong>${firms}</strong><span>Seats and offices managed centrally</span></div><div><small>Membership</small><strong>${membershipActive?'Active':'Not active'}</strong><span>Managed separately</span></div><div><small>Account protection</small><strong>${data.account?.mfaEnabled?'MFA on':'MFA available'}</strong><span>Authenticator security</span></div></div><nav class="dashboard-quick-actions" aria-label="Dashboard quick actions"><a href="#professional-onboarding">Onboarding</a><a href="#professional-profiles">Profiles</a><a href="#professional-firms">Firm & Seats</a><a href="#professional-billing">Billing</a><a href="#professional-security">Security</a><a href="#professional-communications">Messages</a><a href="#professional-support">Support</a></nav></section>`;
  }
  function membershipValueCard(){
    return `<section class="card member-value-card"><div class="section-heading"><div><p class="eyebrow">Membership value today</p><h2>Useful professional tools from the start</h2></div><span class="status-pill">Professional network</span></div><div class="member-value-grid"><div><strong>Professional presence</strong><span>Claimed profile and approved professional-supplied details.</span></div><div><strong>Central management</strong><span>One workspace for profiles, firms, seats, security, and membership.</span></div><div><strong>Portal participation</strong><span>Choose relevant focused portals, jurisdictions, and service preferences.</span></div><div><strong>Early member access</strong><span>Introductory pricing, direct support, and structured feedback.</span></div></div><p class="fine-print">No clients, revenue, ranking, or future value is guaranteed. Smarter Justice must earn continued membership through useful tools and operations.</p></section>`;
  }
  function opportunityStatusCard(data){
    const active=Boolean(data.featureStatus?.publicBookingActivated);
    return `<section class="card opportunity-status-card" id="professional-opportunities"><div class="section-heading"><div><p class="eyebrow">Opportunities and public booking</p><h2>${active?'Available opportunity tools':'Opportunity tools are not available yet'}</h2></div><span class="status-pill">${active?'Available':'Unavailable'}</span></div><p>${active?'Use the controls shown for approved opportunities and availability.':'Public booking, open matching, and public reviews are not available yet. This does not indicate a problem with your account.'}</p><p class="fine-print">The absence of opportunities does not indicate an account problem. Membership value currently centers on profile, firm, participation, and platform tools.</p></section>`;
  }
  function supportCard(){
    return `<section class="card professional-support-card" id="professional-support"><div class="section-heading"><div><p class="eyebrow">Member support</p><h2>Get help and shape the platform</h2></div></div><div class="member-value-grid"><div><strong>Account or profile help</strong><span>Use the contact page and identify yourself as a professional member.</span><a href="/contact.html">Contact support</a></div><div><strong>Billing questions</strong><span>Ask about plans, renewals, firm seats, cancellations, or refunds.</span><a href="/contact.html?topic=professional-billing">Billing support</a></div><div><strong>Report incorrect information</strong><span>Request a correction, duplicate review, or source check.</span><a href="/professionals.html">Find the profile</a></div><div><strong>Member feedback</strong><span>Tell us what would make the dashboard more useful.</span><a href="/contact.html?topic=member-feedback">Share feedback</a></div></div></section>`;
  }

  function professionalCommunicationCard(account={}){
    const prefs=account.communicationPreferences||{};
    return `<section class="card professional-communication-card" id="professional-communications"><div class="section-heading"><div><p class="eyebrow">Communication preferences</p><h2>Choose optional professional messages</h2><p>Security, legal, account, and billing notices remain enabled because they may be necessary to protect the account or explain a service change.</p></div><span class="status-pill">Essential notices on</span></div><form id="professionalCommunicationForm"><label>Preferred language for available messages<select name="preferredLanguage"><option value="en" ${prefs.preferredLanguage!=='es'?'selected':''}>English</option><option value="es" ${prefs.preferredLanguage==='es'?'selected':''}>Spanish when a reviewed version is available</option></select></label><fieldset><legend>Email choices</legend><label class="check"><input type="checkbox" checked disabled> Essential security, legal, account, and billing notices</label><label class="check"><input type="checkbox" name="profileAndDirectoryUpdates" ${prefs.profileAndDirectoryUpdates!==false?'checked':''}> Profile, firm, credential-review, and directory updates</label><label class="check"><input type="checkbox" name="membershipAndProgramUpdates" ${prefs.membershipAndProgramUpdates!==false?'checked':''}> Membership-program and portal-participation updates</label><label class="check"><input type="checkbox" name="researchAndFeedbackInvitations" ${prefs.researchAndFeedbackInvitations?'checked':''}> Optional research, interview, and feedback invitations</label></fieldset><p class="fine-print">Changing optional messages does not affect profile status, credential review, membership eligibility, ranking, or access to support.</p><button class="secondary">Save Communication Choices</button><div id="professionalCommunicationResult" hidden aria-live="polite"></div></form></section>`;
  }

  function professionalSecurityCard(account={}){
    return `<section class="card professional-security-card"><div class="section-heading"><div><p class="eyebrow">Account security</p><h2>Sign-in protection</h2></div><span class="status-pill">${account.mfaEnabled?'MFA enabled':'MFA available'}</span></div><p>Use an authenticator app for stronger account protection. Recovery codes are shown only when MFA is enabled or replaced.</p>${account.mfaEnabled?`<div class="card-actions"><button class="secondary" id="professionalRevokeSessions" type="button">Sign Out Other Sessions</button></div><details class="details-card"><summary>Disable authenticator MFA</summary><form id="professionalDisableMfaForm"><label>Current password<input name="password" type="password" autocomplete="current-password" required></label><label>Authenticator or recovery code<input name="code" autocomplete="one-time-code" required></label><button class="secondary">Disable MFA</button></form></details>`:`<button class="secondary" id="professionalBeginMfa" type="button">Set Up Authenticator MFA</button><div hidden id="professionalMfaEnrollment"></div>`}<div id="professionalSecurityResult" hidden aria-live="polite"></div></section>`;
  }

  function membershipCalculator(){
    const form=$('#firmSavingsCalculator');
    if(!form)return;
    const seats=$('#firmSavingsSeats');
    const result=$('#firmSavingsResult');
    const signupLink=$('#firmSavingsSignupLink');
    function update(){
      const count=Math.max(2,Math.min(500,Number(seats.value)||2));
      seats.value=String(count);
      const total=15+(15*count);
      result.innerHTML=`<strong>${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(total)} per month</strong><span>$15 firm profile + $15 for each of ${count} covered attorney seat${count===1?'':'s'}. No volume discount or annual plan is currently approved.</span>`;
      signupLink.href=`/professional-signup.html?account=firm&campaign=NYC-FOUNDING-WEB&seats=${encodeURIComponent(count)}`;
    }
    form.addEventListener('input',update);
    form.addEventListener('change',update);
    update();
  }

  function pilotApplicationCard(pilot,data){
    const app=pilot.application;
    const targets=[...(data.professionals||[]).map(x=>({kind:'professional',id:x.id,label:`${x.displayName} — individual`})),...(data.firms||[]).map(x=>({kind:'firm',id:x.id,label:`${x.name} — firm`}))];
    const targetOptions=targets.map(x=>`<option value="${esc(x.kind)}|${esc(x.id)}">${esc(x.label)}</option>`).join('');
    const interestOptions=(data.portalParticipationOptions||[]).map(x=>`<label class="check"><input type="checkbox" name="portalInterests" value="${esc(x.value||x.slug||x.id||x)}" ${(app?.portalInterests||[]).includes(x.value||x.slug||x.id||x)?'checked':''}> ${esc(x.label||x.name||x)}</label>`).join('');
    const gate=pilot.paymentGate||{};
    const status=app?.status||'not started';
    return `<section class="card pilot-application-card" id="professional-pilot"><div class="section-heading"><div><p class="eyebrow">Professional membership application</p><h2>Application, approval, and payment are separate</h2><p>Prepare your application now. Payment becomes available only after the application and selected plan are approved and enrollment is open.</p></div><span class="status-pill">${esc(titleCase(status))}</span></div><div class="dashboard-status-grid"><div><strong>Applications</strong><span>${pilot.controls?.applicationsOpen?'Open':'Closed'}</span></div><div><strong>Application</strong><span>${esc(titleCase(status))}</span></div><div><strong>Payment</strong><span>${esc(titleCase(app?.paymentStatus||'blocked'))}</span></div><div><strong>Plan availability</strong><span>${gate.paymentAllowed?'Available':'Not available yet'}</span></div></div>${!gate.paymentAllowed?`<div class="notice"><strong>Why payment is not available</strong><p>Payment is not available yet. You will not be charged until enrollment is open and your application is approved.</p></div>`:''}${targets.length?`<form id="pilotApplicationForm"><div class="form-grid two"><label>Membership target<select name="target" required>${targetOptions}</select></label><label>Billing cadence<input name="billingCadence" value="Monthly" readonly></label><label>Seat count<input name="seatCount" type="number" min="1" max="500" value="${esc(app?.seatCount||1)}"></label><label>Professional types<textarea name="professionalTypes" rows="3" placeholder="Attorney&#10;Tax attorney&#10;CPA">${esc((app?.professionalTypes||[]).join('\n'))}</textarea></label></div><fieldset class="portal-choice-fieldset"><legend>Priority portal interests</legend><div class="checkbox-grid">${interestOptions}</div></fieldset><label>Why do you want to join?<textarea name="whyJoin" rows="4" maxlength="4000">${esc(app?.whyJoin||'')}</textarea></label><label>What would make membership valuable enough to renew?<textarea name="goals" rows="4" maxlength="4000">${esc(app?.goals||'')}</textarea></label><label>Setup or support needs<textarea name="supportNeeds" rows="3" maxlength="3000">${esc(app?.supportNeeds||'')}</textarea></label><fieldset><legend>Required acknowledgments before submission</legend><label class="check"><input type="checkbox" name="acceptMembershipTerms"> I accept the versioned Professional Membership Terms.</label><label class="check"><input type="checkbox" name="acceptPrivacy"> I accept the Privacy Notice.</label><label class="check"><input type="checkbox" name="acceptRecurringBilling"> I understand approved monthly membership renews until canceled.</label><label class="check"><input type="checkbox" name="acceptNoGuarantees"> I understand no clients, matters, ranking, revenue, or outcome is guaranteed.</label><label class="check"><input type="checkbox" name="acceptIndependentProfessional"> I remain an independent professional and Smarter Justice is not my law, tax, or accounting firm.</label><label class="check"><input type="checkbox" name="acceptConflicts"> I remain responsible for conflicts, engagement, scope, and professional obligations.</label></fieldset><div class="card-actions"><button class="secondary" type="button" id="pilotSaveApplication">Save Draft</button><button class="primary" type="submit" ${pilot.controls?.applicationsOpen?'':'disabled'}>Submit Application</button>${app&&!['active-member'].includes(app.status)?'<button class="text-button" type="button" id="pilotWithdrawApplication">Withdraw</button>':''}</div><div id="pilotApplicationResult" hidden aria-live="polite"></div></form>`:'<p>Claim or create a professional or firm profile before applying.</p>'}</section>`;
  }
  function pilotSupportCard(pilot){
    return `<section class="card" id="professional-pilot-support"><div class="section-heading"><div><p class="eyebrow">Recorded professional support</p><h2>Account, profile, firm, verification, or billing help</h2></div><span class="status-pill">${esc(String((pilot.supportTickets||[]).filter(x=>!['resolved','closed'].includes(x.status)).length))} open</span></div><form id="pilotSupportForm"><div class="form-grid two"><label>Category<select name="category"><option>Account and sign-in</option><option>Profile or firm claim</option><option>Credential verification</option><option>Portal participation</option><option>Billing or cancellation</option><option>Website or account problem</option><option>Member feedback</option></select></label><label>Priority<select name="priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>Subject<input name="subject" required maxlength="240"></label><label>Describe the request<textarea name="message" rows="4" required maxlength="5000"></textarea></label><button class="secondary">Send Support Request</button><div id="pilotSupportResult" hidden aria-live="polite"></div></form>${(pilot.supportTickets||[]).length?`<details><summary>Previous support requests</summary><ul>${pilot.supportTickets.map(x=>`<li><strong>${esc(x.subject)}</strong> — ${esc(titleCase(x.status))}${x.resolutionMessage?` — ${esc(x.resolutionMessage)}`:''}</li>`).join('')}</ul></details>`:''}</section>`;
  }
  function professionalGrowthCard(growth={}){
    const policy=growth.policy||{};
    const records=growth.professionals||[];
    const sponsoredOpen=Boolean(policy.paidProducts?.sponsoredVisibility?.available);
    const opportunitiesOpen=Boolean(policy.paidProducts?.caseOpportunityAccess?.available);
    const rows=records.map(row=>{
      const access=row.access||{};
      return `<article class="service-card"><h3>${esc(row.displayName||'Professional profile')}</h3><p><strong>Basic profile:</strong> Free to claim, verify, and edit.</p><p><strong>Sponsored visibility:</strong> ${access.sponsoredPlacementEligible?'Eligible after activation':'Not active'}</p><p><strong>Case opportunities:</strong> ${access.caseOpportunityEligible?'Eligible after activation':'Not active'}</p>${(access.reasons||[]).length?`<details><summary>Requirements still separate</summary><ul>${access.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul></details>`:''}</article>`;
    }).join('');
    return `<section class="card professional-growth-card" id="professional-growth"><div class="section-heading"><div><p class="eyebrow">Professional opportunities and optional paid growth</p><h2>Claim and manage the basic profile free</h2><p>Payment is not required to claim, verify, correct, or edit a basic professional profile. Optional paid products may add clearly labeled sponsored visibility and access to case or attorney-review opportunities.</p></div><span class="status-pill">${sponsoredOpen||opportunitiesOpen?'Limited availability':'Paid products closed'}</span></div><ul class="check-list compact"><li>Free basic profile claiming and editing</li><li>Independent identity, credential, and specialty review</li><li>Sponsored placement is always labeled ${esc(policy.paidProducts?.sponsoredVisibility?.label||'Sponsored')}</li><li>Organic profile order and trust signals are not for sale</li><li>Case-opportunity charges cannot be a percentage of legal fees or depend on a result</li></ul>${rows||'<p class="fine-print">Create or claim a professional profile to see profile-specific growth readiness.</p>'}<div class="dashboard-boundary-note"><strong>Compliance boundary:</strong><span>Payment does not verify identity, approve credentials, establish specialty relevance, create an endorsement, or guarantee clients, work, fees, or outcomes.</span></div></section>`;
  }

  function professionalNetworkSummaryCard(network={}){
    const summary=network.summary||{};
    const organizations=network.organizations||[];
    const seats=network.seats||[];
    const assignments=network.portalAssignments||[];
    return `<section class="card professional-network-member-card" id="professional-network-summary"><div class="section-heading"><div><p class="eyebrow">One Smarter Justice relationship</p><h2>Your firm, seats, offices, and legal portals</h2><p>Your account can support every qualifying legal portal without a separate full subscription for each portal. Each individual practice and portal assignment still requires its own evidence and approval.</p></div><span class="status-pill">Foundation only</span></div><div class="dashboard-status-grid"><div><strong>${esc(summary.organizations||0)}</strong><span>Organization records</span></div><div><strong>${esc(summary.offices||0)}</strong><span>Offices</span></div><div><strong>${esc(summary.seats||0)}</strong><span>Professional seats</span></div><div><strong>${esc(summary.portalAssignments||0)}</strong><span>Portal assignments</span></div></div>${organizations.map(org=>`<div class="notice"><strong>${esc(org.name)}</strong><p>${esc(org.accountModel)} · ${esc(org.billingModel)} · ${esc(org.seatCount||0)} planned seat${Number(org.seatCount||0)===1?'':'s'}.</p></div>`).join('')}${assignments.length?`<details><summary>Portal-assignment status</summary><ul>${assignments.slice(0,40).map(row=>{const seat=seats.find(item=>item.professionalId===row.professionalId);return `<li><strong>${esc(seat?.displayName||row.professionalId)}</strong> — ${esc(row.portalId)} — ${esc(titleCase(row.status))}</li>`;}).join('')}</ul></details>`:'<p>No portal assignments are connected to this account yet.</p>'}<p class="fine-print">Payment, profile control, credential verification, practice evidence, portal assignment, participation, availability, inquiries, appointments, sponsorship, and organic ranking remain separate. Public checkout and live portal connections are not active.</p></section>`;
  }

  function membershipTargets(data){
    const plans=new Map((data.membershipPlans||[]).map(plan=>[plan.id,plan]));
    return [
      ...(data.professionals||[]).map(profile=>({kind:'professional',id:profile.id,label:`${profile.displayName} — individual membership`,planId:'nyc-founding-professional',seatCount:1,plan:plans.get('nyc-founding-professional'),record:profile})),
      ...(data.firms||[]).map(firm=>({kind:'firm',id:firm.id,label:`${firm.name} — ${firm.seatCount} covered seat${Number(firm.seatCount)===1?'':'s'}`,planId:'nyc-founding-firm',seatCount:Number(firm.seatCount||1),plan:plans.get('nyc-founding-firm'),record:firm}))
    ].filter(target=>target.plan);
  }
  function membershipQuote(target){
    if(!target?.plan)return null;
    const seatCount=Math.max(1,Number(target.seatCount)||1);
    const basePerSeat=1500;
    const firmBase=target.kind==='firm'?1500:0;
    const total=target.kind==='firm'?firmBase+(basePerSeat*seatCount):basePerSeat;
    return {total,perSeat:basePerSeat,firmBase,seatCount,discount:0,period:'month',cadence:'monthly'};
  }
  function membershipCheckoutCard(data,pilot){
    const targets=membershipTargets(data);
    if(!targets.length)return `<section class="card membership-checkout-card"><p class="eyebrow">Professional membership</p><h2>Membership options will appear after profile approval</h2><p>Your profile or firm request is still being reviewed. Once control is approved, the dashboard can show the approved target and exact recurring price.</p><p class="fine-print"><a href="/professional-membership-terms.html">Review Professional Membership Terms</a></p></section>`;
    const app=pilot?.application||null;
    const activeTargets=targets.filter(target=>target.record?.membership?.status==='active');
    if(activeTargets.length){
      const rows=activeTargets.map(target=>{const membership=target.record.membership||{};const end=membership.currentPeriodEnd?new Date(membership.currentPeriodEnd).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}):'Not yet available';return `<article class="active-membership-row"><div><strong>${esc(target.label)}</strong><span>${esc(titleCase(membership.billingCadence||'billing schedule not recorded'))} · Current period ends ${esc(end)}</span></div><span class="status-pill">Active</span></article>`;}).join('');
      return `<section class="card membership-checkout-card active-membership-card"><div class="section-heading"><div><p class="eyebrow">Billing and membership</p><h2>Your membership is active</h2><p>Review the current membership record below. For cancellation, seat changes, billing questions, or plan changes, use professional support so the request and effective date are documented.</p></div><span class="status-pill">Active</span></div><div class="active-membership-list">${rows}</div><div class="checkout-submit-row"><a class="primary button-link" href="/contact.html?topic=professional-support&category=billing">Billing and Cancellation Support</a><a class="secondary button-link" href="/professional-membership-terms.html">Review Membership Terms</a></div><p class="fine-print">A second subscription cannot be created for an active target. Payment remains separate from verification, ranking, availability, inquiries, clients, revenue, and results.</p></section>`;
    }
    const approved=app?.status==='approved-for-payment';
    const paymentReady=Boolean(pilot?.paymentGate?.available);
    const selectedIndex=Math.max(0,targets.findIndex(target=>target.kind===app?.targetKind&&target.id===app?.targetId));
    const options=targets.map((target,index)=>`<option value="${esc(target.kind)}|${esc(target.id)}|${esc(target.planId)}|${esc(target.seatCount)}" ${index===selectedIndex?'selected':''}>${esc(target.label)}</option>`).join('');
    const reasons=(pilot?.paymentGate?.reasons||[]).map(reason=>`<li>${esc(reason)}</li>`).join('');
    return `<section class="card membership-checkout-card"><div class="section-heading"><div><p class="eyebrow">Professional membership</p><h2>Review the exact recurring charge before checkout</h2><p>One approved Smarter Justice membership supports the selected professional or firm across all approved qualifying portals. Checkout opens only after the current profile revision and application are approved.</p></div><span class="status-pill">${paymentReady?'Checkout available':'Checkout closed'}</span></div><div class="checkout-readiness"><div><strong>${esc(titleCase(app?.status||'not submitted'))}</strong><span>Application status</span></div><div><strong>${paymentReady?'Ready':'Closed'}</strong><span>Payment gate</span></div><div><strong>${data.account?.mfaEnabled?'Enabled':'Recommended'}</strong><span>Authenticator MFA</span></div></div>${!paymentReady?`<div class="notice"><strong>No payment can be taken yet.</strong><p>Your account and profile remain available. Checkout opens only after approval and launch readiness.</p>${reasons?`<ul class="checkout-gate-list">${reasons}</ul>`:''}</div>`:''}<form id="membershipCheckoutForm"><div class="form-grid two"><label>Membership for<select name="target" required>${options}</select></label><label>Billing frequency<input name="billingCadence" value="Monthly recurring" readonly></label></div><div class="membership-price-summary" id="membershipPriceSummary" aria-live="polite"></div><fieldset class="checkout-acknowledgments"><legend>Confirm before secure checkout</legend><label class="check"><input type="checkbox" name="acceptMembershipTerms" required> I accept the current <a href="/professional-membership-terms.html" target="_blank" rel="noopener">Professional Membership Terms</a>.</label><label class="check"><input type="checkbox" name="acceptRecurringBilling" required> I understand this is a recurring monthly subscription until canceled.</label><label class="check"><input type="checkbox" name="acceptCancellationPolicy" required> I reviewed the renewal, cancellation, and refund terms before payment.</label><label class="check"><input type="checkbox" name="acceptNoGuarantees" required> I understand payment does not guarantee clients, matters, ranking, revenue, or results.</label></fieldset><div class="checkout-submit-row"><button class="primary" ${paymentReady&&approved?'':'disabled'}>Continue to Secure Checkout</button><span class="fine-print">Stripe displays the final recurring amount and billing cadence again before payment. No card details are entered on Smarter Justice.</span></div></form><div id="membershipCheckoutResult" hidden aria-live="polite"></div></section>`;
  }
  function bindProfileDirtyState(){
    $$('.professionalProfileEdit,.professionalFirmEdit').forEach(form=>{
      const bar=form.querySelector('.profile-save-bar'); const state=bar?.querySelector('.save-state');
      const mark=()=>{bar?.classList.add('dirty');if(state)state.textContent='Unsaved changes.';};
      form.addEventListener('input',mark); form.addEventListener('change',mark);
    });
  }
  function bindMembershipQuote(data){
    const form=$('#membershipCheckoutForm'); if(!form)return;
    const targets=membershipTargets(data);
    const summary=$('#membershipPriceSummary');
    const update=()=>{
      const [kind,id,planId,seatCount]=String(form.elements.target.value||'').split('|');
      const target=targets.find(item=>item.kind===kind&&item.id===id&&item.planId===planId)||{kind,id,planId,seatCount:Number(seatCount||1),plan:(data.membershipPlans||[]).find(plan=>plan.id===planId)};
      const quote=membershipQuote(target);
      if(!quote){summary.innerHTML='<strong>Price unavailable</strong><span>Contact professional support before payment.</span>';return;}
      const total=money(quote.total); const perSeat=money(quote.perSeat);
      summary.innerHTML=`<strong>${esc(total)} per ${esc(quote.period)}</strong><span>${target.kind==='firm'?`$15 firm profile + ${esc(target.seatCount)} covered attorney seat${Number(target.seatCount)===1?'':'s'} at ${esc(perSeat)} each`:`One individual professional · ${esc(perSeat)} per ${esc(quote.period)}`}. Renews every ${esc(quote.period)} until canceled.</span>`;
    };
    form.addEventListener('change',update); update();
  }

  function portalPresenceCards(data,targetKind,target){
    const presence=data.portalPresence||{portals:[],profiles:[],acceptances:[]};
    const selected=new Set(target.portalEligibility||[]);
    const portals=(presence.portals||[]).filter(portal=>selected.has(portal.portalId)||selected.has(portal.centralInterestId));
    if(!portals.length)return `<section class="card portal-presence-empty"><p class="eyebrow">Portal presence</p><h3>No focused portal selected yet</h3><p>Select Divorce Law Aid, Estate Law Aid, Personal Injury Law Aid, or Domestic Violence Aid in the central profile, save, and then complete the separate specialty section.</p></section>`;
    return `<section class="portal-presence-workspace" aria-label="Portal-specific profile management"><div class="section-heading"><div><p class="eyebrow">Portal-by-portal presence</p><h3>Manage each specialty profile separately</h3><p>Shared facts remain central. These free specialty fields are reviewed separately and are exported read-only only after exact-revision approval.</p></div><span class="status-pill">No separate portal login</span></div>${portals.map(portal=>{
      const row=(presence.profiles||[]).find(item=>item.targetKind===targetKind&&item.targetId===target.id&&item.portalId===portal.portalId)||{profileRevision:1,submittedRevision:0,reviewedRevision:0,reviewStatus:'draft',participationStatus:'draft',specialtyBiography:'',practiceAreas:[],matterTypes:[],geographicServiceAreas:[],languages:[],consultationPreferences:[],contactPreferences:[],qualifications:[],specialtyEvidence:[],readiness:{readyForReview:false,missingRequired:['Specialty biography','Practice area','Matter type','Geographic service area'],excludedMatterTypes:[]}};
      const acceptance=(presence.acceptances||[]).find(item=>item.targetKind===targetKind&&item.targetId===target.id&&item.portalId===portal.portalId);
      const publicLink=acceptance?.publicProfileUrl&&['STAGING_ACCEPTED','PRODUCTION_ACTIVE'].includes(acceptance.acceptanceStatus)?`<a class="secondary button-link" href="${esc(acceptance.publicProfileUrl)}" target="_blank" rel="noopener">View Portal Profile</a>`:'';
      const missing=row.readiness?.missingRequired||[];
      const matterOptions=targetKind==='professional'?`<label>Matter types handled — one per line<textarea name="matterTypes" rows="4" placeholder="${esc((portal.allowedMatterTypes||[]).slice(0,4).join('\n'))}">${esc((row.matterTypes||[]).join('\n'))}</textarea></label>`:'';
      return `<article class="card portal-presence-card" id="portal-presence-${esc(targetKind)}-${esc(target.id)}-${esc(portal.portalId)}"><div class="section-heading"><div><p class="eyebrow">${esc(portal.name)}</p><h4>${esc(targetKind==='firm'?target.name:target.displayName)}</h4><p>Public profile authority: ${esc(portal.name)}. Smarter Justice remains the private management authority.</p></div><div class="profile-card-actions"><span class="status-pill">${esc(titleCase(row.reviewStatus||'draft'))}</span>${publicLink}</div></div><div class="dashboard-status-grid four-status"><div><strong>Specialty revision</strong><span>${esc(row.profileRevision||1)}</span></div><div><strong>Submitted</strong><span>${esc(row.submittedRevision||0)}</span></div><div><strong>Approved</strong><span>${esc(row.reviewedRevision||0)}</span></div><div><strong>Portal acceptance</strong><span>${esc(titleCase(acceptance?.acceptanceStatus||'not started'))}</span></div></div><form class="portalSpecificProfileEdit" data-target-kind="${esc(targetKind)}" data-target-id="${esc(target.id)}" data-portal-id="${esc(portal.portalId)}"><label>Specialty biography<textarea name="specialtyBiography" rows="5" maxlength="6000" placeholder="Describe relevant experience for this legal specialty without guarantees or unsupported superiority claims.">${esc(row.specialtyBiography||'')}</textarea></label><div class="form-grid two"><label>Relevant practice areas — one per line<textarea name="practiceAreas" rows="4">${esc((row.practiceAreas||[]).join('\n'))}</textarea></label>${matterOptions}<label>Geographic service areas — one per line<textarea name="geographicServiceAreas" rows="4">${esc((row.geographicServiceAreas||[]).join('\n'))}</textarea></label><label>Portal-specific languages — one per line<textarea name="languages" rows="4">${esc((row.languages||[]).join('\n'))}</textarea></label><label>Consultation preferences — one per line<textarea name="consultationPreferences" rows="3">${esc((row.consultationPreferences||[]).join('\n'))}</textarea></label><label>Contact preferences — one per line<textarea name="contactPreferences" rows="3">${esc((row.contactPreferences||[]).join('\n'))}</textarea></label><label>Relevant qualifications — one per line<textarea name="qualifications" rows="4">${esc((row.qualifications||[]).join('\n'))}</textarea></label><label>Public-safe specialty evidence — one per line<textarea name="specialtyEvidence" rows="4" placeholder="Public source or concise evidence description; no private claim documents.">${esc((row.specialtyEvidence||[]).join('\n'))}</textarea></label></div><input type="hidden" name="expectedRevision" value="${esc(row.profileRevision||1)}"><div class="profile-save-bar"><button class="secondary" type="submit">Save ${esc(portal.name)} Details</button><button class="primary portalSpecificSubmitReview" type="button" ${row.readiness?.readyForReview?'':'disabled'}>Submit Exact Revision</button><span class="save-state" aria-live="polite">${missing.length?`Needed before review: ${esc(missing.slice(0,3).join(', '))}.`:'Ready for exact-revision review.'}</span></div><div class="form-result" hidden aria-live="polite"></div><p class="fine-print">Claiming and editing these basic specialty fields is free. Payment does not approve identity, credentials, specialty relevance, publication, Sponsored placement, organic rank, or opportunities.</p></form></article>`;
    }).join('')}</section>`;
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
    const [data,pilot,launch,networkResponse,growth]=await Promise.all([api('/api/professional/dashboard'),api('/api/professional/pilot-program'),api('/api/initial-launch-pilots'),api('/api/professional/network'),api('/api/professional/growth-access')]);
    const professionalNetwork=networkResponse.ok?networkResponse.network:{summary:{},organizations:[],seats:[],portalAssignments:[]};
    data.portalParticipationOptions=(launch.pilots||[]).map(x=>({value:x.centralInterestId,label:x.name}));
    if(!data.ok){location.href='/professional-login.html';return;}
    $('#professionalAccountName').textContent=data.account.displayName;
    const welcome=sessionStorage.getItem('professionalWelcomeMessage');
    sessionStorage.removeItem('professionalWelcomeMessage');
    const message=paymentMessage||welcome||(params.get('welcome')?'Your account was created. Complete the items below to prepare your profile.':'');
    const membershipCard=membershipCheckoutCard(data,pilot);
    out.innerHTML=`${message?`<div class="result-panel success"><p>${esc(message)}</p></div>`:''}
      ${dashboardOverview(data)}
      <div id="professional-onboarding">${setupChecklist(data)}</div>
      ${growth.ok?professionalGrowthCard(growth):''}
      ${membershipValueCard()}
      ${professionalNetworkSummaryCard(professionalNetwork)}
      ${pilot.ok?pilotApplicationCard(pilot,data):''}
      ${manualProfileCreationCard(data)}
      <section id="professional-profiles"><div class="section-heading"><div><p class="eyebrow">Profiles</p><h2>Your private central professional profiles</h2></div><a class="secondary button-link" href="/professionals.html">Claim an Existing Profile</a></div>${data.professionals.map(profile=>profileEditor(profile)+portalPresenceCards(data,'professional',profile)).join('')||'<div class="card"><p>No professional profile is linked yet. Search the directory and request control of your profile.</p><a class="primary button-link" href="/professionals.html">Find My Profile</a></div>'}</section>
      ${(data.pendingClaimProfiles||[]).length?`<section><h2>Professional profile requests being reviewed</h2>${data.pendingClaimProfiles.map(profile=>`<article class="card"><h3>${esc(profile.displayName)}</h3><p>Your request is recorded. This profile remains read-only until identity and authority review is completed.</p></article>`).join('')}</section>`:''}
      ${(data.pendingClaimFirms||[]).length?`<section><h2>Firm profile requests being reviewed</h2>${data.pendingClaimFirms.map(firm=>`<article class="card"><h3>${esc(firm.name)}</h3><p>Your firm claim is recorded. The firm profile remains read-only until identity and authority review is completed.</p></article>`).join('')}</section>`:''}
      ${manualFirmCreationCard()}
      <section id="professional-firms"><p class="eyebrow">Firm management</p><h2>Your firm accounts</h2>${data.firms.map(firm=>firmEditor(firm)+portalPresenceCards(data,'firm',firm)).join('')||'<div class="card"><p>No approved firm profile is linked to this login.</p><a class="secondary button-link" href="/professionals.html">Find a Firm Profile</a></div>'}</section>
      <div id="professional-security">${professionalSecurityCard(data.account)}</div>
      ${professionalCommunicationCard(data.account)}
      <div id="professional-billing">${membershipCard}</div>
      ${opportunityStatusCard(data)}
      <section class="card"><h2>Profile and correction requests</h2>${(data.profileRequests||[]).map(request=>`<p><strong>${esc(titleCase(request.requestType))}</strong> — ${esc(titleCase(request.status))}</p>`).join('')||'<p>No open profile or correction requests.</p>'}</section>
      ${pilot.ok?pilotSupportCard(pilot):supportCard()}`;


    $('#manualProfessionalProfileForm')?.addEventListener('submit',async event=>{
      event.preventDefault(); const form=event.currentTarget; const fd=new FormData(form); const body=Object.fromEntries(fd.entries());
      for(const key of ['jurisdictions','practiceAreas','languages','serviceRegions'])body[key]=list(body[key]); body.portalEligibility=fd.getAll('portalEligibility').filter(Boolean);
      const response=await api('/api/professional/profiles',{method:'POST',body:JSON.stringify(body)}); formMessage(form,response.message||response.error,response.ok?'success':'error'); if(response.ok)setTimeout(()=>location.reload(),500);
    });
    $('#manualFirmWorkspaceForm')?.addEventListener('submit',async event=>{
      event.preventDefault(); const form=event.currentTarget; const fd=new FormData(form); const body=Object.fromEntries(fd.entries());
      for(const key of ['jurisdictions','practiceAreas','languages','serviceRegions'])body[key]=list(body[key]); body.portalEligibility=fd.getAll('portalEligibility').filter(Boolean); body.seatCount=Math.max(1,Math.min(500,Number(body.seatCount)||1));
      const response=await api('/api/professional/firms',{method:'POST',body:JSON.stringify(body)}); formMessage(form,response.message||response.error,response.ok?'success':'error'); if(response.ok)setTimeout(()=>location.reload(),500);
    });
    bindProfileDirtyState();
    bindMembershipQuote(data);
    $$('.portalSpecificProfileEdit').forEach(form=>{
      form.addEventListener('input',()=>{const bar=form.querySelector('.profile-save-bar');bar?.classList.add('dirty');const state=bar?.querySelector('.save-state');if(state)state.textContent='Unsaved portal-specific changes.';});
      form.addEventListener('submit',async event=>{
        event.preventDefault();const submit=form.querySelector('button[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Saving specialty details…';}
        const fd=new FormData(form);const body=Object.fromEntries(fd.entries());for(const key of ['practiceAreas','matterTypes','geographicServiceAreas','languages','consultationPreferences','contactPreferences','qualifications','specialtyEvidence'])body[key]=list(body[key]);body.expectedRevision=Number(body.expectedRevision||1);
        const endpoint=`/api/professional/portal-profiles/${encodeURIComponent(form.dataset.targetKind)}/${encodeURIComponent(form.dataset.targetId)}/${encodeURIComponent(form.dataset.portalId)}`;
        const response=await api(endpoint,{method:'POST',body:JSON.stringify(body)});formMessage(form,response.message||response.error,response.ok?'success':'error');if(response.ok)setTimeout(()=>location.reload(),500);else if(submit){submit.disabled=false;submit.textContent='Save Portal Details';}
      });
      form.querySelector('.portalSpecificSubmitReview')?.addEventListener('click',async event=>{
        if(!confirm('Submit this exact portal-specific revision for specialty review? Nothing will be published or charged.'))return;const button=event.currentTarget;button.disabled=true;button.textContent='Submitting…';const expectedRevision=Number(form.elements.expectedRevision.value||1);
        const endpoint=`/api/professional/portal-profiles/${encodeURIComponent(form.dataset.targetKind)}/${encodeURIComponent(form.dataset.targetId)}/${encodeURIComponent(form.dataset.portalId)}/submit-review`;
        const response=await api(endpoint,{method:'POST',body:JSON.stringify({expectedRevision})});formMessage(form,response.message||response.error,response.ok?'success':'error');if(response.ok)setTimeout(()=>location.reload(),500);else{button.disabled=false;button.textContent='Submit Exact Revision';}
      });
    });
    $$('.professionalProfileEdit').forEach(form=>form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!form.reportValidity())return;
      const submit=form.querySelector('button[type="submit"],button:not([type])');
      if(submit){submit.disabled=true;submit.textContent='Saving profile…';}
      const formData=new FormData(form);
      const body=Object.fromEntries(formData.entries());
      for(const key of ['officeLocations','jurisdictions','practiceAreas','languages','serviceRegions'])body[key]=list(body[key]);
      body.credentials=[{credentialType:body.credentialType,credentialJurisdiction:body.credentialJurisdiction,jurisdiction:body.credentialJurisdiction,credentialIdentifier:body.credentialIdentifier,identifier:body.credentialIdentifier,verificationSource:body.credentialVerificationSource}];
      body.consultationModes=formData.getAll('consultationModes').filter(Boolean);
      body.serviceRoles=formData.getAll('serviceRoles').filter(Boolean);
      body.portalEligibility=formData.getAll('portalEligibility').filter(Boolean);
      const response=await api('/api/professional/profiles/'+encodeURIComponent(form.dataset.id),{method:'POST',body:JSON.stringify(body)});
      formMessage(form,response.ok?'Profile changes saved. Public-source facts and reviewed status remain separately controlled.':response.error,response.ok?'success':'error');
      if(response.ok){const bar=form.querySelector('.profile-save-bar');bar?.classList.remove('dirty');const state=bar?.querySelector('.save-state');if(state)state.textContent='All changes saved.';}
      if(submit){submit.disabled=false;submit.textContent='Save Professional Profile';}
    }));
    $$('.profileSubmitReview').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Submit the current saved profile revision for identity, credential, and portal review? Nothing will be published or charged.'))return;
      button.disabled=true; button.textContent='Submitting…';
      const response=await api('/api/professional/profiles/'+encodeURIComponent(button.dataset.id)+'/submit-review',{method:'POST'});
      notice(button.closest('form')?.querySelector('.form-result')||$('#professionalDashboardWorkspace'),response.message||response.error,response.ok?'success':'error');
      if(response.ok)setTimeout(()=>location.reload(),600); else {button.disabled=false;button.textContent='Submit Current Revision for Review';}
    }));
    $$('.firmSubmitReview').forEach(button=>button.addEventListener('click',async()=>{
      if(!confirm('Submit the current saved firm revision for authority and portal review? Nothing will be published or charged.'))return;
      button.disabled=true; button.textContent='Submitting…';
      const response=await api('/api/professional/firms/'+encodeURIComponent(button.dataset.id)+'/submit-review',{method:'POST'});
      notice(button.closest('form')?.querySelector('.form-result')||$('#professionalDashboardWorkspace'),response.message||response.error,response.ok?'success':'error');
      if(response.ok)setTimeout(()=>location.reload(),600); else {button.disabled=false;button.textContent='Submit Firm for Review';}
    }));
    $$('.professionalFirmEdit').forEach(form=>form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!form.reportValidity())return;
      const submit=form.querySelector('button[type="submit"],button:not([type])');
      if(submit){submit.disabled=true;submit.textContent='Saving firm…';}
      const formData=new FormData(form);
      const body=Object.fromEntries(formData.entries());
      body.locations=list(body.locations); body.jurisdictions=list(body.jurisdictions); body.practiceAreas=list(body.practiceAreas); body.languages=list(body.languages); body.serviceRegions=list(body.serviceRegions); body.portalEligibility=formData.getAll('portalEligibility').filter(Boolean); body.seatCount=Math.max(1,Math.min(500,Number(body.seatCount)||1));
      const response=await api('/api/professional/firms/'+encodeURIComponent(form.dataset.id),{method:'POST',body:JSON.stringify(body)});
      formMessage(form,response.ok?'Firm settings saved. Individual professional credentials and portal assignments remain separate.':response.error,response.ok?'success':'error');
      if(response.ok){const bar=form.querySelector('.profile-save-bar');bar?.classList.remove('dirty');const state=bar?.querySelector('.save-state');if(state)state.textContent='All changes saved.';}
      if(submit){submit.disabled=false;submit.textContent='Save Firm Settings';}
    }));
    $$('.firmProfessionalAdd').forEach(form=>form.addEventListener('submit',async event=>{
      event.preventDefault();
      const formData=new FormData(form);
      const body=Object.fromEntries(formData.entries());
      body.practiceAreas=list(body.practiceAreas);
      body.jurisdictions=list(body.jurisdictions);
      body.languages=list(body.languages);
      body.serviceRegions=list(body.serviceRegions);
      body.consultationModes=formData.getAll('consultationModes').filter(Boolean);
      body.serviceRoles=formData.getAll('serviceRoles').filter(Boolean);
      body.portalEligibility=formData.getAll('portalEligibility').filter(Boolean);
      const response=await api('/api/professional/firms/'+encodeURIComponent(form.dataset.id)+'/professionals',{method:'POST',body:JSON.stringify(body)});
      if(response.ok){formMessage(form,'Professional profile added to the firm workspace.','success');setTimeout(()=>location.reload(),450);}else formMessage(form,response.error||'The professional profile could not be added.','error');
    }));
    $('#pilotApplicationForm')?.addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,fd=new FormData(form),[targetKind,targetId]=String(fd.get('target')).split('|');const body=Object.fromEntries(fd.entries());body.targetKind=targetKind;body.targetId=targetId;body.seatCount=Number(body.seatCount||1);body.professionalTypes=list(body.professionalTypes);body.portalInterests=fd.getAll('portalInterests');for(const key of ['acceptMembershipTerms','acceptPrivacy','acceptRecurringBilling','acceptNoGuarantees','acceptIndependentProfessional','acceptConflicts'])body[key]=fd.has(key);body.idempotencyKey=crypto.randomUUID?.()||String(Date.now());const response=await api('/api/professional/pilot-program/application/submit',{method:'POST',body:JSON.stringify(body)});notice($('#pilotApplicationResult'),response.message||response.error,response.ok?'success':'error');if(response.ok)setTimeout(()=>location.reload(),650);});
    $('#pilotSaveApplication')?.addEventListener('click',async()=>{const form=$('#pilotApplicationForm'),fd=new FormData(form),[targetKind,targetId]=String(fd.get('target')).split('|');const body=Object.fromEntries(fd.entries());body.targetKind=targetKind;body.targetId=targetId;body.seatCount=Number(body.seatCount||1);body.professionalTypes=list(body.professionalTypes);body.portalInterests=fd.getAll('portalInterests');body.idempotencyKey=crypto.randomUUID?.()||String(Date.now());const response=await api('/api/professional/pilot-program/application/save',{method:'POST',body:JSON.stringify(body)});notice($('#pilotApplicationResult'),response.ok?'Application draft saved.':response.error,response.ok?'success':'error');});
    $('#pilotWithdrawApplication')?.addEventListener('click',async()=>{if(!confirm('Withdraw this unpaid membership application?'))return;const response=await api('/api/professional/pilot-program/application/withdraw',{method:'POST',body:JSON.stringify({idempotencyKey:crypto.randomUUID?.()||String(Date.now())})});notice($('#pilotApplicationResult'),response.message||response.error,response.ok?'success':'error');if(response.ok)setTimeout(()=>location.reload(),650);});
    $('#pilotSupportForm')?.addEventListener('submit',async event=>{event.preventDefault();const body=Object.fromEntries(new FormData(event.currentTarget));body.idempotencyKey=crypto.randomUUID?.()||String(Date.now());const response=await api('/api/professional/pilot-program/support',{method:'POST',body:JSON.stringify(body)});notice($('#pilotSupportResult'),response.message||response.error,response.ok?'success':'error');if(response.ok)event.currentTarget.reset();});
    $('#professionalCommunicationForm')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const form=event.currentTarget;
      const body={preferredLanguage:form.elements.preferredLanguage.value,profileAndDirectoryUpdates:form.elements.profileAndDirectoryUpdates.checked,membershipAndProgramUpdates:form.elements.membershipAndProgramUpdates.checked,researchAndFeedbackInvitations:form.elements.researchAndFeedbackInvitations.checked};
      const response=await api('/api/professional/communication-preferences',{method:'POST',body:JSON.stringify(body)});
      notice($('#professionalCommunicationResult'),response.message||response.error,response.ok?'success':'error');
    });
    $('#membershipCheckoutForm')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const form=event.currentTarget;
      if(!form.reportValidity())return;
      const submit=form.querySelector('button[type="submit"],button:not([type])');
      const formData=new FormData(form);
      const [kind,id,planId,seatCount]=String(formData.get('target')).split('|');
      const idempotencyKey=crypto.randomUUID?.()||`membership-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      if(submit){submit.disabled=true;submit.textContent='Opening Stripe Checkout…';}
      const body={kind,id,planId,seatCount:Number(seatCount),billingCadence:formData.get('billingCadence'),acceptMembershipTerms:formData.has('acceptMembershipTerms'),acceptRecurringBilling:formData.has('acceptRecurringBilling'),acceptCancellationPolicy:formData.has('acceptCancellationPolicy'),acceptNoGuarantees:formData.has('acceptNoGuarantees'),idempotencyKey};
      const response=await api('/api/professional/membership/checkout',{method:'POST',headers:{'Idempotency-Key':idempotencyKey},body:JSON.stringify(body)});
      if(response.checkoutUrl){location.href=response.checkoutUrl;return;}
      notice($('#membershipCheckoutResult'),response.message||response.error||'Secure checkout is not available.',response.ok?'success':'error');
      if(submit){submit.disabled=false;submit.textContent='Continue to Secure Checkout';}
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
