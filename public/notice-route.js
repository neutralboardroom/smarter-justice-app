(function(){
  const form=document.getElementById('noticeRouteForm');
  if(!form)return;
  const question=document.getElementById('noticeQuestion');
  const counter=document.getElementById('noticeCounter');
  const practice=document.getElementById('noticePracticeArea');
  const result=document.getElementById('noticeRouteResult');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const list=value=>String(value||'').trim();
  const updateCounter=()=>{counter.textContent=`${Math.max(0,2500-question.value.length)} characters left`;};
  function portalAction(portal){
    if(!portal)return '';
    const open=portal.publicUrl&&(portal.status==='Live — Separate Platform'||portal.status==='Available Now');
    const href=open?portal.publicUrl:`/portal-router.html?portal=${encodeURIComponent(portal.slug)}`;
    return `<a class="secondary link-btn" href="${esc(href)}">${open?'Open this path':'Learn about this path'}</a>`;
  }
  function render(data){
    const related=(data.relatedPortals||[]).map(portal=>`<article><h4>${esc(portal.name)}</h4><p>${esc(portal.availabilityMessage||'This may be another relevant path.')}</p>${portalAction(portal)}</article>`).join('');
    const urgency=(data.urgentConcerns||[]).length?`<div class="routing-alert"><strong>Possible time-sensitive issue</strong><ul>${data.urgentConcerns.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><p>Confirm every date directly with the sender, court, agency, or a qualified professional.</p></div>`:'';
    result.className='story-route-result success';
    result.innerHTML=`<p class="eyebrow">Suggested primary starting point</p><h3>${esc(data.primaryPortal?.name||data.practice?.name||'Smarter Justice General Start')}</h3><p>${esc(data.primaryPortal?.userRouteMessage||data.primaryPortal?.availabilityMessage||'Review this starting direction and decide how you want to continue.')}</p>${portalAction(data.primaryPortal)}${urgency}${related?`<div class="related-route-block"><h4>Other paths that may also be relevant</h4><div class="related-route-grid">${related}</div></div>`:''}<p class="routing-result-disclosure">${esc(data.message)} ${esc(data.disclosure)}</p>`;
    result.hidden=false;
    result.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  fetch('/api/practice-areas').then(response=>response.json()).then(data=>{
    (data.practiceAreas||[]).forEach(item=>{const option=document.createElement('option');option.value=item.slug;option.textContent=item.name;practice.appendChild(option);});
    const requested=new URLSearchParams(location.search).get('practice');
    if(requested&&[...practice.options].some(option=>option.value===requested))practice.value=requested;
  }).catch(()=>{});
  question.addEventListener('input',updateCounter);updateCounter();
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const fields=new FormData(form);
    const details=[list(fields.get('documentType'))&&`Document type: ${list(fields.get('documentType'))}`,list(fields.get('sender'))&&`Sender: ${list(fields.get('sender'))}`,list(fields.get('dateReceived'))&&`Received: ${list(fields.get('dateReceived'))}`,list(fields.get('deadlineDate'))&&`Date shown: ${list(fields.get('deadlineDate'))}`,list(fields.get('location'))&&`Location: ${list(fields.get('location'))}`].filter(Boolean);
    const combined=`${question.value.trim()}${details.length?`\n\n${details.join('\n')}`:''}`;
    if(combined.length<20){question.focus();return;}
    const button=form.querySelector('button[type="submit"]');const original=button.textContent;button.disabled=true;button.textContent='Finding a starting path…';
    result.hidden=false;result.className='story-route-result loading';result.innerHTML='<p>Reviewing the redacted description without creating a saved file…</p>';
    try{
      const response=await fetch('/api/public/story-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:combined,practiceArea:practice.value})});
      const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'The starting-point tool is temporarily unavailable.');render(data);
    }catch(error){result.className='story-route-result error';result.innerHTML=`<p>${esc(error.message)}</p><p><a href="/portals.html">Browse focused portals instead</a></p>`;}
    button.disabled=false;button.textContent=original;
  });
})();
