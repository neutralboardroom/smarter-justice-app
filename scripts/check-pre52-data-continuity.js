'use strict';
const fs=require('fs'),path=require('path');
const contractPath=path.join(__dirname,'..','deployment','pre52','DATA_CONTINUITY_AND_PUBLICATION_GATE__PRE52.json');
const contract=JSON.parse(fs.readFileSync(contractPath,'utf8'));
function flag(name,def=false){const v=String(process.env[name]??'').trim().toLowerCase();if(!v)return def;return ['1','true','yes','on','enabled'].includes(v)}
const persistentUserData=flag('SJ_SERVER_PERSISTENT_USER_DATA_ENABLED',false);
const liveBilling=flag('SJ_LIVE_BILLING_ENABLED',false);
const durableDocuments=flag('SJ_DURABLE_DOCUMENT_STORAGE_ENABLED',false);
const stateChangingMigration=flag('SJ_STATE_CHANGING_MIGRATION',false);
const destructiveMigration=flag('SJ_DESTRUCTIVE_MIGRATION',false);
const db=Boolean(String(process.env.DATABASE_URL||'').trim());
const storeClass=String(process.env.SJ_PERSISTENT_STORE_CLASS||'').trim();
const backupReceipt=String(process.env.SJ_PREDEPLOY_BACKUP_RECEIPT||'').trim();
const restoreReceipt=String(process.env.SJ_RESTORE_PATH_VERIFICATION||'').trim();
const objectStore=Boolean(String(process.env.SJ_DURABLE_OBJECT_STORE||'').trim());
const failures=[];
if(contract.release!=='v2.0.0-pre52')failures.push('CONTRACT_RELEASE_MISMATCH');
if(persistentUserData){
  if(!db)failures.push('DATABASE_URL_REQUIRED_FOR_PERSISTENT_USER_DATA');
  if(storeClass!=='EXTERNAL_DURABLE')failures.push('EXTERNAL_DURABLE_STORE_REQUIRED');
  if(!backupReceipt)failures.push('PERSISTENT_USER_DATA_REQUIRES_CURRENT_BACKUP_RECEIPT');
  if(!restoreReceipt)failures.push('PERSISTENT_USER_DATA_REQUIRES_VERIFIED_RECOVERY_PATH');
}
if(liveBilling){
  if(!persistentUserData || !db)failures.push('LIVE_BILLING_REQUIRES_DURABLE_TRANSACTIONAL_STORE');
  if(!backupReceipt)failures.push('LIVE_BILLING_REQUIRES_CURRENT_BACKUP_RECEIPT');
  if(!restoreReceipt)failures.push('LIVE_BILLING_REQUIRES_VERIFIED_RECOVERY_PATH');
}
if(durableDocuments){
  if(!objectStore)failures.push('DURABLE_DOCUMENT_STORAGE_REQUIRES_EXTERNAL_OBJECT_STORE');
  if(!backupReceipt)failures.push('DURABLE_DOCUMENT_STORAGE_REQUIRES_CURRENT_BACKUP_RECEIPT');
  if(!restoreReceipt)failures.push('DURABLE_DOCUMENT_STORAGE_REQUIRES_VERIFIED_RECOVERY_PATH');
}
if(stateChangingMigration && !backupReceipt)failures.push('STATE_CHANGING_MIGRATION_REQUIRES_CURRENT_BACKUP_RECEIPT');
if(stateChangingMigration && !restoreReceipt)failures.push('STATE_CHANGING_MIGRATION_REQUIRES_RESTORE_PATH_VERIFICATION');
if(destructiveMigration && !flag('SJ_DESTRUCTIVE_MIGRATION_EXPLICITLY_AUTHORIZED',false))failures.push('DESTRUCTIVE_MIGRATION_NOT_EXPLICITLY_AUTHORIZED');
if(destructiveMigration && !backupReceipt)failures.push('DESTRUCTIVE_MIGRATION_REQUIRES_BACKUP_RECEIPT');
const result={
  ok:failures.length===0,
  release:contract.release,
  persistentUserDataEnabled:persistentUserData,
  liveBillingEnabled:liveBilling,
  durableDocumentStorageEnabled:durableDocuments,
  stateChangingMigration,
  destructiveMigration,
  databaseConfigured:db,
  persistentStoreClass:storeClass||null,
  backupReceiptPresent:Boolean(backupReceipt),
  restorePathVerified:Boolean(restoreReceipt),
  durableObjectStoreConfigured:objectStore,
  liveDataIncludedInReleaseArtifacts:false,
  failures
};
console.log(JSON.stringify(result,null,2));
if(failures.length)process.exit(1);
