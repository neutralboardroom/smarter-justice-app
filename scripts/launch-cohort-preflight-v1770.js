'use strict';
const orchestration=require('../lib/launchDayOrchestration');
const deployment=require('../lib/deploymentReadiness');
const pack=require('../lib/coordinatedPromptPack');
const result={schema:'smarter-justice-launch-cohort-preflight-result',releaseVersion:'1.7.70',readOnly:true,pack:pack.validate(),deployment:deployment.validate(),orchestration:orchestration.validate(),productionRequestSent:false,secretValuesRead:false};
result.ok=result.pack.ok&&result.deployment.ok&&result.orchestration.ok;
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(!result.ok)process.exitCode=1;
