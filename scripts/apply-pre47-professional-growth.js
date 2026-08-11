'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const pub=path.join(root,'public'),src=path.resolve(__dirname,'..','public');
for(const name of ['professional-growth.html','professional-growth.js','marketing-compliance-pre47-data.js']){
  const from=path.join(src,name),to=path.join(pub,name);
  if(!fs.existsSync(from))throw new Error(`Missing pre47 payload ${name}`);
  fs.copyFileSync(from,to);
}
function inject(file,needle,replacement,marker){
  const p=path.join(pub,file); if(!fs.existsSync(p))throw new Error(`Missing runtime page ${file}`);
  let s=fs.readFileSync(p,'utf8'); if(s.includes(marker))return;
  if(!s.includes(needle))throw new Error(`Pre47 injection anchor missing in ${file}`);
  s=s.replace(needle,replacement); fs.writeFileSync(p,s);
}
{
  const file='professional-membership.html', p=path.join(pub,file); if(!fs.existsSync(p))throw new Error(`Missing runtime page ${file}`);
  let s=fs.readFileSync(p,'utf8');
  if(!s.includes('SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH_CTA')){
    if(s.includes('<a href="#plans">Plans</a>')) s=s.replace('<a href="#plans">Plans</a>','<!-- SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH_CTA --><a href="/professional-growth.html">Growth Workspace</a><a href="#plans">Plans</a>');
    else if(s.includes('<a href="/professionals.html">Find or Claim Profile</a>')) s=s.replace('<a href="/professionals.html">Find or Claim Profile</a>','<a href="/professionals.html">Find or Claim Profile</a><!-- SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH_CTA --><a href="/professional-growth.html">Growth Workspace</a>');
    else s=s.replace('<main id="main">','<!-- SMARTER_JUSTICE_PRE47_PROFESSIONAL_GROWTH_CTA --><main id="main">');
  }
  if(!s.includes('Open the Professional Growth Workspace')){
    const block='<section class="section narrow"><div class="card"><p class="eyebrow">Use now</p><h2>Open the Professional Growth Workspace</h2><p>Run a browser-local, source-linked marketing compliance preflight, download a review receipt, open Professional Navigator, and connect your profile work in one place.</p><a class="primary link-btn" href="/professional-growth.html">Open Growth Workspace</a></div></section>';
    const anchors=['<section class="section narrow"><div class="card" data-launch-status','<section class="section" id="plans">'];
    const anchor=anchors.find(a=>s.includes(a)); if(!anchor)throw new Error('Pre47 membership insertion anchor missing');
    s=s.replace(anchor,block+anchor);
  }
  fs.writeFileSync(p,s);
}
for(const file of ['attorney-partner-tour.html','attorney-call-tour.html']){
  const p=path.join(pub,file); if(!fs.existsSync(p))continue;
  let s=fs.readFileSync(p,'utf8');
  if(!s.includes('SMARTER_JUSTICE_PRE47_GROWTH_LINK')){
    const close='</main>';
    if(!s.includes(close))throw new Error(`Pre47 tour anchor missing in ${file}`);
    s=s.replace(close,'<section class="section narrow"><div class="card"><!-- SMARTER_JUSTICE_PRE47_GROWTH_LINK --><p class="eyebrow">Professional tools</p><h2>See what your firm can use now.</h2><p>Open the Growth Workspace for a source-linked marketing preflight and Professional Navigator.</p><a class="secondary link-btn" href="/professional-growth.html">Open Growth Workspace</a></div></section>'+close);
    fs.writeFileSync(p,s);
  }
}

{
  const p=path.join(pub,'growth-operations-compliance.html');
  if(fs.existsSync(p)){
    let s=fs.readFileSync(p,'utf8');
    if(!s.includes('SMARTER_JUSTICE_PRE47_WORKING_PREFLIGHT_LINK')){
      const block='<section class="section narrow"><div class="card"><!-- SMARTER_JUSTICE_PRE47_WORKING_PREFLIGHT_LINK --><p class="eyebrow">Working compliance tool</p><h2>Run the marketing preflight before publication.</h2><p>Use the browser-local, source-linked preflight for selected current New York, Florida, and Texas issues. Unmapped or uncertain questions require human review.</p><a class="primary link-btn" href="/professional-growth.html#marketing-preflight">Run Marketing Preflight</a></div></section>';
      if(!s.includes('</main>'))throw new Error('Pre47 GOC insertion anchor missing');
      s=s.replace('</main>',block+'</main>');
      fs.writeFileSync(p,s);
    }
  }
}

console.log('PRE47_PROFESSIONAL_GROWTH_APPLIED');
