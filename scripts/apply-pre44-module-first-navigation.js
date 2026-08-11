'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),pub=path.join(root,'public');
const marker='SMARTER_JUSTICE_PRE44_MODULE_FIRST_NAVIGATION';
const map=new Map([
 ['divorcelawaid.com','/divorce'],['www.divorcelawaid.com','/divorce'],
 ['personalinjurylawaid.com','/personal-injury'],['www.personalinjurylawaid.com','/personal-injury'],
 ['medicalmalpracticeaid.com','/medical-malpractice'],['www.medicalmalpracticeaid.com','/medical-malpractice'],
 ['medicalmalpracticelawaid.com','/medical-malpractice'],['www.medicalmalpracticelawaid.com','/medical-malpractice'],
 ['civilrightslawaid.com','/civil-rights'],['www.civilrightslawaid.com','/civil-rights'],
 ['employmentlawaid.com','/employment'],['www.employmentlawaid.com','/employment'],
 ['businesslawaid.com','/business-law'],['www.businesslawaid.com','/business-law'],
 ['realestatelawaid.com','/real-estate'],['www.realestatelawaid.com','/real-estate'],
 ['consumerprotectionlawaid.com','/consumer-protection'],['www.consumerprotectionlawaid.com','/consumer-protection'],
 ['estatelawaid.com','/estate'],['www.estatelawaid.com','/estate'],
 ['eldercarelawaid.com','/elder-law'],['www.eldercarelawaid.com','/elder-law'],
 ['disabilitylawaid.com','/disability'],['www.disabilitylawaid.com','/disability'],
 ['veteranslawaid.com','/veterans'],['www.veteranslawaid.com','/veterans'],
 ['immigrationoasis.com','/immigration'],['www.immigrationoasis.com','/immigration']
]);
const legacyDomain=/https?:\/\/(?:www\.)?(?:divorcelawaid|personalinjurylawaid|medicalmalpractice(?:law)?aid|civilrightslawaid|employmentlawaid|businesslawaid|realestatelawaid|consumerprotectionlawaid|estatelawaid|eldercarelawaid|disabilitylawaid|veteranslawaid|immigrationoasis)\.com\/?[^"'\s<]*/ig;
const files=fs.readdirSync(pub).filter(n=>n.endsWith('.html'));
let converted=0;
for(const name of files){
 const p=path.join(pub,name);let h=fs.readFileSync(p,'utf8');
 h=h.replace(/href=["'](https?:\/\/[^"']+)["']/ig,(all,url)=>{try{const u=new URL(url);const dest=map.get(u.hostname.toLowerCase());if(dest){converted++;return `href="${dest}"`}}catch{}return all});
 h=h.replaceAll('Open focused website','Open Smarter Justice module')
    .replaceAll('Focused website','Smarter Justice module')
    .replaceAll('Focused specialty experience','Smarter Justice module')
    .replaceAll('The specialty identity and its focused tools remain available while deeper migration into the universal runtime continues.','Stay inside Smarter Justice for this legal area. Navigator and the in-house tools are connected to the same Smarter Justice experience.');
 h=h.replace(/<a[^>]+href=["']https?:\/\/[^"']+["'][^>]*>(?:Visit|Open)[^<]*(?:portal|website)[^<]*<\/a>/ig,'');
 h=h.replace(legacyDomain,'');
 if(!h.includes(marker))h=h.replace('</body>',`<!-- ${marker} --></body>`);
 fs.writeFileSync(p,h,'utf8');
}
const remaining=[];
for(const name of files){const h=fs.readFileSync(path.join(pub,name),'utf8');if(legacyDomain.test(h))remaining.push(name);legacyDomain.lastIndex=0;}
if(remaining.length)throw new Error('legacy micro-portal destinations remain in public HTML: '+remaining.join(','));
console.log(`[pre44-module-first] internal Smarter Justice module navigation enforced across ${files.length} HTML files; ${converted} legacy destinations converted`);
