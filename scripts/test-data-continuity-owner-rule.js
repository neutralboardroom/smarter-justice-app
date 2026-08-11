#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const configPath = path.join(root, 'deployment', 'product-deployment.json');
const errors = [];

function requireTrue(condition, message) {
  if (!condition) errors.push(message);
}

requireTrue(fs.existsSync(configPath), 'Missing deployment/product-deployment.json');
if (fs.existsSync(configPath)) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const continuity = config.dataContinuity || {};
  for (const key of ['persistentStorageRequired', 'backupReceiptRequired', 'migrationClassRequired', 'rollbackMustPreserveNewData']) {
    requireTrue(continuity[key] === true, `Owner data-continuity rule must enable ${key}`);
  }
  requireTrue(typeof config.commands?.migrate === 'string' && config.commands.migrate.length > 0, 'A migration command must be declared');
}

const forbidden = ['users.json', 'payments.json', 'cards.json', 'case-data.json', 'uploaded-documents.json'];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'coverage', 'dist', 'build'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const rel = path.relative(root, full).replace(/\\/g, '/').toLowerCase();
      if (forbidden.some(name => rel.endsWith(name))) errors.push(`Potential live user-data file is stored in source: ${rel}`);
    }
  }
}
walk(root);

const packageJson = path.join(root, 'package.json');
requireTrue(fs.existsSync(packageJson), 'Missing package.json');
if (fs.existsSync(packageJson)) {
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  requireTrue(Boolean(pkg.scripts?.migrate), 'package.json must provide a migrate script');
}

if (errors.length) {
  console.error('Persistent user-data owner-rule qualification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Persistent user-data owner-rule structural gate passed. Backup, restoration, migration rehearsal, and live continuity receipts remain mandatory.');
