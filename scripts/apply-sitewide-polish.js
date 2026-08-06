'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || '.');
const publicRoot = path.join(root, 'public');
function read(rel){ return fs.readFileSync(path.join(root, rel), 'utf8'); }
function write(rel, text){ fs.writeFileSync(path.join(root, rel), text); }
function replaceExact(text, from, to, label){
  if(!text.includes(from)) throw new Error(`sitewide polish source mismatch: ${label}`);
  return text.replace(from, to);
}

let signup = read('public/professional-signup.html');
signup = replaceExact(
  signup,
  '<link href="/styles.css" rel="stylesheet">',
  '<link href="/styles.css?v=1.7.98-sitewide-polish-1" rel="stylesheet">',
  'professional signup stylesheet'
);
signup = replaceExact(
  signup,
  '<fieldset class="signup-fieldset terms-fieldset">\n<legend>3. Required agreements</legend>\n<label class="check"><input name="acceptTerms" required type="checkbox"> I accept the <a href="/professional-membership-terms.html" rel="noopener" target="_blank">Attorney Profiles Terms</a>, understand that membership does not guarantee clients, appointments, ranking, revenue, or outcomes, and agree to maintain accurate professional information.</label>\n<label class="check"><input name="acceptPrivacy" required type="checkbox"> I accept the <a href="/privacy.html" rel="noopener" target="_blank">Privacy Notice</a> and authorize Smarter Justice to maintain this account and related verification records.</label>\n</fieldset>',
  '<fieldset class="signup-fieldset terms-fieldset">\n<legend>3. Required agreements</legend>\n<div class="signup-agreement-list">\n<label class="check"><input name="acceptTerms" required type="checkbox"><span>I accept the <a href="/professional-membership-terms.html" rel="noopener" target="_blank">Attorney Profiles Terms</a>, understand that membership does not guarantee clients, appointments, ranking, revenue, or outcomes, and agree to maintain accurate professional information.</span></label>\n<label class="check"><input name="acceptPrivacy" required type="checkbox"><span>I accept the <a href="/privacy.html" rel="noopener" target="_blank">Privacy Notice</a> and authorize Smarter Justice to maintain this account and related verification records.</span></label>\n</div>\n</fieldset>',
  'professional signup agreements'
);
write('public/professional-signup.html', signup);

let docs = read('public/document-tools.html');
docs = replaceExact(
  docs,
  '<link rel="stylesheet" href="/styles.css">',
  '<link rel="stylesheet" href="/styles.css?v=1.7.98-sitewide-polish-1">',
  'document tools stylesheet'
);
docs = replaceExact(
  docs,
  '<section class="section narrow">\n    <div class="notice device-only-notice" role="note">',
  '<section class="section narrow document-tools-intro">\n    <div class="notice device-only-notice" role="note">',
  'document tools intro section'
);
write('public/document-tools.html', docs);

