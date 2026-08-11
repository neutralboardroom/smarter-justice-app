'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const serverPath=path.join(root,'server.js');
const sitemapPath=path.join(root,'public','sitemap.xml');
const MARK='SMARTER_JUSTICE_PRE55_PROTECTED_CREDENTIAL_ROTATION_DRILL';
if(!fs.existsSync(serverPath)) throw new Error(`PRE55 missing runtime server: ${serverPath}`);
let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes(MARK)){
  for(const required of ["release:'v2.0.0-pre54'","demoPathRelease:'v2.0.0-pre52'","deploymentControlRelease:'v2.0.0-pre54'","marker:'SMARTER_JUSTICE_PRE54_PROVIDER_NATIVE_DEPLOY_CONTROL'"]){
    if(!server.includes(required)) throw new Error(`PRE55 requires qualified pre54 marker: ${required}`);
  }
  server=server.replace("release:'v2.0.0-pre54'","release:'v2.0.0-pre55'");
  server=server.replace("deploymentControlRelease:'v2.0.0-pre54'","deploymentControlRelease:'v2.0.0-pre55'");
  server=server.replace("marker:'SMARTER_JUSTICE_PRE54_PROVIDER_NATIVE_DEPLOY_CONTROL'",`marker:'${MARK}'`);
  const seam='    // SMARTER_JUSTICE_PRE54_PROVIDER_NATIVE_DEPLOY_CONTROL: provider terminal status and accepted-live rollback identity are verified outside the public runtime.';
  if(!server.includes(seam)) throw new Error('PRE55 release-identity comment seam missing');
  server=server.replace(seam,`${seam}\n    // ${MARK}: time-bounded credential rotation is protected, redacted and outside the public runtime.`);
  fs.writeFileSync(serverPath,server,'utf8');
}
if(!fs.existsSync(sitemapPath)) throw new Error(`PRE55 missing runtime sitemap: ${sitemapPath}`);
let sitemap=fs.readFileSync(sitemapPath,'utf8');
sitemap=sitemap.replace(/\s*<url><loc>https:\/\/smarterjustice\.com\/portals\.html<\/loc><\/url>/g,'');
const working=[
  'https://smarterjustice.com/navigator',
  'https://smarterjustice.com/professionals.html',
  'https://smarterjustice.com/professional-growth.html',
  'https://smarterjustice.com/attorney-call-tour.html',
  'https://smarterjustice.com/community-resources.html',
  'https://smarterjustice.com/es/'
];
for(const url of working){
  if(!sitemap.includes(`<loc>${url}</loc>`)) sitemap=sitemap.replace('</urlset>',`  <url><loc>${url}</loc></url>\n</urlset>`);
}
if(sitemap.includes('<loc>https://smarterjustice.com/portals.html</loc>')) throw new Error('PRE55 sitemap still exposes held portals route');
if(sitemap.includes('<loc>https://smarterjustice.com/growth-operations-compliance.html</loc>')) throw new Error('PRE55 sitemap exposes held growth route');
fs.writeFileSync(sitemapPath,sitemap,'utf8');
console.log('PRE55_PROTECTED_CREDENTIAL_ROTATION_AND_ACQUISITION_CONTINUITY_APPLIED');
