'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const target=path.join(root,'.runtime','pre109-live');
const marker=path.join(target,'.pre109-render-bootstrap.json');
if(!fs.existsSync(marker)){console.error('[PRE109 DEPLOY] runtime marker missing; build/bootstrap did not complete');process.exit(1)}
process.env.PYTHON_BIN=process.env.PYTHON_BIN||'python3';
process.env.PYTHONPATH=path.join(target,'.python-vendor')+(process.env.PYTHONPATH?path.delimiter+process.env.PYTHONPATH:'');
process.chdir(target);
require(path.join(target,'server.js'));
