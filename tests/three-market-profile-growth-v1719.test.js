const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-profile-growth-v1719-'));
const seeds=require('../data/threeMarketProfileSeedsV1719');
const marketplace=require('../lib/professionalMarketplace');
const batch=seeds.THREE_MARKET_PROFILE_BATCH_V1719;
assert.equal(batch.leadMarket,'Brooklyn');assert.equal(batch.nextLeadMarket,'Manhattan');
assert.deepEqual(batch.actual,{individualProfessionals:25,firms:5,professionalFirmLinks:25,markets:{Brooklyn:11,Manhattan:7,'Northern Metro New Jersey':7}});
assert.equal(seeds.THREE_MARKET_PROFESSIONAL_SEEDS_V1719.length,25);assert.equal(seeds.THREE_MARKET_FIRM_SEEDS_V1719.length,5);
assert.equal(new Set(seeds.THREE_MARKET_PROFESSIONAL_SEEDS_V1719.map(x=>x.id)).size,25);
for(const p of seeds.THREE_MARKET_PROFESSIONAL_SEEDS_V1719){assert(p.firmId&&p.officeLocations.length&&p.practiceAreas.length&&p.portalEligibility.length&&p.sourceRecords.length);assert.equal(p.claimStatus,'not claimed');assert.equal(p.verificationStatus,'not started');}
const metrics=marketplace.directoryMetrics();assert.deepEqual(metrics,{...metrics,publicProfessionals:233,publicFirms:48,publicTotal:281,qualifyingProfessionals:232,qualifyingFirms:46,qualifyingTotal:278});
assert.equal(marketplace.searchPublicProfessionals({city:'Brooklyn',limit:100}).total,75);
assert.equal(marketplace.searchPublicProfessionals({city:'New York',limit:100}).total,51);
assert.equal(marketplace.searchPublicProfessionals({county:'Hudson County',limit:100}).total,21);
assert.equal(marketplace.searchPublicFirms({county:'Hudson County',limit:100}).total,5);
for(const p of marketplace.searchPublicProfessionals({limit:100}).professionals.filter(x=>/^2026-07-22/.test(x.sourceReviewedAt))){assert.equal(p.claimed,false);assert.equal(p.verified,false);assert.equal(p.participating,false);assert.equal(p.consultationEligible,false);assert(p.firm?.name);}
const owner=marketplace.getOwnerData();assert.equal(owner.profileGrowthBatch.version,'1.7.31');
const report=JSON.parse(fs.readFileSync(path.join(__dirname,'..','PROFILE_GROWTH_REPORT_V1.7.19.json'),'utf8'));assert.equal(report.actual.newIndividualProfessionals,25);assert.equal(report.actual.newFirms,5);assert.equal(report.actual.newProfessionalFirmLinks,25);assert.equal(report.finalDirectory.qualifyingTotal,54);
const html=fs.readFileSync(path.join(__dirname,'..','public','professionals.html'),'utf8');for(const term of ['Search Brooklyn','Search Manhattan','Search Northern New Jersey','name="county"'])assert(html.includes(term),`missing ${term}`);
const source=fs.readFileSync(path.join(__dirname,'..','lib','professionalMarketplace.js'),'utf8');assert(/neutral relevance and alphabetical ordering/.test(source));assert(!/Number\(b\.consultationEligible\).*sort/.test(source));
console.log('v1.7.19 three-market profile targets, 25 professionals, 5 firms, 25 links, county search, claim readiness, neutrality, and owner accountability tests passed.');
