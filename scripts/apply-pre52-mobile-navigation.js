'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const pub=path.join(root,'public');
const appPath=path.join(pub,'app.js');
const cssPath=path.join(pub,'styles.css');
const tourPath=path.join(pub,'attorney-partner-tour.html');
const MARK='SMARTER_JUSTICE_PRE52_MOBILE_NAVIGATION';
let app=fs.readFileSync(appPath,'utf8');
const oldNav="  function initNav(){ const b = $('[data-nav-toggle]'), nav = $('[data-nav]'); if (b && nav) b.addEventListener('click', () => { nav.classList.toggle('open'); b.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false'); }); }";
if(!app.includes(MARK)){
  if(!app.includes(oldNav))throw new Error('PRE52 mobile nav seam missing');
  const improved=`  function initNav(){ // ${MARK}\n    const b=$('[data-nav-toggle]'),nav=$('[data-nav]'); if(!b||!nav)return;\n    if(!nav.id)nav.id='smarter-justice-main-navigation';\n    b.setAttribute('aria-controls',nav.id);\n    const close=()=>{nav.classList.remove('open');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Open menu');b.textContent='Menu';document.body.classList.remove('mobile-nav-open');};\n    const open=()=>{nav.classList.add('open');b.setAttribute('aria-expanded','true');b.setAttribute('aria-label','Close menu');b.textContent='Close';document.body.classList.add('mobile-nav-open');const first=nav.querySelector('a,button');if(first)setTimeout(()=>first.focus({preventScroll:true}),0);};\n    b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();nav.classList.contains('open')?close():open();});\n    nav.addEventListener('click',event=>{if(event.target.closest('a'))close();});\n    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){close();b.focus({preventScroll:true});}});\n    document.addEventListener('click',event=>{if(nav.classList.contains('open')&&!nav.contains(event.target)&&event.target!==b)close();});\n    window.addEventListener('resize',()=>{if(window.innerWidth>1050)close();});\n  }`;
  app=app.replace(oldNav,improved);
  app=app.replaceAll('Recommended focused website','Recommended Smarter Justice legal area');
  app=app.replaceAll('Open focused website','Open legal-area help');
  app=app.replaceAll('View all portals','View all legal areas');
  app=app.replaceAll('Separate website not open yet','Not available yet');
  app=app.replaceAll('A separate website may have its own terms, pricing, and review options.','Availability and terms are shown on the selected Smarter Justice legal-area page.');
  app=app.replaceAll("href=\"/portals.html\"","href=\"/practice-areas.html\"");
  fs.writeFileSync(appPath,app,'utf8');
}
const attorneyPages=['attorney-call-tour.html','attorney-partner-tour.html','professionals.html','attorney-launch.html','professional-membership.html','professional-signup.html'];
for(const name of attorneyPages){
  const p=path.join(pub,name); let s=fs.readFileSync(p,'utf8');
  if(name==='attorney-partner-tour.html') s=s.replace('>5. Operations<','>5. Working today<').replace('>5. Firm workspace<','>5. Working today<');
  s=s.replace(/<li>Full nationwide marketing-compliance automation, unrestricted outbound campaigns, AI front desk, and automatic CRM migration remain gated until qualified\.<\/li>/gi,'');
  s=s.replace(/<li>Nationwide automated compliance approval, unrestricted outbound campaigns, AI front-desk functions, and automatic CRM migration remain gated until they are separately qualified\.<\/li>/gi,'');
  s=s.replace(/Full nationwide marketing-compliance automation, unrestricted outbound campaigns, AI front desk, and automatic CRM migration remain gated until qualified\./gi,'');
  s=s.replace(/Nationwide automated compliance approval, unrestricted outbound campaigns, AI front-desk functions, and automatic CRM migration remain gated until they are separately qualified\./gi,'');
  fs.writeFileSync(p,s,'utf8');
}
let css=fs.readFileSync(cssPath,'utf8');
if(!css.includes(MARK)){
  css+=`\n/* ${MARK} */\n@media(max-width:1050px){.site-header{position:sticky;top:0;z-index:100}.site-header .nav-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:72px;min-height:44px;touch-action:manipulation}.site-header .top-nav{display:none;position:absolute;left:1rem;right:1rem;top:calc(100% + .4rem);z-index:110;background:#fff;border:1px solid var(--line);border-radius:20px;padding:.65rem;box-shadow:0 20px 45px rgba(21,62,84,.18);max-height:calc(100vh - 90px);overflow:auto}.site-header .top-nav.open{display:flex!important;flex-direction:column;align-items:stretch}.site-header .top-nav.open a{display:block;width:100%;min-height:44px;padding:.72rem .8rem;border-radius:12px}.mobile-nav-open{overflow-x:hidden}}\n@media(max-width:720px){.site-header{padding:.55rem .75rem}.site-header .brand img{height:34px}.site-header .top-nav{left:.65rem;right:.65rem}.site-header .header-signin{display:none}.site-header .nav-toggle{margin-left:auto}}\n`;
  fs.writeFileSync(cssPath,css,'utf8');
}
console.log('PRE52_MOBILE_NAVIGATION_APPLIED');
