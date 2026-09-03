'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const target = path.join(root, '.runtime', 'pre128-live');
const bootstrap = spawnSync(process.execPath, [path.join(root, 'scripts', 'bootstrap-pre128-release.js')], { cwd:root, env:process.env, stdio:'inherit' });
if (bootstrap.status !== 0) process.exit(bootstrap.status || 1);
if (!fs.existsSync(path.join(target, '.pre128-render-bootstrap.json'))) process.exit(1);
const migration = spawnSync(process.execPath, [path.join(target, 'scripts', 'run-migrations.js')], { cwd:target, env:process.env, stdio:'inherit' });
process.exit(migration.status || 0);
