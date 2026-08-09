'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.argv[2]||'.');
const pub=path.join(root,'public');
const tests=path.join(root,'tests');
const marker='UNIVERSAL_NAVIGATION_POLISH_V1';
const read=name=>fs.readFileSync(path.join(pub,name),'utf8');
const write=(name,content)=>fs.writeFileSync(path.join(pub,name),content,'utf8');
const exists=name=>fs.existsSync(path.join(pub,name));
function fail(m){throw new Error(`[universal-navigation-polish] ${m}`)}

const desktopNav=`<nav class="u-links" aria-label="Main navigation"><a href="/practice-areas.html">Legal areas</a><a href="/community-resources.html">Community resources</a><a href="/professionals.html">Find a professional</a><a href="/free-tools.html">Free tools</a><a href="/attorney-partner-tour.html">For professionals</a><a href="/es/">Español</a><a class="u-sign" href="/professional-login.html">Sign in</a></nav>`;
const mobileButton=`<button class="u-menu-toggle" type="button" aria-expanded="false" aria-controls="u-mobile-menu"><span class="u-menu-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span><span class="u-menu-toggle__text">Menu</span></button>`;
const mobileNav=`<nav class="u-mobile-menu" id="u-mobile-menu" aria-label="Mobile navigation" hidden><a href="/practice-areas.html">Legal areas</a><a href="/community-resources.html">Community resources</a><a href="/professionals.html">Find a professional</a><a href="/free-tools.html">Free tools</a><a href="/attorney-partner-tour.html">For professionals</a><a href="/es/">Español</a><a href="/professional-login.html">Sign in</a></nav>`;
const extraCss=`<style id="universal-navigation-polish-v1">
.u-menu-toggle{display:none;margin-left:auto;align-items:center;gap:9px;border:1px solid var(--u-line);background:#fff;color:var(--u-ink);border-radius:8px;padding:9px 11px;font:inherit;font-weight:750;cursor:pointer}.u-menu-toggle:focus-visible,.u-mobile-menu a:focus-visible,.u-card:focus-visible,.u-btn:focus-visible,.u-links a:focus-visible{outline:3px solid #8ec5ff;outline-offset:3px}.u-menu-toggle__bars{display:grid;gap:3px}.u-menu-toggle__bars span{display:block;width:18px;height:2px;background:currentColor;border-radius:1px}.u-mobile-menu{position:absolute;top:76px;left:0;right:0;background:#fff;border-bottom:1px solid var(--u-line);box-shadow:0 18px 32px rgba(16,42,67,.12);padding:10px 18px 18px}.u-mobile-menu[hidden]{display:none}.u-mobile-menu a{display:block;color:var(--u-ink);text-decoration:none;font-weight:700;padding:12px 6px;border-bottom:1px solid #eef2f6}.u-mobile-menu a:last-child{border-bottom:0}.u-mobile-menu a:hover{text-decoration:underline}.u-card{position:relative}.u-card .u-more{display:flex;align-items:center;gap:6px}.u-card .u-more::after{content:'→';transition:transform .15s ease}.u-card:hover .u-more::after{transform:translateX(3px)}.u-hub-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:24px}.u-module-card{border:1px solid var(--u-line);border-radius:14px;padding:22px;background:#fff}.u-module-card h3{margin:0 0 8px;font-size:21px}.u-module-card p{color:var(--u-muted);line-height:1.55;margin:0 0 16px}.u-module-actions{display:flex;gap:10px;flex-wrap:wrap}.u-eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--u-blue);margin-bottom:8px}.u-quiet{font-size:13px;color:var(--u-muted);line-height:1.5}.u-network-grid .u-card{min-height:190px}.u-badge{border-radius:4px}
@media(max-width:900px){.u-menu-toggle{display:inline-flex}.u-nav{position:relative}.u-hub-grid{grid-template-columns:1fr}.u-header .u-links{display:none}}
@media(min-width:901px){.u-mobile-menu{display:none!important}}
</style>`;
const mobileScript=`<script id="universal-navigation-polish-v1-script">(()=>{const b=document.querySelector('.u-menu-toggle');const m=document.getElementById('u-mobile-menu');if(!b||!m)return;const close=()=>{b.setAttribute('aria-expanded','false');m.hidden=true;};b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!open));m.hidden=open;});m.addEventListener('click',e=>{if(e.target.closest('a'))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});window.matchMedia('(min-width: 901px)').addEventListener?.('change',e=>{if(e.matches)close();});})();</script>`;

