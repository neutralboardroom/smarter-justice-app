'use strict';
const { portForTest } = require('./test-port');
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {spawn}=require('child_process');
const root=path.join(__dirname,'..');
function digest(file){return crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');}
function runSmoke(label){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,['tests/smoke.test.js'],{cwd:root,env:{...process.env,TERM:'dumb',SJ_CONCURRENT_LABEL:label}});let out='';child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>out+=d);child.on('error',reject);child.on('close',code=>resolve({code,out}));});}
(async()=>{
  const pkg=require('../package.json');assert.equal(pkg.version,'1.7.83');assert.equal(pkg.scripts.test.split(' && ').length,145);
  const manifest=require('../portal-manifest.json');assert.equal(manifest.currentDevelopmentVersion,'1.7.83');assert.equal(manifest.testSuiteParts,146);assert.equal(manifest.dependencyIndependentTestParts,145);assert.equal(manifest.capabilities.parallelSafeExactExtractionAcceptanceV1755,true);
  const truth=require('../PORTFOLIO_TRUTH_V1.7.75.json');assert.equal(truth.currentRelease.sourceBaseline.sha256,'5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898');assert.equal(truth.currentRelease.rollbackArtifact,'smarter-justice-v1.7.73.zip');assert.equal(truth.currentRelease.launchState,'NO_GO');
  const canonical=require('../INITIAL_PORTAL_AUTHORITY_V1.7.75.json');
  for(const expected of canonical.portals){const row=truth.portals.find(x=>x.portalId===expected.portalId);assert(row,expected.portalId);assert.equal(row.version,expected.version);assert.equal(row.evidenceState,expected.evidenceState);assert.equal(row.independentlyVerifiedInThisBuild,false);}
  const preservation=require('../PUBLIC_SURFACE_PRESERVATION_ACCEPTANCE_V1.7.75.json');assert.equal(preservation.decision,'PRESERVE_PUBLIC_EXPERIENCE_EXCEPT_OWNER_ONLY_CURRENT_RELEASE_AND_DETACHED_FINAL_IDENTITY_RENDERING');for(const row of preservation.files){if(row.path==='public/app.js')continue;assert.equal(digest(row.path),row.sha256,row.path);}const currentApp=fs.readFileSync(path.join(root,'public/app.js'),'utf8');assert(currentApp.includes('does not create an attorney-client relationship'));assert(currentApp.includes('non-AI'));

  const fixedPortPattern=/(?:const\s+port\s*=\s*\d{4,5}|\bstart\(\d{4,5}\s*,)/;
  for(const file of fs.readdirSync(path.join(root,'tests')).filter(name=>name.endsWith('.js'))){const source=fs.readFileSync(path.join(root,'tests',file),'utf8');assert(!fixedPortPattern.test(source),`fixed test port remains in ${file}`);}
  const smokeSource=fs.readFileSync(path.join(root,'tests','smoke.test.js'),'utf8');assert(smokeSource.includes('const port = 0;'));assert(!smokeSource.includes('const port=portForTest(3961);'));assert(smokeSource.includes('listening on (\\d+)'));
  const serverSource=fs.readFileSync(path.join(root,'server.js'),'utf8');assert(serverSource.includes('actualPort'));assert(serverSource.includes('Number(port)===0'));
  const [a,b]=await Promise.all([runSmoke('a'),runSmoke('b')]);
  assert.equal(a.code,0,a.out);assert.equal(b.code,0,b.out);assert(a.out.includes('smoke.test.js passed'));assert(b.out.includes('smoke.test.js passed'));
  console.log('release-reproducibility-v1755.test.js passed');
})().catch(error=>{console.error(error);process.exit(1);});
