'use strict';
const path=require('path');const cp=require('child_process');const root=path.resolve(__dirname,'..');
function run(rel){cp.execFileSync(process.execPath,[path.join(root,rel)],{stdio:'inherit',env:process.env});}
run('scripts/bootstrap-pre93-d4-deploy.js');
run('scripts/apply-pre93-d5-owner-password-recovery.js');
console.log('[PRE93-D5 DEPLOY] PRE93-D4 verified; secure owner password recovery applied.');
