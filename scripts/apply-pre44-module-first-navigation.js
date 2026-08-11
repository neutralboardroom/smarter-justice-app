'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),pub=path.join(root,'public');
const marker='SMARTER_JUSTICE_PRE44_MODULE_FIRST_NAVIGATION';
const routes=[
 ['divorcelawaid.com','/divorce'],['personalinjurylawaid.com','/personal-injury'],['medicalmalpracticeaid.com','/medical-malpractice'],['medicalmalpracticelawaid.com','/medical-malpractice'],['civilrightslawaid.com','/civil-rights'],['employmentlawaid.com','/employment'],['businesslawaid.com','/business-law'],['realestatelawaid.com','/real-estate'],['consumerprotectionlawaid.com','/consumer-protection'],['estatelawaid.com','/estate'],['eldercarelawaid.com','/elder-law'],['disabilitylawaid.com','/disability'],['veteranslawaid.com','/veterans'],['immigrationoasis.com','/immigration']
];
const domainPattern=d=>d.split('.').join('\\.');
const files=fs.readdirSync(pub).filter(n=>n.endsWith('.html'));
let converted=0;
for(const name of files){
 const p=path.join(pub,name);let h=fs.readFileSync(p,'utf8');
 for(const [domain,dest] of routes){
   const re=new RegExp(`https?:\\/\\/(?:www\\.)?${domainPattern(domain)}(?:\\/[^"'\\s<]*)?`,'ig');
   h=h.replace(re,()=>{converted++;return dest});
 }
 h=h.replace(/open\s+focused\s+website/ig,'Open Smarter Justice module')
    .replace(/focused\s+website/ig,'Smarter Justice module')
    .replace(/focused\s+specialty\s+experience/ig,'Smarter Justice module')
    .replace(/focused\s+portal/ig,'Smarter Justice module')
    .replace(/deeper\s+migration\s+into\s+the\s+universal\s+runtime/ig,'continued improvement inside Smarter Justice')
    .replace(/The specialty identity and its focused tools remain available while continued improvement inside Smarter Justice continues\./ig,'Stay inside Smarter Justice for this legal area. Navigator and the in-house tools are connected to the same Smarter Justice experience.');
 h=h.replace(/<a[^>]+href=["']https?:\/\/[^"']+["'][^>]*>(?:Visit|Open)[^<]*(?:portal|website)[^<]*<\/a>/ig,'');
 if(!h.includes(marker))h=h.replace('</body>',`<!-- ${marker} --></body>`);
 fs.writeFileSync(p,h,'utf8');
}
const legacy=new RegExp(`https?://(?:www\\.)?(?:${routes.map(([d])=>domainPattern(d)).join('|')})`,'i');
const staleLanguage=/open\s+focused\s+website|focused\s+website|focused\s+portal|deeper\s+migration\s+into\s+the\s+universal\s+runtime/i;
const remaining=[];
for(const name of files){const h=fs.readFileSync(path.join(pub,name),'utf8');if(legacy.test(h)||staleLanguage.test(h))remaining.push(name);}
if(remaining.length)throw new Error('legacy micro-portal destinations/language remain in public HTML: '+remaining.join(','));
console.log(`[pre44-module-first] internal Smarter Justice module navigation enforced across ${files.length} HTML files; ${converted} legacy URL occurrences converted`);
