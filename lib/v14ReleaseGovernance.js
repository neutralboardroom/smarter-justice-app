'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const ROOT=path.join(__dirname,'..');
const binding=require('../ARTIFACT_BINDING_AND_MODE_RECEIPT.json');
const contract=require('../V14_RELEASE_IDENTITY_AND_RECEIPT_CONTRACT_V1.7.83.json');
const scope=require('../V14_MATERIAL_SCOPE_AND_MODE_V1.7.83.json');
function clone(v){return JSON.parse(JSON.stringify(v));}
function sha(b){return crypto.createHash('sha256').update(b).digest('hex');}
function read(name){return fs.readFileSync(path.join(ROOT,name));}
function parseOwnerReceipt(){const text=read('OWNER_RECEIPT.txt').toString('utf8');const fields={};for(const line of text.split(/\r?\n/)){const m=line.match(/^([A-Z0-9_]+):\s*(.*)$/);if(m)fields[m[1]]=m[2].trim();}return{text,fields};}
function parseInventory(){const bytes=read('RELEASE_PAYLOAD_INVENTORY_SHA256.txt');const text=bytes.toString('utf8');if(text.trim()==='PENDING_UNTIL_PAYLOAD_FREEZE')return{state:'PENDING',bytes,text,records:[]};const records=[];const errors=[];for(const [i,line] of text.split(/\n/).entries()){if(!line)continue;const m=line.match(/^([a-f0-9]{64})  (.+)$/);if(!m){errors.push(`line:${i+1}`);continue;}records.push({sha256:m[1],path:m[2]});}return{state:'FROZEN',bytes,text,records,errors};}
function validate(){
 const errors=[];
 if(binding.selected_operating_mode!=='MODE_B_EXISTING_CHAT_PACKET_ONLY')errors.push('mode');
 if(binding.selected_authoritative_base?.sha256!=='61fea278a69055915e9b4b916e4b64ec514614f1746cacf659a6931ccd0228b1'||binding.selected_authoritative_base?.version!=='1.7.82')errors.push('base-binding');
 if(binding.governing_packet?.sha256!=='fce42ce0927748f94189692ef5b3bf8e0fe9f8d12273287f03a68eb7bccdad6f'||binding.governing_packet?.packet_id!=='SJP-LMP-UNIVERSAL-ONE-STEP-2026-08-03-V14-ALL-CHAT-MODES')errors.push('packet-binding');
 if(binding.editing_authorized_after_binding!==true||binding.deployment_authorized!==false||binding.launch_state!=='NO_GO')errors.push('binding-gates');
 if(contract.release_version!=='1.7.83'||contract.embedded_owner_receipt!=='OWNER_RECEIPT.txt'||contract.release_payload_inventory!=='RELEASE_PAYLOAD_INVENTORY_SHA256.txt')errors.push('receipt-contract');
 if(contract.embedded_final_outer_zip_sha256_prohibited!==true||contract.embedded_final_outer_zip_size_prohibited!==true||contract.final_delivery_zip_identity!=='REPORTED_AFTER_PACKAGING')errors.push('outer-identity-boundary');
 if(scope.selected_mode!==binding.selected_operating_mode||scope.release_version!=='1.7.83')errors.push('scope-mode');
 const receipt=parseOwnerReceipt();
 if(receipt.fields.PRODUCT_VERSION!=='1.7.83'||receipt.fields.STARTING_ARTIFACT_SHA256!==binding.selected_authoritative_base.sha256)errors.push('owner-receipt-identity');
 if(receipt.fields.FINAL_DELIVERY_ZIP_IDENTITY!=='REPORTED_AFTER_PACKAGING')errors.push('owner-receipt-final-boundary');
 if(/FINAL_DELIVERY_ZIP_(SHA256|SIZE_BYTES)\s*:/i.test(receipt.text))errors.push('owner-receipt-self-reference-field');
 if(/OPENAI_API_KEY\s*[:=]\s*[A-Za-z0-9_-]{12,}/.test(receipt.text))errors.push('secret-bearing-receipt');
 const inv=parseInventory();
 if(inv.state==='FROZEN'){
  errors.push(...(inv.errors||[]).map(x=>`inventory:${x}`));
  const paths=inv.records.map(x=>x.path);const sorted=[...paths].sort((a,b)=>a.localeCompare(b));if(JSON.stringify(paths)!==JSON.stringify(sorted))errors.push('inventory-unsorted');
  const excluded=new Set(contract.release_payload_inventory_scope.exclude||[]);
  for(const p of paths){if(excluded.has(p))errors.push(`inventory-excluded:${p}`);if(p.startsWith('/')||p.split('/').includes('..')||p.includes('\\'))errors.push(`inventory-unsafe:${p}`);const full=path.join(ROOT,p);if(!fs.existsSync(full)||!fs.statSync(full).isFile())errors.push(`inventory-missing:${p}`);else if(sha(fs.readFileSync(full))!==inv.records.find(x=>x.path===p).sha256)errors.push(`inventory-hash:${p}`);}
  const invSha=sha(inv.bytes);if(receipt.fields.RELEASE_PAYLOAD_INVENTORY_SHA256!==invSha)errors.push('owner-receipt-inventory-sha');if(Number(receipt.fields.RELEASE_PAYLOAD_INVENTORY_RECORD_COUNT)!==inv.records.length)errors.push('owner-receipt-inventory-count');
 }else{
  if(receipt.fields.RELEASE_PAYLOAD_INVENTORY_SHA256!=='PENDING_UNTIL_PAYLOAD_FREEZE'||receipt.fields.RELEASE_PAYLOAD_INVENTORY_RECORD_COUNT!=='PENDING_UNTIL_PAYLOAD_FREEZE')errors.push('prefinal-inventory-boundary');
 }
 return{ok:errors.length===0,errors,releaseVersion:'1.7.83',mode:binding.selected_operating_mode,payloadState:inv.state,payloadInventorySha256:inv.state==='FROZEN'?sha(inv.bytes):null,payloadInventoryRecords:inv.records.length,finalDeliveryIdentity:'REPORTED_AFTER_PACKAGING',deploymentAuthorized:false,launchState:'NO_GO'};
}
function ownerView(){return{artifactBinding:clone(binding),receiptContract:clone(contract),materialScope:clone(scope),validation:validate(),deploymentAuthorized:false,launchState:'NO_GO'};}
module.exports={parseOwnerReceipt,parseInventory,validate,ownerView};
