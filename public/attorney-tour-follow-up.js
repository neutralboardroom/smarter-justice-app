(()=>{
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const params=new URLSearchParams(location.search);
  const requested=params.get('practice')||'divorce';

  function render(data){
    const selected=data.selected||{};
    const field=data.fieldKit||{};
    const label=selected.label||selected.portalName||'practice-relevant';
    document.title=`${label} Attorney Tour Follow-Up | Smarter Justice`;
    $('#followUpTitle').textContent=`Continue the ${label} tour`;
    $('#followUpPractice').textContent=label;
    $('#followUpSummary').textContent=`Review the Smarter Justice model, ${selected.portalName||'the relevant specialty portal'}, a synthetic profile example, one public tool, and the central professional-management story.`;
    $('#followUpShortPath').textContent=`smarterjustice.com${field.shortPath||'/attorney-tour'}`;
    $('#followUpQr').src=field.qrAsset||'/images/attorney-tour/divorce.svg';
    $('#followUpQr').alt=`QR code for the ${label} Attorney Partner Tour`;
    $('#openPracticeTour').href=field.shortPath||'/attorney-tour';
    $('#returnToTour').href=`/attorney-partner-tour.html?practice=${encodeURIComponent(selected.query||'divorce')}`;
  }

  async function load(){
    try{
      const response=await fetch(`/api/public/attorney-partner-tour?practice=${encodeURIComponent(requested)}`,{headers:{Accept:'application/json'}});
      const body=await response.json();
      if(!response.ok||!body.ok)throw new Error(body.error||'The follow-up card could not be prepared.');
      render(body.tour);
    }catch{
      $('#followUpTitle').textContent='Continue the Smarter Justice Attorney Partner Tour';
    }
  }

  $('#printFollowUp')?.addEventListener('click',()=>window.print());
  load();
})();
