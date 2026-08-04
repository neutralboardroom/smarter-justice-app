const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-directory-v1714-'));
const marketplace=require('../lib/professionalMarketplace');

const metrics=marketplace.directoryMetrics();
assert.deepEqual({publicProfessionals:metrics.publicProfessionals,publicFirms:metrics.publicFirms,publicTotal:metrics.publicTotal},{publicProfessionals:233,publicFirms:48,publicTotal:281});
assert.deepEqual({qualifyingProfessionals:metrics.qualifyingProfessionals,qualifyingFirms:metrics.qualifyingFirms,qualifyingTotal:metrics.qualifyingTotal},{qualifyingProfessionals:232,qualifyingFirms:46,qualifyingTotal:278});
assert(/non-secondary source record/.test(metrics.qualificationRule));

function pros(input={}){return marketplace.searchPublicProfessionals({...input,limit:100});}
function firms(input={}){return marketplace.searchPublicFirms({...input,limit:100});}
assert.equal(pros({postalCode:'11242'}).total,38,'exact ZIP should find all current individual profiles');
assert.equal(firms({postalCode:'11242'}).total,18,'exact ZIP should find all current firm profiles');
assert.equal(pros({postalCode:'10001'}).total,0,'a different exact ZIP must not invent nearby matches');
assert.equal(firms({postalCode:'10001'}).total,0,'a different exact ZIP must not invent nearby firm matches');
assert.equal(pros({city:'Brooklyn'}).total,75);
assert.equal(pros({city:'New York'}).total,51);
assert.equal(pros({city:'Jersey City'}).total,15);
assert.equal(pros({county:'Kings County'}).total,64);
assert.equal(pros({county:'New York County'}).total,51);
assert.equal(pros({county:'Hudson County'}).total,21);
assert.equal(firms({county:'Hudson County'}).total,5);
assert.equal(firms({city:'Brooklyn'}).total,23);
assert.equal(pros({state:'NY'}).total,150);
assert.equal(firms({state:'New York'}).total,43);
assert.equal(pros({professionalType:'attorney'}).total,233);
assert.equal(pros({professionalType:'CPA'}).total,0);
assert.equal(pros({language:'Spanish'}).total,3);
assert.equal(firms({language:'Spanish'}).total,4);
assert.equal(pros({profileStatus:'unclaimed'}).total,233);
assert.equal(firms({profileStatus:'verified'}).total,0);
assert.equal(pros({inquiryAvailability:true}).total,0,'closed inquiry gates must remain closed');
assert.equal(firms({inquiryAvailability:true}).total,0,'closed firm inquiry gates must remain closed');

const carAccident=pros({practiceArea:'car accident'}).professionals.map(x=>x.displayName);
assert(carAccident.includes('Michael S. Lamonsoff')&&carAccident.includes('Jeffrey K. Kestenbaum'),'plain-language car-accident search should map to documented motor-vehicle services');
const family=firms({practiceArea:'family law'}).firms.map(x=>x.name);
assert(family.includes('Ganolli Law')&&family.includes('Law Office of Andrew A. Bokser'),'family-law synonym search should include supported firms');
const seededFirm=firms({practiceArea:'personal injury'}).firms.find(x=>x.name==='Avanzino & Moreno, P.C.');
assert(seededFirm&&seededFirm.practiceAreas.includes('Personal injury'),'firm source facts must not disappear merely because no individual profile is attached');
assert.equal(new Set(firms({postalCode:'11242'}).firms.map(x=>x.id)).size,18,'multiple-office handling must not duplicate firm cards');

const alphabetical=pros().professionals.map(x=>x.displayName);
assert.deepEqual(alphabetical,[...alphabetical].sort((a,b)=>a.localeCompare(b)),'default organic ordering should be neutral alphabetical order');
assert(/Payment, sponsorship, membership/.test(pros().disclosure));
assert.equal(pros().distanceSearchAvailable,false);
assert(/Radius search is not shown/.test(pros().distanceSearchMessage));
assert(pros().professionals.every(x=>x.locationData[0]?.postalCode));
assert(pros().professionals.every(x=>/^2026-07-(20|22|23|24)/.test(x.sourceReviewedAt)));

const html=fs.readFileSync(path.join(__dirname,'..','public','professionals.html'),'utf8');
for(const field of ['postalCode','city','county','state','profileKind','professionalType','language','serviceMethod','profileStatus','sourceFreshness','inquiryAvailability'])assert(html.includes(`name=\"${field}\"`),`missing public search field ${field}`);
assert(/Radius results are not shown until verified coordinates/.test(html));
const js=fs.readFileSync(path.join(__dirname,'..','public','professional.js'),'utf8');
assert(/qualifyingTotal/.test(js)&&/sourceReviewedAt/.test(js)&&/data-clear-directory-filters/.test(js));
const marketplaceSource=fs.readFileSync(path.join(__dirname,'..','lib','professionalMarketplace.js'),'utf8');
assert(!/Number\(b\.consultationEligible\).*sort/.test(marketplaceSource),'organic sorting must not prioritize appointment eligibility');
assert(/neutral relevance and alphabetical ordering/.test(marketplaceSource));
console.log('v1.7.14 neutral professional search, exact location filters, source freshness, practice synonyms, and strict qualifying-profile count tests passed.');
