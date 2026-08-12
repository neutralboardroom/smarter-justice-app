'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve('.runtime/smarter-justice-v1.7.98');
const required=['server.js','package.json','lib/privateAcquisitionMeasurementPre56.js','public/index.html','public/app.js','public/styles.css','public/sitemap.xml','public/measurement-privacy.html','public/private-measurement-pre56.js'];
const failures=[];
for(const rel of required)if(!fs.existsSync(path.join(root,rel)))failures.push(`MISSING_RUNTIME_${rel.replace(/[^A-Za-z0-9]+/g,'_').toUpperCase()}`);
let server='',sitemap='',moduleSource='',client='';
for(const [key,rel] of [['server','server.js'],['sitemap','public/sitemap.xml'],['moduleSource','lib/privateAcquisitionMeasurementPre56.js'],['client','public/private-measurement-pre56.js']]){
  if(fs.existsSync(path.join(root,rel))){const value=fs.readFileSync(path.join(root,rel),'utf8');if(key==='server')server=value;if(key==='sitemap')sitemap=value;if(key==='moduleSource')moduleSource=value;if(key==='client')client=value;}
}
for(const marker of ["release:'v2.0.0-pre56'","demoPathRelease:'v2.0.0-pre52'","deploymentControlRelease:'v2.0.0-pre56'","SMARTER_JUSTICE_PRE56_PRIVACY_MINIMIZED_MEASUREMENT","process.env.PORT","server.listen(port"])if(!server.includes(marker))failures.push(`SERVER_MARKER_MISSING:${marker}`);
for(const marker of ["RETENTION_DAYS=30","CONSENT_VERSION='1.0.0'","MINIMUM_RATIO_DENOMINATOR=20","thirdPartyTrackers:false","storesLegalNarratives:false","storesIpAddressInMeasurementRows:false"])if(!moduleSource.includes(marker))failures.push(`MEASUREMENT_BOUNDARY_MISSING:${marker}`);
for(const marker of ["localStorage.getItem(CONSENT_KEY)==='granted'","measurementConsent:true","/api/public/private-measurement/status","/measurement-privacy.html"])if(!client.includes(marker))failures.push(`CLIENT_CONSENT_GATE_MISSING:${marker}`);
for(const held of ['https://smarterjustice.com/portals.html','https://smarterjustice.com/growth-operations-compliance.html'])if(sitemap.includes(`<loc>${held}</loc>`))failures.push(`HELD_SITEMAP_ROUTE:${held}`);
for(const working of ['https://smarterjustice.com/navigator','https://smarterjustice.com/professionals.html','https://smarterjustice.com/professional-growth.html','https://smarterjustice.com/measurement-privacy.html'])if(!sitemap.includes(`<loc>${working}</loc>`))failures.push(`WORKING_SITEMAP_ROUTE_MISSING:${working}`);
let runtimeVersion=null;try{runtimeVersion=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;}catch{}
if(runtimeVersion!=='1.7.98')failures.push('RUNTIME_VERSION_MISMATCH');
const port=Number(String(process.env.PORT||'3000').trim());if(!Number.isInteger(port)||port<0||port>65535)failures.push('INVALID_PORT');if(process.env.RENDER&&port===0)failures.push('RENDER_PORT_MUST_BE_NONZERO');
const measurementEnabled=/^(1|true|yes|on)$/i.test(String(process.env.SJ_PRIVACY_MINIMIZED_MEASUREMENT_ENABLED||''));
if((process.env.NODE_ENV==='production'||process.env.RENDER)&&measurementEnabled&&!process.env.DATABASE_URL)failures.push('MEASUREMENT_REQUIRES_DURABLE_DATABASE');
const result={ok:failures.length===0,release:'v2.0.0-pre56',runtimeVersion,port,render:Boolean(process.env.RENDER),privacyMinimizedMeasurementEnabled:measurementEnabled,consentDefault:'not-granted',retentionDays:30,fullQualificationLocation:'BUILD_AND_CI_NOT_RUNTIME_START',failures};
console.log(JSON.stringify(result,null,2));if(failures.length)process.exit(1);
