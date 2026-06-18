const store = require('./store');

function getStorageCapabilities(){
  const status = store.storageStatus();
  return {
    mode: status.mode,
    databaseReady: status.databaseReady,
    databaseUrlPresent: status.databaseUrlPresent,
    diskBackedByRenderMount: status.diskBackedByRenderMount,
    uploadStorage: status.diskBackedByRenderMount ? 'render-persistent-disk' : 'local-disk-or-configured-path',
    warning: /warning|not-ready/.test(status.mode) ? 'Configure DATABASE_URL plus persistent/object upload storage before real sensitive paid uploads.' : ''
  };
}
module.exports = { getStorageCapabilities };
