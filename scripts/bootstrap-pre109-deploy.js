'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');
const root=path.resolve(__dirname,'..');
const names=['SMARTER_JUSTICE__PRE109_DEPLOY_RUNTIME.tgz','SMARTER_JUSTICE__PRE109_DEPLOY_RUNTIME (1).tgz','SMARTER_JUSTICE__PRE109_DEPLOY_RUNTIME(1).tgz'];
const wrapperNames=['SMARTER_JUSTICE__ONE_FILE_GITHUB_UPLOAD__PRE109.zip','SMARTER_JUSTICE__ONE_FILE_GITHUB_UPLOAD__PRE109 (1).zip','SMARTER_JUSTICE__ONE_FILE_GITHUB_UPLOAD__PRE109(1).zip'];
let archive=names.map(n=>path.join(root,n)).find(p=>fs.existsSync(p));
const wrapper=wrapperNames.map(n=>path.join(root,n)).find(p=>fs.existsSync(p));
const extractedCarrier=path.join(root,'.runtime','PRE109_DEPLOY_RUNTIME_FROM_UPLOAD.tgz');
if(!archive&&wrapper){fs.mkdirSync(path.dirname(extractedCarrier),{recursive:true});const py=`import zipfile,sys\nz=zipfile.ZipFile(sys.argv[1])\nname='SMARTER_JUSTICE__PRE109_DEPLOY_RUNTIME.tgz'\nassert name in z.namelist(), 'carrier missing from wrapper'\nopen(sys.argv[2],'wb').write(z.read(name))`;const r=cp.spawnSync(process.env.PYTHON_BIN||'python3',['-c',py,wrapper,extractedCarrier],{encoding:'utf8'});if(r.status!==0)fail('Could not extract PRE109 runtime from upload ZIP: '+String(r.stderr||r.stdout||''));archive=extractedCarrier;}
const target=path.join(root,'.runtime','pre109-live');
const expectedSha256='c88e1834cd9fd9c46bd8eb548e61327ee0964dded7107f9eb38d12483db19db3';
const expectedBytes=12701045;
function fail(message){console.error(`[PRE109 DEPLOY] ${message}`);process.exit(1)}
function assert(ok,message){if(!ok)fail(message)}
function sha(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
function readJson(rel){const p=path.join(target,rel);assert(fs.existsSync(p),`missing required file: ${rel}`);return JSON.parse(fs.readFileSync(p,'utf8'))}
assert(archive,'PRE109 deployment carrier is missing. Upload SMARTER_JUSTICE__ONE_FILE_GITHUB_UPLOAD__PRE109.zip (preferred) or SMARTER_JUSTICE__PRE109_DEPLOY_RUNTIME.tgz to the repository root.');
const stat=fs.statSync(archive);assert(stat.size===expectedBytes,`carrier size mismatch: ${stat.size} != ${expectedBytes}`);
const digest=sha(archive);assert(digest===expectedSha256,`carrier SHA-256 mismatch: ${digest}`);
const members=cp.execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:64*1024*1024});
for(const raw of members.split(/\r?\n/)){const name=raw.trim();if(!name)continue;const normalized=name.replace(/^\.\//,'');assert(!path.posix.isAbsolute(normalized),`unsafe absolute archive member: ${name}`);assert(!normalized.split('/').includes('..'),`unsafe parent traversal archive member: ${name}`)}
fs.rmSync(target,{recursive:true,force:true});fs.mkdirSync(target,{recursive:true});
cp.execFileSync('tar',['-xzf',archive,'-C',target],{stdio:'inherit'});
const pkg=readJson('package.json');assert(pkg.name==='smarter-justice-v1','unexpected runtime package identity');assert(pkg.version==='2.0.0-pre109',`unexpected runtime version: ${pkg.version}`);
const receipt=readJson('deployment/pre109/PRE109_FINAL_QUALIFICATION_RECEIPT.json');
assert(receipt.release==='v2.0.0-pre109','release receipt mismatch');assert(receipt.status==='QUALIFIED_NONPRODUCTION','PRE109 qualification status mismatch');
assert(Array.isArray(receipt.scope)&&receipt.scope.join(',')==='immigration,tax','PRE109 scope mismatch');
assert(receipt.qualification?.formEngineChecks==='28/28 PASS','form-engine qualification mismatch');assert(receipt.qualification?.runtimeChecks==='15/15 PASS','runtime qualification mismatch');assert(receipt.qualification?.regressionChecks==='267/267 PASS','regression qualification mismatch');assert(Number(receipt.qualification?.secretFindings)===0,'secret scan mismatch');assert(Number(receipt.qualification?.removedPredecessorFiles)===0&&Number(receipt.qualification?.unauthorizedPredecessorChanges)===0,'no-loss qualification mismatch');
const imm=readJson('data/pre109-immigration-form-library.json');const tax=readJson('data/pre109-tax-form-library.json');
assert(imm.counts?.forms===108&&imm.counts?.instructions===92,'Immigration preserved-library count mismatch');assert(tax.counts?.total===65&&tax.counts?.forms===46&&tax.counts?.instructions===19,'Tax preserved-library count mismatch');
for(const rel of ['server.js','lib/formEnginePre109.js','scripts/pre109_fill_official_pdf.py','public/forms-center.html','public/immigration.html','public/taxes.html','vendor/pre109/immigration-oasis/data/official-pdf-cache/g-1145.pdf','vendor/pre109/justice-tax-solutions/assets/official-forms/irs-individual-income-tax/f1040 U.S. Individual Income Tax Return.pdf','vendor/pre109/justice-tax-solutions/assets/official-forms/irs-tax-debt-resolution/f9465 Installment Agreement Request.pdf','.python-vendor/pypdf/__init__.py'])assert(fs.existsSync(path.join(target,rel)),`missing PRE109 deploy-critical file: ${rel}`);
for(const rel of ['server.js','lib/formEnginePre109.js'])cp.execFileSync(process.execPath,['--check',path.join(target,rel)],{stdio:'inherit'});
const pyEnv={...process.env,PYTHONPATH:path.join(target,'.python-vendor')+(process.env.PYTHONPATH?path.delimiter+process.env.PYTHONPATH:'')};
cp.execFileSync(process.env.PYTHON_BIN||'python3',['-c','import pypdf; print(pypdf.__version__)'],{stdio:'inherit',env:pyEnv});
if(process.env.PRE109_BOOTSTRAP_SKIP_TARGET_NPM_CI!=='1'){const npm=process.platform==='win32'?'npm.cmd':'npm';cp.execFileSync(npm,['--prefix',target,'ci','--omit=dev','--no-audit','--no-fund','--ignore-scripts'],{stdio:'inherit',env:{...process.env,NPM_CONFIG_AUDIT:'false',NPM_CONFIG_FUND:'false'}})}
const marker={schemaVersion:'smarter-justice.pre109.render-bootstrap.v1',release:'v2.0.0-pre109',carrier:wrapper?path.basename(wrapper):path.basename(archive),carrierSha256:digest,carrierBytes:stat.size,scope:receipt.scope,qualification:receipt.qualification,preservedLibraries:{immigration:imm.counts,tax:tax.counts},verifiedGenerationLanes:receipt.verifiedGenerationLanes,preparedAt:new Date().toISOString()};
fs.writeFileSync(path.join(target,'.pre109-render-bootstrap.json'),JSON.stringify(marker,null,2)+'\n');
console.log(`[PRE109 DEPLOY] verified ${marker.release}; forms=${marker.verifiedGenerationLanes.length} verified lanes; carrier=${digest}`);
