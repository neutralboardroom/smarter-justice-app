'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1747-'));
process.env.SMARTER_JUSTICE_STORAGE_DIR=tempStorage;
process.env.NODE_ENV='test';
(async()=>{try{
  const store=require('../lib/store');await store.init();
  const cohort=require('../lib/launchCohortOperations');
  const marketplace=require('../lib/professionalMarketplace');
  const pkg=require('../package.json');
  assert.equal(pkg.version,'1.7.83');
  assert.equal(cohort.TARGET_RELEASE_VERSION,'1.7.75');
  const initial=cohort.ownerView();
  assert.equal(initial.boundaries.freeBasicProfileFirst,true);
  assert.equal(initial.boundaries.paidGrowthOpen,false);
  assert.equal(initial.boundaries.autoPublication,false);
  assert.deepEqual(initial.cohort.portalIds,['divorce-law-aid','estate-law-aid','personal-injury-law-aid','domestic-violence-aid']);

  const denied=cohort.publicInterest({name:'Launch Lawyer',email:'launch-lawyer@example.test'});
  assert.match(denied.error,/Consent/i);
  const interest=cohort.publicInterest({name:'Launch Lawyer',firmName:'Launch Law PLLC',email:'launch-lawyer@example.test',registrationNumber:'NY-1747-LAUNCH',portalIds:['divorce-law-aid','estate-law-aid'],campaignCode:'BROOKLYN-QR-01',consentToContact:true});
  assert(interest.confirmationId);
  let owner=cohort.ownerView();
  assert.equal(owner.summary.contacts,1);
  assert.equal(owner.contacts[0].status,'interest-received');
  assert.equal(owner.contacts[0].notes.includes('No legal matter information'),true);

  const plan=cohort.updateCohort({status:'rehearsal',capacity:12,supportOwner:'Roger',portalIds:['divorce-law-aid','personal-injury-law-aid'],paidGrowthOpen:true});
  assert.equal(plan.cohort.capacity,12);
  assert.equal(plan.cohort.paidGrowthOpen,false,'owner workbench must not open paid growth');
  assert.equal(plan.cohort.freeBasicProfileOnly,true);

  assert.deepEqual(cohort.inferPortals(['Family law','Child custody']),['divorce-law-aid']);
  assert.deepEqual(cohort.inferPortals(['Probate','Trusts']),['estate-law-aid']);
  assert.deepEqual(cohort.inferPortals(['Motor vehicle accidents','Premises liability']),['personal-injury-law-aid']);
  assert.deepEqual(cohort.inferPortals(['Workers compensation']),[],'workers compensation must not be silently assigned to Personal Injury');
  assert.deepEqual(cohort.inferPortals(['Medical malpractice']),[],'medical malpractice must remain separate');

  const preview=cohort.previewBatch({
    sourceName:'Owner-reviewed New York attorney source',
    sourceUrl:'https://example.test/official-attorney-source',
    publisher:'Example official publisher',
    authorityLevel:'bar-or-court',
    reviewStatus:'approved-source',
    retrievedAt:'2026-07-29',
    factsSupported:['Professional name','Registration number','Public business address','Practice area'],
    termsOrUseNotes:'Owner confirmed permitted use for profile-candidate review.',
    csvText:'displayName,registrationNumber,firmName,officeAddress,businessEmail,phone,website,jurisdictions,practiceAreas,languages\nAvery Launch,NY-1747-UNIQUE,Avery Launch Law,"26 Court Street, Brooklyn, NY 11242",avery@example.test,212-555-0174,https://example.test/avery,New York,"Family law, Child custody",English\nNeeds Review,NY-1747-REVIEW,Review Firm,,,,,New York,,English\nMedical Only,NY-1747-MED,Medical Firm,"1 Main Street, New York, NY",medical@example.test,,,New York,Medical malpractice,English'
  },'test-owner');
  assert(preview.batch.id);
  assert.equal(preview.batch.rowCount,3);
  assert.equal(preview.batch.readyCount,2);
  assert.equal(preview.batch.needsReviewCount,1);
  const avery=preview.batch.candidates.find(x=>x.displayName==='Avery Launch');
  assert.deepEqual(avery.suggestedPortalIds,['divorce-law-aid']);
  const medical=preview.batch.candidates.find(x=>x.displayName==='Medical Only');
  assert.deepEqual(medical.suggestedPortalIds,[]);

  const committed=cohort.commitBatch(preview.batch.id,'test-owner');
  assert.equal(committed.results.created.length,2);
  assert.equal(committed.results.errors.length,0);
  const records=marketplace.getOwnerData().professionals;
  const created=records.find(x=>x.displayName==='Avery Launch');
  assert(created);
  assert.equal(created.publicProfileEnabled,false);
  assert.equal(created.profileStatus,'unclaimed public profile');
  assert.deepEqual(created.portalEligibility,[],'suggested portals must not become approved portal eligibility');
  assert.equal(created.membership.planId,'basic-directory');
  assert.equal(created.membership.status,'none');
  assert.equal(created.sourceRecords.length,1);
  assert.match(created.ownerNotes,/Suggested portal review only: divorce-law-aid/);
  assert.equal(marketplace.searchPublicProfessionals({q:'Avery Launch'}).total,0,'private imported records must not become public search results');

  const duplicatePreview=cohort.previewBatch({sourceName:'Owner-reviewed source',sourceUrl:'https://example.test/source-two',authorityLevel:'bar-or-court',reviewStatus:'approved-source',factsSupported:['Professional name','Registration number','Public business address'],records:[{displayName:'Avery Launch',registrationNumber:'NY-1747-UNIQUE',officeAddress:'26 Court Street, Brooklyn, NY 11242',practiceAreas:['Family law']}]},'test-owner');
  assert.equal(duplicatePreview.batch.duplicateCount,1);
  assert.equal(duplicatePreview.batch.readyCount,0);

  owner=cohort.ownerView();
  assert.equal(owner.summary.profilesCreated,2);
  assert.match(cohort.exportMarkdown(),/Initial Attorney Cohort Packet/);
  assert.match(cohort.exportMarkdown(),/Fail-closed boundary/);

  const root=path.join(__dirname,'..');
  const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
  for(const route of ['/api/professional-launch-interest','/api/owner/launch-cohort','/api/owner/launch-cohort/profile-batches/preview','/api/owner/launch-cohort/profile-batches/'])assert(server.includes(route),route);
  const attorney=fs.readFileSync(path.join(root,'public','attorney-launch.html'),'utf8');
  assert.match(attorney,/Request Free Profile Follow-Up/);
  assert.match(attorney,/Do not include client names, legal facts, privileged communications, or confidential matter details/);
  assert.match(attorney,/does not publish a profile, verify identity or credentials, approve a specialty/i);
  const activation=fs.readFileSync(path.join(root,'public','launch-activation.html'),'utf8');
  assert.match(activation,/Free-profile cohort and profile-growth intake/);
  assert.match(activation,/Paste a CSV/);
  console.log('launch-cohort-profile-growth-v1747.test.js passed');
}finally{fs.rmSync(tempStorage,{recursive:true,force:true});}})().catch(error=>{console.error(error);process.exitCode=1;});
