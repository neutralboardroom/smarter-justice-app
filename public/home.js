(function(){
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const friendly=value=>String(value||'').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const launchQuery=new URLSearchParams(location.search);
  const launchCampaign=String(launchQuery.get('campaign')||'').trim().toUpperCase().replace(/[^A-Z0-9_-]+/g,'-').slice(0,80);
  const recordLaunchEvent=(eventType,portalId='')=>launchCampaign&&fetch('/api/public/launch-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({campaignCode:launchCampaign,eventType,portalId,audience:'public'})}).catch(()=>{});
  recordLaunchEvent('landing-view');

  function networkGroup(item){
    if(item.isLive || ['live verified','separate live platform'].includes(item.deploymentStatus)) return 'live';
    if(['development package','staging','deployed unverified'].includes(item.deploymentStatus) || ['testing','in development'].includes(item.portalStatus)) return 'building';
    return 'planned';
  }
  function networkStatus(item){
    const group=networkGroup(item);
    if(group==='live') return item.deploymentStatus==='separate live platform' ? 'Available on its own website' : 'Available now';
    if(group==='building') return 'Being prepared';
    return 'Planned';
  }
  function participationText(value){
    const labels={
      'not open':'Not available yet','applications only':'Enrollment availability varies','pilot paused':'Enrollment paused',
      'controlled pilot':'Limited enrollment','open':'Available','not applicable':'Not applicable'
    };
    return labels[value]||friendly(value||'not open');
  }
  function renderDomainCard(item){
    const group=networkGroup(item);
    const portalSlug=item.participationPortalSlug||item.portalSlug||'general-smarter-justice-start';
    const interestHref=`/professional-signup.html?campaign=DOMAIN-NETWORK&portal=${encodeURIComponent(portalSlug)}`;
    const liveAction=item.liveUrl?`<a class="secondary link-btn" href="${esc(item.liveUrl)}" rel="noopener">Visit Website</a>`:`<a class="secondary link-btn" href="/professional-membership.html">Participation Details</a>`;
    return `<article class="domain-network-card" data-domain-group="${group}">
      <div class="domain-card-top"><span class="network-status ${group}">${esc(networkStatus(item))}</span><span class="official-domain-mark">Official Smarter Justice domain</span></div>
      <h3>${esc(item.brandName)}</h3>
      <p class="domain-name">${esc(item.domain)}</p>
      <p>${esc(item.publicSummary||'A focused portal in the Smarter Justice network.')}</p>
      <dl class="domain-card-facts">
        <div><dt>Domain</dt><dd>${item.ownershipStatus==='owned'?'Official network domain':esc(friendly(item.ownershipStatus))}</dd></div>
        <div><dt>Focused service</dt><dd>${esc(networkStatus(item))}</dd></div>
        <div><dt>Website</dt><dd>${esc(networkStatus(item))}</dd></div>
        <div><dt>Professional participation</dt><dd>${esc(participationText(item.professionalParticipationStatus))}</dd></div>
      </dl>
      <div class="domain-card-actions">${liveAction}<a class="primary link-btn" href="${esc(interestHref)}">Add to My Interests</a></div>
    </article>`;
  }
  async function loadDomainNetwork(){
    const grid=document.getElementById('domainNetworkGrid');
    if(!grid)return;
    const summary=document.getElementById('domainNetworkSummary');
    try{
      const response=await fetch('/api/public/domain-network',{headers:{'Accept':'application/json'}});
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data.error||'The portal information is temporarily unavailable.');
      const stats=data.summary||{};
      summary.innerHTML=`<div><strong>${esc(stats.officialDomains||data.domains.length)}</strong><span>Focused websites</span></div><div><strong>${esc(stats.liveWebsites||0)}</strong><span>Available now</span></div><div><strong>${esc(stats.inDevelopment||0)}</strong><span>Being prepared</span></div><div><strong>${esc(stats.planned||0)}</strong><span>Planned</span></div>`;
      grid.innerHTML=(data.domains||[]).map(renderDomainCard).join('')||'<p class="fine-print">No official domains are currently published.</p>';
      document.querySelectorAll('[data-domain-filter]').forEach(button=>button.addEventListener('click',()=>{
        const filter=button.dataset.domainFilter;
        document.querySelectorAll('[data-domain-filter]').forEach(x=>x.classList.toggle('active',x===button));
        grid.querySelectorAll('[data-domain-group]').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.domainGroup!==filter;});
      }));
    }catch(error){
      summary.innerHTML='';
      grid.innerHTML=`<div class="notice"><strong>Portal information unavailable</strong><p>${esc(error.message)}</p><p><a href="/portals.html">Review public starting paths</a></p></div>`;
    }
  }

  async function loadPublicServiceInitiatives(){
    const section=document.getElementById('stopDomesticViolenceInitiative');
    if(!section)return;
    try{
      const response=await fetch('/api/public-config',{headers:{'Accept':'application/json'}});
      const data=await response.json();
      const initiative=data?.publicServiceInitiatives?.stopDomesticViolence;
      if(!response.ok||!initiative?.configured)return;
      const link=document.getElementById('stopDomesticViolenceLink');
      const artwork=document.getElementById('stopDomesticViolenceArtwork');
      link.href=initiative.siteUrl;
      link.textContent='Visit StopSignProject.org';
      artwork.src=initiative.artworkPath;
      section.hidden=false;
    }catch{}
  }

  const form=document.getElementById('storyRouteForm');
  if(form){
    const textarea=document.getElementById('storyRouteQuestion');
    const counter=document.getElementById('storyRouteCounter');
    const result=document.getElementById('storyRouteResult');
    function updateCounter(){counter.textContent=`${Math.max(0,2500-textarea.value.length)} characters left`;}
    function portalAction(portal){
      if(!portal)return '';
      const open=portal.publicUrl && (portal.status==='Live — Separate Platform'||portal.status==='Available Now');
      const href=open?portal.publicUrl:`/portal-router.html?portal=${encodeURIComponent(portal.slug)}`;
      const label=open?(portal.slug==='general-smarter-justice-start'?'Review this path':'Open focused portal'):'Learn about this path';
      return `<a class="secondary link-btn" href="${esc(href)}">${esc(label)}</a>`;
    }
    function render(data){
      const related=(data.relatedPortals||[]).map(portal=>`<article><h4>${esc(portal.name)}</h4><p>${esc(portal.availabilityMessage||'This may be another relevant path.')}</p>${portalAction(portal)}</article>`).join('');
      const urgency=(data.urgentConcerns||[]).length?`<div class="routing-alert"><strong>Possible time-sensitive issue</strong><ul>${data.urgentConcerns.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><p>Confirm every deadline directly with the court, agency, notice, or a qualified professional.</p></div>`:'';
      const details=(data.helpfulDetails||[]).length?`<details><summary>Details that could improve the next step</summary><ul>${data.helpfulDetails.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></details>`:'';
      result.className='story-route-result success';
      result.innerHTML=`<p class="eyebrow">Suggested primary starting point</p><h3>${esc(data.primaryPortal?.name||data.practice?.name||'Smarter Justice General Start')}</h3><p>${esc(data.primaryPortal?.userRouteMessage||data.primaryPortal?.availabilityMessage||'Review this starting direction and decide how you want to continue.')}</p><div class="result-actions">${portalAction(data.primaryPortal)}<a class="primary link-btn" href="/professionals.html">Find Professionals</a><a class="text-link" href="/upload-notice.html">Describe a Notice</a></div>${urgency}${related?`<div class="related-route-block"><h4>Other paths that may also be relevant</h4><div class="related-route-grid">${related}</div></div>`:''}${details}<p class="routing-result-disclosure">${esc(data.message)} ${esc(data.disclosure)}</p>`;
      result.hidden=false;
      result.scrollIntoView({behavior:'smooth',block:'nearest'});
    }
    document.querySelectorAll('[data-story-example]').forEach(button=>button.addEventListener('click',()=>{
      textarea.value=button.dataset.storyExample||'';
      updateCounter();
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length,textarea.value.length);
    }));
    textarea.addEventListener('input',updateCounter);
    updateCounter();
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const question=textarea.value.trim();
      result.hidden=false;
      if(question.length<20){result.className='story-route-result error';result.innerHTML='<p>Please add a little more detail so we can identify a useful starting direction.</p>';textarea.focus();return;}
      const button=form.querySelector('button[type="submit"]');
      const original=button.textContent;button.disabled=true;button.textContent='Finding your starting point…';
      result.className='story-route-result loading';result.innerHTML='<p>Reviewing your description to suggest a starting point…</p>';
      try{
        const response=await fetch('/api/public/story-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,practiceArea:new URLSearchParams(location.search).get('practice')||''})});
        const data=await response.json();
        if(!response.ok||!data.ok)throw new Error(data.error||'The starting-point tool is temporarily unavailable.');
        render(data);
        recordLaunchEvent('public-start-submitted');
        recordLaunchEvent('portal-direction-shown',data.primaryPortal?.slug||'');
      }catch(error){result.className='story-route-result error';result.innerHTML=`<p>${esc(error.message)}</p><p><a href="/portals.html">Browse focused portals instead</a></p>`;}
      button.disabled=false;button.textContent=original;
    });
  }

  loadDomainNetwork();
  loadPublicServiceInitiatives();
})();
