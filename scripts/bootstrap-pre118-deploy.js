'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const wrapper=path.join(root,'SMARTER_JUSTICE__ONE_FILE_GITHUB_UPLOAD__PRE117.zip');
const runtimeName='SMARTER_JUSTICE__PRE117_DEPLOY_RUNTIME.tgz';
const extracted=path.join(root,'.runtime',runtimeName),target=path.join(root,'.runtime','pre118-live');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const fail=m=>{console.error('[PRE118 DEPLOY] '+m);process.exit(1)},ok=(v,m)=>{if(!v)fail(m)};
ok(fs.existsSync(wrapper),'PRE117 carrier missing');ok(fs.statSync(wrapper).size===14153144,'carrier size mismatch');ok(sha(wrapper)==='6e66a8580f075f47c9f029119ac0df04e337a7bd0cead639081bc99ca631872e','carrier hash mismatch');
fs.mkdirSync(path.dirname(extracted),{recursive:true});const py=`import pathlib,sys,zipfile\nsrc=pathlib.Path(sys.argv[1]);out=pathlib.Path(sys.argv[2]);name=${JSON.stringify(runtimeName)}\nwith zipfile.ZipFile(src) as z:\n assert z.namelist()==[name]\n out.write_bytes(z.read(name))`;let q=cp.spawnSync(process.env.PYTHON_BIN||'python3',['-c',py,wrapper,extracted],{encoding:'utf8'});if(q.status!==0)fail(q.stderr||q.stdout);
ok(fs.statSync(extracted).size===14152962,'runtime size mismatch');ok(sha(extracted)==='2f1af991887ba4963ef0570ae3da913bdbe34972be5f3fae4164515bc16a20f8','runtime hash mismatch');
const names=cp.execFileSync('tar',['-tzf',extracted],{encoding:'utf8',maxBuffer:128*1024*1024});for(const raw of names.split(/\r?\n/)){const n=raw.trim().replace(/^\.\//,'');if(!n)continue;ok(!path.posix.isAbsolute(n)&&!n.split('/').includes('..'),'unsafe path '+n)}
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});cp.execFileSync('tar',['-xzf',extracted,'-C',target],{stdio:'inherit'});
let count=0;const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.isFile())count++}};walk(target);ok(count===4418,'base runtime count mismatch '+count);
const receipt=JSON.parse(fs.readFileSync(path.join(target,'coordination/pre117/FINAL_QUALIFICATION_RECEIPT.json'),'utf8'));ok(receipt.status==='PASS_QUALIFIED_NONPRODUCTION'&&receipt.regressionChecks===267&&receipt.noLoss.missing===0&&receipt.noLoss.unauthorizedChanged===0,'base qualification mismatch');
for(const f of ['package.json','package-lock.json']){const p=path.join(target,f),j=JSON.parse(fs.readFileSync(p,'utf8'));j.version='2.0.0-pre118';if(f==='package-lock.json'&&j.packages&&j.packages[''])j.packages[''].version='2.0.0-pre118';fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n')}
const indexPath=path.join(target,'public/index.html');let s=fs.readFileSync(indexPath,'utf8');
const oldNav='<nav aria-label="Main navigation" class="u-links" data-nav=""><a href="/">Start</a><a href="/navigator">AI Navigator</a><a href="/free-tools.html">Free tools</a><a href="/community-resources.html">Community help</a><a href="/practice-areas.html">Legal areas</a><a href="/professionals.html">Find a lawyer</a><a href="/attorney-partner-tour.html">For lawyers</a></nav>';
const newNav='<nav aria-label="Main navigation" class="u-links pre118-simple-nav" data-nav=""><a href="/professionals.html">Find a lawyer</a><a href="/attorney-partner-tour.html">For lawyers</a></nav>';ok(s.includes(oldNav),'PRE117 homepage nav anchor missing');s=s.replace(oldNav,newNav);
s=s.replace(/<div class="pre106-journey" data-pre106-journey="">.*?<\/div><\/div><\/div><main class="pre108-home-main" id="main">/s,'<main class="pre108-home-main pre118-home-main" id="main">');
const sm=s.match(/(<select aria-hidden="true" hidden="" id="storyRouteState".*?<\/select>)/s);ok(sm,'hidden state selector missing');const select=sm[1];
const hs=s.indexOf('<section class="u-hero pre108-home-hero" id="public-start">'),ns=s.indexOf('<section class="pre108-home-section">',hs);ok(hs>=0&&ns>hs,'PRE117 hero anchors missing');
const hero=`<section class="pre118-first-encounter" id="public-start">
<div class="u-wrap pre118-first-shell">
<div class="pre118-navigator-label">Smarter Justice Navigator</div>
<h1>Tell us what happened.</h1>
<p class="pre118-lead">We’ll help you understand what matters and what to do next.</p>
<form class="pre118-start-form" id="storyRouteForm" novalidate="">
__SELECT__
<label class="pre118-question-label" for="storyRouteQuestion">What’s going on?</label>
<textarea id="storyRouteQuestion" maxlength="2500" name="question" placeholder="Describe what happened in your own words. Include any notice, change, event, or date you’re worried about." required=""></textarea>
<div class="pre118-start-actions"><button class="u-btn u-btn-primary" type="submit">Show me what to do next</button></div>
<div class="pre118-reassurance" aria-label="Starting-point assurances"><span>Free to start</span><span>No account required</span><span>Not sent to lawyers</span></div>
<div class="u-form-meta pre118-form-meta"><span id="storyRouteHelp">You don’t need to know the legal category or choose a state first.</span><span id="storyRouteCounter">2500 characters left</span></div>
<p class="pre118-privacy-note">Your description is not saved by this starting-point route. If location matters, we’ll ask when it becomes useful.</p>
</form>
<section aria-live="polite" class="story-route-result" hidden="" id="storyRouteResult"></section>
<div class="pre118-below-fold-cue"><a href="#more-help">I already know what I need</a></div>
</div>
</section>
`.replace('__SELECT__',select);s=s.slice(0,hs)+hero+s.slice(ns);s=s.replace('<section class="pre108-home-section pre108-home-section-soft">','<section class="pre108-home-section pre108-home-section-soft" id="more-help">');s=s.replace('</head>','<link href="/pre118-home.css" rel="stylesheet"/></head>');fs.writeFileSync(indexPath,s);
ok(sha(indexPath)==='4a04a80cc24f22cbd00fb9565821579aaec6be2e54dec8993e82c58c45d8f96f','PRE118 homepage hash mismatch');
const css=`/* SMARTER_JUSTICE_PRE118_SIMPLE_PUBLIC_FIRST_ENCOUNTER */
.pre118-home-main{background:#fff}
.pre118-home-main+.u-footer{}
body[data-sj-page="index"] .pre106-journey{display:none!important}
body[data-sj-page="index"] .u-header{position:relative}
body[data-sj-page="index"] .u-nav{height:66px}
body[data-sj-page="index"] .pre118-simple-nav{gap:4px}
body[data-sj-page="index"] .pre118-simple-nav a{font-size:13px;color:#40566a}
.pre118-first-encounter{min-height:calc(100vh - 66px);display:flex;align-items:center;padding:54px 0 62px;background:linear-gradient(180deg,#f7fbfb 0%,#ffffff 74%);border-bottom:1px solid #e3ebee}
.pre118-first-shell{max-width:840px;text-align:center}
.pre118-navigator-label{display:inline-block;margin-bottom:14px;font-size:13px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:#0a5c65}
.pre118-first-shell h1{max-width:none;margin:0 0 12px;font-size:clamp(42px,6vw,70px);line-height:.98;letter-spacing:-.05em;color:#102f46}
.pre118-lead{max-width:650px;margin:0 auto 30px;color:#51656f;font-size:clamp(18px,2.2vw,22px);line-height:1.5}
.pre118-start-form{max-width:760px;margin:0 auto;text-align:left;background:#fff;border:1px solid #cfdfe2;border-radius:20px;padding:24px;box-shadow:0 22px 60px rgba(16,47,70,.11)}
.pre118-question-label{display:block;margin:0 0 10px;font-size:19px;font-weight:850;color:#102f46}
.pre118-start-form textarea{display:block;width:100%;min-height:205px;padding:18px;border:1px solid #aebfc5;border-radius:13px;background:#fff;color:#102f46;font:inherit;font-size:17px;line-height:1.55;resize:vertical;box-shadow:inset 0 1px 2px rgba(16,47,70,.03)}
.pre118-start-form textarea:focus{outline:3px solid #a9ded9;outline-offset:2px;border-color:#0a5c65}
.pre118-start-form textarea::placeholder{color:#7b8d96}
.pre118-start-actions{margin-top:14px}
.pre118-start-actions .u-btn{width:100%;min-height:54px;border-radius:11px;font-size:17px;background:#0a5c65;border-color:#0a5c65}
.pre118-start-actions .u-btn:hover{background:#07464d;border-color:#07464d}
.pre118-reassurance{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin:16px 0 8px;color:#526873;font-size:13px;font-weight:700}
.pre118-reassurance span:before{content:'✓';margin-right:6px;color:#08765f;font-weight:900}
.pre118-form-meta{margin:9px 0 0;align-items:center}
.pre118-privacy-note{margin:9px 0 0;text-align:center;color:#687b84;font-size:12px;line-height:1.45}
.pre118-below-fold-cue{margin-top:20px;font-size:13px}
.pre118-below-fold-cue a{color:#526873;text-underline-offset:3px}
body[data-sj-page="index"] .pre108-home-section:first-of-type{padding-top:54px}
@media(max-width:900px){body[data-sj-page="index"] .pre118-simple-nav{display:none}.pre118-first-encounter{min-height:auto;padding:46px 0 52px}.pre118-start-form{padding:20px}.pre118-start-form textarea{min-height:190px}}
@media(max-width:620px){.pre118-first-shell{width:min(100% - 24px,840px)}.pre118-first-shell h1{font-size:42px}.pre118-lead{font-size:18px;margin-bottom:22px}.pre118-start-form{padding:16px;border-radius:16px}.pre118-start-form textarea{min-height:180px;padding:15px;font-size:16px}.pre118-form-meta{display:block}.pre118-form-meta #storyRouteCounter{display:block;margin-top:5px}.pre118-reassurance{gap:10px 14px}}
`;const cssPath=path.join(target,'public/pre118-home.css');fs.writeFileSync(cssPath,css);ok(sha(cssPath)==='4e2a7b25473ea8e13d6a371936a98e58cd193b93d322d7576cd2b15cca64749b','PRE118 CSS hash mismatch');
count=0;walk(target);ok(count===4419,'PRE118 runtime count mismatch '+count);ok(JSON.parse(fs.readFileSync(path.join(target,'package.json'),'utf8')).version==='2.0.0-pre118','version mismatch');
const html=fs.readFileSync(indexPath,'utf8');ok((html.match(/id="storyRouteForm"/g)||[]).length===1,'must expose one start form');ok(html.includes('<h1>Tell us what happened.</h1>')&&html.includes('Show me what to do next'),'first encounter mismatch');ok(!html.includes('class="pre106-journey"')&&!html.includes('pre108-hero-grid'),'competing first paths remain');
const marker={schemaVersion:'smarter-justice.pre118.render-bootstrap.inline-delta.v1',release:'v2.0.0-pre118',baseRelease:'v2.0.0-pre117',pre118ProductArtifactSha256:'ed6a4638959aaec8a8c15108b4b6503548a24172e2d2094cf0fe43fd050e0d4f',homepageModel:'ONE_BIG_NAVIGATOR_FIRST_ENCOUNTER',runtimeFiles:4419,practiceAreas:69,controlledGenerationLanes:12,productionDeploymentAuthorized:true,consequentialLiveEffectsRemainProductGated:true,preparedAt:new Date().toISOString()};fs.writeFileSync(path.join(target,'.pre118-render-bootstrap.json'),JSON.stringify(marker,null,2)+'\n');console.log('[PRE118 DEPLOY] exact PRE118 first-encounter delta prepared');