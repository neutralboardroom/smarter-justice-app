#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');const automation=require('../lib/v14ReleaseReceiptAutomation');
const root=path.join(__dirname,'..');const check=process.argv.includes('--check');const inventoryPath=path.join(root,'RELEASE_PAYLOAD_INVENTORY_SHA256.txt');
const generated=automation.generatePayloadInventory(root);
if(check){const current=fs.readFileSync(inventoryPath,'utf8');if(current!==generated){console.error('V14 payload inventory drift');process.exit(1);}const result=automation.validate(root);if(!result.ok){console.error(result.errors.join('\n'));process.exit(1);}console.log(`v14-release-receipts check passed (${result.payloadInventoryRecords} records)`);}
else{fs.writeFileSync(inventoryPath,generated);console.log(`wrote ${inventoryPath} (${generated.trimEnd().split('\n').filter(Boolean).length} records)`);}