function polishDocument(html){
  if(html.includes(marker))return html;
  if(!html.includes(desktopNav))fail('desktop navigation contract not found');
  html=html.replace(desktopNav,desktopNav+mobileButton+mobileNav);
  html=html.replace('</head>',`<!-- ${marker} -->${extraCss}</head>`);
  html=html.replace('</body>',mobileScript+'</body>');
  return html;
}

const homeFile='index.html';
let home=read(homeFile);
const directReplacements=[
  ['href="/portals.html"><div class="u-icon">⚖️</div><h3>Divorce & family</h3>','href="/family-law"><div class="u-icon">⚖️</div><h3>Divorce & family</h3>'],
  ['href="/portals.html"><div class="u-icon">🩹</div><h3>Injury & accidents</h3>','href="/injury"><div class="u-icon">🩹</div><h3>Injury & accidents</h3>'],
  ['href="/portals.html"><div class="u-icon">🏛️</div><h3>Criminal & civil rights</h3>','href="/rights-defense"><div class="u-icon">🏛️</div><h3>Criminal & civil rights</h3>'],
  ['href="/portals.html"><div class="u-icon">💼</div><h3>Work & business</h3>','href="/work-business"><div class="u-icon">💼</div><h3>Work & business</h3>'],
  ['href="/portals.html"><div class="u-icon">🏠</div><h3>Housing, property & debt</h3>','href="/property-debt"><div class="u-icon">🏠</div><h3>Housing, property & debt</h3>'],
  ['href="/portals.html"><div class="u-icon">📄</div><h3>Estate, benefits & records</h3>','href="/estate-benefits-records"><div class="u-icon">📄</div><h3>Estate, benefits & records</h3>']
];
for(const [from,to] of directReplacements){if(!home.includes(from))fail(`homepage direct-link source missing: ${from.slice(0,50)}`);home=home.replace(from,to)}
home=polishDocument(home);
write(homeFile,home);

for(const name of ['universal-smarter-justice.html','domestic-violence.html','tax.html']){if(!exists(name))fail(`missing ${name}`);write(name,polishDocument(read(name)))}

const template=read('index.html');
const head=template.match(/^<!doctype html><html lang="en"><head>[\s\S]*?<\/head>/i)?.[0];
const header=template.match(/<header class="u-header">[\s\S]*?<\/header>/i)?.[0];
const footer=template.match(/<footer class="u-footer">[\s\S]*?<\/footer>/i)?.[0];
if(!head||!header||!footer)fail('could not extract shared public shell');
const shell=(title,description,content)=>head.replace(/<title>[\s\S]*?<\/title>/i,`<title>${title}</title>`).replace(/<meta name="description" content="[^"]*">/i,`<meta name="description" content="${description}">`)+`<body class="u-page">${header}<main>${content}</main>${footer}${mobileScript}</body></html>`;
const btn=(href,label,primary=false)=>`<a class="u-btn ${primary?'u-btn-primary':'u-btn-secondary'}" href="${href}">${label}</a>`;
const moduleCard=(name,summary,href,legacy,legacyLabel='Focused website')=>`<article class="u-module-card"><div class="u-eyebrow">Smarter Justice specialty</div><h3>${name}</h3><p>${summary}</p><div class="u-module-actions">${btn(href,'Open specialty',true)}${legacy?btn(legacy,legacyLabel):''}</div></article>`;
const hubPage=(slug,title,lead,cards)=>shell(`${title} | Smarter Justice`,lead,`<section class="u-network-hero"><div class="u-wrap"><div class="u-kicker">Focused help</div><h1>${title}</h1><p class="u-lead">${lead}</p><div class="u-hub-grid">${cards.join('')}</div><p class="u-quiet" style="margin-top:24px">Not sure which specialty fits? Return to the homepage and describe what happened in your own words.</p></div></section>`);

