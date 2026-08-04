const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
process.env.NODE_ENV='test';process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-profile-growth-v1720-'));
const seeds=require('../data/threeMarketProfileSeedsV1720');const marketplace=require('../lib/professionalMarketplace');const batch=seeds.THREE_MARKET_PROFILE_BATCH_V1720;
assert.equal(batch.leadMarket,'Manhattan');assert.equal(batch.nextLeadMarket,'Northern Metro New Jersey');assert.deepEqual(batch.actual,{individualProfessionals:17,firms:1,professionalFirmLinks:17,markets:{Manhattan:8,Brooklyn:5,'Northern Metro New Jersey':4}});
assert.equal(seeds.THREE_MARKET_PROFESSIONAL_SEEDS_V1720.length,17);assert.equal(seeds.THREE_MARKET_FIRM_SEEDS_V1720.length,1);assert.equal(new Set(seeds.THREE_MARKET_PROFESSIONAL_SEEDS_V1720.map(x=>x.id)).size,17);
for(const p of seeds.THREE_MARKET_PROFESSIONAL_SEEDS_V1720){assert(p.firmId&&p.officeLocations.length&&p.practiceAreas.length&&p.portalEligibility.length&&p.sourceRecords.length);assert.equal(p.claimStatus,'not claimed');assert.equal(p.verificationStatus,'not started');assert(p.sourceRecords.every(x=>x.authorityLevel==='self-reported'&&x.reviewStatus==='approved source'));}
assert.deepEqual(marketplace.directoryMetrics(),{publicProfessionals:233,publicFirms:48,publicTotal:281,qualifyingProfessionals:232,qualifyingFirms:46,qualifyingTotal:278,qualificationRule:marketplace.directoryMetrics().qualificationRule});
assert.equal(marketplace.searchPublicProfessionals({city:'New York',limit:100}).total,51);assert.equal(marketplace.searchPublicProfessionals({city:'Brooklyn',limit:100}).total,75);assert.equal(marketplace.searchPublicProfessionals({county:'Hudson County',limit:100}).total,21);
for(const id of seeds.THREE_MARKET_PROFESSIONAL_SEEDS_V1720.map(x=>x.id)){const p=marketplace.getOwnerData().professionals.find(x=>x.id===id);assert(p&&p.sourceSeeded&&p.publicProfileEnabled);assert.equal(p.claimStatus,'not claimed');assert.equal(p.verificationStatus,'not started');assert.equal(p.eligibility.consultationEligible,false);assert(p.firmId);}
const owner=marketplace.getOwnerData();assert.equal(owner.profileGrowthBatch.version,'1.7.31');assert.equal(owner.profileGrowthBatch.nextLeadMarket,'The Bronx');
const report=JSON.parse(fs.readFileSync(path.join(__dirname,'..','PROFILE_GROWTH_REPORT_V1.7.20.json'),'utf8'));assert.equal(report.actual.newIndividualProfessionals,17);assert.equal(report.actual.newFirms,1);assert.equal(report.actual.newProfessionalFirmLinks,17);assert.equal(report.finalDirectory.publicTotal,75);assert.equal(report.finalDirectory.qualifyingTotal,72);
console.log('v1.7.20 Manhattan-led profile targets, 17 professionals, 1 firm, 17 links, exact totals, source controls, neutrality, and closed eligibility passed.');
