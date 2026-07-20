const assert=require('assert');
const {spawnSync}=require('child_process');
const path=require('path');
const fs=require('fs');
const os=require('os');
const cwd=path.join(__dirname,'..');
function run(source,env={}){ return spawnSync(process.execPath,['-e',source],{cwd,env:{...process.env,...env},encoding:'utf8',timeout:10000}); }
const productionDir=fs.mkdtempSync(path.join(os.tmpdir(),'sj-production-storage-'));
let result=run(`const store=require('./lib/store'); try{store.writeJson('cases.json',[]); process.exit(3)}catch(err){if(err.code==='STORAGE_NOT_READY'&&err.statusCode===503)process.exit(0); console.error(err);process.exit(2)}`,{NODE_ENV:'production',SMARTER_JUSTICE_STORAGE_DIR:productionDir,DATABASE_URL:'',RENDER:''});
assert.equal(result.status,0,`production without PostgreSQL must block sensitive writes: ${result.stderr}`);
const developmentDir=fs.mkdtempSync(path.join(os.tmpdir(),'sj-development-storage-'));
result=run(`const store=require('./lib/store'); store.writeJson('cases.json',[{id:'local-test'}]); if(store.readJson('cases.json',[])[0].id!=='local-test')process.exit(2);`,{NODE_ENV:'test',SMARTER_JUSTICE_STORAGE_DIR:developmentDir,DATABASE_URL:'',RENDER:''});
assert.equal(result.status,0,`local development storage should remain usable: ${result.stderr}`);
const failedDbDir=fs.mkdtempSync(path.join(os.tmpdir(),'sj-failed-db-'));
result=run(`const store=require('./lib/store'); store.init().then(()=>process.exit(3)).catch(err=>{if(/PostgreSQL was selected/.test(err.message))process.exit(0);console.error(err);process.exit(2)})`,{NODE_ENV:'production',SMARTER_JUSTICE_STORAGE_DIR:failedDbDir,DATABASE_URL:'postgres://invalid:invalid@127.0.0.1:1/smarterjustice',PGSSLMODE:'disable',PG_CONNECT_TIMEOUT_MS:'1000',RENDER:''});
assert.equal(result.status,0,`selected PostgreSQL failure must stop production startup: ${result.stderr}`);
const storeSource=fs.readFileSync(path.join(cwd,'lib','store.js'),'utf8');
assert(/if \(!productionRuntime\) writeDiskJson\(name, data\)/.test(storeSource),'production PostgreSQL state must not be mirrored to local JSON');
assert(/await store\.flush\(\)/.test(fs.readFileSync(path.join(cwd,'server.js'),'utf8')),'startup must flush the owner bootstrap write before listening');

const renderMount=fs.mkdtempSync(path.join(os.tmpdir(),'sj-render-mount-'));
const overriddenLocal=fs.mkdtempSync(path.join(os.tmpdir(),'sj-overridden-local-'));
result=run(`const store=require('./lib/store'); const status=store.storageStatus(); if(!status.storageDir.startsWith(process.env.RENDER_DISK_MOUNT_PATH)) { console.error(status); process.exit(2); }`,{NODE_ENV:'test',RENDER_DISK_MOUNT_PATH:renderMount,SMARTER_JUSTICE_STORAGE_DIR:overriddenLocal,DATABASE_URL:''});
assert.equal(result.status,0,`Render disk mount must take precedence over a conflicting local storage path: ${result.stderr}`);
const uploadGateDir=fs.mkdtempSync(path.join(os.tmpdir(),'sj-upload-gate-'));
result=run(`const pg=require('pg'); class FakeClient { async connect(){} async query(sql){ return /SELECT value/.test(sql)?{rows:[]}:{rows:[]}; } } require.cache[require.resolve('pg')].exports={Client:FakeClient}; const store=require('./lib/store'); store.init().then(()=>{try{store.saveAttachment('case1',{name:'private.txt',dataBase64:Buffer.from('private').toString('base64')});process.exit(3)}catch(err){if(err.code==='UPLOAD_STORAGE_NOT_READY')process.exit(0);console.error(err);process.exit(2)}}).catch(err=>{console.error(err);process.exit(4)});`,{NODE_ENV:'production',RENDER:'',RENDER_DISK_MOUNT_PATH:'',SMARTER_JUSTICE_STORAGE_DIR:uploadGateDir,DATABASE_URL:'postgres://fake/fake',PGSSLMODE:'disable'});
assert.equal(result.status,0,`production uploads must require durable private upload storage even when the database is healthy: ${result.stderr}`);
for(const dir of [productionDir,developmentDir,failedDbDir,renderMount,overriddenLocal,uploadGateDir])fs.rmSync(dir,{recursive:true,force:true});
console.log('storage-readiness.test.js passed');
