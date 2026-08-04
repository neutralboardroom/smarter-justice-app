(function(){
  function setText(selector,value){document.querySelectorAll(selector).forEach(node=>{node.textContent=value;});}
  function updateCtas(open){
    document.querySelectorAll('[data-professional-program-cta]').forEach(link=>{
      link.textContent=open?(link.dataset.openLabel||'Apply for Membership'):(link.dataset.pausedLabel||'Create Professional Account');
      link.setAttribute('aria-label',open?'Apply for professional membership':'Create a professional account and prepare a profile');
    });
  }
  async function load(){
    try{
      const response=await fetch('/api/professional-program-status',{headers:{Accept:'application/json'}});
      const data=await response.json();
      if(!response.ok||!data.ok)return;
      document.body.dataset.professionalApplications=data.applicationsOpen?'open':'paused';
      setText('[data-professional-program-headline]',data.headline||'Professional accounts and profile preparation are available; paid membership applications are not open yet.');
      setText('[data-professional-program-explanation]',data.explanation||'Professionals may create an account and prepare or claim a profile now.');
      setText('[data-professional-program-payment]',data.paymentExplanation||'No membership payment is available or collected while enrollment remains closed.');
      updateCtas(Boolean(data.applicationsOpen));
    }catch{
      updateCtas(false);
    }
  }
  document.addEventListener('DOMContentLoaded',load);
})();
