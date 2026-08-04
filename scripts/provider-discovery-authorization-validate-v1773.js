'use strict';
const authorization=require('../lib/providerDiscoveryAuthorization');
const result={command:'provider:authorization:validate',...authorization.validatePacket(),readOnly:true,deploymentRequested:false,productionRequestSent:false,providerMetadataRead:false,secretValuesRead:false};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
if(!result.ok)process.exitCode=1;
