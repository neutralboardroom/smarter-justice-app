'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const pub=path.join(root,'public');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
function countHtml(dir){let n=0;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())n+=countHtml(p);else if(e.name.endsWith('.html'))n++;}return n;}
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.version,'2.0.0-pre97','candidate package must be PRE97');
const release=JSON.parse(read('deployment/pre97/PRE97_RELEASE_SUMMARY.json'));
assert.equal(release.release,'v2.0.0-pre97');
assert.equal(release.predecessor.sha256,'a506ac9c1c0447b97f412da30341ea616e089be423a3c43addf6ca3813f7a9bc');
assert.equal(release.predecessor.bytes,14393357);
assert.equal(release.predecessor.overallAssertions,665);
assert.equal(release.predecessor.runtimeSmokeChecks,177);
assert.equal(release.predecessor.sameOriginLinksChecked,6005);
assert.equal(release.scope.nationalUSA,true);
assert.equal(release.scope.all50StatesAndDC,true);
assert.equal(release.scope.predecessorLoss,false);
assert.equal(release.linkAudit.reviewedPageMissingCount,0);
assert.equal(countHtml(pub),168,'PRE97 must preserve 168 HTML surfaces');
for(const rel of [
  'public/pre97-polish.css','public/pre97-home.css','public/pre97-home.js','public/pre97-auth.js',
  'public/pre97-directory.js','public/pre97-profile-fix.js','public/pre97-professional.js',
  'public/pre97-conversion.js','public/pre97-owner.css','public/pre97-control.css','public/pre97-owner-recovery.js',
  'governance/current/ROGER_RULE_PROACTIVE_PAGE_BY_PAGE_AUDIT.md',
  'deployment/pre97/PRE97_SCREENSHOT_AUDIT_RECEIPT.md','deployment/pre97/PRE97_NEXT_VERSION_IMPROVEMENT_LIST.md'
]) assert(exists(rel),`missing PRE97 file: ${rel}`);
const home=read('public/index.html');
assert(home.includes('/pre97-home.js')&&home.includes('/pre97-home.css'),'homepage PRE97 hooks missing');
assert(/across the united states|national u\.s\.|all 50 states/i.test(home),'homepage must retain national U.S. positioning');
const directory=read('public/professionals.html');
assert(directory.includes('/pre97-directory.js'),'directory overlay missing');
assert(!/City or borough/.test(directory),'directory must not use borough-specific general label');
assert(!/placeholder=["']Kings County/i.test(directory),'directory must not use NY-specific county placeholder');
assert(/additional qualified connectors can be added nationally/i.test(directory),'directory must explain jurisdiction connector as national expansion');
const owner=read('public/owner-login.html');
assert(/<button[^>]+type=["']submit["'][^>]*>Sign in securely<\/button>/i.test(owner),'owner login must have explicit submit button');
assert(owner.includes('/pre97-auth.js'),'owner login auth hardening missing');
const control=read('public/control-center.html');
assert(/<button[^>]+type=["']submit["'][^>]*>Sign in securely<\/button>/i.test(control),'Control Center login must have explicit submit button');
assert(control.includes('/pre97-control.css')&&control.includes('/pre97-auth.js'),'Control Center PRE97 assets missing');
const recovery=read('public/owner-password-reset.html');
assert(recovery.includes('/pre97-owner-recovery.js')&&recovery.includes('/pre97-owner.css'),'owner recovery PRE97 assets missing');
assert(/one-time (?:hosting|render) recovery/i.test(recovery),'owner recovery one-time path missing');
const signup=read('public/professional-signup.html');
assert(signup.includes('/pre97-professional.js'),'signup PRE97 behavior missing');
assert(!/type=["']file["']/i.test(signup),'professional signup must not invite confidential file uploads');
assert(/claimProfessionalId|claimFirmId/.test(signup),'signup must preserve claim context controls');
const profile=read('public/professional-profile.html'),firm=read('public/firm-profile.html');
assert(profile.includes('/pre97-profile-fix.js')&&firm.includes('/pre97-profile-fix.js'),'profile normalization overlay missing');
const review=read('public/profile-review.html');
assert(review.includes('/pre97-conversion.js'),'profile review conversion cleanup missing');
const tour=read('public/attorney-partner-tour.html');
assert(tour.includes('/pre97-polish.css'),'Attorney Partner Tour PRE97 styling missing');
for(const js of fs.readdirSync(pub).filter(n=>/^pre97-.*\.js$/.test(n))){const s=read('public/'+js);assert(!/eval\s*\(|new Function\s*\(/.test(s),`${js} must not use dynamic code execution`);}
assert.equal(sha('governance/current/ROGER_RULE_PROACTIVE_PAGE_BY_PAGE_AUDIT.md').length,64);
console.log(`pre97-screenshot-audit.test.js passed: 168 pages, ${release.linkAudit.linksChecked} local links audited, ${release.changedFiles.length} changed-file receipts`);
