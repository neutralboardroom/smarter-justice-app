const store = require('./store');

function getStorageCapabilities(){
  const status = store.storageStatus();
  const warnings = [];
  if (!status.databaseUrlPresent) warnings.push('PostgreSQL is not selected. Local JSON is for development only and is not approved for sensitive paid traffic.');
  if (status.databaseUrlPresent && !status.databaseReady) warnings.push('PostgreSQL was selected but is unavailable. Sensitive writes are blocked instead of falling back to local JSON.');
  if (!status.privateUploadStorageReady) warnings.push('Configure durable private upload storage before accepting sensitive documents.');
  return {
    mode: status.mode,
    productionRuntime: status.productionRuntime,
    databaseReady: status.databaseReady,
    databaseUrlPresent: status.databaseUrlPresent,
    persistenceBlocked: status.persistenceBlocked,
    sensitiveWritesAllowed: status.sensitiveWritesAllowed,
    diskBackedByRenderMount: status.diskBackedByRenderMount,
    uploadStorageWritable: status.uploadStorageWritable,
    privateUploadStorageReady: status.privateUploadStorageReady,
    operationalForSensitiveTraffic: status.operationalForSensitiveTraffic,
    uploadStorage: status.diskBackedByRenderMount ? 'render-persistent-disk' : (status.explicitlyConfiguredStoragePath ? 'configured-development-path' : 'local-development-path'),
    warning: warnings.join(' ')
  };
}
module.exports = { getStorageCapabilities };
