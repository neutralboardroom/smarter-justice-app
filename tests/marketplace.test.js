const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const professionalSources = require('../lib/publicProfessionalDataSources');

const port = 3962;
const base = `http://127.0.0.1:${port}`;
const tempStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'smarter-justice-marketplace-'));
const ownerToken = 'owner-marketplace-test-token-1234567890';
const adminToken = 'admin-marketplace-test-token-1234567890';
const portalRulesToken = 'portal-rules-test-token-1234567890';
const server = spawn(process.execPath, ['server.js'], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    ADMIN_TOKEN: adminToken,
    OWNER_CONTROL_CENTER_TOKEN: ownerToken,
    PORTAL_RULES_API_TOKEN: portalRulesToken,
    APP_BASE_URL: base,
    SMARTER_JUSTICE_STORAGE_DIR: tempStorage,
    OWNER_NOTIFICATION_EMAIL: '',
    STRIPE_WEBHOOK_SECRET: 'whsec-marketplace-regression-test'
  }
});
let log = '';
server.stdout.on('data', d => log += d.toString());
server.stderr.on('data', d => log += d.toString());
const wait = ms => new Promise(r => setTimeout(r, ms));
async function result(url, opts={}){
  const response = await fetch(url, opts);
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { response, data, text };
}
async function json(url, opts={}){
  const r = await result(url, opts);
  if (!r.response.ok) throw new Error(`${r.response.status}: ${JSON.stringify(r.data)}`);
  return r.data;
}
function ownerHeaders(extra={}){ return { 'X-Owner-Control-Token': ownerToken, ...extra }; }
function post(body, headers={}){ return { method:'POST', headers:{ 'Content-Type':'application/json', ...headers }, body:JSON.stringify(body) }; }

