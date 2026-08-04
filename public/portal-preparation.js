(()=>{
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clean=value=>String(value??'').replace(/\r/g,'').trim();
  const lines=value=>clean(value).split('\n').map(item=>item.trim()).filter(Boolean);
  const safeFile=value=>String(value||'smarter-justice-portal-preparation').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'smarter-justice-portal-preparation';
  const state={portals:[],selected:null,pack:null,text:''};
  function portalCanOpen(portal){return Boolean(portal?.publicUrl)&&portal.publicUrl!=='/'&&/Live|Available/.test(portal.status||'');}
  function renderScope(){
    const portal=state.selected;const panel=$('#portalPreparationScope');
    if(!portal){panel.innerHTML='<strong>Choose a portal</strong><p>The portal’s public scope and current availability will appear here.</p>';return;}
    const action=portalCanOpen(portal)?`Separate website: ${portal.publicUrl}`:'Continue through Smarter Justice or retain the pack until the focused website is available.';
    panel.innerHTML=`<strong>${esc(portal.name)}</strong><p>${esc(portal.summary||'')}</p><p><strong>Current availability:</strong> ${esc(portal.availabilityMessage||portal.status||'Availability varies')}</p><p><strong>Suggested next step:</strong> ${esc(action)}</p>`;
  }
  function serialize(form){
    const data=new FormData(form);const portal=state.selected;
    const materials=data.getAll('materials').map(clean).filter(Boolean);
    const pack={
      schemaVersion:'1.0.0',
      createdAt:new Date().toISOString(),
      generator:'Smarter Justice device-only Portal Preparation Pack',
      portal:{slug:portal.slug,name:portal.name,status:portal.status,availabilityMessage:portal.availabilityMessage||'',publicUrl:portal.publicUrl||'',summary:portal.summary||'',helpsWith:portal.helpsWith||[],disclosure:portal.disclosure||''},
      userConfirmed:{jurisdiction:clean(data.get('jurisdiction')),locality:clean(data.get('locality')),knownDateOrEvent:clean(data.get('knownDate')),userChosenTargetDate:clean(data.get('targetDate')),materials,summary:clean(data.get('summary')),questions:lines(data.get('questions')),goal:clean(data.get('goal')),accessLanguageSafetyOrCommunicationNeeds:clean(data.get('needs'))},
      boundaries:['No server upload or account storage','No AI analysis','No legal-deadline calculation','No professional contact, lead, booking, routing, filing, or relationship creation','User must review and edit before sharing']
    };
    const text=[
      'SMARTER JUSTICE PORTAL PREPARATION PACK',
      `Created locally: ${new Date(pack.createdAt).toLocaleString()}`,
      '',
      `FOCUSED PORTAL: ${portal.name}`,
      `Portal status: ${portal.status||'Availability varies'}`,
      `Availability: ${portal.availabilityMessage||''}`,
      portal.publicUrl?`Public URL: ${portal.publicUrl}`:'Public URL: Separate focused website not currently available from this tool.',
      `Scope: ${portal.summary||''}`,
      portal.helpsWith?.length?`Helps with: ${portal.helpsWith.join('; ')}`:'',
      `Important portal limit: ${portal.disclosure||'Review current portal terms and limits before continuing.'}`,
      '',
      'LOCATION AND TIMING CONFIRMED BY USER',
      `State or jurisdiction: ${pack.userConfirmed.jurisdiction||'Not entered'}`,
      `County, city, or agency: ${pack.userConfirmed.locality||'Not entered'}`,
      `Known date or event: ${pack.userConfirmed.knownDateOrEvent||'Not entered'}`,
      `User-chosen planning date: ${pack.userConfirmed.userChosenTargetDate||'Not entered'} (not a calculated legal deadline)`,
      '',
      'MATERIALS THE USER SAYS THEY HAVE',
      ...(materials.length?materials.map(item=>`- ${item}`):['- None selected']),
      '',
      'CONFIRMED SITUATION SUMMARY',
      pack.userConfirmed.summary||'Not entered',
      '',
      'QUESTIONS TO ADDRESS',
      ...(pack.userConfirmed.questions.length?pack.userConfirmed.questions.map(item=>`- ${item}`):['- None entered']),
      '',
      'DESIRED OUTCOME OR NEXT STEP',
      pack.userConfirmed.goal||'Not entered',
      '',
      'ACCESS, LANGUAGE, SAFETY, OR COMMUNICATION NEEDS',
      pack.userConfirmed.accessLanguageSafetyOrCommunicationNeeds||'Not entered',
      '',
      'BOUNDARIES',
      ...pack.boundaries.map(item=>`- ${item}`),
      '',
      'Review this pack for accuracy. Remove unnecessary sensitive information before sharing it with anyone.'
    ].filter((line,index,array)=>!(line===''&&array[index-1]==='')).join('\n');
    return {pack,text};
  }
  function download(filename,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);}
  async function loadPortals(){
    const select=$('#portalPreparationPortal');
    try{
      const response=await fetch('/api/portals').then(result=>result.json());
      if(!response.ok)throw new Error(response.error||'Could not load portal choices.');
      state.portals=(response.portals||[]).filter(portal=>portal.publicVisible!==false);
      select.innerHTML='<option value="">Choose a focused portal</option>'+state.portals.map(portal=>`<option value="${esc(portal.slug)}">${esc(portal.name)} — ${esc(portal.status)}</option>`).join('');
    }catch(error){select.innerHTML='<option value="">Portal choices unavailable</option>';$('#portalPreparationStatus').textContent=error.message;}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    loadPortals();
    $('#portalPreparationPortal')?.addEventListener('change',event=>{state.selected=state.portals.find(portal=>portal.slug===event.target.value)||null;renderScope();});
    $('#portalPreparationForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      if(!state.selected){$('#portalPreparationStatus').textContent='Choose a focused portal first.';return;}
      const result=serialize(event.currentTarget);state.pack=result.pack;state.text=result.text;
      $('#portalPreparationOutputTitle').textContent=`${state.selected.name} preparation pack`;
      $('#portalPreparationOutputIntro').textContent='Review every line before downloading or sharing it.';
      const output=$('#portalPreparationOutput');output.hidden=false;output.textContent=state.text;
      $('#portalPreparationDownloads').hidden=false;$('#portalPreparationStatus').textContent='Preparation pack built locally in this browser tab.';
    });
    $('#clearPortalPreparation')?.addEventListener('click',()=>{const form=$('#portalPreparationForm');form.reset();state.selected=null;state.pack=null;state.text='';renderScope();$('#portalPreparationOutput').hidden=true;$('#portalPreparationOutput').textContent='';$('#portalPreparationDownloads').hidden=true;$('#portalPreparationOutputTitle').textContent='Your preparation pack will appear here.';$('#portalPreparationOutputIntro').textContent='Complete the form and choose “Build preparation pack.”';$('#portalPreparationStatus').textContent='Cleared from this page.';});
    $('#downloadPortalPreparationText')?.addEventListener('click',()=>{if(state.text)download(`${safeFile(state.selected?.name)}-preparation-pack.txt`,state.text,'text/plain;charset=utf-8');});
    $('#downloadPortalPreparationJson')?.addEventListener('click',()=>{if(state.pack)download(`${safeFile(state.selected?.name)}-preparation-pack.json`,JSON.stringify(state.pack,null,2),'application/json;charset=utf-8');});
    $('#copyPortalPreparation')?.addEventListener('click',async()=>{if(!state.text)return;try{await navigator.clipboard.writeText(state.text);$('#portalPreparationStatus').textContent='Copied to the clipboard.';}catch{$('#portalPreparationStatus').textContent='Copy was unavailable. Select the text manually.';}});
  });
})();
