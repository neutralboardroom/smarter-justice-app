'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');

const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1741-'));
process.env.SMARTER_JUSTICE_STORAGE_DIR=tempStorage;
process.env.NODE_ENV='test';
process.env.APP_BASE_URL='http://localhost:3000';

(async()=>{
  try{
    const store=require('../lib/store');
    await store.init();
    const accounts=require('../lib/professionalAccounts');
    const marketplace=require('../lib/professionalMarketplace');
    const network=require('../lib/professionalNetwork');
    const adapter=require('../lib/professionalPortalAdapter');
    const pilot=require('../lib/pilotProgram');

    const signup=await accounts.createAccount({
      email:'launch-minimal@example.com',password:'correct-horse-battery-staple',displayName:'Launch Minimal Attorney',accountType:'individual',
      professionalType:'attorney',officeLocation:'26 Court Street, Brooklyn, NY 11242',jurisdictions:['New York'],practiceAreas:['Employment Law'],
      portalEligibility:['employment-law-aid'],credentialType:'Attorney registration',credentialJurisdiction:'New York',credentialIdentifier:'NY-1741-001',
      acceptTerms:true,acceptPrivacy:true
    });
    assert.ok(signup.verification.testToken);
    const verified=await accounts.verifyEmail(signup.verification.testToken);
    assert.ok(verified.account.emailVerified);
    const req={headers:{cookie:verified.session.cookie}};
    let dashboard=accounts.dashboard(req);
    assert.equal(dashboard.professionals.length,1);
    let profile=dashboard.professionals[0];
    assert.equal(profile.credentials.length,1,'Credential entered at signup must be retained.');
    assert.equal(profile.credentials[0].status,'pending');
    assert.equal(profile.profileRevision,1);

    const saved=accounts.updateProfessionalForAccount(req,profile.id,{
      expectedRevision:1,displayName:'Launch Minimal Attorney',phone:'212-555-0141',website:'https://example.com',
      biography:'Employment attorney serving New York clients with a clear focus on workplace disputes, wage concerns, leave, retaliation, and practical preparation for an independent legal consultation.',
      officeLocations:['26 Court Street, Brooklyn, NY 11242'],jurisdictions:['New York'],practiceAreas:['Employment Law'],languages:['English'],
      serviceRegions:['Brooklyn','New York City'],consultationModes:['video'],availabilityStatus:'accepting inquiries',portalEligibility:['employment-law-aid'],
      credentials:[{id:profile.credentials[0].id,credentialType:'Attorney registration',jurisdiction:'New York',identifier:'NY-1741-001',verificationSource:'https://example.com/credential'}]
    });
    assert.ok(saved.professional);
    assert.equal(saved.professional.profileRevision,2);
    assert.equal(saved.professional.profileReadiness.readyForReview,true);

    const stale=accounts.updateProfessionalForAccount(req,profile.id,{expectedRevision:1,displayName:'Stale overwrite'});
    assert.equal(stale.conflict,true,'A stale browser revision must not overwrite newer profile data.');

    const submitted=accounts.submitProfessionalProfileForReview(req,profile.id);
    assert.ok(submitted.professional);
    assert.equal(submitted.professional.submittedRevision,2);
    assert.equal(submitted.professional.reviewStatus,'submitted');

    const credentialId=submitted.professional.credentials[0].id;
    const verifiedCredential=marketplace.recordCredentialVerification(profile.id,{credentialId,status:'active',verificationSource:'https://example.com/credential',verificationScope:['New York attorney identity and registration']});
    assert.equal(verifiedCredential.professional.verificationStatus,'verified');
    const approved=marketplace.updateProfessional(profile.id,{reviewStatus:'approved',ownerApprovalStatus:'approved'},'owner');
    assert.ok(approved.professional);
    assert.equal(approved.professional.reviewedRevision,2);

    await network.synchronize('v1741-test');
    let assignment=network.ownerView().portalAssignments.find(row=>row.professionalId===profile.id&&row.portalId==='employment-law-aid');
    assert.ok(assignment);
    await network.updatePortalAssignment(assignment.id,{status:'approved',ownerApproved:true,portalPublicationState:'approved for distribution'});
    assignment=network.ownerView().portalAssignments.find(row=>row.id===assignment.id);
    assert.equal(assignment.approvedSourceRevision,2);
    assert.equal(assignment.publicationEligible,true);

    let handoff=network.portalHandoff('employment-law-aid');
    let payload=handoff.profiles.find(row=>row.professionalId===profile.id);
    assert.equal(payload.publicationEligible,true);
    assert.equal(payload.distributionAction,'UPSERT_PUBLIC');
    assert.equal(adapter.validateHandoff(handoff,'employment-law-aid').valid,true);

    const changed=accounts.updateProfessionalForAccount(req,profile.id,{
      expectedRevision:2,displayName:'Launch Minimal Attorney',phone:'212-555-0141',website:'https://example.com',
      biography:saved.professional.biography,officeLocations:['26 Court Street, Brooklyn, NY 11242'],jurisdictions:['New York'],practiceAreas:['Employment Law'],languages:['English'],
      serviceRegions:['Brooklyn','New York City'],consultationModes:['video'],availabilityStatus:'accepting inquiries',portalEligibility:['employment-law-aid'],
      credentials:[{id:credentialId,credentialType:'Attorney registration',jurisdiction:'New York',identifier:'NY-1741-CHANGED',verificationSource:'https://example.com/credential'}]
    });
    assert.equal(changed.professional.profileRevision,3);
    assert.equal(changed.professional.credentials[0].status,'pending','Changing credential identity must invalidate prior verification.');
    assert.equal(changed.professional.verificationStatus,'pending');
    assert.equal(changed.professional.reviewStatus,'changes-pending-review');

    handoff=network.portalHandoff('employment-law-aid');
    payload=handoff.profiles.find(row=>row.professionalId===profile.id);
    assert.equal(payload.publicationEligible,false,'A changed revision must stop public distribution until re-reviewed.');
    assert.equal(payload.distributionAction,'UPSERT_PRIVATE');
    assert.equal(adapter.validateHandoff(handoff,'employment-law-aid').valid,true);

    const prematureApproval=marketplace.updateProfessional(profile.id,{reviewStatus:'approved'},'owner');
    assert.ok(prematureApproval.error,'Owner approval must reject an unsubmitted current revision.');

    const resubmitted=accounts.submitProfessionalProfileForReview(req,profile.id);
    assert.equal(resubmitted.professional.submittedRevision,3);
    await pilot.updateControls({applicationsOpen:true,paymentGateEnabled:false,maxSubmittedApplications:10,maxApprovedApplications:5,cohortName:'Launch-minimal founding cohort'});
    const account=accounts.setMembershipTarget(verified.account.id,{kind:'professional',id:profile.id,planId:'nyc-founding-professional',seatCount:1});
    const applicationInput={targetKind:'professional',targetId:profile.id,planId:'nyc-founding-professional',billingCadence:'monthly',seatCount:1,portalInterests:['employment-law-aid'],acceptMembershipTerms:true,acceptPrivacy:true,acceptRecurringBilling:true,acceptNoGuarantees:true,acceptIndependentProfessional:true,acceptConflicts:true};
    const application=await pilot.submitApplication(account,applicationInput,'v1741-submit');
    assert.equal(application.application.status,'submitted');
    const blockedApproval=await pilot.ownerReviewApplication(application.application.id,{status:'approved-for-payment'},'v1741-owner-blocked');
    assert.ok(blockedApproval.error,'Payment approval must wait for exact profile-review approval.');

    const rollout=require('../MICRO_PORTAL_INTEGRATION_ROLLOUT_V1.7.50.json');
    assert.ok(Array.isArray(rollout.portalInstructions));
    assert.equal(rollout.portalInstructions.length,25);
    assert.equal(rollout.rules.duplicatePortalAccounts,false);
    assert.equal(rollout.rules.duplicatePortalBilling,false);
    const kit=fs.readFileSync(path.join(__dirname,'..','MICRO_PORTAL_PROFESSIONAL_INTEGRATION_KIT_V1.1.0.md'),'utf8');
    assert.match(kit,/Do not add a second professional account/i);
    assert.match(kit,/approvedSourceRevision/);
    const buildPrompt=fs.readFileSync(path.join(__dirname,'..','MICRO_PORTAL_SMARTER_JUSTICE_INTEGRATION_BUILD_PROMPT_V1.7.50.txt'),'utf8');
    assert.match(buildPrompt,/one central Smarter Justice account/i);
    assert.match(buildPrompt,/must not create a second login/i);
    assert.match(buildPrompt,/UPSERT_PRIVATE, UPSERT_PUBLIC, and SUPPRESS/i);
    assert.match(buildPrompt,/two fresh extractions/i);
    const schema=require('../schemas/micro-portal-professional-handoff-v1.4.0.schema.json');
    assert.equal(schema.properties.handoffVersion.const,'1.4.0');

    const pkg=require('../package.json');
    assert.equal(pkg.version,'1.7.83');
    console.log('launch-minimal-professional-integration-v1741: ok');
  }finally{
    fs.rmSync(tempStorage,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