const moduleDefs={
  'divorce':{name:'Divorce Law Aid',summary:'Divorce, custody, parenting time, support, separation, and preparation pathways.',legacy:'https://divorcelawaid.com'},
  'personal-injury':{name:'Personal Injury Law Aid',summary:'Injury claims, evidence organization, medical records, timelines, and professional-search preparation.',legacy:'https://personalinjurylawaid.com'},
  'medical-malpractice':{name:'Medical Malpractice Law Aid',summary:'Medical-injury timelines, records, potential negligence issues, and preparation for professional review.',legacy:'https://medicalmalpracticeaid.com'},
  'civil-rights':{name:'Civil Rights & Police Misconduct Law Aid',summary:'Civil-rights, police-misconduct, documentation, deadlines, and professional-search starting help.',legacy:'https://civilrightslawaid.com'},
  'employment':{name:'Employment Law Aid',summary:'Workplace rights, termination, discrimination, pay, leave, retaliation, and employment-document preparation.',legacy:'https://employmentlawaid.com'},
  'business-law':{name:'Business Law Aid',summary:'Business formation, contracts, disputes, operations, and professional-support starting points.',legacy:'https://businesslawaid.com'},
  'real-estate':{name:'Real Estate Law Aid',summary:'Property transactions, ownership, disputes, leases, closings, and real-estate legal preparation.',legacy:'https://realestatelawaid.com'},
  'consumer-protection':{name:'Consumer Protection Law Aid',summary:'Fraud, scams, unfair practices, consumer disputes, documentation, and complaint-preparation pathways.',legacy:'https://consumerprotectionlawaid.com'},
  'estate':{name:'Estate Law Aid',summary:'Estate planning, wills, probate, administration, and family preparation pathways.',legacy:'https://estatelawaid.com'},
  'elder-law':{name:'Elder Care Law Aid',summary:'Elder-care planning, decision support, benefits, family coordination, and professional-search preparation.',legacy:'https://eldercarelawaid.com'},
  'disability':{name:'Disability Law Aid',summary:'Disability-related legal starting points, records organization, benefits, and professional-search preparation.',legacy:'https://disabilitylawaid.com'},
  'veterans':{name:'Veterans Benefits & Military Law Aid',summary:'Veterans benefits, military-related legal issues, records, and professional-support pathways.',legacy:'https://veteranslawaid.com'},
  'immigration':{name:'Immigration Oasis',summary:'Immigration information, preparation pathways, and focused support through the connected Smarter Justice network.',legacy:'https://immigrationoasis.com'}
};
for(const [slug,d] of Object.entries(moduleDefs)){
  const content=`<section class="u-network-hero"><div class="u-wrap"><div class="u-kicker">Smarter Justice specialty</div><h1>${d.name}</h1><p class="u-lead">${d.summary}</p><div class="u-split" style="margin-top:30px"><article class="u-panel"><h3>Start here in Smarter Justice</h3><p>Use the Smarter Justice starting-point flow when you want help identifying next steps across connected legal and practical needs.</p>${btn('/#public-start','Tell us what happened',true)}</article><article class="u-panel"><h3>Focused specialty experience</h3><p>The specialty identity and its focused tools remain available while deeper migration into the universal runtime continues.</p>${btn(d.legacy,'Open focused website')}</article></div></div></section>`;
  write(`${slug}.html`,polishDocument(shell(`${d.name} | Smarter Justice`,d.summary,content)));
}

