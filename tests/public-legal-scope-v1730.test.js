'use strict';
const assert=require('assert');const fs=require('fs');const path=require('path');const root=path.join(__dirname,'..');
const files=['whole-situation.html','whole-situation.js','free-tools.html','llms.txt'];const content=files.map(f=>fs.readFileSync(path.join(root,'public',f),'utf8')).join('\n');
for(const banned of ['Smarter Money','Smarter Health','Smarter Property','automatic cross-sector sharing','sector handoff'])assert(!content.includes(banned),banned);
for(const required of ['legal-portal-only','automatic cross-portal sharing','Landlord-Tenant and Housing Law Aid','CoveredNYC Health Coverage Help','Business Launch Desk'])assert(content.toLowerCase().includes(required.toLowerCase()),required);
console.log('public-legal-scope-v1730.test.js passed');
