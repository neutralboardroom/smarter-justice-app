const assert=require('assert');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
assert.equal(sha('public/logo.svg'),'47eb6e04c9724c82afa28a2c91ef5548c1dfbf16b57549a465cd177191e3420a','approved logo identity changed');
assert.equal(sha('public/favicon.svg'),'e16bc676b4b0d93a2a0615b13426dcd4ebd32551fb8f22e6ae5104cb238a76c5','approved favicon identity changed');
const assets=['public/images/brand/smarter-justice-logo-primary.svg','public/images/brand/smarter-justice-logo-primary.png','public/images/brand/smarter-justice-mark.svg','public/images/brand/smarter-justice-mark-512.png','public/images/brand/favicon-32.png','public/images/brand/favicon-48.png','public/images/brand/apple-touch-icon.png','public/images/brand/icon-192.png','public/images/brand/icon-512.png','public/images/brand/smarter-justice-social.png','public/images/brand/BRAND_ASSETS.md','public/site.webmanifest'];
for(const file of assets){assert(fs.existsSync(path.join(root,file)),`${file} missing`);assert(fs.statSync(path.join(root,file)).size>200,`${file} empty`);}
const brand=read('public/images/brand/BRAND_ASSETS.md');assert(/approved repository assets/i.test(brand)&&/No third-party logo/i.test(brand));
const manifest=JSON.parse(read('public/site.webmanifest'));assert.equal(manifest.name,'Smarter Justice');assert.equal(manifest.icons.length,2);
const css=read('public/styles.css');const classic=css.slice(css.lastIndexOf('v1.7.19 classic bright professional visual system'));
for(const token of ['--bg:#f7f9fa','background:#fff!important','border-radius:8px','prefers-reduced-motion','outline:3px solid var(--focus)'])assert(classic.includes(token),`missing classic token ${token}`);
assert(!/radial-gradient|linear-gradient/.test(classic),'ordinary v1.7.19 visual override must not introduce page gradients');
const htmlFiles=fs.readdirSync(path.join(root,'public')).filter(x=>x.endsWith('.html'));
assert.equal(htmlFiles.length,77);
for(const name of htmlFiles){const html=read(`public/${name}`);for(const ref of ['/favicon.svg','/images/brand/favicon-32.png','/images/brand/favicon-48.png','/images/brand/apple-touch-icon.png','/site.webmanifest'])assert(html.includes(ref),`${name} missing ${ref}`);}
console.log('v1.7.19 classic visual system, approved logo preservation, complete brand assets, metadata, focus, and reduced-motion tests passed.');
