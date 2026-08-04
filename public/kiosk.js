(()=>{
  const params=new URLSearchParams(location.search);
  const campaign=params.get('campaign')||'DBK-COURTS-PUBLIC';
  const staff=params.get('staff')||'';
  const asset=params.get('asset')||'';
  const sessionKey=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;
  const status=document.getElementById('kioskStatus');
  const locationLine=document.getElementById('kioskLocationLine');
  const withTracking=(href,lane)=>{const u=new URL(href,location.origin);u.searchParams.set('campaign',campaign);u.searchParams.set('source','nyc-field-launch');if(staff)u.searchParams.set('staff',staff);if(asset)u.searchParams.set('asset',asset);if(lane)u.searchParams.set('lane',lane);return u.pathname+u.search+u.hash;};
  const record=async(eventType,lane,notes='')=>{try{await fetch('/api/public/field-launch/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventType,campaignCode:campaign,lane,channel:'kiosk',staffCode:staff,assetCode:asset,idempotencyKey:`${sessionKey}:${eventType}:${lane}`,notes})});}catch{}}
  async function init(){
    const data=await fetch('/api/public/field-launch/config?campaign='+encodeURIComponent(campaign)).then(r=>r.json()).catch(()=>({ok:false}));
    if(data.ok&&data.available){
      if(locationLine)locationLine.textContent=`${data.location?.area||'NYC'}: free guided starting help for the public and a professional account and profile network for attorneys, tax professionals, and firms.`;
      if(status){status.textContent=data.laneEnabled?'This Smarter Justice starting station is available.':'This starting station is not open right now. You can still use the main Smarter Justice website.';status.classList.toggle('ready',Boolean(data.laneEnabled));}
    }else if(status)status.textContent='Use the ordinary Smarter Justice website paths below.';
    const publicStart=document.getElementById('kioskPublicStart');if(publicStart){publicStart.href=withTracking('/#public-start','public');publicStart.addEventListener('click',()=>record('public-start-click','public'));}
    const proStart=document.getElementById('kioskProfessionalStart');if(proStart){proStart.href=withTracking('/professional-membership.html','professional');proStart.addEventListener('click',()=>record('professional-start-click','professional'));}
    const proApply=document.getElementById('kioskProfessionalApply');if(proApply){proApply.href=withTracking('/professional-signup.html','professional');proApply.addEventListener('click',()=>record('professional-application-started','professional'));}
    record('kiosk-view',data?.campaign?.lane||'mixed');
  }
  init();
})();
