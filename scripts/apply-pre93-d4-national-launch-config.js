'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.resolve(__dirname,'..','.runtime','pre93-live');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function fail(m){console.error(`[PRE93-D4 HOTFIX] ${m}`);process.exit(1)}
function edit(rel,before,after,oldText,newText){const p=path.join(root,rel);if(!fs.existsSync(p))fail(`missing ${rel}`);if(sha(p)!==before)fail(`${rel} preimage mismatch: ${sha(p)}`);let s=fs.readFileSync(p,'utf8');if((s.split(oldText).length-1)!==1)fail(`${rel} patch anchor missing or ambiguous`);s=s.replace(oldText,newText);fs.writeFileSync(p,s);if(sha(p)!==after)fail(`${rel} patched hash mismatch: ${sha(p)}`);return{path:rel,beforeSha256:before,afterSha256:after,bytes:fs.statSync(p).size};}
const changed=[];
changed.push(edit('.env.launch.example','08a1e510f9282eb3b85924d46b518fdece760c841669971f06cc5ca67aaba353','9147936b0adde83d6e414cbf90b2b45f58e053fe5304db019df56e60a8517132','LAUNCH_COHORT_NAME=NYC Founding Attorney Pilot','LAUNCH_COHORT_NAME=National U.S. Founding Attorney Cohort'));
changed.push(edit('PROFESSIONAL_MARKETPLACE_STANDARD.md','808242ff44d3c615584c2c7394803264a058f0bfd57cf2750298db1e1f3a7e3f','06579ede8dbc0d7ec3cd6ec6df97527c11035bca53386730308756a04e5ac81a','The controlled NYC pilot may use $15 monthly or $150 annual individual pricing within the approved $10–$20 test range, with firm per-seat pricing and volume discounts.','A controlled national U.S. launch cohort may use $15 monthly or $150 annual individual pricing within the approved $10–$20 test range, with firm per-seat pricing and volume discounts; state- and jurisdiction-specific compliance remains required where applicable.'));
const receipt={schemaVersion:'smarter-justice.pre93-d4.runtime-hotfix.v1',release:'v2.0.0-pre93',deploymentAmendment:'PRE93-D4-NATIONAL-LAUNCH-CONFIG-AND-READINESS-DIAGNOSTICS',sourceCarrierSha256:'62597eaa30f484bcafb8de73553d2cf5225c7eb06514c4ca39f3a3b4d151ce5b',nationalRogerRule:'SJ-RGR-PRE92-NATIONAL-USA-SCOPE',purpose:'Remove current NYC-limited launch configuration wording while preserving historical records and add safe live readiness diagnostics.',changedFiles:changed,historicalRecordsRewritten:false,liveActions:false};
const out=path.join(root,'deployment','pre93','PRE93_D4_RUNTIME_HOTFIX_RECEIPT.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');console.log(`[PRE93-D4 HOTFIX] PASS files=${changed.length} nationalScope=50-states-plus-DC`);
