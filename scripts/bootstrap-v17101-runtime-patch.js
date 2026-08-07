'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'release-delta','v17101-runtime-patch-manifest.json'),'utf8'));
const archivePath = path.join(root,manifest.baseArtifact);
const runtimeRoot = path.join(root,'.runtime');
const baseRoot = path.join(runtimeRoot,'smarter-justice-v1.7.98');
const appRoot = path.join(runtimeRoot,`smarter-justice-v${manifest.targetVersion}`);
function fail(m){console.error(`[v17101-runtime-patch] ${m}`);process.exit(1);}
function sha(data){return crypto.createHash('sha256').update(data).digest('hex');}
function run(cmd,args,opts={}){const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit',env:process.env,...opts});return {ok:!r.error&&r.status===0,status:r.status,error:r.error};}
if(!fs.existsSync(archivePath))fail(`missing ${manifest.baseArtifact}`);
const base=fs.readFileSync(archivePath);
if(base.length!==manifest.baseSize||sha(base)!==manifest.baseSha256)fail('retained v1.7.98 base identity mismatch');
const b64=manifest.chunks.map(rel=>{const p=path.join(root,rel);if(!fs.existsSync(p))fail(`missing ${rel}`);return fs.readFileSync(p,'ascii').replace(/\s+/g,'');}).join('');
const gz=Buffer.from(b64,'base64');
if(gz.length!==manifest.patchGzipSize||sha(gz)!==manifest.patchGzipSha256)fail('runtime patch identity mismatch');
const patch=zlib.gunzipSync(gz);
fs.rmSync(runtimeRoot,{recursive:true,force:true});fs.mkdirSync(runtimeRoot,{recursive:true});
const py=['import pathlib,sys,zipfile','archive=pathlib.Path(sys.argv[1])','target=pathlib.Path(sys.argv[2]).resolve()','with zipfile.ZipFile(archive) as z:','  for info in z.infolist():',"    name=info.filename.replace('\\\\','/')",'    member=pathlib.PurePosixPath(name)',"    if member.is_absolute() or '..' in member.parts: raise SystemExit(f'unsafe ZIP member: {name}')",'  z.extractall(target)'].join('\n');
let ex=run('python3',['-c',py,archivePath,runtimeRoot]);
if(!ex.ok){fs.rmSync(runtimeRoot,{recursive:true,force:true});fs.mkdirSync(runtimeRoot,{recursive:true});ex=run('unzip',['-q',archivePath,'-d',runtimeRoot]);}
if(!ex.ok||!fs.existsSync(baseRoot))fail('base extraction failed');
fs.renameSync(baseRoot,appRoot);
const patchFile=path.join(os.tmpdir(),`sj-v17101-${process.pid}.patch`);fs.writeFileSync(patchFile,patch);
try{const ap=run('git',['apply','--check',patchFile],{cwd:appRoot});if(!ap.ok)fail('git apply preflight failed');const apply=run('git',['apply',patchFile],{cwd:appRoot});if(!apply.ok)fail('git apply failed');}finally{fs.rmSync(patchFile,{force:true});}
for(const [rel,digest] of Object.entries(manifest.fileHashes)){const p=path.join(appRoot,rel);if(!fs.existsSync(p)||!fs.statSync(p).isFile())fail(`patched target missing ${rel}`);if(sha(fs.readFileSync(p))!==digest)fail(`patched target hash mismatch ${rel}`);}
const pkg=JSON.parse(fs.readFileSync(path.join(appRoot,'package.json'),'utf8'));if(pkg.version!==manifest.targetVersion)fail(`runtime version ${pkg.version} != ${manifest.targetVersion}`);
if(process.env.SKIP_RUNTIME_INSTALL!=='1'){const i=run('npm',['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],{cwd:appRoot,env:{...process.env,npm_config_registry:'https://registry.npmjs.org/',NPM_CONFIG_AUDIT:'false',NPM_CONFIG_FUND:'false'}});if(!i.ok)fail(`runtime dependency install failed ${i.status??'unknown'}`);}
console.log(`[v17101-runtime-patch] verified ${Object.keys(manifest.fileHashes).length} production/runtime files against qualified v${manifest.targetVersion}`);
console.log(`[v17101-runtime-patch] target artifact SHA-256 ${manifest.targetArtifactSha256}`);
