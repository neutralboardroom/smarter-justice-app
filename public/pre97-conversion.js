(()=>{
  'use strict';
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  function run(){
    if(!/profile-review\.html$/i.test(location.pathname))return;
    document.body.classList.add('profile-review-page');
    const signIns=[...document.querySelectorAll('header a')].filter(a=>/^sign in$/i.test(norm(a.textContent)));
    signIns.slice(1).forEach(a=>a.remove());
    const h1=document.querySelector('h1');h1?.closest('section')?.classList.add('pre97-review-hero');
    const headings=[...document.querySelectorAll('h2,h3')];
    const repeated=headings.find(h=>/check sources and currentness/i.test(norm(h.textContent)));
    repeated?.closest('section')?.classList.add('pre97-secondary-review-explainer');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
