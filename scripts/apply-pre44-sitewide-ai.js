'use strict';

const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(process.argv[2]||'.');
const serverPath=path.join(root,'server.js');
const publicDir=path.join(root,'public');
const appPath=path.join(publicDir,'app.js');
const navPath=path.join(publicDir,'navigator.js');
const navHtmlPath=path.join(publicDir,'navigator.html');
const stylesPath=path.join(publicDir,'styles.css');
const marker='SMARTER_JUSTICE_PRE44_SITEWIDE_NAVIGATOR';
function fail(m){throw new Error(`[pre44-sitewide-ai] ${m}`)}
function read(p){if(!fs.existsSync(p))fail(`missing ${path.relative(root,p)}`);return fs.readFileSync(p,'utf8')}
function write(p,s){fs.writeFileSync(p,s,'utf8')}
let server=read(serverPath);
if(server.includes(marker))fail('overlay already applied');
const oldBridge="path.join(repoRoot,'deployment','pre43','navigator_preview_cli.py')";
if(!server.includes(oldBridge))fail('pre43 bridge seam missing');
server=server.replace(oldBridge,"path.join(repoRoot,'deployment','pre44','navigator_cli.py')");
server=server.replaceAll("version:'v2.0.0-pre43'","version:'v2.0.0-pre44'");
server=server.replace('function pre43NavigatorCli(payload){',`// ${marker}\nfunction pre43NavigatorCli(payload){`);
write(serverPath,server);
let nav=read(navPath);
if(nav.includes(marker))fail('navigator browser overlay already applied');
const modeNeedle="$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>selectMode(b.dataset.mode)));selectMode(toolMode);";
if(!nav.includes(modeNeedle))fail('navigator mode seam missing');
nav=nav.replace(modeNeedle,`${modeNeedle}\n  // ${marker}\n  const params=new URLSearchParams(location.search);\n  const requestedMode=String(params.get('mode')||'').toUpperCase();\n  if($$('[data-mode]').some(b=>b.dataset.mode===requestedMode))selectMode(requestedMode);\n  const pageContext=String(params.get('context')||'').slice(0,500);\n  if(pageContext)message.placeholder='Ask Navigator about: '+pageContext;`);
const bodyNeedle="body:JSON.stringify({threadId,message:text,inputMode:'TEXT',toolMode})";
if(!nav.includes(bodyNeedle))fail('navigator request seam missing');
nav=nav.replace(bodyNeedle,"body:JSON.stringify({threadId,message:text,inputMode:'TEXT',toolMode,pageContext})");
const statusNeedle="['Consequential actions','Confirmation-gated']";
if(!nav.includes(statusNeedle))fail('navigator status seam missing');
nav=nav.replace(statusNeedle,`${statusNeedle},['Conversation storage',x.durablePersistenceAccepted?'Durable':'Temporary']`);
nav=`// ${marker}\n`+nav;
write(navPath,nav);
let html=read(navHtmlPath);
html=html.replaceAll('v2.0.0-pre43','v2.0.0-pre44');
html=html.replace('Public AI assistance is live.','Public AI assistance is live and Navigator is now linked throughout Smarter Justice.');
write(navHtmlPath,html);
let app=read(appPath);
if(!app.includes(marker)){
app+=`\n\n// ${marker}\n(()=>{\n  function addNavigator(){\n    if(location.pathname==='/navigator'||location.pathname==='/navigator.html')return;\n    const internal=/\\/(?:owner|staff|admin|control-center|launch-activation|production-readiness|ai-summary)(?:\\.html)?$/i.test(location.pathname);\n    const context=(document.querySelector('main h1')?.textContent||document.title||'this page').trim().slice(0,180);\n    const href='/navigator?context='+encodeURIComponent(context);\n    for(const nav of document.querySelectorAll('header nav,.site-header nav,nav[aria-label="Primary"]')){\n      if(!nav.querySelector('a[href^="/navigator"]')){const a=document.createElement('a');a.href=href;a.textContent='Navigator';a.dataset.sjNavigatorGlobal='1';nav.appendChild(a);}\n    }\n    if(!internal){\n      const main=document.querySelector('main');\n      const h1=main&&main.querySelector('h1');\n      if(main&&h1&&!main.querySelector('[data-sj-navigator-context]')){const a=document.createElement('a');a.href=href;a.textContent='Ask Navigator about this page';a.className='sj-navigator-context-link';a.dataset.sjNavigatorContext='1';h1.insertAdjacentElement('afterend',a);}\n    }\n  }\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addNavigator,{once:true});else addNavigator();\n})();\n`;
write(appPath,app);
}
let styles=read(stylesPath);
if(!styles.includes('SMARTER_JUSTICE_PRE44_SITEWIDE_NAVIGATOR_STYLES')){
styles+=`\n/* SMARTER_JUSTICE_PRE44_SITEWIDE_NAVIGATOR_STYLES */\n.sj-navigator-context-link{display:inline-block;margin:.5rem 0 1rem;text-decoration:underline;text-underline-offset:3px;font-weight:700}.sj-navigator-context-link:focus{outline:3px solid currentColor;outline-offset:3px}\n`;
write(stylesPath,styles);
}
console.log('[pre44-sitewide-ai] sitewide Navigator links, page context, persistence status, and pre44 bridge applied');
