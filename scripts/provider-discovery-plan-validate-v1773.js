'use strict';
const providerDiscoveryPlan=require('../lib/providerDiscoveryPlan');
const result={command:'provider:discovery-plan:validate',...providerDiscoveryPlan.validatePlan(),readOnly:true,deploymentRequested:false,productionRequestSent:false,secretValuesRead:false};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(!result.ok)process.exitCode=1;
