'use strict';
const providerPreflight=require('../lib/providerPreflight');
const result={command:'provider:preflight:validate',...providerPreflight.validateStaticArtifacts(),readOnly:true,deploymentRequested:false,productionRequestSent:false,secretValuesRead:false};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(!result.ok)process.exitCode=1;
