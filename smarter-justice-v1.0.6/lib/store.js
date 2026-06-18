const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseDiskDir = process.env.SMARTER_JUSTICE_STORAGE_DIR || (process.env.RENDER_DISK_MOUNT_PATH ? path.join(process.env.RENDER_DISK_MOUNT_PATH, 'smarter-justice-storage') : path.join(__dirname, '..', 'storage'));
const storageDir = baseDiskDir;
const uploadDir = path.join(storageDir, 'uploads');
const quarantineDir = path.join(uploadDir, 'quarantine');
for (const dir of [storageDir, uploadDir, quarantineDir]) fs.mkdirSync(dir, { recursive: true });

const DEFAULTS = {
  'cases.json': [],
  'communityPartners.json': [],
  'notifications.json': [],
  'auditLog.json': []
};
const cache = new Map();
for (const [name, fallback] of Object.entries(DEFAULTS)) cache.set(name, fallback);
let db = null;
let dbReady = false;
let initError = '';

function file(name){ return path.join(storageDir, name); }
function readDiskJson(name, fallback){
  try { return JSON.parse(fs.readFileSync(file(name), 'utf8')); } catch { return fallback; }
}
function writeDiskJson(name, data){
  const target = file(name);
  const tmp = target + '.tmp';
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, target);
}
async function init(){
  for (const [name, fallback] of Object.entries(DEFAULTS)) cache.set(name, readDiskJson(name, fallback));
  if (!process.env.DATABASE_URL) return;
  try {
    let Client;
    try { ({ Client } = require('pg')); } catch (err) {
      initError = 'DATABASE_URL is set, but optional pg dependency is not installed yet. Run npm install during deploy.';
      return;
    }
    db = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false } });
    await db.connect();
    await db.query(`CREATE TABLE IF NOT EXISTS smarter_justice_store (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    await db.query(`CREATE TABLE IF NOT EXISTS smarter_justice_events (
      id text PRIMARY KEY,
      event_type text NOT NULL,
      case_id text,
      payload jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`);
    for (const [name, fallback] of Object.entries(DEFAULTS)) {
      const row = await db.query('SELECT value FROM smarter_justice_store WHERE key=$1', [name]);
      if (row.rows[0]) {
        cache.set(name, row.rows[0].value);
        writeDiskJson(name, row.rows[0].value);
      } else {
        const diskValue = readDiskJson(name, fallback);
        cache.set(name, diskValue);
        await db.query('INSERT INTO smarter_justice_store(key,value,updated_at) VALUES($1,$2,now()) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=now()', [name, JSON.stringify(diskValue)]);
      }
    }
    dbReady = true;
  } catch (err) {
    initError = err.message || 'Postgres initialization failed.';
    dbReady = false;
  }
}
function persistJson(name, data){
  cache.set(name, data);
  writeDiskJson(name, data);
  if (dbReady && db) {
    db.query('INSERT INTO smarter_justice_store(key,value,updated_at) VALUES($1,$2,now()) ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=now()', [name, JSON.stringify(data)]).catch(err => { initError = err.message; });
  }
}
function readJson(name, fallback){
  if (cache.has(name)) return cache.get(name);
  const value = readDiskJson(name, fallback);
  cache.set(name, value);
  return value;
}
function writeJson(name, data){ persistJson(name, data); }
function uid(prefix='sj', bytes=8){ return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(bytes).toString('hex')}`; }
function secureToken(prefix='continue'){ return `${prefix}_${crypto.randomBytes(24).toString('base64url')}`; }
function now(){ return new Date().toISOString(); }
function allCases(){ return readJson('cases.json', []); }
function saveCases(cases){ writeJson('cases.json', cases); }
function findCase(id){ return allCases().find(c => c.id === id || c.continuationToken === id || c.publicAccessToken === id); }
function upsertCase(item){
  const cases = allCases();
  const idx = cases.findIndex(c => c.id === item.id);
  if (idx >= 0) cases[idx] = item; else cases.unshift(item);
  saveCases(cases);
  return item;
}
function allPartners(){ return readJson('communityPartners.json', []); }
function savePartners(partners){ writeJson('communityPartners.json', partners); }
function upsertPartner(partner){
  const partners = allPartners();
  const idx = partners.findIndex(p => p.code === partner.code || p.id === partner.id);
  if (idx >= 0) partners[idx] = partner; else partners.unshift(partner);
  savePartners(partners);
  return partner;
}
function notifications(){ return readJson('notifications.json', []); }
function auditLog(){ return readJson('auditLog.json', []); }
function addAudit(event){
  const items = auditLog();
  const saved = { id: uid('audit', 8), createdAt: now(), ...event };
  items.unshift(saved);
  writeJson('auditLog.json', items.slice(0,1500));
  if (dbReady && db) db.query('INSERT INTO smarter_justice_events(id,event_type,case_id,payload,created_at) VALUES($1,$2,$3,$4,now()) ON CONFLICT (id) DO NOTHING', [saved.id, saved.action || 'audit', saved.caseId || null, JSON.stringify(saved)]).catch(()=>{});
  return saved;
}
function addNotification(note){
  const items = notifications();
  const saved = { id: uid('note', 8), createdAt: now(), ...note };
  items.unshift(saved);
  writeJson('notifications.json', items.slice(0,1500));
  if (dbReady && db) db.query('INSERT INTO smarter_justice_events(id,event_type,case_id,payload,created_at) VALUES($1,$2,$3,$4,now()) ON CONFLICT (id) DO NOTHING', [saved.id, `notification:${saved.kind || 'unknown'}`, saved.payload?.caseId || null, JSON.stringify(saved)]).catch(()=>{});
  return saved;
}
function saveAttachment(caseId, attachment){
  if (!attachment || !attachment.name) return null;
  const safeName = String(attachment.name).replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'upload.bin';
  const id = uid('upload', 10);
  const base64 = String(attachment.dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
  let buf = Buffer.from('');
  try { buf = base64 ? Buffer.from(base64, 'base64') : Buffer.from(''); } catch { buf = Buffer.from(''); }
  const rel = path.join('uploads', 'quarantine', `${caseId}-${id}-${safeName}`);
  const abs = path.join(storageDir, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, buf, { mode: 0o600 });
  return { id, name: safeName, originalName: attachment.name, documentType: attachment.documentType || '', mimeType: attachment.mimeType || attachment.type || 'application/octet-stream', sizeBytes: buf.length, storedPath: rel, uploadedAt: now(), uploadState: attachment.uploadState || 'quarantined-awaiting-review' };
}
function deleteAttachmentFile(attachment){
  if (!attachment || !attachment.storedPath) return false;
  const abs = path.normalize(path.join(storageDir, attachment.storedPath));
  if (!abs.startsWith(storageDir)) return false;
  try { fs.unlinkSync(abs); return true; } catch { return false; }
}
function storageStatus(){
  return {
    storageDir,
    diskBackedByRenderMount: Boolean(process.env.RENDER_DISK_MOUNT_PATH),
    databaseUrlPresent: Boolean(process.env.DATABASE_URL),
    databaseReady: dbReady,
    databaseInitError: initError,
    mode: dbReady ? 'postgres-cache-plus-disk-uploads' : (process.env.DATABASE_URL ? 'database-url-present-not-ready-local-disk-runtime' : (process.env.RENDER && !process.env.RENDER_DISK_MOUNT_PATH && !process.env.SMARTER_JUSTICE_STORAGE_DIR ? 'local-json-warning-render-disk-or-database-needed' : 'local-json-disk'))
  };
}
module.exports = { init, uid, secureToken, now, allCases, upsertCase, findCase, allPartners, upsertPartner, addNotification, notifications, auditLog, addAudit, saveAttachment, deleteAttachmentFile, readJson, writeJson, storageStatus };
