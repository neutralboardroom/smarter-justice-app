'use strict';

const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(process.argv[2]||'.');
const publicDir=path.join(root,'public');
const indexPath=path.join(publicDir,'index.html');
const portalsPath=path.join(publicDir,'portals.html');
const communityPath=path.join(publicDir,'community-network.html');
const marker='UNIVERSAL_SMARTER_JUSTICE_PRE22_VISIBLE_INSPECTION';

function fail(message){throw new Error(`[pre22-visible-inspection] ${message}`);}
function esc(value){return String(value??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));}
function write(file,content){fs.writeFileSync(file,content,'utf8');}
function read(file){if(!fs.existsSync(file))fail(`missing ${path.relative(root,file)}`);return fs.readFileSync(file,'utf8');}
function injectAfterBody(html,fragment){const m=html.match(/<body[^>]*>/i);if(!m)fail('index.html has no body tag');return html.replace(m[0],m[0]+fragment);}
function addBeforeHeadClose(html,fragment){if(!/<\/head>/i.test(html))fail('document has no closing head tag');return html.replace(/<\/head>/i,fragment+'\n</head>');}

const sourceIntake={accepted:16,total:25,pending:9};
const modules=[
  {id:'bankruptcy-debt-law-aid',brand:'Bankruptcy & Debt Law Aid',path:'/bankruptcy',state:'pending'},
  {id:'business-law-aid',brand:'Business Law Aid',path:'/business-law',version:'0.17.0',domain:'https://businesslawaid.com',state:'accepted'},
  {id:'car-accident-law-aid',brand:'Car Accident Law Aid',path:'/car-accidents',state:'pending'},
  {id:'civil-rights-police-misconduct-law-aid',brand:'Civil Rights & Police Misconduct Law Aid',path:'/civil-rights',version:'0.35.0',domain:'https://civilrightslawaid.com',state:'accepted'},
  {id:'consumer-protection-fraud-scam-law-aid',brand:'Consumer Protection, Fraud & Scam Law Aid',path:'/consumer-protection',version:'0.56.0',domain:'https://consumerprotectionlawaid.com',state:'accepted'},
  {id:'contractcreator',brand:'ContractCreator',path:'/contracts',state:'pending'},
  {id:'criminal-law-aid',brand:'Criminal Law Aid',path:'/criminal-law',state:'pending'},
  {id:'disability-law-aid',brand:'Disability Law Aid',path:'/disability',version:'0.53.0',domain:'https://disabilitylawaid.com',state:'accepted'},
  {id:'divorce-law-aid',brand:'Divorce Law Aid',path:'/divorce',version:'0.91.0',domain:'https://divorcelawaid.com',state:'accepted'},
  {id:'domestic-violence-aid',brand:'Domestic Violence Aid',legacyBrand:'Stop Sign Project',path:'/domestic-violence',version:'0.95.0',domain:'https://stopsignproject.org',state:'accepted'},
  {id:'elder-care-law-aid',brand:'Elder Care Law Aid',path:'/elder-law',version:'0.24.0',domain:'https://eldercarelawaid.com',state:'accepted'},
  {id:'employment-law-aid',brand:'Employment Law Aid',path:'/employment',version:'0.63.0',domain:'https://employmentlawaid.com',state:'accepted'},
  {id:'estate-law-aid',brand:'Estate Law Aid',path:'/estate',version:'1.3.7',domain:'https://estatelawaid.com',state:'accepted'},
  {id:'family-law',brand:'Family Law',path:'/family-law',state:'platform'},
  {id:'immigration-oasis',brand:'Immigration Oasis',path:'/immigration',domain:'https://immigrationoasis.com',state:'accepted'},
  {id:'insurance-claim-law-aid',brand:'Insurance Claims, Denials & Bad Faith Law Aid',path:'/insurance-claims',state:'pending'},
  {id:'justice-tax-solutions',brand:'Justice Tax Solutions',path:'/tax',version:'0.1.159',domain:'https://justicetaxsolutions.com',state:'accepted'},
  {id:'justice-truck',brand:'Justice Truck',path:'/justice-truck',state:'pending'},
  {id:'medical-malpractice-law-aid',brand:'Medical Malpractice Law Aid',path:'/medical-malpractice',version:'0.68.0',domain:'https://medicalmalpracticeaid.com',state:'accepted'},
  {id:'name-records-education-law-aid',brand:'Name, Records & Education Law Aid',path:'/name-records-education',state:'pending'},
  {id:'personal-injury-law-aid',brand:'Personal Injury Law Aid',path:'/personal-injury',version:'0.90.0',domain:'https://personalinjurylawaid.com',state:'accepted'},
  {id:'real-estate-law-aid',brand:'Real Estate Law Aid',path:'/real-estate',version:'0.36.0',domain:'https://realestatelawaid.com',state:'accepted'},
  {id:'trademark-patent-ip-law-aid',brand:'Trademark, Patent & IP Law Aid',path:'/intellectual-property',state:'pending'},
  {id:'veterans-benefits-military-law-aid',brand:'Veterans Benefits & Military Law Aid',path:'/veterans',version:'0.36.0',domain:'https://veteranslawaid.com',state:'accepted'},
  {id:'workers-compensation-law-aid',brand:'Workers Compensation Law Aid',path:'/workers-compensation',state:'pending'}
];
if(modules.length!==25)fail(`expected 25 specialty modules, got ${modules.length}`);