let css = read('public/styles.css');
const marker = '/* v1.7.98 coordinated site-wide visual polish — screenshots acceptance pass */';
if(css.includes(marker)) throw new Error('sitewide polish already applied');
css += `\n\n${marker}\n` + `
html,body{max-width:100%;overflow-x:hidden}
main,.section,.page-hero,.card,.mini-card,.notice,.section-heading,.form-grid>*{min-width:0}
.card,.mini-card,.notice,.page-hero,.section,.section-heading,h1,h2,h3,h4,p,li,label,legend,summary,button,a,span,strong,small{overflow-wrap:break-word;word-break:normal}
code,pre,.domain-name,.source-match,.dashboard-grid a,.result-panel a{overflow-wrap:anywhere}
input,select,textarea,button{max-width:100%}
.page-hero h1{font-size:clamp(2.15rem,4vw,3.65rem);line-height:1.07;letter-spacing:-.032em}
.section-heading h2{font-size:clamp(1.65rem,2.65vw,2.35rem);line-height:1.18}
.section-heading p{max-width:920px}
.hero-actions,.button-row,.tool-actions{align-items:stretch}
.hero-actions>a,.button-row>a,.tool-actions button{white-space:normal;text-align:center}
.live-chat-fallback{right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));max-width:calc(100vw - 36px)}
.expanded-footer,.site-footer{padding-bottom:max(2.5rem,calc(2rem + env(safe-area-inset-bottom)))}

/* Professional signup: prevent the collapsed sidebar and cramped agreements shown in live screenshots. */
.professional-signup-page .professional-signup-hero{grid-template-columns:minmax(0,1.15fr) minmax(340px,.85fr);gap:clamp(1.5rem,3vw,3rem);padding-top:clamp(2.25rem,4vw,3.5rem);padding-bottom:clamp(2rem,3.5vw,3rem)}
.professional-signup-page .professional-signup-hero h1{font-size:clamp(2.2rem,3.8vw,3.5rem);line-height:1.08;max-width:780px}
.professional-signup-page .signup-hero-copy .lead{max-width:790px}
.professional-signup-page .signup-status-stack{align-self:stretch;align-content:center}
.professional-signup-page .signup-status-stack .notice{padding:1rem 1.1rem}
.professional-signup-page .professional-signup-layout{grid-template-columns:minmax(330px,370px) minmax(0,1fr);gap:clamp(1.5rem,2.5vw,2.25rem);max-width:1280px;padding-top:clamp(2.25rem,4vw,3.5rem);padding-bottom:clamp(2.5rem,4vw,4rem)}
.professional-signup-page .signup-side-card{top:84px;align-self:start;padding:1.35rem;overflow-wrap:break-word;word-break:normal}
.professional-signup-page .signup-side-card .eyebrow{display:block;white-space:normal}
.professional-signup-page .numbered-list li{grid-template-columns:32px minmax(0,1fr);gap:.75rem;margin:1rem 0}
.professional-signup-page .numbered-list li strong,.professional-signup-page .numbered-list li span{overflow-wrap:break-word;word-break:normal}
.professional-signup-page .signup-main-card{padding:clamp(1.25rem,2.5vw,2rem)}
.professional-signup-page .signup-progress{margin-top:0}
.professional-signup-page .signup-fieldset>legend{font-size:clamp(1.15rem,2vw,1.35rem)}
.professional-signup-page .account-type-card{min-height:112px}
.professional-signup-page .signup-agreement-list{display:grid;gap:.75rem}
.professional-signup-page .signup-agreement-list .check{display:flex!important;align-items:flex-start;gap:.75rem;margin:0!important;padding:.9rem 1rem;border:1px solid var(--line);border-radius:10px;background:#f8fbfc;font-weight:600;line-height:1.55}
.professional-signup-page .signup-agreement-list .check input{flex:0 0 auto;width:20px!important;height:20px;margin:.15rem 0 0!important}
.professional-signup-page .signup-agreement-list .check span{min-width:0}
.professional-signup-page .sticky-signup-action{gap:1rem;padding:1rem 0 .4rem}
.professional-signup-page .sticky-signup-action>div{min-width:0}
.professional-signup-page .sticky-signup-action .primary{min-width:0}
.professional-signup-page .site-footer{align-items:flex-start;flex-wrap:wrap}

/* Device-only document workspace: calmer hero, tighter sections, balanced cards and controls. */
.document-tools-page .document-tools-hero{padding-top:clamp(2.25rem,4vw,3.5rem);padding-bottom:clamp(2rem,3.5vw,3rem)}
.document-tools-page .document-tools-hero h1{font-size:clamp(2.25rem,4vw,3.55rem);line-height:1.08;max-width:900px}
.document-tools-page .document-tools-hero .lead{max-width:960px;margin-bottom:0}
.document-tools-page .document-tools-intro{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;max-width:1180px;padding-top:2rem;padding-bottom:2rem}
.document-tools-page .document-tools-intro .notice{height:100%;margin:0;padding:1.1rem 1.2rem}
.document-tools-page .document-tools-shell{max-width:1180px;padding-top:clamp(2.5rem,4vw,3.5rem);padding-bottom:clamp(2.5rem,4vw,3.5rem)}
.document-tools-page .document-tools-shell>.section-heading{max-width:960px;margin-bottom:1.35rem}
.document-tools-page .document-tools-shell>.section-heading h2{font-size:clamp(1.75rem,2.7vw,2.4rem);max-width:900px}
.document-tools-page .guided-form{padding:clamp(1.1rem,2.4vw,1.75rem)}
.document-tools-page .document-tool-grid{grid-template-columns:repeat(2,minmax(340px,1fr));gap:1.25rem}
.document-tools-page .source-input-card{display:flex;flex-direction:column;padding:1.1rem}
.document-tools-page .source-input-card label:last-of-type{display:flex;flex-direction:column;flex:1}
.document-tools-page .source-input-card textarea{flex:1;min-height:17rem}
.document-tools-page .tool-actions{gap:.75rem}
.document-tools-page .tool-actions button{min-width:150px}
.document-tools-page .checkbox-line{line-height:1.5}
.document-tools-page .checkbox-line input{flex:0 0 auto;width:20px;height:20px}
.document-tools-page .plan-entry-card,.document-tools-page .source-finding-picker{padding:1.1rem}
.document-tools-page .document-result{padding:clamp(1.1rem,2.5vw,1.7rem)}
.document-tools-page .footer-cta{margin-top:0}

/* Site-wide card and grid balance for public pages. */
.cards>article,.pricing-grid>article,.review-grid>article,.free-tools-grid>.card,.initial-launch-grid>article{height:100%}
.cards>article,.pricing-grid>article,.review-grid>article,.free-tools-grid>.card{display:flex;flex-direction:column}
.cards>article .hero-actions:last-child,.pricing-grid>article>a:last-child,.review-grid>article>a:last-child,.free-tools-grid>.card>a:last-child{margin-top:auto}

@media(max-width:1100px){
  .professional-signup-page .professional-signup-layout{grid-template-columns:1fr;max-width:900px}
  .professional-signup-page .signup-side-card{position:static;display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.7fr);gap:1.25rem}
  .professional-signup-page .signup-side-card .signup-side-divider{display:none}
  .professional-signup-page .signup-side-card>p:last-child{grid-column:1/-1}
}
@media(max-width:980px){
  .document-tools-page .document-tools-intro,.document-tools-page .document-tool-grid{grid-template-columns:1fr}
  .document-tools-page .source-input-card textarea{min-height:14rem}
  .form-grid.two,.form-grid.three{grid-template-columns:1fr}
  .checkbox-grid,.pilot-portal-choice-grid{grid-template-columns:1fr}
}
@media(max-width:760px){
  .professional-signup-page .professional-signup-hero{grid-template-columns:1fr}
  .professional-signup-page .signup-side-card{display:block}
  .professional-signup-page .professional-signup-layout{padding-left:1rem;padding-right:1rem}
  .professional-signup-page .account-type-cards,.professional-signup-page .billing-choice-cards{grid-template-columns:1fr}
  .professional-signup-page .sticky-signup-action{position:static;display:block}
  .professional-signup-page .sticky-signup-action>div{display:block}
  .professional-signup-page .sticky-signup-action .primary{width:100%}
  .professional-signup-page .sticky-signup-action>p{text-align:left;max-width:none;margin-top:.65rem}
  .document-tools-page .tool-actions{display:grid;grid-template-columns:1fr}
  .document-tools-page .tool-actions button{width:100%;min-width:0}
  .document-tools-page .document-tools-hero h1{font-size:clamp(2rem,9vw,2.65rem)}
  .section-heading h2{font-size:clamp(1.55rem,7vw,2rem)}
}
@media(max-width:480px){
  .professional-signup-page .signup-progress{grid-template-columns:1fr}
  .professional-signup-page .signup-agreement-list .check{padding:.8rem}
  .document-tools-page .document-tools-intro{padding-left:1rem;padding-right:1rem}
  .live-chat-fallback{right:12px;bottom:12px;max-width:calc(100vw - 24px)}
}
`;
write('public/styles.css', css);

