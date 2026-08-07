'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'release-delta', 'v17101-runtime-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const archivePath = path.join(root, manifest.baseArtifact);
const runtimeRoot = path.join(root, '.runtime');
const baseRoot = path.join(runtimeRoot, 'smarter-justice-v1.7.98');
const appRoot = path.join(runtimeRoot, `smarter-justice-v${manifest.targetVersion}`);

function fail(message) {
  console.error(`[v17101-runtime-projection] ${message}`);
  process.exit(1);
}
function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
function run(command, args, options={}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', env: process.env, ...options });
  if (result.error) return {ok:false,error:result.error};
  return {ok:result.status===0,status:result.status};
}
function safeRelative(name) {
  const n=name.replace(/\\/g,'/').replace(/^\.\//,'');
  if(!n||n.startsWith('/')||n.split('/').includes('..')) fail(`unsafe delta path ${name}`);
  return n;
}
function octal(buf){const t=buf.toString('ascii').replace(/\0.*$/s,'').trim();return t?parseInt(t,8):0;}
function extractUstar(tar,dest){
  let offset=0,count=0;
  while(offset+512<=tar.length){
    const h=tar.subarray(offset,offset+512);
    if(h.every(b=>b===0))break;
    const name=h.subarray(0,100).toString('utf8').replace(/\0.*$/s,'');
    const prefix=h.subarray(345,500).toString('utf8').replace(/\0.*$/s,'');
    const rel=safeRelative(prefix?`${prefix}/${name}`:name);
    const size=octal(h.subarray(124,136));
    const type=h[156]===0?'0':String.fromCharCode(h[156]);
    const start=offset+512,end=start+size;
    if(end>tar.length)fail(`truncated delta member ${rel}`);
    const target=path.resolve(dest,rel),destPrefix=path.resolve(dest)+path.sep;
    if(!target.startsWith(destPrefix))fail(`delta escaped root ${rel}`);
    if(type==='0'||type===''){
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,tar.subarray(start,end));
      count++;
    }else if(type==='5')fs.mkdirSync(target,{recursive:true});
    else fail(`unsupported tar type ${type} for ${rel}`);
    offset=start+Math.ceil(size/512)*512;
  }
  return count;
}

if(!fs.existsSync(archivePath))fail(`missing ${manifest.baseArtifact}`);
const base=fs.readFileSync(archivePath);
if(base.length!==manifest.baseSize||sha256(base)!==manifest.baseSha256)fail('retained exact v1.7.98 base identity mismatch');

const b64=manifest.chunks.map(rel=>{
  const p=path.join(root,rel); if(!fs.existsSync(p))fail(`missing ${rel}`);
  return fs.readFileSync(p,'ascii').replace(/\s+/g,'');
}).join('');
const gz=Buffer.from(b64,'base64');
if(gz.length!==manifest.deltaTarGzipSize||sha256(gz)!==manifest.deltaTarGzipSha256)fail('runtime delta identity mismatch');
const tar=zlib.gunzipSync(gz);

fs.rmSync(runtimeRoot,{recursive:true,force:true});
fs.mkdirSync(runtimeRoot,{recursive:true});
const py=[
'import pathlib,sys,zipfile','archive=pathlib.Path(sys.argv[1])','target=pathlib.Path(sys.argv[2]).resolve()',
'with zipfile.ZipFile(archive) as z:',
'  for info in z.infolist():',
"    name=info.filename.replace('\\\\','/')",'    member=pathlib.PurePosixPath(name)',
"    if member.is_absolute() or '..' in member.parts: raise SystemExit(f'unsafe ZIP member: {name}')",
'  z.extractall(target)'].join('\n');
let extraction=run('python3',['-c',py,archivePath,runtimeRoot]);
if(!extraction.ok){
  fs.rmSync(runtimeRoot,{recursive:true,force:true});fs.mkdirSync(runtimeRoot,{recursive:true});
  extraction=run('unzip',['-q',archivePath,'-d',runtimeRoot]);
}
if(!extraction.ok||!fs.existsSync(baseRoot))fail('exact retained base extraction failed');
fs.renameSync(baseRoot,appRoot);
const applied=extractUstar(tar,appRoot);
if(applied!==manifest.patchedFiles)fail(`patched file count ${applied} != ${manifest.patchedFiles}`);

for(const [rel,digest] of Object.entries(manifest.fileHashes)){
  const p=path.join(appRoot,rel);
  if(!fs.existsSync(p)||!fs.statSync(p).isFile())fail(`patched target missing ${rel}`);
  const actual=sha256(fs.readFileSync(p));
  if(actual!==digest)fail(`patched target hash mismatch ${rel}`);
}
const pkg=JSON.parse(fs.readFileSync(path.join(appRoot,'package.json'),'utf8'));
if(pkg.version!==manifest.targetVersion)fail(`runtime version ${pkg.version} != ${manifest.targetVersion}`);

if(process.env.SKIP_RUNTIME_INSTALL!=='1'){
  const install=run('npm',['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],{
    cwd:appRoot,
    env:{...process.env,npm_config_registry:'https://registry.npmjs.org/',NPM_CONFIG_AUDIT:'false',NPM_CONFIG_FUND:'false'}
  });
  if(!install.ok)fail(`runtime dependency install failed with status ${install.status??'unknown'}`);
}
console.log(`[v17101-runtime-projection] verified ${applied} production/runtime files against qualified v${manifest.targetVersion}`);
console.log(`[v17101-runtime-projection] target artifact SHA-256 ${manifest.targetArtifactSha256}`);
