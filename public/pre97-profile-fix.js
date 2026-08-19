(()=>{
  'use strict';
  const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
  const uniqueCaseInsensitive=items=>{const seen=new Set();return items.filter(item=>{const key=normalize(item).toLowerCase();if(!key||seen.has(key))return false;seen.add(key);return true;});};
  function titleCaseIfAllCaps(node){
    if(!node)return;
    const raw=normalize(node.textContent);
    if(raw.length<2||raw!==raw.toUpperCase()||!/[A-Z]/.test(raw))return;
    node.textContent=raw.toLowerCase().replace(/(^|[\s'-])([a-z])/g,(_,a,b)=>a+b.toUpperCase());
  }
  function dedupeLabeledList(label){
    document.querySelectorAll('p').forEach(p=>{
      const strong=p.querySelector('strong');
      if(!strong||normalize(strong.textContent).toLowerCase()!==label.toLowerCase())return;
      const full=normalize(p.textContent);
      const idx=full.indexOf(':');
      if(idx<0)return;
      const values=full.slice(idx+1).split('·').map(normalize).filter(Boolean);
      const unique=uniqueCaseInsensitive(values);
      if(unique.length&&unique.length<values.length)p.innerHTML=`<strong>${strong.textContent}</strong> ${unique.join(' · ')}`;
    });
  }
  function dedupeSources(){
    document.querySelectorAll('.public-sources-card ul, [class*="source"] ul').forEach(ul=>{
      const seen=new Set();
      [...ul.children].forEach(li=>{
        const key=normalize(li.textContent).toLowerCase();
        if(!key)return;
        if(seen.has(key))li.remove(); else seen.add(key);
      });
    });
  }
  function clarifyAvailability(){
    document.querySelectorAll('h2,h3,h4').forEach(h=>{
      if(!/professional-supplied availability/i.test(normalize(h.textContent)))return;
      const container=h.parentElement;
      if(!container)return;
      container.querySelectorAll('p').forEach(p=>{
        const text=normalize(p.textContent);
        if(/^status:\s*not configured$/i.test(text))p.innerHTML='<strong>Status:</strong> No availability information provided';
      });
    });
  }
  function apply(){
    const main=document.querySelector('#professionalProfile,#firmProfile');
    if(!main)return;
    titleCaseIfAllCaps(main.querySelector('.profile-hero h1,h1'));
    dedupeLabeledList('Office locations:');
    dedupeLabeledList('Service regions:');
    dedupeSources();
    clarifyAvailability();
  }
  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();
