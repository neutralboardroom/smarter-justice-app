'use strict';
const assert=require('assert');const fs=require('fs');const os=require('os');const path=require('path');
process.env.NODE_ENV='test';process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-profile-v1729-'));
const seeds=require('../data/sixRegionProfileSeedsV1729');const marketplace=require('../lib/professionalMarketplace');
assert.equal(seeds.SIX_REGION_PROFILE_BATCH_V1729.version,'1.7.29');assert.equal(seeds.SIX_REGION_PROFESSIONAL_SEEDS_V1729.length,36);assert.equal(seeds.SIX_REGION_FIRM_SEEDS_V1729.length,1);assert.equal(new Set(seeds.SIX_REGION_PROFESSIONAL_SEEDS_V1729.map(x=>x.id)).size,36);
for(const [county,count] of Object.entries({'Kings County':12,'Passaic County':12,'Fairfield County':12}))assert.equal(seeds.SIX_REGION_PROFESSIONAL_SEEDS_V1729.filter(x=>x.publicFacts.county===county).length,count,county);
for(const row of seeds.SIX_REGION_PROFESSIONAL_SEEDS_V1729){assert.equal(row.claimStatus,'not claimed');assert.equal(row.verificationStatus,'not started');assert.equal(row.availabilityStatus,'not configured');assert(row.sourceRecords.length>=1);assert(marketplace.getPublicProfessional(row.id),row.id);}
const metrics=marketplace.directoryMetrics();assert(metrics.publicProfessionals>=197&&metrics.publicFirms>=42&&metrics.publicTotal>=239);assert(metrics.qualifyingTotal>=236);
for(const county of ['Kings County','Passaic County','Fairfield County'])assert.equal(marketplace.searchPublicProfessionals({county,limit:250}).professionals.filter(x=>seeds.SIX_REGION_PROFESSIONAL_SEEDS_V1729.some(s=>s.id===x.recordId)).length,12,county);
const cohen=marketplace.getPublicFirm('firm-cohen-wolf');assert(cohen&&cohen.professionalCount>=12&&cohen.claimed===false&&cohen.participating===false);
console.log('six-region-profile-growth-v1729.test.js passed');
