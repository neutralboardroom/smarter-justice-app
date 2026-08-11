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
  requireTrue(JSON.stringify(config.localization?.requiredLocales) === JSON.stringify(['en', 'es']), 'Required locales must be exactly en and es');
  requireTrue(config.localization?.toggleRequired === true, 'English/Español toggle owner rule must be enabled');
  requireTrue(config.localization?.criticalJourneyReceiptRequired === true, 'Bilingual critical-journey receipt must be required');
}

const candidates = [
  'locales', 'i18n', 'translations', 'public/locales', 'src/locales', 'src/i18n',
  'content/en', 'content/es', 'public/en', 'public/es'
].map(p => path.join(root, p));
const existing = candidates.filter(p => fs.existsSync(p));
requireTrue(existing.length > 0, 'No recognized localization directory exists yet; full English/Spanish implementation is required before qualification');

const allText = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'coverage', 'dist', 'build'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(json|js|cjs|mjs|html|md|txt|yml|yaml)$/i.test(entry.name)) {
      try { allText.push(fs.readFileSync(full, 'utf8')); } catch {}
    }
  }
}
walk(root);
const joined = allText.join('\n');
requireTrue(/Español|Spanish|\bes\b/i.test(joined), 'No Spanish-language or locale evidence found');
requireTrue(/English|\ben\b/i.test(joined), 'No English-language or locale evidence found');

if (errors.length) {
  console.error('Spanish owner-rule qualification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Spanish owner-rule structural gate passed. Human-reviewed full translation parity is still required by release receipt.');