(async()=>{
  try{
    for(let i=0;i<50;i++){
      if(log.includes('listening')) break;
      if(server.exitCode!==null) throw new Error(`Server exited early: ${log}`);
      await wait(100);
    }

    // Master Rules Pack is private, versioned, reproducible, and independently accessible by approved portals.
    let r = await result(`${base}/api/system/master-rules-pack`);
    assert.equal(r.response.status, 403, 'rules pack must not be public');
    r = await result(`${base}/api/system/master-rules-pack?token=${encodeURIComponent(ownerToken)}`);
    assert.equal(r.response.status, 403, 'rules pack must reject URL credentials');
    r = await result(`${base}/api/system/master-rules-pack`, {headers:{'X-Admin-Token':adminToken}});
    assert.equal(r.response.status, 403, 'staff admin token must not open owner/rules surfaces');
    const pack = await json(`${base}/api/system/master-rules-pack`, {headers:{'X-Portal-Rules-Token':portalRulesToken}});
    assert(pack.ok && /^1\./.test(pack.version), 'rules pack missing version');
    assert(/^[a-f0-9]{64}$/.test(pack.checksum), 'rules pack missing SHA-256 checksum');
    assert(pack.mandatoryRules.some(x=>/active qualifying paid professional/i.test(x)), 'paid membership rule missing');
    assert(pack.mandatoryRules.some(x=>/source-tracked/i.test(x)), 'source-seeded profile rule missing');
    assert(pack.mandatoryRules.some(x=>/New York City founding-member pilot/i.test(x)), 'NYC founding-member rule missing');
    assert(pack.mandatoryRules.some(x=>/volume discounts/i.test(x)), 'firm volume-discount rule missing');
    assert(pack.strongDefaults.some(x=>/QR enrollment/i.test(x)), 'mobile/QR outreach default missing');
    assert(/strong defaults, not inflexible rules/i.test(pack.specialtyAdaptationPolicy.principle), 'specialty adaptation authority missing');
    const md = await result(`${base}/api/system/master-rules-pack?format=markdown`, {headers:{'X-Owner-Control-Token':ownerToken}});
    assert.equal(md.response.status, 200);
    assert(/Smarter Justice Master Rules and Suggestions Pack/.test(md.text));
    assert(md.text.includes(pack.checksum), 'Markdown and JSON rules pack checksum must match');
    const unavailable = await result(`${base}/api/system/master-rules-pack?version=0.0.1`, {headers:{'X-Portal-Rules-Token':portalRulesToken}});
    assert.equal(unavailable.response.status, 404, 'unknown pack versions must not silently return current rules');

    // Private marketplace cannot be opened by the public or staff credential.
    r = await result(`${base}/api/owner/professional-marketplace`);
    assert.equal(r.response.status, 403);
    r = await result(`${base}/api/owner/professional-marketplace`, {headers:{'X-Admin-Token':adminToken}});
    assert.equal(r.response.status, 403);
    const marketplace = await json(`${base}/api/owner/professional-marketplace`, {headers:ownerHeaders()});
    assert(marketplace.summary && marketplace.governance, 'owner marketplace foundation missing');
    assert(marketplace.professionalAccounts && Array.isArray(marketplace.professionalAccounts.accounts), 'central professional account summary missing');
    assert(marketplace.summary.professionals >= 10 && marketplace.summary.firms >= 10, 'Downtown Brooklyn founding profile seeds missing');
    assert.equal(marketplace.summary.publicDirectoryActivated, true);
    assert(marketplace.membershipPlans.some(x=>x.id==='professional-member' && x.consultationEligibility), 'paid professional membership plan missing');
    assert(marketplace.membershipPlans.some(x=>x.id==='basic-directory' && !x.consultationEligibility), 'free directory plan must not grant consultations');
    const expectedRevenue = ['professional-memberships','firm-memberships','enhanced-profiles','sponsored-placements','scheduling-dashboard-tools','document-review-workflows','analytics','staff-accounts','practice-growth-tools','technology-fees','crm-integrations','white-label-enterprise'];
    for(const id of expectedRevenue) assert(marketplace.revenuePrograms.some(x=>x.id===id), `missing revenue program ${id}`);
    const foundingIndividual = marketplace.membershipPlans.find(x=>x.id==='nyc-founding-professional');
    const foundingFirm = marketplace.membershipPlans.find(x=>x.id==='nyc-founding-firm');
    assert(foundingIndividual && foundingIndividual.monthlyPriceCents===1500 && foundingIndividual.foundingPlan, 'NYC individual founding plan missing');
    assert(foundingFirm && foundingFirm.monthlyPriceCents===1500 && foundingFirm.audience==='firm', 'NYC founding firm plan missing');
    for(const id of ['founding-member-pilot','firm-volume-discounts','in-person-sales-enablement','mobile-qr-enrollment']) assert(marketplace.revenuePrograms.some(x=>x.id===id), `missing founding revenue program ${id}`);
    assert(marketplace.firmVolumeDiscountTiers.some(x=>x.minSeats===5 && x.discountPercent===15), '5-seat firm discount tier missing');

    // Firm quotes are transparent and do not activate billing or eligibility.
    const fiveSeatQuote = await json(`${base}/api/owner/professional-marketplace/firm-quote`, post({planId:'nyc-founding-firm',seatCount:5}, ownerHeaders()));
    assert.equal(fiveSeatQuote.quote.discountPercent,15);
    assert.equal(fiveSeatQuote.quote.monthlyDiscountedPerSeatCents,1275);
    assert.equal(fiveSeatQuote.quote.monthlyTotalCents,6375);
    assert.equal(fiveSeatQuote.quote.pricingIsIllustrative,true);

    // Campaigns are private by default; only pilot-ready or active campaigns expose an invitation offer.
    const draftCampaign = await json(`${base}/api/owner/professional-marketplace/outreach-campaigns`, post({name:'Test NYC Building Pilot',campaignCode:'NYC-TEST-DRAFT',status:'draft',building:'Test Tower',offerPlanId:'nyc-founding-professional',firmOfferPlanId:'nyc-founding-firm'}, ownerHeaders()));
    assert.equal(draftCampaign.campaign.status,'draft');
    r = await result(`${base}/api/professional-membership-offer?campaign=NYC-TEST-DRAFT`);
    assert.equal(r.response.status,404,'draft campaigns must not expose public enrollment offers');
    const activeCampaign = await json(`${base}/api/owner/professional-marketplace/outreach-campaigns/${encodeURIComponent(draftCampaign.campaign.id)}`, post({status:'pilot-ready'}, ownerHeaders()));
    assert(activeCampaign.publicOffer && activeCampaign.publicOffer.monthlyPriceCents===1500);
    const publicOffer = await json(`${base}/api/professional-membership-offer?campaign=NYC-TEST-DRAFT`);
    assert.equal(publicOffer.offer.foundingOffer,true);
    assert(publicOffer.offer.firmDiscountTiers.some(x=>x.discountPercent===15));

    // Public interest creates only a private sales prospect and never a membership, profile, or eligibility status.
    const publicInterest = await json(`${base}/api/professional-membership-interest`, post({campaignCode:'NYC-TEST-DRAFT',contactName:'Jordan Pilot',professionalType:'attorney',email:'jordan@example.test',firmName:'Pilot Law',firmSeatEstimate:5,practiceAreas:['Business law'],consultationInterests:['Free consultations'],consentToContact:true}));
    assert(publicInterest.confirmationId);
    const afterInterest = await json(`${base}/api/owner/professional-marketplace`, {headers:ownerHeaders()});
    const prospect = afterInterest.outreachProspects.find(x=>x.id===publicInterest.confirmationId);
    assert(prospect && prospect.status==='application started' && prospect.potentialSeats===5);
    assert.equal(prospect.discountPercent,15);
    assert.equal(prospect.estimatedMonthlyRevenueCents,6375);
    assert(!afterInterest.professionals.some(x=>x.email==='jordan@example.test'), 'interest form must not create a professional profile');
    assert(!afterInterest.firms.some(x=>x.name==='Pilot Law'), 'interest form must not create a firm membership');

    // Private firm records preserve centralized billing and seat estimates without activating membership.
    const firmRecord = await json(`${base}/api/owner/professional-marketplace/firms`, post({name:'Example Founding Firm',seatCount:5,billingAdministratorName:'Morgan Admin',billingAdministratorEmail:'billing@example.test',membership:{planId:'nyc-founding-firm',status:'none',seatCount:5},jurisdictions:['New York'],portalEligibility:['general-smarter-justice-start']}, ownerHeaders()));
    assert.equal(firmRecord.firm.seatCount,5);
    assert.equal(firmRecord.firm.quote.discountPercent,15);
    assert.equal(firmRecord.firm.membership.status,'none');

    // Official NY source connector is recorded and owner-only.
    r = await result(`${base}/api/owner/professional-marketplace/public-sources`);
    assert.equal(r.response.status, 403);
    const sources = await json(`${base}/api/owner/professional-marketplace/public-sources`, {headers:ownerHeaders()});
    const ny = sources.sources['nys-attorney-registrations'];
    assert(ny && ny.datasetId==='eqw2-r5nb', 'official NY attorney source missing');
    assert.equal(ny.publisher, 'New York State Unified Court System');

    const fixture = {
      registration_number:'1234567', first_name:'ALEX', middle_name:'Q', last_name:'EXAMPLE', suffix:'',
      company_name:'Example Legal PLLC', street_1:'100 Public Plaza', street_2:'Suite 10', city:'Albany', state:'NY',
      zip:'12207', country:'United States', county:'Albany', phone_number:'518-555-0100', year_admitted:'2001',
      judicial_department_of_admission:'3', law_school:'Example Law School', status:'Currently registered'
    };
    const imported = await json(`${base}/api/owner/professional-marketplace/public-sources/nys-attorneys/import`, post({
      testRows:[fixture], portalEligibility:['general-smarter-justice-start'], practiceAreas:[]
    }, ownerHeaders()));
    assert.equal(imported.created.length, 1, 'official source fixture should create one private seeded record');
    const seeded = imported.created[0];
    assert.equal(seeded.sourceSeeded, true);
    assert.equal(seeded.profileStatus, 'unclaimed public profile');
    assert.equal(seeded.claimStatus, 'not claimed');
    assert.equal(seeded.publicProfileEnabled, false, 'source import must not publish profiles automatically');
    assert.equal(seeded.eligibility.consultationEligible, false, 'source import must not grant consultation eligibility');
    assert.equal(seeded.eligibility.paidMembership, false);
    assert(seeded.sourceRecords.some(x=>x.datasetId==='eqw2-r5nb' && x.externalSourceId==='eqw2-r5nb:1234567'), 'source evidence missing');
    assert.equal(seeded.publicFacts.registrationNumber, '1234567');
    assert(!seeded.practiceAreas.length, 'registration data must not infer a legal specialty');

    const duplicate = await json(`${base}/api/owner/professional-marketplace/public-sources/nys-attorneys/import`, post({testRows:[fixture]}, ownerHeaders()));
    assert.equal(duplicate.created.length, 0);
    assert.equal(duplicate.duplicates.length, 1, 'duplicate source imports must be rejected safely');

    // Membership by itself is never sufficient.
    const activeUntil = new Date(Date.now()+30*86400000).toISOString();
    const onlyMembership = await json(`${base}/api/owner/professional-marketplace/professionals/${encodeURIComponent(seeded.id)}`, post({
      membership:{planId:'professional-member',status:'active',currentPeriodEnd:activeUntil,lastPaymentConfirmedAt:new Date().toISOString()},
      sponsorship:{status:'active',portals:['general-smarter-justice-start'],jurisdictions:['New York'],placementType:'test placement'}
    }, ownerHeaders()));
    assert.equal(onlyMembership.professional.eligibility.paidMembership, true);
    assert.equal(onlyMembership.professional.eligibility.consultationEligible, false);
    assert.equal(onlyMembership.professional.eligibility.sponsorshipAffectsEligibility, false);
    assert(onlyMembership.professional.eligibility.reasons.length >= 5, 'independent eligibility gates should remain');

    // Free/basic membership never makes a professional eligible.
    const basic = await json(`${base}/api/owner/professional-marketplace/professionals/${encodeURIComponent(seeded.id)}`, post({membership:{planId:'basic-directory',status:'active',currentPeriodEnd:activeUntil}}, ownerHeaders()));
    assert.equal(basic.professional.eligibility.paidMembership, false);
    assert.equal(basic.professional.eligibility.consultationEligible, false);

    // All independent gates are required for eligibility.
    const now = new Date().toISOString();
    const eligible = await json(`${base}/api/owner/professional-marketplace/professionals/${encodeURIComponent(seeded.id)}`, post({
      membership:{planId:'professional-member',status:'active',startedAt:now,currentPeriodEnd:activeUntil,lastPaymentConfirmedAt:now},
      verificationStatus:'verified', ownerApprovalStatus:'approved', profileStatus:'participating',
      jurisdictions:['New York'], portalEligibility:['general-smarter-justice-start'], practiceAreas:['General legal consultation'],
      verificationScope:['Identity','New York attorney registration'],
      marketplaceTermsAcceptedAt:now, independentProfessionalAcknowledgmentAt:now, conflictsPolicyAcceptedAt:now,
      credentials:[{credentialType:'New York attorney registration',jurisdiction:'New York',identifier:'1234567',status:'active',verificationSource:'https://data.ny.gov/Transparency/NYS-Attorney-Registrations/eqw2-r5nb',verifiedAt:now}],
      consultationServices:[{title:'Initial consultation',serviceType:'free consultation',status:'active',durationMinutes:30,modes:['video'],portals:['general-smarter-justice-start'],jurisdictions:['New York'],practiceAreas:['General legal consultation'],schedulingEnabled:true,scope:'Initial discussion only.'}],
      sponsorship:{status:'none'}
    }, ownerHeaders()));
    assert.equal(eligible.professional.eligibility.consultationEligible, true, eligible.professional.eligibility.reasons.join('; '));
    assert.equal(eligible.professional.eligibility.paidMembership, true);

    // Profile claim/correction workflow exists and does not create eligibility or publication by itself.
    const claim = await json(`${base}/api/owner/professional-marketplace/profile-requests`, post({profileId:seeded.id,requestType:'claim',requesterName:'Alex Example',requesterEmail:'alex@example.test',details:'Test claim request.'}, ownerHeaders()));
    assert.equal(claim.request.requestType, 'claim');
    assert.equal(claim.request.status, 'new');
    const afterClaim = await json(`${base}/api/owner/professional-marketplace`, {headers:ownerHeaders()});
    const claimedRecord = afterClaim.professionals.find(x=>x.id===seeded.id);
    assert.equal(claimedRecord.claimStatus, 'claim requested');
    assert.equal(claimedRecord.publicProfileEnabled, false);

    // Public directory defaults must return a useful page, not a single result, and must support firm detail pages.
    const defaultProfessionalDirectory = await json(`${base}/api/public/professionals`);
    assert.equal(defaultProfessionalDirectory.limit,25,'public professional directory should default to a useful page size');
    assert(defaultProfessionalDirectory.professionals.length > 1,'public professional directory must not silently default to one result');
    const defaultFirmDirectory = await json(`${base}/api/public/firms`);
    assert.equal(defaultFirmDirectory.limit,25,'public firm directory should default to a useful page size');
    assert(defaultFirmDirectory.firms.length > 1,'public firm directory must not silently default to one result');
    const publicFirmSeed=defaultFirmDirectory.firms.find(x=>!x.claimed);
    assert(publicFirmSeed && publicFirmSeed.recordId,'public firm result missing claimable record identifier');
    const publicFirmDetail=await json(`${base}/api/public/firms/${encodeURIComponent(publicFirmSeed.id)}`);
    assert.equal(publicFirmDetail.firm.recordId,publicFirmSeed.recordId);
    assert(Array.isArray(publicFirmDetail.firm.professionals),'firm profile should include its public professional roster');
    const defaultNyQuery=new URL(professionalSources.buildNysAttorneyQuery({}));
    assert.equal(defaultNyQuery.searchParams.get('$limit'),'25','official New York search should default to 25 records');
    assert.equal(defaultNyQuery.searchParams.get('$offset'),'0','official New York search should default to the first page');
    const secondNyQuery=new URL(professionalSources.buildNysAttorneyQuery({limit:25,offset:25,city:'Brooklyn'}));
    assert.equal(secondNyQuery.searchParams.get('$offset'),'25','official New York search should support later result pages');
    assert(/Brooklyn/i.test(secondNyQuery.searchParams.get('$where')||''),'official search pagination must preserve search filters');

    // Public profile finder shows curated source-tracked records without implying participation.
    const publicDirectory = await json(`${base}/api/public/professionals?q=${encodeURIComponent('26 Court')}`);
    assert(publicDirectory.total >= 8, 'Downtown Brooklyn public finder should expose multiple 26 Court profiles');
    const publicSeed = publicDirectory.professionals.find(x=>!x.claimed);
    assert(publicSeed && publicSeed.sourceRecords.length, 'public seed should be source tracked and unclaimed');
    assert.equal(publicSeed.consultationEligible,false,'an unclaimed profile must not accept consultations');
    const credentialReview=await json(`${base}/api/owner/professional-marketplace/credential-verification`,post({professionalId:publicSeed.recordId,credentialType:'New York attorney registration',jurisdiction:'New York',status:'active',verificationSource:'https://data.ny.gov/Transparency/NYS-Attorney-Registrations/eqw2-r5nb',verificationScope:['identity','registration status']},ownerHeaders()));
    assert.equal(credentialReview.professional.verificationStatus,'verified','an active source-backed credential review should update the verification state');
    const complaintCreated=await json(`${base}/api/owner/professional-marketplace/complaints`,post({professionalId:publicSeed.recordId,category:'identity review',severity:'high',summary:'Regression-test compliance concern.',suspendImmediately:true},ownerHeaders()));
    assert.equal(complaintCreated.suspended,true,'a serious owner-recorded concern may place an immediate eligibility hold');
    assert.equal(complaintCreated.professional.profileStatus,'suspended');
    const complaintResolved=await json(`${base}/api/owner/professional-marketplace/complaints/${encodeURIComponent(complaintCreated.complaint.id)}`,post({status:'resolved',resolution:'Regression-test concern cleared.'},ownerHeaders()));
    assert.equal(complaintResolved.complaint.status,'resolved');
    const suspensionCleared=await json(`${base}/api/owner/professional-marketplace/suspension`,post({professionalId:publicSeed.recordId,suspended:false,ownerApprovalStatus:'approved'},ownerHeaders()));
    assert.notEqual(suspensionCleared.professional.profileStatus,'suspended');
    const publicDetail = await json(`${base}/api/public/professionals/${encodeURIComponent(publicSeed.id)}`);
    assert.equal(publicDetail.professional.claimed,false);
    assert(/does not imply/.test(publicDetail.professional.publicSourceDisclaimer));
    const secondPublicSeed=publicDirectory.professionals.find(x=>!x.claimed && x.recordId!==publicSeed.recordId);
    const directClaimSignup=await result(`${base}/api/professional/auth/signup`,post({
      accountType:'individual',displayName:'Direct Claim Attorney',email:'direct-claim@example.test',password:'LongPassword!DirectClaim',
      claimProfessionalId:secondPublicSeed.recordId,acceptTerms:true,acceptPrivacy:true
    }));
    assert.equal(directClaimSignup.response.status,201,JSON.stringify(directClaimSignup.data));
    assert.equal(directClaimSignup.data.account.professionalIds.length,0,'find-and-claim signup should not create a duplicate private professional profile');
    const directClaimCookie=String(directClaimSignup.response.headers.get('set-cookie')||'').split(';')[0];
    await json(`${base}/api/professional/claim-profile`,post({professionalId:secondPublicSeed.recordId},{Cookie:directClaimCookie}));
    const directClaimDashboard=await json(`${base}/api/professional/dashboard`,{headers:{Cookie:directClaimCookie}});
    assert.equal(directClaimDashboard.professionals.length,0,'claiming an existing profile should not add a duplicate owned draft');
    assert(directClaimDashboard.pendingClaimProfiles.some(x=>x.id===secondPublicSeed.recordId));
    r = await result(`${base}/api/professionals`);
    assert.equal(r.response.status,404,'only the documented public professional API should exist');
    const publicPortals = await json(`${base}/api/portals`);
    assert(!JSON.stringify(publicPortals).includes('ALEX EXAMPLE'), 'private imported records must not leak into public portal catalog');

    // One central professional account may request profile control, but the request remains read-only until owner approval.
    const signupResult = await result(`${base}/api/professional/auth/signup`, post({
      accountType:'individual',displayName:'Central Account Attorney',email:'central-attorney@example.test',password:'LongPassword!123',
      professionalType:'attorney',officeLocation:'26 Court Street, Brooklyn, NY',practiceAreas:['Family law'],portalEligibility:['general-smarter-justice-start'],
      acceptTerms:true,acceptPrivacy:true,campaignCode:'NYC-FOUNDING-26-COURT'
    }));
    assert.equal(signupResult.response.status,201,JSON.stringify(signupResult.data));
    const professionalCookie=String(signupResult.response.headers.get('set-cookie')||'').split(';')[0];
    assert(/sj_professional_session=/.test(professionalCookie),'professional signup should issue an HttpOnly session cookie');
    let professionalDashboard=await json(`${base}/api/professional/dashboard`,{headers:{Cookie:professionalCookie}});
    assert.equal(professionalDashboard.professionals.length,1);
    const ownDraft=professionalDashboard.professionals[0];
    assert.equal(ownDraft.profileStatus,'private draft');
    const claimResult=await json(`${base}/api/professional/claim-profile`,post({professionalId:publicSeed.recordId},{Cookie:professionalCookie}));
    assert(claimResult.profileRequest && claimResult.account.pendingClaimProfessionalIds.includes(publicSeed.recordId));
    professionalDashboard=await json(`${base}/api/professional/dashboard`,{headers:{Cookie:professionalCookie}});
    assert(professionalDashboard.pendingClaimProfiles.some(x=>x.id===publicSeed.recordId));
    r=await result(`${base}/api/professional/profiles/${encodeURIComponent(publicSeed.recordId)}`,post({biography:'Unauthorized pre-approval edit.'},{Cookie:professionalCookie}));
    assert.equal(r.response.status,403,'claim request must not grant edit control before owner approval');
    const claimRequest=professionalDashboard.profileRequests.find(x=>x.profileId===publicSeed.recordId);
    const ownerApproved=await json(`${base}/api/owner/professional-accounts/approve-profile-claim`,post({accountId:signupResult.data.account.id,professionalId:publicSeed.recordId,profileRequestId:claimRequest.id},ownerHeaders()));
    assert(ownerApproved.account.professionalIds.includes(publicSeed.recordId));
    const approvedEdit=await json(`${base}/api/professional/profiles/${encodeURIComponent(publicSeed.recordId)}`,post({biography:'Profile owner supplied biography pending public review.'},{Cookie:professionalCookie}));
    assert(/Profile owner supplied/.test(approvedEdit.professional.biography));
    const pausedCheckout=await result(`${base}/api/professional/membership/checkout`,post({kind:'professional',id:ownDraft.id,planId:'nyc-founding-professional',seatCount:1,billingCadence:'monthly'},{Cookie:professionalCookie}));
    assert.equal(pausedCheckout.response.status,409,'membership enrollment must remain closed while the founding pilot is paused');
    const openedPilot=await json(`${base}/api/owner/professional-marketplace/pilot-controls`,post({status:'pilot-open',maxActiveProfessionalMemberships:25,maxActiveFirmMemberships:10,maxTotalFirmSeats:100,ownerApprovalRequired:true,notes:'Regression-test controlled pilot.'},ownerHeaders()));
    assert.equal(openedPilot.pilotControls.status,'pilot-open');
    const unpaidCheckout=await json(`${base}/api/professional/membership/checkout`,post({kind:'professional',id:ownDraft.id,planId:'nyc-founding-professional',seatCount:1,billingCadence:'monthly'},{Cookie:professionalCookie}));
    assert.equal(unpaidCheckout.stripeConfigured,false,'missing Stripe credentials must not fake paid membership');
    const stripeEvent={id:'evt_professional_membership_test',type:'checkout.session.completed',data:{object:{id:'cs_professional_membership_test',status:'complete',payment_status:'paid',customer:'cus_test',subscription:'sub_test',metadata:{kind:'professional_membership',accountId:signupResult.data.account.id,membershipKind:'professional',membershipId:ownDraft.id,planId:'nyc-founding-professional',seatCount:'1',billingCadence:'monthly'}}}};
    const rawStripeBody=JSON.stringify(stripeEvent); const stripeTimestamp=Math.floor(Date.now()/1000); const stripeSignature=crypto.createHmac('sha256','whsec-marketplace-regression-test').update(`${stripeTimestamp}.${rawStripeBody}`).digest('hex');
    const stripeWebhook=await json(`${base}/webhooks/stripe`,{method:'POST',headers:{'Content-Type':'application/json','Stripe-Signature':`t=${stripeTimestamp},v1=${stripeSignature}`},body:rawStripeBody});
    assert.equal(stripeWebhook.activated,true,'a valid signed Stripe completion should activate the membership record');
    professionalDashboard=await json(`${base}/api/professional/dashboard`,{headers:{Cookie:professionalCookie}});
    const paidDraft=professionalDashboard.professionals.find(x=>x.id===ownDraft.id);
    assert.equal(paidDraft.membership.status,'active');
    assert.equal(paidDraft.eligibility.consultationEligible,false,'paid membership alone must not create consultation eligibility');

    // Official registration selection may create a source-linked private account profile, but not a verified or public profile.
    const officialSignup=await result(`${base}/api/professional/auth/signup`,post({
      accountType:'individual',displayName:'Official Record Signup',email:'official-signup@example.test',password:'LongPassword!456',professionalType:'attorney',
      registrationNumber:'7654321',acceptTerms:true,acceptPrivacy:true
    }));
    assert.equal(officialSignup.response.status,201,JSON.stringify(officialSignup.data));
    const officialCookie=String(officialSignup.response.headers.get('set-cookie')||'').split(';')[0];
    const officialDashboard=await json(`${base}/api/professional/dashboard`,{headers:{Cookie:officialCookie}});
    assert.equal(officialDashboard.professionals[0].publicFacts.registrationNumber,'7654321');
    assert.equal(officialDashboard.professionals[0].publicProfileEnabled,false);
    assert.notEqual(officialDashboard.professionals[0].verificationStatus,'verified');

    // A public firm profile remains read-only until an owner approves the central account claim.
    const firmClaimSignup=await result(`${base}/api/professional/auth/signup`,post({
      accountType:'firm',displayName:'Public Firm Claim Administrator',firmName:publicFirmSeed.name,email:'firm-claim@example.test',password:'LongPassword!FirmClaim',
      claimFirmId:publicFirmSeed.recordId,seatCount:2,acceptTerms:true,acceptPrivacy:true
    }));
    assert.equal(firmClaimSignup.response.status,201,JSON.stringify(firmClaimSignup.data));
    const firmClaimCookie=String(firmClaimSignup.response.headers.get('set-cookie')||'').split(';')[0];
    const attachPublicFirm=await json(`${base}/api/professional/claim-firm`,post({firmId:publicFirmSeed.recordId},{Cookie:firmClaimCookie}));
    assert(attachPublicFirm.account.pendingClaimFirmIds.includes(publicFirmSeed.recordId));
    let firmClaimDashboard=await json(`${base}/api/professional/dashboard`,{headers:{Cookie:firmClaimCookie}});
    assert(firmClaimDashboard.pendingClaimFirms.some(x=>x.id===publicFirmSeed.recordId));
    r=await result(`${base}/api/professional/firms/${encodeURIComponent(publicFirmSeed.recordId)}`,post({phone:'212-555-0111'},{Cookie:firmClaimCookie}));
    assert.equal(r.response.status,403,'firm claim must not grant edit control before owner approval');
    const firmClaimRequest=firmClaimDashboard.profileRequests.find(x=>x.profileId===publicFirmSeed.recordId && x.requestType==='claim');
    const approvedFirmClaim=await json(`${base}/api/owner/professional-accounts/approve-firm-claim`,post({accountId:firmClaimSignup.data.account.id,firmId:publicFirmSeed.recordId,profileRequestId:firmClaimRequest.id},ownerHeaders()));
    assert(approvedFirmClaim.account.firmIds.includes(publicFirmSeed.recordId));
    const approvedFirmEdit=await json(`${base}/api/professional/firms/${encodeURIComponent(publicFirmSeed.recordId)}`,post({phone:'212-555-0111',locations:['26 Court Street, Brooklyn, NY']},{Cookie:firmClaimCookie}));
    assert.equal(approvedFirmEdit.firm.phone,'212-555-0111');
    assert.equal(approvedFirmEdit.firm.claimStatus,'claimed');
    const claimedFirmPublic=await json(`${base}/api/public/firms/${encodeURIComponent(publicFirmSeed.id)}`);
    assert.equal(claimedFirmPublic.firm.claimed,true,'approved firm claim should be reflected honestly on the public profile');

    // A newly created firm account centrally manages seats and multiple professional profiles across portal practice areas.
    const firmSignup=await result(`${base}/api/professional/auth/signup`,post({
      accountType:'firm',displayName:'Firm Administrator',firmName:'Central Multi-Practice Firm',email:'firm-admin@example.test',password:'LongPassword!789',
      officeLocation:'26 Court Street, Brooklyn, NY',seatCount:3,portalEligibility:['general-smarter-justice-start'],acceptTerms:true,acceptPrivacy:true
    }));
    assert.equal(firmSignup.response.status,201,JSON.stringify(firmSignup.data));
    const firmCookie=String(firmSignup.response.headers.get('set-cookie')||'').split(';')[0];
    let firmDashboard=await json(`${base}/api/professional/dashboard`,{headers:{Cookie:firmCookie}});
    assert.equal(firmDashboard.firms.length,1);
    const accountFirm=firmDashboard.firms[0];
    const addedFirmPro=await json(`${base}/api/professional/firms/${encodeURIComponent(accountFirm.id)}/professionals`,post({displayName:'Firm Roster Attorney',professionalType:'attorney',practiceAreas:['Criminal law','Family law'],portalEligibility:['general-smarter-justice-start']},{Cookie:firmCookie}));
    assert.equal(addedFirmPro.professional.firmId,accountFirm.id);
    assert.equal(addedFirmPro.professional.membership.coveredByFirmId,accountFirm.id,'firm roster professional should be covered by the central firm membership record');
    firmDashboard=await json(`${base}/api/professional/dashboard`,{headers:{Cookie:firmCookie}});
    assert(firmDashboard.professionals.some(x=>x.displayName==='Firm Roster Attorney'));
    const firmNoStripe=await json(`${base}/api/professional/membership/checkout`,post({kind:'firm',id:accountFirm.id,planId:'nyc-founding-firm',seatCount:3,billingCadence:'monthly'},{Cookie:firmCookie}));
    assert.equal(firmNoStripe.stripeConfigured,false);
    assert.equal(firmNoStripe.quote.discountPercent,10);

    // Generated portal prompt and manifest inherit rules-pack version/checksum and marketplace rules.
    const cc = await json(`${base}/api/owner/control-center`, {headers:ownerHeaders()});
    assert.equal(cc.masterRulesPack.version, pack.version);
    assert.equal(cc.masterRulesPack.checksum, pack.checksum);
    const prompt = await result(`${base}/api/owner/control-center/prompts/justice-tax-solutions`, {headers:ownerHeaders()});
    assert.equal(prompt.response.status, 200);
    assert(prompt.text.includes(pack.checksum), 'generated prompt missing current rules checksum');
    assert(/active qualifying paid professional/i.test(prompt.text), 'generated prompt missing professional membership rule');
    assert(/source-tracked/i.test(prompt.text), 'generated prompt missing public profile seeding rule');
    const manifest = await json(`${base}/api/owner/control-center/manifests/justice-tax-solutions`, {headers:ownerHeaders()});
    assert.equal(manifest.manifest.masterRulesPackVersion, pack.version);
    assert.equal(manifest.manifest.masterRulesPackChecksum, pack.checksum);

    console.log('marketplace.test.js passed');
  } catch(err){
    console.error(err);
    console.error(log);
    process.exitCode=1;
  } finally {
    server.kill('SIGTERM');
    fs.rmSync(tempStorage,{recursive:true,force:true});
  }
})();
