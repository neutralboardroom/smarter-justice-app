'use strict';
const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');

const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1745-'));
process.env.SMARTER_JUSTICE_STORAGE_DIR=tempStorage;
process.env.NODE_ENV='test';
process.env.APP_BASE_URL='http://localhost:3000';
delete process.env.PORTAL_PRODUCTION_ACTIVATION_ENABLED;

(async()=>{
  try{
    const store=require('../lib/store');await store.init();
    const accounts=require('../lib/professionalAccounts');
    const marketplace=require('../lib/professionalMarketplace');
    const presence=require('../lib/portalPresenceManagement');
    const network=require('../lib/professionalNetwork');
    const adapter=require('../lib/professionalPortalAdapter');

    const signup=await accounts.createAccount({email:'portal-profile@example.com',password:'correct-horse-battery-staple',displayName:'Portal Profile Attorney',accountType:'individual',professionalType:'attorney',officeLocation:'26 Court Street, Brooklyn, NY 11242',jurisdictions:['New York'],practiceAreas:['Divorce','Personal Injury'],portalEligibility:['digital-divorce','accident-injury-help'],acceptTerms:true,acceptPrivacy:true});
    assert(signup.verification.testToken);
    const verified=await accounts.verifyEmail(signup.verification.testToken);const req={headers:{cookie:verified.session.cookie}};
    const dashboard=accounts.dashboard(req);assert(dashboard.portalPresence);assert.equal(dashboard.portalPresence.freeBasicProfileControl,true);assert.equal(dashboard.portalPresence.profiles.length,0);
    const professional=dashboard.professionals[0];assert(professional);

    const divorceInput={expectedRevision:1,specialtyBiography:'I represent people in divorce, custody, support, and related family-law matters with careful preparation, clear communication, and court-focused planning.',practiceAreas:['Divorce and Family Law'],matterTypes:['Divorce','Child custody'],geographicServiceAreas:['Brooklyn','New York City'],languages:['English'],consultationPreferences:['Telephone','Video'],contactPreferences:['Website inquiry'],qualifications:['New York admission'],specialtyEvidence:['Public professional biography and court admissions record']};
    let result=accounts.updatePortalProfileForAccount(req,'professional',professional.id,'divorce-law-aid',divorceInput);assert(result.profile);assert.equal(result.profile.profileRevision,2);assert.equal(result.profile.paymentRequiredForEdit,false);
    result=accounts.updatePortalProfileForAccount(req,'professional',professional.id,'divorce-law-aid',{...divorceInput,specialtyBiography:divorceInput.specialtyBiography+' Updated.'});assert.equal(result.conflict,true);
    result=accounts.submitPortalProfileForReview(req,'professional',professional.id,'divorce-law-aid',{expectedRevision:2});assert(result.profile);assert.equal(result.profile.submittedRevision,2);assert.equal(result.profile.reviewStatus,'submitted');
    result=presence.ownerReviewPortalProfile('professional',professional.id,'divorce-law-aid',{expectedRevision:1,decision:'approved'},'test-owner');assert.equal(result.conflict,true);
    result=presence.ownerReviewPortalProfile('professional',professional.id,'divorce-law-aid',{expectedRevision:2,decision:'approved',reviewNotes:'Specialty scope and public-safe evidence reviewed.'},'test-owner');assert.equal(result.profile.reviewStatus,'approved');assert.equal(result.profile.reviewedRevision,2);

    let handoff=network.portalHandoff('divorce-law-aid');let payload=handoff.profiles.find(row=>row.professionalId===professional.id);assert(payload);assert.equal(payload.portalSpecificProfileState,'APPROVED_EXACT_REVISION');assert.equal(payload.portalSpecificProfileRevision,2);assert.equal(payload.portalSpecificProfile.matterTypes[0],'Divorce');assert.equal(adapter.validateHandoff(handoff,'divorce-law-aid').valid,true);

    const latest=marketplace.getOwnerData().professionals.find(row=>row.id===professional.id);
    const centralUpdate=accounts.updateProfessionalForAccount(req,professional.id,{expectedRevision:latest.profileRevision,displayName:latest.displayName,phone:'212-555-0199',website:'https://example.com',photoUrl:'',biography:latest.biography,languages:latest.languages,officeLocations:latest.officeLocations,jurisdictions:latest.jurisdictions,practiceAreas:latest.practiceAreas,serviceRoles:latest.serviceRoles,availabilityStatus:latest.availabilityStatus,consultationModes:latest.consultationModes,serviceRegions:latest.serviceRegions,availabilityNote:latest.availabilityNote,portalEligibility:latest.portalEligibility,consultationServices:latest.consultationServices,credentials:latest.credentials});assert(centralUpdate.professional);
    handoff=network.portalHandoff('divorce-law-aid');payload=handoff.profiles.find(row=>row.professionalId===professional.id);assert.equal(payload.portalSpecificProfileState,'WITHHELD_STALE_CENTRAL_SOURCE_REVISION');assert.equal(payload.portalSpecificProfile,null);

    result=accounts.updatePortalProfileForAccount(req,'professional',professional.id,'personal-injury-law-aid',{expectedRevision:1,specialtyBiography:'I handle vehicle crashes and other injury claims with careful investigation, source review, deadline awareness, and clear client communication throughout the matter.',practiceAreas:['Personal Injury'],matterTypes:['Car accidents','Workers Compensation'],geographicServiceAreas:['New York City'],languages:['English']});assert(result.profile);
    result=accounts.submitPortalProfileForReview(req,'professional',professional.id,'personal-injury-law-aid',{expectedRevision:2});assert(result.error);assert(result.readiness.excludedMatterTypes.includes('Workers Compensation'));

    result=presence.upsertAcceptance('professional',professional.id,'divorce-law-aid',{maturity:'D4_STAGING_VERIFIED',publicProfileUrl:'https://divorcelawaid.com/attorneys/portal-profile-attorney',acceptedCentralSourceRevision:centralUpdate.professional.profileRevision,acceptedPortalProfileRevision:2,checks:{canonicalPage:'PASS'}},'test-owner');assert(result.error);
    result=presence.upsertAcceptance('professional',professional.id,'divorce-law-aid',{maturity:'D3_ADAPTER_TESTS_PASS',publicProfileUrl:'https://divorcelawaid.com/attorneys/portal-profile-attorney',acceptedCentralSourceRevision:centralUpdate.professional.profileRevision,acceptedPortalProfileRevision:2,checks:{canonicalPage:'PASS'},evidenceRefs:['Local adapter fixture']},'test-owner');assert(result.acceptance);assert.equal(result.acceptance.acceptanceStatus,'LOCAL_ADAPTER_ACCEPTED');assert.equal(result.acceptance.productionActivationAuthorized,false);
    result=presence.upsertAcceptance('professional',professional.id,'divorce-law-aid',{maturity:'D5_PRODUCTION_VERIFIED',confirmation:'ACTIVATE PORTAL PROFILE PRODUCTION'},'test-owner');assert(result.error);
    result=presence.upsertAcceptance('professional',professional.id,'divorce-law-aid',{maturity:'D3_ADAPTER_TESTS_PASS',publicProfileUrl:'https://evil.example/attorney'},'test-owner');assert(result.error);

    const ownerView=presence.ownerView();assert.equal(ownerView.productionActivationEnabled,false);assert(ownerView.portalProfiles.some(row=>row.portalId==='divorce-law-aid'));assert(ownerView.acceptanceRecords.some(row=>row.acceptanceStatus==='LOCAL_ADAPTER_ACCEPTED'));
    const refreshed=accounts.dashboard(req);assert(refreshed.portalPresence.profiles.some(row=>row.portalId==='divorce-law-aid'));assert(refreshed.portalPresence.acceptances.some(row=>row.portalId==='divorce-law-aid'));

    const dashboardJs=fs.readFileSync(path.join(__dirname,'..','public','professional.js'),'utf8');
    const ownerHtml=fs.readFileSync(path.join(__dirname,'..','public','portal-profile-acceptance.html'),'utf8');
    const ownerJs=fs.readFileSync(path.join(__dirname,'..','public','portal-profile-acceptance.js'),'utf8');
    assert.match(dashboardJs,/Portal-by-portal presence/);assert.match(dashboardJs,/Payment does not approve identity/);assert.match(ownerHtml,/no portal writes/i);assert.match(ownerJs,/D4_STAGING_VERIFIED/);

    console.log('portal-presence-management-v1745.test.js passed');
  }finally{fs.rmSync(tempStorage,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
