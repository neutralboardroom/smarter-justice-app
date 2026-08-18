(()=>{
  'use strict';
  const text=node=>String(node?.textContent||'').replace(/\s+/g,' ').trim();
  function closestSection(node){return node?.closest('section,article,main>div')||node?.parentElement;}
  function run(){
    if(location.pathname!=='/'&&!/index\.html$/i.test(location.pathname))return;
    document.body.classList.add('pre97-home-audit');
    const h1=[...document.querySelectorAll('h1')].find(n=>/start with what happened/i.test(text(n)));if(h1){const section=closestSection(h1);section?.classList.add('pre97-home-hero');}
    const jurisdiction=[...document.querySelectorAll('label,div,p')].find(n=>/^Jurisdiction context/i.test(text(n))&&n.querySelector?.('select'));if(jurisdiction)jurisdiction.classList.add('pre97-jurisdiction-control');
    const paths=[...document.querySelectorAll('h2')].find(n=>/choose a common legal path|choose a path|common legal path/i.test(text(n)));closestSection(paths)?.classList.add('pre97-home-paths');
    const attorney=[...document.querySelectorAll('h2,h3')].find(n=>/your profile, professional tools|growth, operations, and compliance/i.test(text(n)));closestSection(attorney)?.classList.add('pre97-home-attorney-cta');
    document.querySelector('footer')?.classList.add('pre97-home-footer');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
