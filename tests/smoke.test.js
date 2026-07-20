const assert = require('assert');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const port = 3961;
const base = `http://127.0.0.1:${port}`;
const tempStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'smarter-justice-smoke-'));
const server = spawn(process.execPath, ['server.js'], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    ADMIN_TOKEN: 'test-token',
    OWNER_CONTROL_CENTER_TOKEN: 'owner-test-token-unique-1234567890',
    APP_BASE_URL: base,
    SMARTER_JUSTICE_STORAGE_DIR: tempStorage,
    STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
    OWNER_NOTIFICATION_EMAIL: ''
  }
});
let log = '';
server.stdout.on('data', d => log += d.toString());
server.stderr.on('data', d => log += d.toString());
function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
async function fetchResult(url, opts){
  const response = await fetch(url, opts);
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { response, data, text };
}
async function fetchJson(url, opts){
  const result = await fetchResult(url, opts);
  if (!result.response.ok) throw new Error(JSON.stringify(result.data));
  return result.data;
}

(async () => {
  try {
    for (let i=0;i<40;i++){
      if(log.includes('listening')) break;
      if(server.exitCode !== null) throw new Error(`Server exited early: ${log}`);
      await wait(100);
    }

    const health = await fetchJson(`${base}/health`);
    assert.equal(health.ok, true);
    assert.equal(health.version, '1.6.1');
    assert.equal(Object.prototype.hasOwnProperty.call(health,'ownerNotificationConfigured'), false, 'public health must not expose notification configuration state');
    assert(!Object.prototype.hasOwnProperty.call(health, 'ownerEmail'), 'health must not expose owner email');
    assert.equal(health.features.formReadinessLevels, true);
    assert.equal(health.features.firstFormDraftStarterPackage, true);
    assert.equal(health.features.secureContinuationTokens, true);
    assert.equal(health.features.userCaseAccessRequiresContinuationToken, true);
    assert.equal(health.features.liveChatReady, false);
    assert.equal(health.features.contactSupportFallback, true);
    assert.equal(health.features.liveChatPublicConfigEndpoint, true);
    assert.equal(health.features.optionalPostgresPersistence, true);
    assert.equal(health.features.guidedHomepageStepFlow, true);
    assert.equal(health.features.focusedPracticeLandingPages, 15);
    assert.equal(health.features.conversionReadyPricingPage, true);
    assert.equal(health.features.umbrellaPortalRouter, true);
    assert(health.features.portalCount >= 10);
    assert.equal(health.features.microPortalGateway, true);
    assert.equal(health.features.privateOwnerControlCenterFoundation, true);
    assert.equal(health.features.portalPortfolioTracking, true);
    assert.equal(health.features.portalPromptGenerator, true);
    assert.equal(health.features.masterCoordinationPromptGenerator, true);
    assert.equal(health.features.portfolioManifestExport, true);
    assert.equal(health.features.controlCenterOwnerRoleSeparatedFromStaffAdmin, true);
    assert.equal(health.features.sharedPlatformStandardVersion, '1.3.3');
    assert.equal(health.features.immigrationOasisSeparatePortalCard, true);
    assert.equal(health.features.communityPartnerPrivateAccessKeys, true);
    assert.equal(health.features.communityPartnerAnonymizedReporting, true);
    assert.equal(health.features.adminCredentialsExcludedFromUrlsByDefault, true);
    assert.equal(health.features.configuredPortalUrlValidation, true);
    assert.equal(health.features.aiProviderLayerFoundation, true);
    assert.equal(health.features.aiProviderFallbackWithoutKeys, true);
    assert.equal(health.features.matterPathEngine, true);
    assert.equal(health.features.matterPathStageDetection, true);
    assert.equal(health.features.correctNextPathScreen, true);
    assert.equal(health.features.dashboardStageTimeline, true);
    assert.equal(health.features.staffWhyPathChosen, true);
    assert.equal(health.features.reviewReadyFormDrafts, true);
    assert.equal(health.features.verifiedFieldMappingFoundation, true);
    assert(health.features.reviewReadyDraftPathCount >= 9);
    assert.equal(health.features.reviewReadyDraftUserMissingDetailUpdates, true);
    assert.equal(health.features.reviewReadyDraftStaffFieldOverrides, true);
    assert.equal(health.features.reviewReadyDraftApprovalGate, true);
    assert.equal(health.features.expandedTaxReviewDraftPaths, true);
    assert(health.features.matterPathCount >= 15);
    assert.equal(health.features.uploadNoticePrimaryCta, true);
    assert.equal(health.features.practiceSpecificSmartQuestions, true);
    assert.equal(health.features.noticeUploadEntryPage, true);
    assert.equal(health.features.stripeCheckoutFoundation, true);
    assert.equal(health.features.stripeWebhookFoundation, true);
    assert.equal(health.features.requestMoreInformationWorkflow, true);
    assert.equal(health.features.launchReadinessChecklist, true);
    assert.equal(health.features.reviewPackageDownload, true);
    assert.equal(health.features.verifiedFormPathRegistry, true);
    assert.equal(health.features.adminAuditLogFoundation, true);
    assert.equal(health.features.humanReviewSeparateFromAttorneyReview, true);
    assert.equal(health.features.taxAttorneyReviewOption, true);
    assert.equal(health.features.offerInCompromiseIncluded, true);
    assert.equal(health.features.adminTokenRequiredNoDefault, true);
    assert.equal(health.features.ownerControlCenterTokenRequiredNoDefault, true);
    assert.equal(health.operationalReadiness.detailedReadinessRequiresAuthentication, true);
    assert.equal(Object.prototype.hasOwnProperty.call(health,'credentials'), false, 'public health must not expose internal configuration details');
    assert.equal(JSON.stringify(health).includes('storageDir'), false, 'public health must not expose storage paths');
    assert(health.features.practiceAreas >= 40);

    const publicConfig = await fetchJson(`${base}/api/public-config`);
    assert.equal(publicConfig.liveChat.configured, false);
    assert.equal(publicConfig.liveChat.propertyId, '');
    assert.equal(publicConfig.liveChat.widgetId, '');

    const home = await fetch(`${base}/`).then(r=>r.text());
    assert(/Start free/i.test(home));
    assert(/one trusted starting point/i.test(home));
    assert(/maxlength="2500"/.test(home));

    const portals = await fetchJson(`${base}/api/portals`);
    assert(portals.ok && portals.portals.some(p => p.slug === 'immigration-oasis' && /separate/i.test(p.disclosure)));
    assert(portals.portals.every(p => p.availabilityMessage));
    const contractPortal = portals.portals.find(p => p.slug === 'contract-creator');
    assert(contractPortal && contractPortal.publicUrl === '', 'planned ContractCreator portal should not appear live');
    const portalDetail = await fetchJson(`${base}/api/portals/justice-tax-solutions`);
    assert(portalDetail.ok && /Tax/.test(portalDetail.portal.name));
    const portalRec = await fetchJson(`${base}/api/portal-recommendation?practice=taxes`);
    assert(portalRec.ok && portalRec.portal.slug === 'justice-tax-solutions');
    const portalsHtml = await fetch(`${base}/portals.html`).then(r=>r.text());
    assert(/Focused Justice Portals/.test(portalsHtml));
    const portalRouterHtml = await fetch(`${base}/portal-router.html?portal=immigration-oasis`).then(r=>r.text());
    assert(/Portal Details/.test(portalRouterHtml));

    const practices = await fetchJson(`${base}/api/practice-areas`);
    assert(practices.practiceAreas.some(p => p.slug === 'medical-malpractice'));
    const schema = await fetchJson(`${base}/api/intake-schema/taxes`);
    assert(schema.ok && /Tax preparation/.test(schema.schema.title));
    assert(schema.matterPath && schema.matterPath.stages.length >= 3);
    const aiStatus = await fetchJson(`${base}/api/ai-status`);
    assert(aiStatus.ok && aiStatus.fallbackWithoutKeys === true);
    const matterPaths = await fetchJson(`${base}/api/matter-paths`);
    assert(matterPaths.ok && matterPaths.matterPaths.taxes);

    const partner = await fetchJson(`${base}/api/community-partners/register`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name:'Test Community Center', email:'partner@example.com' })
    });
    assert(partner.ok && partner.partner.code && partner.partner.dashboardUrl);
    assert(!Object.prototype.hasOwnProperty.call(partner.partner, 'email'), 'partner public response should not expose contact email');
    const partnerDashboardUrl = new URL(partner.partner.dashboardUrl);
    const partnerAccess = new URLSearchParams(partnerDashboardUrl.hash.replace(/^#/, '')).get('access');
    assert(partnerAccess && partnerAccess.length >= 24, 'partner dashboard needs a high-entropy private key');

    const submitted = await fetchJson(`${base}/api/free-question`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        practiceArea:'taxes', subcategory:'Offer in compromise', requestedPortal:'justice-tax-solutions',
        state:'New York', county:'Queens', city:'New York City', documentType:'Tax notice',
        deadlineDate:'2026-07-15', dateReceived:'2026-06-18', amountInvolved:'12000',
        question:'I received an IRS notice and need help with an offer in compromise, lien, and deadline next month.',
        fullName:'Test User', email:'test@example.com', consentToContact:true, referralCode:partner.partner.code,
        attachments:[{name:'irs-notice.pdf', mimeType:'application/pdf', dataBase64: Buffer.from('test pdf placeholder').toString('base64')}]
      })
    });
    assert(submitted.ok);
    assert(/^continue_/.test(submitted.case.id), 'public case ID should be the high-entropy continuation token');
    assert(/tax/i.test(submitted.case.practiceName));
    assert(/tax attorney|CPA|accountant|enrolled/i.test(submitted.case.professionalReviewLane));
    assert.equal(submitted.case.attachments.length, 1);
    assert(!Object.prototype.hasOwnProperty.call(submitted.case.attachments[0], 'storedPath'), 'public attachment data must not expose storage paths');
    assert(submitted.case.analysis.formReadiness);
    assert(submitted.case.analysis.matterPath);
    assert(submitted.case.correctNextPath);
    assert(submitted.case.analysis.aiReview && submitted.case.analysis.aiReview.mode === 'rules-fallback');
    assert(submitted.case.recommendedPortal && submitted.case.recommendedPortal.slug === 'justice-tax-solutions');
    assert(submitted.case.portalRouting && /Justice Tax Solutions/.test(submitted.case.portalRouting.recommendedPortalName));
    assert((submitted.case.verifiedFormPaths || []).some(p => p.id === 'tax-resolution-oic-starter'));
    assert((submitted.case.missingInformation || []).length >= 1);
    assert(submitted.case.formPathEvaluation && submitted.case.formPathEvaluation.completionPercent >= 0);
    assert(submitted.case.reviewReadyDraft && submitted.case.reviewReadyDraft.matched === true);
    assert(submitted.case.reviewReadyDraft.mappedFields.length >= 5);
    assert(submitted.case.matterPath.formReadinessScore >= 0);
    assert((submitted.case.dynamicMissingInformation || []).length >= 1);
    assert.equal(submitted.case.documentType, 'Tax notice');

    const storedCases = JSON.parse(fs.readFileSync(path.join(tempStorage, 'cases.json'), 'utf8'));
    const internalCaseId = storedCases[0].id;
    assert(internalCaseId && internalCaseId !== submitted.case.id, 'internal storage ID must differ from public access token');
    const internalIdDenied = await fetchResult(`${base}/api/cases/${encodeURIComponent(internalCaseId)}`);
    assert.equal(internalIdDenied.response.status, 404, 'internal case IDs must not grant user access');
    const loaded = await fetchJson(`${base}/api/cases/${encodeURIComponent(submitted.case.id)}`);
    assert.equal(loaded.case.id, submitted.case.id);
    const pkg = await fetch(`${base}/api/cases/${encodeURIComponent(submitted.case.id)}/review-package`).then(r=>r.text());
    assert(/organized file summary/i.test(pkg));
    assert(/Suggested next step/i.test(pkg));
    assert(!/<strong>Mode:<\/strong>|rules-fallback/.test(pkg), 'customer summary should not expose provider mode');
    const draftPkg = await fetch(`${base}/api/cases/${encodeURIComponent(submitted.case.id)}/draft-package`).then(r=>r.text());
    assert(/form-preparation starter file/i.test(draftPkg));
    const reviewReadyDraft = await fetch(`${base}/api/cases/${encodeURIComponent(submitted.case.id)}/review-ready-draft`).then(r=>r.text());
    assert(/Form draft for review/i.test(reviewReadyDraft));
    assert(!/field-mapped|draft engine/i.test(reviewReadyDraft));
    const reviewReadyDraftJson = await fetchJson(`${base}/api/cases/${encodeURIComponent(submitted.case.id)}/review-ready-draft.json`);
    assert(reviewReadyDraftJson.ok && reviewReadyDraftJson.reviewReadyDraft.mappedFields.length >= 5);
    const draftPaths = await fetchJson(`${base}/api/review-ready-draft-paths`);
    assert(draftPaths.ok && draftPaths.draftPaths.length >= 9);
    assert(draftPaths.draftPaths.some(p => p.id === 'irs-1040x-amended-return-review-draft'));
    const detailUpdate = await fetchJson(`${base}/api/cases/${encodeURIComponent(submitted.case.id)}/draft-details`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ details:{ householdSize:'2', monthlyIncome:'4200', monthlyExpenses:'3900', assets:'older car and checking account', bankAccounts:'checking account', filingCompliance:'all filed' } })
    });
    assert(detailUpdate.ok && detailUpdate.reviewReadyDraft.mappedFields.length >= 5);

    const checkout = await fetchJson(`${base}/api/checkout`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ caseId: submitted.case.id, serviceType:'tax_review' })
    });
    assert(checkout.ok && checkout.stripeConfigured === false);

    const launchQueryDenied = await fetchResult(`${base}/api/launch-readiness?token=test-token`);
    assert.equal(launchQueryDenied.response.status, 403, 'admin query tokens should be denied by default');
    const launch = await fetchJson(`${base}/api/launch-readiness`, { headers:{'X-Admin-Token':'test-token'} });
    assert(launch.ok && launch.checklist.items.some(i => i.key === 'stripeWebhook'));

    const event = { id:'evt_test', type:'checkout.session.completed', data:{ object:{ id:'cs_test_123', client_reference_id: submitted.case.id, payment_status:'paid', status:'complete', amount_total:19900, currency:'usd', metadata:{ caseId: submitted.case.id } } } };
    const raw = JSON.stringify(event);
    const ts = Math.floor(Date.now()/1000);
    const sig = crypto.createHmac('sha256','whsec_test_secret').update(`${ts}.${raw}`).digest('hex');
    const webhook = await fetchJson(`${base}/webhooks/stripe`, {
      method:'POST', headers:{'Content-Type':'application/json','Stripe-Signature':`t=${ts},v1=${sig}`}, body: raw
    });
    assert(webhook.received && webhook.handled && webhook.foundCase);
    const afterWebhook = await fetchJson(`${base}/api/cases/${encodeURIComponent(submitted.case.id)}`);
    assert(/webhook/.test(afterWebhook.case.paymentStatus));

    const partnerNoAccess = await fetchResult(`${base}/api/community-partners/${encodeURIComponent(partner.partner.code)}`);
    assert.equal(partnerNoAccess.response.status, 403, 'partner code alone must not open dashboard data');
    const partnerQueryAccessDenied = await fetchResult(`${base}/api/community-partners/${encodeURIComponent(partner.partner.code)}?access=${encodeURIComponent(partnerAccess)}`);
    assert.equal(partnerQueryAccessDenied.response.status, 403, 'partner access keys should not be accepted from query strings');
    const partnerData = await fetchJson(`${base}/api/community-partners/${encodeURIComponent(partner.partner.code)}`, { headers:{'X-Partner-Access':partnerAccess} });
    assert.equal(partnerData.summary.starts, 1);
    assert.equal(partnerData.summary.credits, 1);
    assert.equal(partnerData.referredStarts.length, 1);
    const partnerPayload = JSON.stringify(partnerData);
    for (const forbidden of ['Test User','test@example.com','continuationLink','practiceName','question','attachments','IRS notice']) {
      assert(!partnerPayload.includes(forbidden), `partner dashboard leaked ${forbidden}`);
    }
    assert(partnerData.referredStarts[0].createdAt && partnerData.referredStarts[0].creditStatus);

    const nextPathHtml = await fetch(`${base}/next-path.html?case=${encodeURIComponent(submitted.case.id)}`).then(r=>r.text());
    assert(/Your Next Step/.test(nextPathHtml));
    const linkEmail = await fetchJson(`${base}/api/cases/${encodeURIComponent(submitted.case.id)}/email-link`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email:'test@example.com' })
    });
    assert(linkEmail.ok);

    const ownerToken = 'owner-test-token-unique-1234567890';
    const controlQueryDenied = await fetchResult(`${base}/api/owner/control-center?token=${encodeURIComponent(ownerToken)}`);
    assert.equal(controlQueryDenied.response.status, 403, 'Control Center owner credentials must never be accepted from query strings');
    const staffCannotOpenOwner = await fetchResult(`${base}/api/owner/control-center`, { headers:{'X-Admin-Token':'test-token'} });
    assert.equal(staffCannotOpenOwner.response.status, 403, 'staff administrator credential must not open owner Control Center');
    const oldAdminNamespace = await fetchResult(`${base}/api/admin/control-center`, { headers:{'X-Admin-Token':'test-token'} });
    assert.equal(oldAdminNamespace.response.status, 404, 'old shared admin/owner Control Center namespace should be removed');
    const control = await fetchJson(`${base}/api/owner/control-center`, { headers:{'X-Owner-Control-Token':ownerToken} });
    assert(control.ok && control.portals.length >= 10);
    assert.equal(control.summary.sharedStandardVersion, '1.3.3');
    assert(control.summary.highPriority >= 1);
    assert(/strong defaults/i.test(control.governance.deviationPolicy.principle));
    const taxPortal = control.portals.find(p => p.slug === 'justice-tax-solutions');
    assert(taxPortal && taxPortal.professionalReviewTypes.includes('CPA'));
    assert(Array.isArray(taxPortal.portalSpecificRequirements));

    const privatePortal = await fetchJson(`${base}/api/owner/control-center/portals`, {
      method:'POST', headers:{'Content-Type':'application/json','X-Owner-Control-Token':ownerToken},
      body: JSON.stringify({
        name:'Court Deadline Desk', slug:'court-deadline-desk', priority:'low',
        currentBuildTarget:'Privately evaluate a deadline and court-notice specialty portal before any public launch decision.',
        portalSpecificRequirements:['Require jurisdiction and exact notice dates before suggesting a procedural starting path.']
      })
    });
    assert.equal(privatePortal.portal.slug,'court-deadline-desk');
    assert.equal(privatePortal.portal.customPrivateRecord,true);
    assert.equal(privatePortal.portal.portfolioStatus,'planned');
    assert(privatePortal.warnings.some(x=>/private portfolio record/i.test(x)));
    const duplicatePrivatePortal = await fetchResult(`${base}/api/owner/control-center/portals`, {
      method:'POST', headers:{'Content-Type':'application/json','X-Owner-Control-Token':ownerToken},
      body: JSON.stringify({ name:'Court Deadline Desk', slug:'court-deadline-desk' })
    });
    assert.equal(duplicatePrivatePortal.response.status,400,'duplicate private portal identifiers must be rejected');
    const publicPortalCatalog = await fetchJson(`${base}/api/portals`);
    assert(!publicPortalCatalog.portals.some(p=>p.slug==='court-deadline-desk'),'private portfolio records must never appear in the public portal catalog');
    const privatePrompt = await fetchJson(`${base}/api/owner/control-center/prompts/court-deadline-desk`, { headers:{'X-Owner-Control-Token':ownerToken} });
    assert(/Court Deadline Desk/.test(privatePrompt.prompt));
    assert(/Require jurisdiction and exact notice dates/.test(privatePrompt.prompt));
    const privateManifest = await fetchJson(`${base}/api/owner/control-center/manifests/court-deadline-desk`, { headers:{'X-Owner-Control-Token':ownerToken} });
    assert.equal(privateManifest.manifest.portalId,'court-deadline-desk');
    assert.equal(privateManifest.manifest.portfolioStatus,'planned');
    assert(/Private portfolio record/.test(privateManifest.manifest.definition.disclosure));

    const savedPortal = await fetchJson(`${base}/api/owner/control-center/portals/justice-tax-solutions`, {
      method:'POST', headers:{'Content-Type':'application/json','X-Owner-Control-Token':ownerToken},
      body: JSON.stringify({
        latestDevelopmentVersion:'0.2.0', latestZipName:'justice-tax-solutions-v0.2.0.zip', activeBuildState:'building', progressPercent:35,
        repository:'https://github.com/example/justice-tax-solutions', productionUrl:'javascript:alert(1)',
        blockers:['Stripe configuration pending'], ownerDecisions:['Tax preparation and tax resolution remain distinct but coordinated lanes.'],
        portalSpecificRequirements:['Preserve CPA, enrolled agent, accountant, and tax attorney review options.'],
        nextBuildInstructions:['Audit the notice upload and prior-return review funnels before adding new features.'],
        documentedDeviations:['Shared lane default | Tax preparation and tax resolution use separate lanes | tax workflow only | possible duplicated UI | clearer professional and user workflow.']
      })
    });
    assert.equal(savedPortal.portal.latestDevelopmentVersion,'0.2.0');
    assert.equal(savedPortal.portal.latestZipName,'justice-tax-solutions-v0.2.0.zip');
    assert.equal(savedPortal.portal.progressPercent,35);
    assert.equal(savedPortal.portal.documentedDeviations.length,1);
    assert.equal(savedPortal.portal.productionUrl,'', 'unsafe production URL must not be saved');
    assert(savedPortal.warnings.some(x => /productionUrl/.test(x)));
    const promptResult = await fetchJson(`${base}/api/owner/control-center/prompts/justice-tax-solutions`, { headers:{'X-Owner-Control-Token':ownerToken} });
    assert(/Justice Tax Solutions/.test(promptResult.prompt));
    assert(/Shared-standard flexibility and portal-specific deviation authority/.test(promptResult.prompt));
    assert(/General Smarter Justice system requirements/.test(promptResult.prompt));
    assert(/Tax preparation and tax resolution remain distinct/.test(promptResult.prompt));
    assert(/Stripe configuration pending/.test(promptResult.prompt));
    assert(/Every later continuation prompt/.test(promptResult.prompt));
    const masterPrompt = await fetchJson(`${base}/api/owner/control-center/prompts/master`, { headers:{'X-Owner-Control-Token':ownerToken} });
    assert(/Master coordination responsibilities/i.test(masterPrompt.prompt));
    assert(/Current portfolio snapshot/.test(masterPrompt.prompt));
    const portalManifest = await fetchJson(`${base}/api/owner/control-center/manifests/justice-tax-solutions`, { headers:{'X-Owner-Control-Token':ownerToken} });
    assert.equal(portalManifest.manifest.portalId,'justice-tax-solutions');
    assert.equal(portalManifest.manifest.latestZipName,'justice-tax-solutions-v0.2.0.zip');
    assert(portalManifest.manifest.portalSpecificRequirements.some(x=>/CPA/.test(x)));
    const portfolioExport = await fetchJson(`${base}/api/owner/control-center/export`, { headers:{'X-Owner-Control-Token':ownerToken} });
    assert.equal(portfolioExport.exportVersion,'1.0.0');
    assert(portfolioExport.portals.some(p=>p.slug==='justice-tax-solutions' && p.latestDevelopmentVersion==='0.2.0'));

    const adminQueryDenied = await fetchResult(`${base}/api/admin/cases?token=test-token`);
    assert.equal(adminQueryDenied.response.status, 403, 'admin case query token should be denied by default');
    const update = await fetchJson(`${base}/api/admin/cases/${encodeURIComponent(submitted.case.id)}`, {
      method:'POST',
      headers:{'Content-Type':'application/json','X-Admin-Token':'test-token'},
      body: JSON.stringify({
        status:'More information needed', userActionNeeded:'Need one more document',
        userFacingNote:'Please upload the full IRS notice.', formDraftStatus:'starter facts incomplete',
        reviewReadyDraftStatus:'starter mapped — missing information',
        reviewReadyDraftOverrides: JSON.stringify({ taxYears:'2023 and 2024', amountOwed:'12000', proposedMonthlyPayment:'250' }),
        reviewReadyDraftFieldNotes:'Corrected tax year and proposed payment after review.'
      })
    });
    assert(update.ok && /IRS notice/.test(update.case.userFacingNote));
    const admin = await fetchJson(`${base}/api/admin/cases`, { headers:{'X-Admin-Token':'test-token'} });
    assert(admin.cases.length >= 1);
    assert(Array.isArray(admin.auditLog) && admin.auditLog.length >= 1);
    assert(admin.partners.every(p => !Object.prototype.hasOwnProperty.call(p, 'email') && !Object.prototype.hasOwnProperty.call(p, 'accessToken')));

    console.log('smoke.test.js passed');
  } finally {
    server.kill();
    try { fs.rmSync(tempStorage, { recursive:true, force:true }); } catch {}
  }
})().catch(err => {
  console.error(err);
  if (log) console.error(log);
  server.kill();
  process.exit(1);
});
