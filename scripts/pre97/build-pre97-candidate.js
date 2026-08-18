'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const root=path.resolve(__dirname,'../..');
const archive=path.join(root,'PRE96_DEPLOY_RUNTIME.tgz');
const target=path.join(root,'.runtime','pre97-candidate');
const outDir=path.join(root,'.build','pre97');
const expectedSha='a506ac9c1c0447b97f412da30341ea616e089be423a3c43addf6ca3813f7a9bc';
const expectedBytes=14393357;
const release='v2.0.0-pre97';
function fail(m){throw new Error(`[PRE97 BUILD] ${m}`)}
function assert(v,m){if(!v)fail(m)}
function shaFile(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}
function read(rel){const p=path.join(target,rel);assert(fs.existsSync(p),`missing runtime file ${rel}`);return fs.readFileSync(p,'utf8')}
function write(rel,s){const p=path.join(target,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)}
function patch(rel,from,to,{required=true}={}){let s=read(rel);const matched=typeof from==='string'?s.includes(from):from.test(s);if(!matched){if(required)fail(`patch anchor missing in ${rel}: ${String(from).slice(0,120)}`);return false}s=typeof from==='string'?s.replace(from,to):s.replace(from,to);write(rel,s);return true}
function injectHead(rel,markup){let s=read(rel);if(s.includes(markup))return;assert(s.includes('</head>'),`no </head> in ${rel}`);write(rel,s.replace('</head>',`${markup}</head>`))}
function copyAsset(name){const src=path.join(root,'public',name),dst=path.join(target,'public',name);assert(fs.existsSync(src),`overlay asset missing ${name}`);fs.copyFileSync(src,dst)}
function walk(dir,fn){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p,fn);else fn(p)}}
function localLinkAudit(){const pub=path.join(target,'public');const html=[];walk(pub,p=>{if(p.endsWith('.html'))html.push(p)});const missing=[];let checked=0;const allow=[/^\/api\//,/^\/attorney-tour\//,/^\/case\//,/^\/professional\/[^/]+\//,/^\/auth\//];for(const file of html){const body=fs.readFileSync(file,'utf8');for(const m of body.matchAll(/(?:href|src)=["']([^"']+)["']/g)){let u=m[1].trim();if(!u||u.startsWith('#')||/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(u))continue;u=u.split('#')[0].split('?')[0];if(!u)continue;if(allow.some(r=>r.test(u)))continue;checked++;let p;if(u.startsWith('/'))p=path.join(pub,u.slice(1));else p=path.resolve(path.dirname(file),u);if(!path.extname(p))p+='.html';if(!fs.existsSync(p))missing.push({from:path.relative(pub,file),link:m[1],resolved:path.relative(pub,p)})}}
return {htmlFiles:html.length,checked,missing};}
function changedManifest(){const names=['public/index.html','public/control-center.html','public/owner-login.html','public/owner-password-reset.html','public/professionals.html','public/professional-profile.html','public/firm-profile.html','public/professional-signup.html','public/professional-login.html','public/profile-review.html','public/attorney-partner-tour.html','public/pre97-polish.css','public/pre97-owner.css','public/pre97-control.css','public/pre97-home.css','public/pre97-home.js','public/pre97-auth.js','public/pre97-directory.js','public/pre97-profile-fix.js','public/pre97-professional.js','public/pre97-conversion.js'];return names.filter(n=>fs.existsSync(path.join(target,n))).map(rel=>{const p=path.join(target,rel),b=fs.readFileSync(p);return {path:rel,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}})}

assert(fs.existsSync(archive),'PRE96 carrier missing');const st=fs.statSync(archive);assert(st.size===expectedBytes,`PRE96 bytes ${st.size} != ${expectedBytes}`);assert(shaFile(archive)===expectedSha,'PRE96 SHA-256 mismatch');
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
const members=cp.execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:64*1024*1024});for(const raw of members.split(/\r?\n/)){const n=raw.trim().replace(/^\.\//,'');if(!n)continue;assert(!path.posix.isAbsolute(n)&&!n.split('/').includes('..'),`unsafe archive member ${raw}`)}
cp.execFileSync('tar',['-xzf',archive,'-C',target],{stdio:'inherit'});
const predecessorPkg=JSON.parse(read('package.json'));assert(predecessorPkg.version==='2.0.0-pre96','unexpected predecessor runtime version');
const predecessorSummary=JSON.parse(read('deployment/pre96/PRE96_RELEASE_SUMMARY.json'));assert(predecessorSummary.release==='v2.0.0-pre96','predecessor summary mismatch');assert(predecessorSummary.sameOriginLinksChecked===6005,'PRE96 link-audit baseline changed');

for(const asset of ['pre97-polish.css','pre97-owner.css','pre97-control.css','pre97-home.css','pre97-home.js','pre97-auth.js','pre97-directory.js','pre97-profile-fix.js','pre97-professional.js','pre97-conversion.js'])copyAsset(asset);
const css='<link rel="stylesheet" href="/pre97-polish.css">';
const inject=[
 ['public/index.html','<link rel="stylesheet" href="/pre97-home.css"><script defer src="/pre97-home.js"></script>'],
 ['public/professionals.html','<script defer src="/pre97-directory.js"></script>'],
 ['public/professional-profile.html','<script defer src="/pre97-profile-fix.js"></script>'],
 ['public/firm-profile.html','<script defer src="/pre97-profile-fix.js"></script>'],
 ['public/professional-signup.html','<script defer src="/pre97-professional.js"></script>'],
 ['public/professional-login.html','<script defer src="/pre97-auth.js"></script>'],
 ['public/owner-login.html','<link rel="stylesheet" href="/pre97-owner.css"><script defer src="/pre97-auth.js"></script>'],
 ['public/owner-password-reset.html','<link rel="stylesheet" href="/pre97-owner.css"><script defer src="/pre97-auth.js"></script>'],
 ['public/control-center.html','<link rel="stylesheet" href="/pre97-control.css"><script defer src="/pre97-auth.js"></script>'],
 ['public/profile-review.html','<script defer src="/pre97-conversion.js"></script>'],
 ['public/attorney-partner-tour.html','']
];
for(const [rel,extra] of inject){assert(fs.existsSync(path.join(target,rel)),`PRE96 missing reviewed page ${rel}`);injectHead(rel,css+extra)}

patch('public/control-center.html','<button class="primary">Sign in securely</button>','<button class="primary" type="submit">Sign in securely</button>');
patch('public/control-center.html','<h1>Coordinate the Smarter Justice legal network without making every portal identical.</h1>','<h1>Run the Smarter Justice network from one private owner workspace.</h1>',{required:false});
patch('public/control-center.html',/<p class="lead">Track legal-portal builds,[\s\S]*?Neutral Boardroom is dormant and non-blocking\.<\/p>/,'<p class="lead">Track releases, deployments, priorities, readiness, risks, professional systems, and owner decisions across the national Smarter Justice legal network.</p>',{required:false});
patch('public/control-center.html','<details class="details-card"><summary>Temporary development token access</summary>','<details class="details-card pre97-development-access"><summary>Legacy development token access</summary>',{required:false});
patch('public/owner-login.html',/<button class="primary">Sign in securely<\/button>/,'<button class="primary" type="submit">Sign in securely</button>',{required:false});
patch('public/professional-login.html',/<button class="primary">Sign In<\/button>/,'<button class="primary" type="submit">Sign in securely</button>',{required:false});
for(const rel of ['public/owner-password-reset.html']){let s=read(rel);s=s.replace(/<button class="primary">/g,'<button class="primary" type="submit">');write(rel,s)}

const pkg=JSON.parse(read('package.json'));pkg.version='2.0.0-pre97';pkg.description='Smarter Justice PRE97 — exact PRE96 successor with screenshot-audit UX, national directory, professional onboarding, profile presentation, and owner-auth hardening.';write('package.json',JSON.stringify(pkg,null,2)+'\n');
for(const rel of ['public/pre97-home.js','public/pre97-auth.js','public/pre97-directory.js','public/pre97-profile-fix.js','public/pre97-professional.js','public/pre97-conversion.js','server.js'])cp.execFileSync(process.execPath,['--check',path.join(target,rel)],{stdio:'inherit'});
const control=read('public/control-center.html');assert(/<button class="primary" type="submit">Sign in securely<\/button>/.test(control),'Control Center submit regression remains');
const owner=read('public/owner-login.html');assert(/type="submit">Sign in securely<\/button>/.test(owner),'owner login submit regression remains');
const directory=read('public/professionals.html');assert(!/City or borough/.test(directory),'regional City or borough wording remains in exact carrier after overlay');
const signup=read('public/professional-signup.html');assert(signup.includes('/pre97-professional.js'),'signup UX overlay missing');
const home=read('public/index.html');assert(home.includes('/pre97-home.js'),'homepage screenshot-audit overlay missing');
const linkAudit=localLinkAudit();
const changed=changedManifest();
const summary={schemaVersion:'smarter-justice.pre97.release-summary.v1',release,predecessor:{release:'v2.0.0-pre96',sha256:expectedSha,bytes:expectedBytes,overallAssertions:predecessorSummary.overallAssertions,runtimeSmokeChecks:predecessorSummary.runtimeSmokeChecks,sameOriginLinksChecked:predecessorSummary.sameOriginLinksChecked},scope:{nationalUSA:true,all50StatesAndDC:true,predecessorLoss:false},materialChanges:['homepage screenshot-audit spacing hooks','national-first professional directory labels and compact results','profile and firm duplicate-presentation normalization','account-first professional signup and claim flow','password visibility and explicit submit semantics','owner recovery spacing and security hierarchy','Control Center owner sign-in regression fix','profile-review duplicate sign-in cleanup','attorney-tour laptop density refinements'],linkAudit:{htmlFiles:linkAudit.htmlFiles,linksChecked:linkAudit.checked,missingCount:linkAudit.missing.length,missing:linkAudit.missing.slice(0,100)},changedFiles:changed,generatedAt:new Date().toISOString()};
fs.mkdirSync(path.join(target,'deployment','pre97'),{recursive:true});write('deployment/pre97/PRE97_RELEASE_SUMMARY.json',JSON.stringify(summary,null,2)+'\n');
fs.mkdirSync(outDir,{recursive:true});const out=path.join(outDir,'PRE97_DEPLOY_RUNTIME.tgz');fs.rmSync(out,{force:true});cp.execFileSync('tar',['-czf',out,'-C',target,'.'],{stdio:'inherit'});const artifact={file:path.basename(out),bytes:fs.statSync(out).size,sha256:shaFile(out),release,predecessorSha256:expectedSha,changedFiles:changed.length,linkAudit:summary.linkAudit};fs.writeFileSync(path.join(outDir,'PRE97_ARTIFACT_RECEIPT.json'),JSON.stringify(artifact,null,2)+'\n');console.log(`[PRE97 BUILD] complete ${artifact.file} sha256=${artifact.sha256} bytes=${artifact.bytes} changed=${changed.length} links=${linkAudit.checked} missing=${linkAudit.missing.length}`);
