'use strict';
const fs=require('fs');
const path=require('path');
const schema=require('../PRODUCT_LAUNCH_READINESS_RECEIPT_SCHEMA_V1.7.75.json');
const matrix=require('../PORTFOLIO_LAUNCH_READINESS_MATRIX_V1.7.75.json');
const sourceReceipt=require('../PRODUCT_LAUNCH_READINESS_RECEIPT_SMARTER_JUSTICE_SOURCE_V1.7.72.json');
const ROOT=path.join(__dirname,'..');
const INITIAL_SCOPE=Object.freeze(matrix.initial_cutover_scope.map(x=>x.id));
const INITIAL_SET=new Set(INITIAL_SCOPE);
const READINESS_STATES=new Set(schema.allowedReadinessStates);
const SUCCESS_STATES=new Set(schema.successfulReadinessStates);
const GATE_KEYS=Object.freeze([...schema.requiredGateKeys]);
const GATE_STATES=new Set(schema.allowedGateStates);
function clone(value){return JSON.parse(JSON.stringify(value));}
function string(value){return String(value??'').trim();}
function hasSecretMaterial(value){return /(?:sk_live_|rk_live_|ghp_|github_pat_|postgres(?:ql)?:\/\/[^"\s]+:[^"\s]+@|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY)/i.test(JSON.stringify(value));}
function validateReceipt(receipt={}){
  const errors=[];
  if(receipt.schema_id!=='SJP-PRODUCT-LAUNCH-READINESS-RECEIPT-2026-08-02-V1')errors.push('schema-id');
  const product=receipt.product||{};
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(string(product.id)))errors.push('product-id');
  if(!string(product.name))errors.push('product-name');
  if(!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(string(product.version)))errors.push('product-version');
  if(!string(product.artifact_name).toLowerCase().endsWith('.zip'))errors.push('artifact-name');
  if(!/^[a-f0-9]{64}$/.test(string(product.artifact_sha256)))errors.push('artifact-sha256');
  if(!Number.isInteger(product.artifact_size_bytes)||product.artifact_size_bytes<1)errors.push('artifact-size');
  if(typeof product.initial_cutover_track!=='boolean')errors.push('initial-cutover-track');
  if(product.build_and_readiness_track!==true)errors.push('build-readiness-track');
  if(product.initial_cutover_track===true&&!INITIAL_SET.has(product.id))errors.push('initial-cutover-scope-mismatch');
  if(INITIAL_SET.has(product.id)&&product.initial_cutover_track!==true)errors.push('initial-cutover-flag-mismatch');
  if(!READINESS_STATES.has(receipt.readiness_state))errors.push('readiness-state');
  if(receipt.readiness_state==='LAUNCH_READY_NOT_SCHEDULED'&&product.initial_cutover_track!==false)errors.push('launch-ready-not-scheduled-requires-non-initial-product');
  const gates=receipt.gates||{};
  for(const key of GATE_KEYS){if(!GATE_STATES.has(gates[key]))errors.push(`gate:${key}`);}
  for(const key of ['exact_blockers','builder_controlled_work_remaining','protected_owner_actions','evidence_files'])if(!Array.isArray(receipt[key]))errors.push(key);
  if(!string(receipt.next_executable_action))errors.push('next-executable-action');
  if(receipt.readiness_state==='BLOCKED_WITH_EXACT_REASON'&&!(receipt.exact_blockers||[]).length)errors.push('blocked-without-exact-reason');
  if(hasSecretMaterial(receipt))errors.push('secret-material');
  return{
    ok:errors.length===0,
    errors,
    productId:string(product.id),
    productName:string(product.name),
    version:string(product.version),
    readinessState:string(receipt.readiness_state),
    initialCutoverTrack:product.initial_cutover_track===true,
    successful:errors.length===0&&SUCCESS_STATES.has(receipt.readiness_state),
    launchReadyNotScheduled:errors.length===0&&receipt.readiness_state==='LAUNCH_READY_NOT_SCHEDULED'
  };
}
function aggregateReceipts(receipts=[],options={}){
  const seen=new Set();
  const rows=[];
  const invalidReceipts=[];
  for(const receipt of Array.isArray(receipts)?receipts:[]){
    const validation=validateReceipt(receipt);
    if(validation.productId&&seen.has(validation.productId))validation.errors.push('duplicate-product-receipt');
    validation.ok=validation.errors.length===0;
    validation.successful=validation.ok&&SUCCESS_STATES.has(validation.readinessState);
    if(validation.productId)seen.add(validation.productId);
    const row={
      productId:validation.productId||null,
      productName:validation.productName||null,
      version:validation.version||null,
      readinessState:validation.readinessState||null,
      initialCutoverTrack:validation.initialCutoverTrack,
      successful:validation.successful,
      launchReadyNotScheduled:validation.launchReadyNotScheduled,
      validation:{ok:validation.ok,errors:[...validation.errors]}
    };
    rows.push(row);
    if(!validation.ok)invalidReceipts.push(row);
  }
  const validRows=rows.filter(x=>x.validation.ok);
  const validIds=new Set(validRows.map(x=>x.productId));
  const missingInitialCutoverReceipts=INITIAL_SCOPE.filter(id=>!validIds.has(id));
  const blockedProducts=validRows.filter(x=>x.readinessState==='BLOCKED_WITH_EXACT_REASON').map(x=>x.productId);
  const successfulProducts=validRows.filter(x=>x.successful).map(x=>x.productId);
  const nonInitialLaunchReady=validRows.filter(x=>x.launchReadyNotScheduled).map(x=>x.productId);
  return{
    schemaId:matrix.schema_id,
    generatedForRelease:'1.7.75',
    initialCutoverScope:[...INITIAL_SCOPE],
    productReceipts:rows,
    summary:{
      suppliedReceipts:rows.length,
      validReceipts:validRows.length,
      invalidReceipts:invalidReceipts.length,
      successfulProducts:successfulProducts.length,
      blockedProducts:blockedProducts.length,
      nonInitialLaunchReadyNotScheduled:nonInitialLaunchReady.length,
      missingInitialCutoverReceipts:missingInitialCutoverReceipts.length
    },
    successfulProductIds:successfulProducts,
    blockedProductIds:blockedProducts,
    nonInitialLaunchReadyNotScheduledProductIds:nonInitialLaunchReady,
    missingInitialCutoverReceipts,
    invalidReceipts,
    crossBlockingApplied:false,
    missingReceiptInferenceApplied:false,
    deploymentAuthorized:false,
    portfolioDecision:options.portfolioDecision||'INDEPENDENT_PRODUCT_STATES_ONLY_NO_PRODUCTION_AUTHORIZATION'
  };
}
function validateStaticArtifacts(root=ROOT){
  const errors=[];
  if(schema.releaseVersion!=='1.7.75')errors.push('schema-release-version');
  if(matrix.releaseVersion!=='1.7.75')errors.push('matrix-release-version');
  if(JSON.stringify(INITIAL_SCOPE)!==JSON.stringify(['smarter-justice-central','divorce-law-aid','estate-law-aid','personal-injury-law-aid','domestic-violence-aid']))errors.push('initial-cutover-scope');
  if(matrix.current_candidate?.state!=='BUILD_IN_PROGRESS'||matrix.current_candidate?.exact_receipt_present!==false)errors.push('candidate-boundary');
  const receiptValidation=validateReceipt(sourceReceipt);
  if(!receiptValidation.ok)errors.push(...receiptValidation.errors.map(x=>`source-receipt:${x}`));
  for(const file of [
    'PRODUCT_LAUNCH_READINESS_RECEIPT_SCHEMA_V1.7.75.json',
    'PRODUCT_LAUNCH_READINESS_RECEIPT_SMARTER_JUSTICE_SOURCE_V1.7.72.json',
    'PORTFOLIO_LAUNCH_READINESS_MATRIX_V1.7.75.json'
  ])if(!fs.existsSync(path.join(root,file)))errors.push(`missing:${file}`);
  if(hasSecretMaterial({schema,matrix,sourceReceipt}))errors.push('secret-material');
  const aggregate=aggregateReceipts([sourceReceipt]);
  if(aggregate.crossBlockingApplied!==false||aggregate.missingReceiptInferenceApplied!==false||aggregate.deploymentAuthorized!==false)errors.push('aggregation-boundary');
  return{ok:errors.length===0,errors,releaseVersion:'1.7.75',sourceReceipt:receiptValidation,aggregate};
}
function ownerView(){return{schema:clone(schema),matrix:clone(matrix),sourceReceipt:clone(sourceReceipt),validation:validateStaticArtifacts(),aggregate:aggregateReceipts([sourceReceipt])};}
module.exports={INITIAL_SCOPE,validateReceipt,aggregateReceipts,validateStaticArtifacts,ownerView};
