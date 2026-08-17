'use strict';
const path=require('path');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');
function run(rel){cp.execFileSync(process.execPath,[path.join(root,rel)],{stdio:'inherit',env:process.env});}
run('scripts/bootstrap-pre93-deploy.js');
run('scripts/apply-pre93-d4-national-launch-config.js');
console.log('[PRE93-D4 DEPLOY] base PRE93-D3 verified; current national launch configuration correction applied.');
