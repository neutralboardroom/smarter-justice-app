'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');

const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1740-'));
process.env.SMARTER_JUSTICE_STORAGE_DIR=tempStorage;
process.env.NODE_ENV='test';
process.env.APP_BASE_URL='http://localhost:3000';

(async()=>{
  try {
    const store=require('../lib/store');
    await store.init();
    const accounts=require('../lib/professionalAccounts');
    const marketplace=require('../lib/professionalMarketplace');
    const network=require('../lib/professionalNetwork');
    const adapter=require('../lib/professionalPortalAdapter');
    const pilot=require('../lib/pilotProgram');

    const signup=await accounts.createAccount({
      email:'launch-attorney@example.com',password:'correct-horse-battery-staple',displayName:'Launch Attorney',accountType:'individual',
      professionalType:'attorney',officeLocation:'26 Court Street, Brooklyn, NY 11242',jurisdictions:['New York'],practiceAreas:['Employment Law'],
      portalEligibility:['employment-law-aid'],acceptTerms:true,acceptPrivacy:true
    });
    assert.ok(signup.account);
    assert.ok(signup.verification.testToken);
    const verified=await accounts.verifyEmail(signup.verification.testToken);
    assert.ok(verified.account.emailVerified);
    assert.ok(verified.session.cookie.includes('sj_professional_session='));

    let owner=marketplace.getOwnerData();
    const initial=owner.professionals.find(row=>verified.account.professionalIds.includes(row.id));
    assert.ok(initial,'Verification should create a private profile even without a prebuilt listing.');
    assert.equal(initial.sourceOrigin,'professional-self-entry');
    assert.equal(initial.publicProfileEnabled,false);
    assert.equal(initial.portalPublicationState,'not distributed');

    const req={headers:{cookie:verified.session.cookie}};
    const created=accounts.createProfessionalForAccount(req,{
      displayName:'Launch Attorney — Employment',professionalType:'attorney',officeLocations:['26 Court Street, Brooklyn, NY 11242'],
      jurisdictions:['New York'],practiceAreas:['Employment Law'],portalEligibility:['employment-law-aid'],languages:['English'],consultationModes:['video']
    });
    assert.ok(created.professional);
    assert.ok(created.professional.portalEligibility.includes('employment-law-aid'),'Canonical portal selection must be retained.');
    assert.equal(created.professional.publicProfileEnabled,false);
    assert.equal(created.professional.portalPublicationState,'not distributed');

    const firm=accounts.createFirmForAccount(req,{name:'Launch Law PLLC',officeLocation:'26 Court Street, Brooklyn, NY 11242',jurisdictions:['New York'],practiceAreas:['Employment Law'],portalEligibility:['employment-law-aid'],seatCount:2});
    assert.ok(firm.firm);
    assert.equal(firm.firm.publicProfileEnabled,false);

    const assisted=accounts.ownerCreateProfileForAccount({accountId:verified.account.id,kind:'professional',displayName:'Owner Assisted Attorney',professionalType:'attorney',officeLocations:['Brooklyn, NY'],jurisdictions:['New York'],practiceAreas:['Employment Law'],portalEligibility:['employment-law-aid']});
    assert.ok(assisted.professional);
    assert.equal(assisted.professional.sourceOrigin,'owner-assisted-entry');
    assert.equal(assisted.professional.publicProfileEnabled,false);

    const account=accounts.setMembershipTarget(verified.account.id,{kind:'professional',id:created.professional.id,planId:'nyc-founding-professional',seatCount:1});
    const application=await pilot.saveApplication(account,{targetKind:'professional',targetId:created.professional.id,planId:'nyc-founding-professional',billingCadence:'monthly',seatCount:1,portalInterests:['employment-law-aid']},'v1740-save');
    assert.ok(application.application);
    assert.equal(application.application.status,'draft');
    assert.equal(application.application.paymentStatus,'not-started');

    const handoff=network.portalHandoff('employment-law-aid');
    assert.ok(handoff);
    assert.equal(handoff.publicationPolicy.accountAndBillingSystem,'Smarter Justice');
    assert.equal(handoff.publicationPolicy.publicProfileSystem,'destination micro-portal');
    assert.equal(handoff.publicationPolicy.smarterJusticePublicDirectory,false);
    assert.equal(handoff.publicationPolicy.paymentAloneNeverPublishes,true);
    const payload=handoff.profiles.find(row=>row.professionalId===created.professional.id);
    assert.ok(payload,'The destination portal handoff should include the centrally managed profile payload.');
    assert.equal(payload.publicationEligible,false);
    assert.equal(payload.smarterJusticePublicProfile,false);
    assert.equal(payload.paymentCreatesPublication,false);
    assert.equal(payload.publicListingDestination,'employment-law-aid');
    assert.ok(handoff.firms.some(row=>row.firmId===firm.firm.id)===false,'Only firms referenced by portal profile payloads should be exported.');

    const validation=adapter.validateHandoff(handoff,'employment-law-aid');
    assert.equal(validation.valid,true,JSON.stringify(validation.errors));
    const fixture=adapter.buildFixture(handoff);
    assert.equal(fixture.consumerPreview.writeAuthorized,false);
    assert.equal(fixture.consumerPreview.profilePayloadCount,handoff.profiles.length);
    assert.equal(fixture.consumerPreview.publicationEligibleCount,0);

    const professionalsHtml=fs.readFileSync(path.join(__dirname,'..','public','professionals.html'),'utf8');
    const signupHtml=fs.readFileSync(path.join(__dirname,'..','public','professional-signup.html'),'utf8');
    const dashboardJs=fs.readFileSync(path.join(__dirname,'..','public','professional.js'),'utf8');
    assert.match(professionalsHtml,/noindex,follow,noarchive/);
    assert.match(professionalsHtml,/public specialty profiles belong on the focused legal portals/i);
    assert.match(signupHtml,/no prebuilt profile/i);
    assert.match(dashboardJs,/Create a private professional profile/);
    assert.match(dashboardJs,/not distributed until verification and portal approval/i);

    const pkg=require('../package.json');
    const manifest=require('../portal-manifest.json');
    assert.equal(pkg.version,manifest.currentDevelopmentVersion);
    assert.ok(Number(manifest.testSuiteParts)>=96);

    console.log('central-profile-distribution-v1740: ok');
  } finally {
    fs.rmSync(tempStorage,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
