'use strict';
const assert=require('assert');
const fs=require('fs');
const governance=require('../lib/v14ReleaseGovernance');
const binding=require('../ARTIFACT_BINDING_AND_MODE_RECEIPT.json');
const contract=require('../V14_RELEASE_IDENTITY_AND_RECEIPT_CONTRACT_V1.7.83.json');
(()=>{
 const result=governance.validate();assert.equal(result.ok,true,result.errors.join(','));assert.equal(result.mode,'MODE_B_EXISTING_CHAT_PACKET_ONLY');assert.equal(result.finalDeliveryIdentity,'REPORTED_AFTER_PACKAGING');assert.equal(binding.governing_packet.sha256,'fce42ce0927748f94189692ef5b3bf8e0fe9f8d12273287f03a68eb7bccdad6f');assert.equal(binding.selected_authoritative_base.sha256,'61fea278a69055915e9b4b916e4b64ec514614f1746cacf659a6931ccd0228b1');assert.equal(contract.embedded_final_outer_zip_sha256_prohibited,true);const receipt=fs.readFileSync('OWNER_RECEIPT.txt','utf8');assert.ok(receipt.includes('FINAL_DELIVERY_ZIP_IDENTITY: REPORTED_AFTER_PACKAGING'));assert.ok(!receipt.includes('FINAL_DELIVERY_ZIP_SHA256:'));assert.ok(!receipt.includes('FINAL_DELIVERY_ZIP_SIZE_BYTES:'));
 console.log('v14-release-governance-v1779.test.js passed');
})();
