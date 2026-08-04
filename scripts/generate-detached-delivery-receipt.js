#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');const tool=require('../lib/v14DetachedDeliveryReceipt');
function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:null;}
const artifact=arg('--artifact'),twin=arg('--twin'),output=arg('--output');
if(!artifact||!twin||!output){console.error('Usage: node scripts/generate-detached-delivery-receipt.js --artifact <final-a.zip> --twin <final-b.zip> --output <receipt.json>');process.exit(2);}
const receipt=tool.createReceipt({artifactPath:path.resolve(artifact),twinArtifactPath:path.resolve(twin)});const result=tool.validateReceipt(receipt,{artifactPath:path.resolve(artifact),twinArtifactPath:path.resolve(twin)});if(!result.ok){console.error(JSON.stringify(result,null,2));process.exit(1);}fs.writeFileSync(path.resolve(output),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({ok:true,output:path.resolve(output),...result},null,2));