const hubs={
  'family-law':{title:'Divorce & family help',lead:'Start with divorce and family-law questions, then move into the focused specialty that fits.',cards:[moduleCard('Divorce Law Aid','Divorce, custody, parenting time, support, separation, and preparation.','/divorce','https://divorcelawaid.com')]},
  'injury':{title:'Injury & accident help',lead:'Focused paths for injuries, accidents, medical harm, and related claim preparation.',cards:[moduleCard('Personal Injury Law Aid','General injury claims, evidence, timelines, and preparation.','/personal-injury','https://personalinjurylawaid.com'),moduleCard('Medical Malpractice Law Aid','Medical injury and possible negligence preparation.','/medical-malpractice','https://medicalmalpracticeaid.com')]},
  'rights-defense':{title:'Rights & defense help',lead:'Start with civil-rights and defense-related concerns and move into the most relevant specialty path.',cards:[moduleCard('Civil Rights & Police Misconduct Law Aid','Civil-rights, police-misconduct, documentation, and professional-search preparation.','/civil-rights','https://civilrightslawaid.com'),moduleCard('Criminal Law Aid','Criminal-defense specialty migration is still being prepared.','/portals.html',null)]},
  'work-business':{title:'Work & business help',lead:'Employment, workplace, business, and contract-related starting points in one focused hub.',cards:[moduleCard('Employment Law Aid','Workplace rights, pay, leave, termination, discrimination, and retaliation.','/employment','https://employmentlawaid.com'),moduleCard('Business Law Aid','Business formation, operations, contracts, and disputes.','/business-law','https://businesslawaid.com')]},
  'property-debt':{title:'Housing, property & debt help',lead:'Property, consumer, debt, and financial-pressure starting points with clear specialty boundaries.',cards:[moduleCard('Real Estate Law Aid','Transactions, ownership, leases, closings, and property disputes.','/real-estate','https://realestatelawaid.com'),moduleCard('Consumer Protection Law Aid','Fraud, scams, unfair practices, and consumer disputes.','/consumer-protection','https://consumerprotectionlawaid.com'),moduleCard('Bankruptcy & Debt Law Aid','The focused bankruptcy and debt migration is still being prepared.','/portals.html',null)]},
  'estate-benefits-records':{title:'Estate, benefits & records help',lead:'Life-planning, elder-care, disability, veterans, immigration, and records-related starting paths.',cards:[moduleCard('Estate Law Aid','Estate planning, wills, probate, and administration.','/estate','https://estatelawaid.com'),moduleCard('Elder Care Law Aid','Elder-care planning, benefits, and family coordination.','/elder-law','https://eldercarelawaid.com'),moduleCard('Disability Law Aid','Disability-related legal and benefits starting points.','/disability','https://disabilitylawaid.com'),moduleCard('Veterans Benefits & Military Law Aid','Veterans benefits and military-related legal support.','/veterans','https://veteranslawaid.com'),moduleCard('Immigration Oasis','Focused immigration information and preparation.','/immigration','https://immigrationoasis.com')]}
};
for(const [slug,h] of Object.entries(hubs))write(`${slug}.html`,polishDocument(hubPage(slug,h.title,h.lead,h.cards)));

const test=`'use strict';\nconst fs=require('node:fs');const path=require('node:path');const p=n=>fs.readFileSync(path.join(__dirname,'..','public',n),'utf8');\nconst home=p('index.html');for(const s of ['u-menu-toggle','u-mobile-menu','/family-law','/injury','/rights-defense','/work-business','/property-debt','/estate-benefits-records'])if(!home.includes(s))throw new Error('missing '+s);\nfor(const f of ['family-law.html','injury.html','rights-defense.html','work-business.html','property-debt.html','estate-benefits-records.html','divorce.html','personal-injury.html','medical-malpractice.html','civil-rights.html','employment.html','business-law.html','real-estate.html','consumer-protection.html','estate.html','elder-law.html','disability.html','veterans.html','immigration.html']){if(!fs.existsSync(path.join(__dirname,'..','public',f)))throw new Error('missing file '+f);const x=p(f);if(!x.includes('u-menu-toggle')||!x.includes('u-mobile-menu'))throw new Error('mobile nav missing '+f)}\nif((home.match(/href=\"\/portals\.html\"/g)||[]).length>0)throw new Error('homepage still routes specialty cards to generic portals page');\nconsole.log('universal-navigation-polish-v1.test.js passed');\n`;fs.writeFileSync(path.join(tests,'universal-navigation-polish-v1.test.js'),test,'utf8');
console.log('[universal-navigation-polish] mobile navigation, direct hubs, and connected specialty entrances applied');