const globalCss=`<style id="sj-pre22-inspection-style">
:root{--sj2-ink:#101828;--sj2-muted:#475467;--sj2-line:#d0d5dd;--sj2-soft:#f8fafc;--sj2-accent:#174ea6;--sj2-good:#067647;--sj2-warn:#b54708}
.sj2-ribbon{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#fff;border-bottom:1px solid var(--sj2-line);box-shadow:0 2px 10px rgba(16,24,40,.06);padding:12px 18px;position:relative;z-index:20}
.sj2-ribbon__inner{max-width:1180px;margin:0 auto;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.sj2-ribbon strong{color:var(--sj2-ink);font-size:15px}.sj2-ribbon span{color:var(--sj2-muted);font-size:14px;flex:1;min-width:260px}.sj2-ribbon a{display:inline-block;border:1px solid var(--sj2-accent);border-radius:7px;padding:8px 12px;color:var(--sj2-accent);font-weight:700;text-decoration:none;background:#fff}.sj2-ribbon a:hover{text-decoration:underline}
.sj2-shell{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--sj2-ink);background:#fff;min-height:100vh}.sj2-wrap{max-width:1180px;margin:0 auto;padding:32px 20px 64px}.sj2-kicker{font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12px;color:var(--sj2-accent)}.sj2-hero{padding:42px 0 28px;border-bottom:1px solid var(--sj2-line)}.sj2-hero h1{font-size:clamp(34px,6vw,62px);line-height:1.02;letter-spacing:-.035em;margin:10px 0 16px;max-width:920px}.sj2-hero p{font-size:18px;line-height:1.65;color:var(--sj2-muted);max-width:900px}.sj2-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}.sj2-btn{display:inline-block;padding:11px 15px;border-radius:8px;text-decoration:none;font-weight:800;border:1px solid var(--sj2-accent)}.sj2-btn--primary{background:var(--sj2-accent);color:#fff}.sj2-btn--secondary{background:#fff;color:var(--sj2-accent)}
.sj2-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:28px 0}.sj2-stat{border:1px solid var(--sj2-line);border-radius:10px;padding:18px;background:var(--sj2-soft)}.sj2-stat strong{font-size:28px;display:block}.sj2-stat span{color:var(--sj2-muted);font-size:13px}.sj2-section{padding:34px 0;border-top:1px solid var(--sj2-line)}.sj2-section h2{font-size:30px;margin:0 0 8px}.sj2-section>p{color:var(--sj2-muted);line-height:1.65;max-width:900px}.sj2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:20px}.sj2-card{border:1px solid var(--sj2-line);border-radius:10px;padding:18px;background:#fff}.sj2-card h3{font-size:18px;margin:0 0 7px}.sj2-card p{color:var(--sj2-muted);line-height:1.5;font-size:14px}.sj2-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.sj2-tag{font-size:12px;border:1px solid var(--sj2-line);border-radius:5px;padding:4px 7px;background:var(--sj2-soft)}.sj2-tag--good{color:var(--sj2-good);border-color:#abefc6;background:#ecfdf3}.sj2-tag--pending{color:var(--sj2-warn);border-color:#fedf89;background:#fffaeb}.sj2-card a{color:var(--sj2-accent);font-weight:700}.sj2-note{border-left:4px solid var(--sj2-accent);padding:14px 16px;background:var(--sj2-soft);color:var(--sj2-muted);line-height:1.6}.sj2-footer{border-top:1px solid var(--sj2-line);padding:24px 0;color:var(--sj2-muted);font-size:13px}
@media(max-width:850px){.sj2-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.sj2-grid{grid-template-columns:1fr}.sj2-ribbon__inner{align-items:flex-start}}
</style>`;

