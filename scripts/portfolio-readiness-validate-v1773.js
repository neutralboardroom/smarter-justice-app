'use strict';
const readiness=require('../lib/portfolioLaunchReadiness');
const result=readiness.validateStaticArtifacts();
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(!result.ok)process.exitCode=1;
