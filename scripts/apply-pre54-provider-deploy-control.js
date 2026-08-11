'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const serverPath=path.join(root,'server.js');
const MARK='SMARTER_JUSTICE_PRE54_PROVIDER_NATIVE_DEPLOY_CONTROL';
if(!fs.existsSync(serverPath)) throw new Error(`PRE54 missing runtime server: ${serverPath}`);
let s=fs.readFileSync(serverPath,'utf8');
if(!s.includes(MARK)){
  for(const required of ["release:'v2.0.0-pre53'","demoPathRelease:'v2.0.0-pre52'","deploymentControlRelease:'v2.0.0-pre53'","marker:'SMARTER_JUSTICE_PRE53_RENDER_STARTUP_AND_LIVE_GATE'"]){
    if(!s.includes(required)) throw new Error(`PRE54 requires qualified pre53 marker: ${required}`);
  }
  s=s.replace("release:'v2.0.0-pre53'","release:'v2.0.0-pre54'");
  s=s.replace("deploymentControlRelease:'v2.0.0-pre53'","deploymentControlRelease:'v2.0.0-pre54'");
  s=s.replace("marker:'SMARTER_JUSTICE_PRE53_RENDER_STARTUP_AND_LIVE_GATE'",`marker:'${MARK}'`);
  const seam='    // SMARTER_JUSTICE_PRE53_RENDER_STARTUP_AND_LIVE_GATE: deployment-control successor; public attorney content remains the qualified pre52 demo layer.';
  if(!s.includes(seam)) throw new Error('PRE54 release-identity comment seam missing');
  s=s.replace(seam,`${seam}\n    // ${MARK}: provider terminal status and accepted-live rollback identity are verified outside the public runtime.`);
  fs.writeFileSync(serverPath,s,'utf8');
}
console.log('PRE54_PROVIDER_NATIVE_DEPLOY_CONTROL_APPLIED');
