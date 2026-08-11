'use strict';
const fs=require('fs'),path=require('path');
const root=process.argv[2]||'.runtime/smarter-justice-v1.7.98';
const serverPath=path.join(root,'server.js');
if(!fs.existsSync(serverPath)) throw new Error(`PRE51 missing runtime server: ${serverPath}`);
let s=fs.readFileSync(serverPath,'utf8');
const MARK='SMARTER_JUSTICE_PRE51_PUBLIC_DOMAIN_RELEASE_IDENTITY';
if(!s.includes(MARK)){
  const cacheAnchor="    const safetySensitivePage = p === '/domestic-violence-aid.html';";
  if(!s.includes(cacheAnchor)) throw new Error('PRE51 cache seam missing');
  s=s.replace(cacheAnchor, cacheAnchor+`\n    const demoReleaseFreshPage = new Set([\n      '/attorney-call-tour.html','/attorney-partner-tour.html','/professionals.html','/attorney-launch.html','/professional-membership.html','/professional-signup.html'\n    ]).has(p); // ${MARK}`);

  const cacheExpr="      'Cache-Control': safetySensitivePage ? 'no-store, max-age=0' : (publicAsset ? 'public, max-age=86400, stale-while-revalidate=604800' : 'no-cache')";
  if(!s.includes(cacheExpr)) throw new Error('PRE51 Cache-Control seam missing');
  s=s.replace(cacheExpr,"      'Cache-Control': safetySensitivePage ? 'no-store, max-age=0' : (demoReleaseFreshPage ? 'no-store, max-age=0, must-revalidate' : (publicAsset ? 'public, max-age=86400, stale-while-revalidate=604800' : 'no-cache'))");

  const headerAnchor="    if (safetySensitivePage) headers['Referrer-Policy'] = 'no-referrer';";
  if(!s.includes(headerAnchor)) throw new Error('PRE51 static header seam missing');
  s=s.replace(headerAnchor,headerAnchor+`\n    if (demoReleaseFreshPage) {\n      headers['CDN-Cache-Control'] = 'no-store';\n      headers['X-Smarter-Justice-Release-Commit'] = String(process.env.RENDER_GIT_COMMIT || 'unknown');\n      headers['X-Smarter-Justice-Demo-Path'] = 'v2.0.0-pre50';\n    }`);

  const apiAnchor="  if (req.method === 'GET' && pathName === '/health') {";
  if(!s.includes(apiAnchor)) throw new Error('PRE51 API seam missing');
  const route=`  if (req.method === 'GET' && pathName === '/api/release-identity') {\n    return json(res, 200, {\n      ok:true,\n      app:'Smarter Justice',\n      release:'v2.0.0-pre51',\n      demoPathRelease:'v2.0.0-pre50',\n      gitCommit:String(process.env.RENDER_GIT_COMMIT || ''),\n      gitBranch:String(process.env.RENDER_GIT_BRANCH || ''),\n      gitRepo:String(process.env.RENDER_GIT_REPO_SLUG || ''),\n      externalHostname:String(process.env.RENDER_EXTERNAL_HOSTNAME || ''),\n      externalUrl:String(process.env.RENDER_EXTERNAL_URL || ''),\n      renderRuntime:Boolean(process.env.RENDER),\n      demoHtmlCachePolicy:'NO_STORE',\n      marker:'${MARK}'\n    });\n  }\n`;
  s=s.replace(apiAnchor,route+apiAnchor);
  fs.writeFileSync(serverPath,s,'utf8');
}
console.log('PRE51_PUBLIC_DOMAIN_RELEASE_IDENTITY_APPLIED');