const ribbon=`<!-- ${marker} --><div class="sj2-ribbon" data-release="v2.0.0-pre22"><div class="sj2-ribbon__inner"><strong>Universal Smarter Justice v2.0.0-pre22 · live inspection</strong><span>One runtime, one release train · ${sourceIntake.accepted}/${sourceIntake.total} source intakes accepted · Domestic Violence Aid / Stop Sign Project and Justice Tax Solutions now mapped into the universal platform.</span><a href="/universal-smarter-justice">Inspect pre22 build</a></div></div>`;

let index=read(indexPath);
if(index.includes(marker))fail('visible inspection overlay already applied');
index=addBeforeHeadClose(index,globalCss);
index=injectAfterBody(index,ribbon);
write(indexPath,index);

if(fs.existsSync(portalsPath)){
  let portals=read(portalsPath);
  const old='The first public-and-attorney launch covers ten equal areas: Divorce & Family, Estate Planning & Probate, Personal Injury, Criminal Defense, Employment, Bankruptcy & Debt, Consumer Protection, Real Estate, Tax, and Immigration. Each focused portal remains independently deployed and verified.';
  const replacement='Universal Smarter Justice now uses one runtime and one release train. The focused legal and tax areas remain distinct specialty modules with their own branding, tools, funnels, safety rules and legacy-domain entrances. The v2.0.0-pre22 source intake is 16/25 accepted; legacy-domain cutovers remain gated until parity and deployment qualification.';
  if(portals.includes(old))portals=portals.replace(old,replacement);
  portals=portals.replace('## Why separate portals?','## Why focused specialty modules?');
  portals=addBeforeHeadClose(portals,globalCss);
  portals=injectAfterBody(portals,ribbon);
  write(portalsPath,portals);
}

if(fs.existsSync(communityPath)){
  let community=read(communityPath);
  community=addBeforeHeadClose(community,globalCss);
  community=injectAfterBody(community,ribbon);
  write(communityPath,community);
}

const moduleCards=modules.map(m=>{
  const stateLabel=m.state==='accepted'?'Source accepted':m.state==='platform'?'Platform-native sibling':'Source recovery pending';
  const stateClass=m.state==='pending'?'sj2-tag--pending':'sj2-tag--good';
  const version=m.version?`<span class="sj2-tag">v${esc(m.version)}</span>`:'';
  const domain=m.domain?`<a href="${esc(m.domain)}" rel="noopener">Legacy domain</a>`:'Legacy domain unresolved / path-only';
  const inspect=m.id==='domestic-violence-aid'?'<a href="/domestic-violence">Inspect module</a>':m.id==='justice-tax-solutions'?'<a href="/tax">Inspect module</a>':`<span>Smarter Justice path: ${esc(m.path)}</span>`;
  return `<article class="sj2-card" id="${esc(m.id)}"><h3>${esc(m.brand)}</h3>${m.legacyBrand?`<p><strong>Preserved public brand:</strong> ${esc(m.legacyBrand)}</p>`:''}<p>${inspect}</p><p>${domain}</p><div class="sj2-meta"><span class="sj2-tag ${stateClass}">${stateLabel}</span>${version}</div></article>`;
}).join('\n');

