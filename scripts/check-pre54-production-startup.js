'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve('.runtime/smarter-justice-v1.7.98');
const required=['server.js','package.json','public/index.html','public/app.js','public/styles.css'];
const failures=[];
for(const rel of required) if(!fs.existsSync(path.join(root,rel))) failures.push(`MISSING_RUNTIME_${rel.replace(/[^A-Za-z0-9]+/g,'_').toUpperCase()}`);
let server='';
if(fs.existsSync(path.join(root,'server.js'))) server=fs.readFileSync(path.join(root,'server.js'),'utf8');
for(const marker of ["release:'v2.0.0-pre54'","demoPathRelease:'v2.0.0-pre52'","deploymentControlRelease:'v2.0.0-pre54'","SMARTER_JUSTICE_PRE54_PROVIDER_NATIVE_DEPLOY_CONTROL","process.env.PORT","server.listen(port"]){
  if(!server.includes(marker)) failures.push(`SERVER_MARKER_MISSING:${marker}`);
}
let runtimeVersion=null;
try{ runtimeVersion=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version; }catch{}
if(runtimeVersion!=='1.7.98') failures.push('RUNTIME_VERSION_MISMATCH');
const port=Number(String(process.env.PORT||'3000').trim());
if(!Number.isInteger(port)||port<0||port>65535) failures.push('INVALID_PORT');
if(process.env.RENDER && port===0) failures.push('RENDER_PORT_MUST_BE_NONZERO');
const result={ok:failures.length===0,release:'v2.0.0-pre54',runtimeVersion,port,render:Boolean(process.env.RENDER),fullQualificationLocation:'BUILD_AND_CI_NOT_RUNTIME_START',failures};
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exit(1);