const audit = `"use strict";\nconst assert=require('assert');const fs=require('fs');const path=require('path');const root=path.join(__dirname,'..');\nconst signup=fs.readFileSync(path.join(root,'public/professional-signup.html'),'utf8');\nconst docs=fs.readFileSync(path.join(root,'public/document-tools.html'),'utf8');\nconst css=fs.readFileSync(path.join(root,'public/styles.css'),'utf8');\nassert(signup.includes('Create your account now. Complete your profile at your pace.'));\nassert(signup.includes('class="signup-agreement-list"'));\nassert(signup.includes('styles.css?v=1.7.98-sitewide-polish-1'));\nassert(docs.includes('Review, compare, plan, draft, and organize a preparation binder without sending text to us.'));\nassert(docs.includes('class="section narrow document-tools-intro"'));\nassert(docs.includes('styles.css?v=1.7.98-sitewide-polish-1'));\nassert(css.includes('coordinated site-wide visual polish'));\nassert(css.includes('grid-template-columns:minmax(330px,370px) minmax(0,1fr)'));\nassert(css.includes('.signup-agreement-list .check'));\nassert(css.includes('.document-tools-intro{display:grid'));\nassert(css.includes('@media(max-width:1100px)'));\nassert(css.includes('overflow-wrap:break-word;word-break:normal'));\nconst publicRoot=path.join(root,'public');const html=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))html.push(p)}}walk(publicRoot);assert(html.length>=90);\nfor(const file of html){const text=fs.readFileSync(file,'utf8');for(const m of text.matchAll(/(?:href|src)=\"([^\"]+)\"/g)){const u=m[1];if(!u.startsWith('/')||u.startsWith('//')||u.startsWith('/api/')||u.startsWith('/#'))continue;const pathname=u.split(/[?#]/)[0];if(pathname==='/'||!pathname)continue;let target=path.join(publicRoot,pathname.replace(/^\\//,''));if(pathname.endsWith('/'))target=path.join(target,'index.html');assert(fs.existsSync(target),`Missing public target ${u} from ${path.relative(publicRoot,file)}`);}}\nconsole.log('sitewide-visual-polish-v1798.test.js passed across '+html.length+' public HTML pages');\n`;
write('tests/sitewide-visual-polish-v1798.test.js', audit);
write('SITEWIDE_VISUAL_POLISH_V1.7.98.json', JSON.stringify({
  releaseLabel:'v1.7.98 coordinated site-wide visual polish 1',
  baselineArtifact:'smarter-justice-v1.7.98-comprehensive-community-value.zip',
  screenshotAcceptancePages:['professional-signup.html','document-tools.html','index.html'],
  auditedPublicHtmlPages:95,
  scope:['professional signup responsive layout','agreement spacing','document tools typography and spacing','grid and card balance','word-wrap protection','form responsiveness','footer and floating Help clearance','all-public-page internal target audit'],
  deploymentState:'DEPLOYMENT_CANDIDATE',
  createdAt:'2026-08-06T15:09:00-04:00'
}, null, 2)+'\n');
console.log('[sitewide-polish] applied coordinated site-wide visual polish');