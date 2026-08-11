'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const pub=path.join(root,'public'), src=path.resolve(__dirname,'..','public');
for(const name of ['portals.html','attorney-partner-tour.html','attorney-partner-tour.js','attorney-call-tour.html']){
  const from=path.join(src,name),to=path.join(pub,name); if(!fs.existsSync(from))throw new Error(`Missing pre45 payload ${name}`); fs.copyFileSync(from,to);
}
// Replace only the obsolete navigation label/link; preserve the rest of each page.
for(const name of fs.readdirSync(pub).filter(n=>n.endsWith('.html'))){
  const p=path.join(pub,name); let s=fs.readFileSync(p,'utf8');
  const next=s.replace(/<a href="\/portals\.html">Portals<\/a>/g,'<a href="/practice-areas.html">Legal areas</a>');
  if(next!==s)fs.writeFileSync(p,next);
}
console.log('PRE45_PUBLIC_ALIGNMENT_APPLIED');
