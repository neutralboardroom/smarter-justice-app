'use strict';
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const root=path.resolve(__dirname,'..'),target=path.join(root,'.runtime','pre117-live'),marker=path.join(target,'.pre117-render-bootstrap.json');
if(!fs.existsSync(marker)){console.error('[PRE117 DEPLOY] marker missing');process.exit(1)}
const m=JSON.parse(fs.readFileSync(marker,'utf8'));
if(m.release!=='v2.0.0-pre117'||m.qualificationStatus!=='QUALIFIED_NONPRODUCTION'||m.productionAuthorization!==false){console.error('[PRE117 DEPLOY] marker mismatch');process.exit(1)}
const env={...process.env,PYTHON_BIN:process.env.PYTHON_BIN||'python3',PYTHONDONTWRITEBYTECODE:'1',PYTHONPYCACHEPREFIX:process.env.PYTHONPYCACHEPREFIX||'/tmp/sj-pre117-runtime-pycache'};
env.PYTHONPATH=path.join(target,'.python-vendor')+(env.PYTHONPATH?path.delimiter+env.PYTHONPATH:'');
const c=spawn(process.execPath,[path.join(target,'server.js')],{cwd:target,env,stdio:'inherit'});
for(const s of ['SIGTERM','SIGINT'])process.on(s,()=>{if(!c.killed)c.kill(s)});
c.on('exit',(code,signal)=>process.exit(signal?1:(Number.isInteger(code)?code:1)));
