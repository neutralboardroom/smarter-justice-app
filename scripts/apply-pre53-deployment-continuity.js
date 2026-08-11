'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const serverPath=path.join(root,'server.js');
const MARK='SMARTER_JUSTICE_PRE53_RENDER_STARTUP_AND_LIVE_GATE';
if(!fs.existsSync(serverPath)) throw new Error(`PRE53 missing runtime server: ${serverPath}`);
let s=fs.readFileSync(serverPath,'utf8');
if(!s.includes(MARK)){
  if(!s.includes("release:'v2.0.0-pre52'")) throw new Error('PRE53 requires pre52 runtime release identity');
  if(!s.includes("demoPathRelease:'v2.0.0-pre52'")) throw new Error('PRE53 requires pre52 attorney demo identity');
  if(!s.includes("marker:'SMARTER_JUSTICE_PRE52_ATTORNEY_VALUE_CLARITY'")) throw new Error('PRE53 requires pre52 identity marker');
  s=s.replace("release:'v2.0.0-pre52'","release:'v2.0.0-pre53'");
  s=s.replace("demoPathRelease:'v2.0.0-pre52',","demoPathRelease:'v2.0.0-pre52',\n      deploymentControlRelease:'v2.0.0-pre53',");
  s=s.replace("marker:'SMARTER_JUSTICE_PRE52_ATTORNEY_VALUE_CLARITY'",`marker:'${MARK}'`);
  const seam="    return json(res, 200, {\n      ok:true,";
  if(!s.includes(seam)) throw new Error('PRE53 release-identity route seam missing');
  s=s.replace(seam,`    // ${MARK}: deployment-control successor; public attorney content remains the qualified pre52 demo layer.\n${seam}`);
  fs.writeFileSync(serverPath,s,'utf8');
}
console.log('PRE53_DEPLOYMENT_CONTINUITY_APPLIED');