const universalPage=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Universal Smarter Justice v2.0.0-pre22 | Live Inspection</title><meta name="description" content="Live inspection view of the Universal Smarter Justice v2.0.0-pre22 consolidation state.">${globalCss}</head><body class="sj2-shell"><div class="sj2-wrap"><header class="sj2-hero"><div class="sj2-kicker">Universal Smarter Justice · v2.0.0-pre22</div><h1>One platform. Distinct specialty modules. Preserved public identities.</h1><p>This is the visible inspection surface for the qualified pre22 consolidation workspace. Shared accounts, identity, billing, security, AI orchestration, administration and common UX belong to one Smarter Justice runtime. Specialty branding, routes, tools, funnels, terminology, safety constraints and legacy-domain entrances remain distinct.</p><div class="sj2-actions"><a class="sj2-btn sj2-btn--primary" href="/">Back to Smarter Justice</a><a class="sj2-btn sj2-btn--secondary" href="/domestic-violence">Domestic Violence Aid</a><a class="sj2-btn sj2-btn--secondary" href="/tax">Justice Tax Solutions</a></div></header><section class="sj2-stats" aria-label="pre22 consolidation status"><div class="sj2-stat"><strong>${sourceIntake.accepted}/${sourceIntake.total}</strong><span>source intakes accepted</span></div><div class="sj2-stat"><strong>${sourceIntake.pending}</strong><span>source recoveries still pending</span></div><div class="sj2-stat"><strong>25</strong><span>specialty modules registered</span></div><div class="sj2-stat"><strong>1</strong><span>universal runtime / release train</span></div></section><section class="sj2-section"><h2>What changed in pre22</h2><p>Domestic Violence Aid v0.95.0 is centrally mapped with the Stop Sign Project identity and <code>stopsignproject.org</code> preserved. Justice Tax Solutions v0.1.159 is centrally mapped with <code>justicetaxsolutions.com</code> preserved. Production DNS cutover for legacy specialty hosts remains disabled until each host passes parity and deployment qualification.</p><div class="sj2-note"><strong>Inspection boundary:</strong> this page exposes the current consolidated architecture and source-intake truth on SmarterJustice.com. It does not claim that the nine still-missing donor sources or unqualified legacy-domain cutovers are complete.</div></section><section class="sj2-section"><h2>Specialty module registry</h2><p>Accepted modules retain their own identity inside the universal runtime. Pending entries remain visible as migration work, not as completed source imports.</p><div class="sj2-grid">${moduleCards}</div></section><footer class="sj2-footer">Universal Smarter Justice v2.0.0-pre22 · consolidation authority SHA-256 7a6a5886ac9afa79cd25803448345359d1e36557baefaddbd2323ee9673838e9 · legacy-domain routing remains fail-closed until qualified.</footer></div></body></html>`;
write(path.join(publicDir,'universal-smarter-justice.html'),universalPage);

function specialtyPage({title,kicker,description,stats,legacyUrl,legacyLabel,safety=false}){
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | Universal Smarter Justice</title>${globalCss}</head><body class="sj2-shell"><div class="sj2-wrap"><header class="sj2-hero"><div class="sj2-kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="sj2-actions"><a class="sj2-btn sj2-btn--primary" href="/universal-smarter-justice">Universal pre22 inspection</a><a class="sj2-btn sj2-btn--secondary" href="${esc(legacyUrl)}" rel="noopener">${esc(legacyLabel)}</a>${safety?'<a class="sj2-btn sj2-btn--secondary" href="/domestic-violence-aid.html">Safety resources</a>':''}</div></header><section class="sj2-stats">${stats.map(([a,b])=>`<div class="sj2-stat"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join('')}</section><section class="sj2-section"><h2>Universal runtime status</h2><p>This specialty is source-accepted and centrally mapped inside Universal Smarter Justice. Its legacy public domain is preserved as a future specialty entrance, but production host cutover remains off until parity, safety, route, profile, SEO and deployment qualification pass.</p><div class="sj2-note">No redirect or DNS cutover is being claimed by this inspection page. The preserved domain can continue to serve its existing public site while the universal module is inspected here.</div></section><footer class="sj2-footer">Universal Smarter Justice v2.0.0-pre22 live inspection.</footer></div></body></html>`;
}
write(path.join(publicDir,'domestic-violence.html'),specialtyPage({title:'Domestic Violence Aid',kicker:'Stop Sign Project preserved · source v0.95.0',description:'A privacy-first specialty module inside Universal Smarter Justice. The public/legacy Stop Sign Project identity and stopsignproject.org domain remain preserved while the universal module is qualified.',legacyUrl:'https://stopsignproject.org',legacyLabel:'Open Stop Sign Project',safety:true,stats:[['920','source profiles protected'],['615','individual profiles'],['305','firms + organizations'],['3,053/3,053','source files preserved']]}));
write(path.join(publicDir,'tax.html'),specialtyPage({title:'Justice Tax Solutions',kicker:'Tax specialty module · source v0.1.159',description:'Tax preparation, notices, audits, collections, resolution and professional-support capability is mapped into Universal Smarter Justice while the JusticeTaxSolutions.com public identity is preserved.',legacyUrl:'https://justicetaxsolutions.com',legacyLabel:'Open legacy tax site',stats:[['1,107','professional profiles'],['979','individual professionals'],['128','firms + organizations'],['959','professional relationships']]}));

const receipt={schemaVersion:'1.0.0',release:'v2.0.0-pre22',marker,authorityArtifact:'smarter-justice-comprehensive-consolidation-workspace-v2.0.0-pre22-LEAN-ACTIVE.zip',authoritySha256:'7a6a5886ac9afa79cd25803448345359d1e36557baefaddbd2323ee9673838e9',sourceIntake,moduleCount:modules.length,visibleRoutes:['/','/portals','/community-network','/universal-smarter-justice','/domestic-violence','/tax'],legacyHostCutoversEnabled:false,notes:'Visible inspection projection only. It exposes the qualified pre22 consolidation state without claiming completion of pending source intake or legacy-domain cutover.'};
write(path.join(root,'VISIBLE_PRE22_INSPECTION_RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n');

const test=`'use strict';\nconst assert=require('node:assert');\nconst fs=require('node:fs');\nconst path=require('node:path');\nconst root=path.join(__dirname,'..');\nconst pub=path.join(root,'public');\nconst index=fs.readFileSync(path.join(pub,'index.html'),'utf8');\nassert(index.includes('${marker}'));\nassert(index.includes('Universal Smarter Justice v2.0.0-pre22'));\nfor(const f of ['universal-smarter-justice.html','domestic-violence.html','tax.html'])assert(fs.existsSync(path.join(pub,f)),f);\nconst universal=fs.readFileSync(path.join(pub,'universal-smarter-justice.html'),'utf8');\nassert(universal.includes('16/25'));assert(universal.includes('25</strong><span>specialty modules registered'));\nassert(universal.includes('Justice Tax Solutions'));assert(universal.includes('Domestic Violence Aid'));assert(universal.includes('Stop Sign Project'));\nconst dv=fs.readFileSync(path.join(pub,'domestic-violence.html'),'utf8');\nassert(dv.includes('920'));assert(dv.includes('3,053/3,053'));assert(dv.includes('stopsignproject.org'));\nconst tax=fs.readFileSync(path.join(pub,'tax.html'),'utf8');\nassert(tax.includes('1,107'));assert(tax.includes('959'));assert(tax.includes('justicetaxsolutions.com'));\nconst receipt=require('../VISIBLE_PRE22_INSPECTION_RECEIPT.json');\nassert.strictEqual(receipt.authoritySha256,'7a6a5886ac9afa79cd25803448345359d1e36557baefaddbd2323ee9673838e9');\nassert.strictEqual(receipt.legacyHostCutoversEnabled,false);\nconsole.log('visible-pre22-inspection.test.js passed');\n`;
write(path.join(root,'tests','visible-pre22-inspection.test.js'),test);
console.log('[pre22-visible-inspection] homepage ribbon and universal inspection routes prepared');
