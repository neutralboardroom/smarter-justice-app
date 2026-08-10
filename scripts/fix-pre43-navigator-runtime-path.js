'use strict';

const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(process.argv[2]||'.');
const serverPath=path.join(root,'server.js');
if(!fs.existsSync(serverPath))throw new Error('[pre43-runtime-path] generated server missing');
let source=fs.readFileSync(serverPath,'utf8');
const oldText="const script=path.resolve(process.cwd(),'deployment/pre43/navigator_preview_cli.py');\n    const child=spawn(process.env.PYTHON_BIN||'python3',[script],{cwd:process.cwd(),env:{...process.env},stdio:['pipe','pipe','pipe']});";
const newText="const repoRoot=path.resolve(__dirname,'..','..');\n    const script=path.join(repoRoot,'deployment','pre43','navigator_preview_cli.py');\n    const child=spawn(process.env.PYTHON_BIN||'python3',[script],{cwd:repoRoot,env:{...process.env},stdio:['pipe','pipe','pipe']});";
if(!source.includes(oldText))throw new Error('[pre43-runtime-path] expected Navigator bridge seam missing');
source=source.replace(oldText,newText);
fs.writeFileSync(serverPath,source,'utf8');
console.log('[pre43-runtime-path] Navigator Python bridge anchored to repository root');
