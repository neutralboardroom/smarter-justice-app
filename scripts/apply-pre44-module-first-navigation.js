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
 h=h.replaceAll('Open focused website','Open Smarter Justice module')
    .replaceAll('Focused website','Smarter Justice module')
    .replaceAll('Focused specialty experience','Smarter Justice module')
    .replaceAll('The specialty identity and its focused tools remain available while deeper migration into the universal runtime continues.','Stay inside Smarter Justice for this legal area. Navigator and the in-house tools are connected to the same Smarter Justice experience.');
 h=h.replace(/<a[^>]+href=["']https?:\/\/[^"']+["'][^>]*>(?:Visit|Open)[^<]*(?:portal|website)[^<]*<\/a>/ig,'');
 if(!h.includes(marker))h=h.replace('</body>',`<!-- ${marker} --></body>`);
 fs.writeFileSync(p,h,'utf8');
}
const legacy=new RegExp(`https?://(?:www\\.)?(?:${routes.map(([d])=>domainPattern(d)).join('|')})`,'i');
const remaining=[];
for(const name of files){const h=fs.readFileSync(path.join(pub,name),'utf8');if(legacy.test(h))remaining.push(name);}
if(remaining.length)throw new Error('legacy micro-portal destinations remain in public HTML: '+remaining.join(','));
console.log(`[pre44-module-first] internal Smarter Justice module navigation enforced across ${files.length} HTML files; ${converted} legacy URL occurrences converted`);
