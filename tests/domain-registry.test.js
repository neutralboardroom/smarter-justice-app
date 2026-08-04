const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-domain-registry-'));
const registry=require('../lib/domainRegistry');


const homepage=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
const homeScript=fs.readFileSync(path.join(__dirname,'..','public','home.js'),'utf8');
const ownerPage=fs.readFileSync(path.join(__dirname,'..','public','control-center.html'),'utf8');
const ownerScript=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
assert(homepage.includes('id="professional-network-status"'),'professional homepage must expose the official portal network');
assert(homepage.includes('id="domainNetworkGrid"'),'professional homepage must include the domain network grid');
assert(homeScript.includes('/api/public/domain-network'),'homepage must use the public-safe domain registry source');
assert(homeScript.includes('Professional participation'),'domain cards must show professional participation separately');
assert(homeScript.includes('Add to My Interests'),'domain cards must support professional signup interest handoff');
assert(ownerPage.includes('domainRegistry'),'owner Control Center must expose the domain registry');
assert(ownerScript.includes('/api/owner/domain-registry'),'owner Control Center must use protected domain registry routes');

const publicData=registry.getPublicData();
assert.equal(publicData.registryVersion,'1.0.0');
assert(publicData.domains.length>=10,'all actually confirmed official domains should be visible to professionals');
assert(!publicData.domains.some(x=>x.domain==='contractcreator.com'),'unowned ContractCreator.com must not be published');
assert(publicData.domains.some(x=>x.domain==='employmentlawaid.com'&&x.ownershipStatus==='owned'));
assert(publicData.domains.some(x=>x.domain==='divorcelawaid.com'));
assert(publicData.domains.some(x=>x.domain==='criminallawaid.com'));
assert(publicData.domains.some(x=>x.domain==='estatelawaid.com'));
assert(publicData.domains.some(x=>x.domain==='personalinjurylawaid.com'));
assert(publicData.domains.some(x=>x.domain==='disabilitylawaid.com'));
assert(publicData.domains.some(x=>x.domain==='landlordtenantaid.com'));
assert(publicData.domains.some(x=>x.domain==='stopsignproject.org'&&x.ownershipStatus==='owned'&&x.deploymentStatus==='development package'),'owner-confirmed StopSignProject.org must be truthful about not being live verified');
assert(!publicData.domains.some(x=>x.domain==='workerscompensationlawaid.com'),'unconfirmed purchases must remain private');
assert.equal(publicData.summary.officialDomains,publicData.domains.length);
assert.equal(publicData.summary.publicVisible,publicData.domains.length);
assert(publicData.summary.liveWebsites>=2);
assert(publicData.domains.every(x=>x.participationPortalSlug));

const ownerData=registry.getOwnerData();
assert(ownerData.domains.some(x=>x.ownershipStatus==='purchase planned'));
let saved=registry.upsert({id:'DOMAIN-EMPLOYMENT-001',brandName:'Employment Law Aid',domain:'employmentlawaid.com',ownershipStatus:'owned',portalStatus:'in development',dnsStatus:'pending verification',sslStatus:'not requested',deploymentStatus:'development package',canonicalStatus:'planned',professionalParticipationStatus:'applications only',publicVisible:true,sortOrder:11},'test-owner');
assert(!saved.error);
assert(saved.changedFields.includes('dnsStatus'));
const after=registry.getOwnerData();
assert.equal(after.domains.find(x=>x.id==='DOMAIN-EMPLOYMENT-001').professionalParticipationStatus,'applications only');
assert(after.history.some(x=>x.domainId==='DOMAIN-EMPLOYMENT-001'));
assert(registry.markdown().includes('Employment Law Aid'));
console.log('Domain registry tests passed.');
