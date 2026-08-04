const assert=require('assert');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const text=name=>fs.readFileSync(path.join(root,name),'utf8');
const json=name=>JSON.parse(text(name));

const pkg=json('package.json');
assert.equal(pkg.version,'1.7.10');
assert(pkg.scripts.test.includes('release-governance-v1710.test.js'));
assert(text('server.js').includes("const VERSION = '1.7.10'"));
const manifest=json('portal-manifest.json');
assert.equal(manifest.currentDevelopmentVersion,'1.7.10');
assert.equal(manifest.latestZipName,'smarter-justice-v1.7.10.zip');
assert.equal(manifest.lastExactArtifactTestVersion,'1.7.10');
assert.equal(manifest.testSuiteParts,25);
for(const cap of ['explicitPublicAssistanceChoice','rulesOnlyDefaultAssistance','publicAiProviderDetailsHidden','minimalPublicHealthResponse','professionalProgramPublicTruthEndpoint','professionalServiceRoleClassification','profileCorrectionRemovalVisibility','centralPortalRegistryReconciliationV1710']) assert.equal(manifest.capabilities[cap],true,`missing ${cap}`);

const improvements=json('NEXT_VERSION_IMPROVEMENT_LIST.json');
assert.equal(improvements.releaseVersion,'1.7.10');
assert.equal(improvements.items.length,39);
assert.equal(new Set(improvements.items.map(x=>x.id)).size,39);
for(const x of improvements.items) for(const key of ['id','title','priority','userBenefit','currentStatus','requiredImplementationOrEvidence','dependenciesOrGates','classification','releaseDisposition','evidence']) assert(Object.prototype.hasOwnProperty.call(x,key),`${x.id} missing ${key}`);
for(const id of ['SJ-NEXT-031','SJ-NEXT-032','SJ-NEXT-033','SJ-NEXT-034','SJ-NEXT-035','SJ-NEXT-036','SJ-NEXT-037','SJ-NEXT-038','SJ-NEXT-039']) assert(improvements.items.some(x=>x.id===id),`${id} missing`);
for(const id of ['SJ-NEXT-032','SJ-NEXT-033','SJ-NEXT-034']) { const i=improvements.items.find(x=>x.id===id); assert.equal(i.priority,'P0'); assert(!/^completed/.test(i.releaseDisposition)); }
for(const id of ['SJ-NEXT-035','SJ-NEXT-037']) assert.equal(improvements.items.find(x=>x.id===id).releaseDisposition,'completed in v1.7.10');
assert(improvements.items.filter(x=>x.priority==='P2').every(x=>/deferred|carried forward|pending/i.test(x.releaseDisposition)));

const active=text('ACTIVE_BUILD_QUEUE.md');
assert(!active.includes('SJ-NEXT-035 —')&&!active.includes('SJ-NEXT-037 —'),'completed v1.7.10 items must not remain active');
assert(active.includes('SJ-NEXT-032')&&active.includes('SJ-NEXT-039'));
const master=text('NEXT_BUILD_MASTER_LIST.md');
assert(master.includes('ACTIVE_BUILD_QUEUE.md')&&master.includes('NEXT_VERSION_IMPROVEMENT_LIST.json')&&/Do not manufacture scope/i.test(master));

const evidence=json('RELEASE_EVIDENCE_V1.7.10.json');
assert.equal(evidence.release.version,'1.7.10');
assert.equal(evidence.release.deployment.deployed,false);
assert.equal(evidence.release.deployment.liveVerified,false);
assert.equal(evidence.release.rollbackArtifact,'smarter-justice-v1.7.9.zip');
assert(evidence.privacySafeFunnelMeasurement.prohibitedProperties.includes('free-text legal description'));
assert(evidence.closedGates.includes('confidential production uploads'));
assert(evidence.changes.some(x=>x.id==='V1710-ASSISTANCE-CONTROL'));

const readiness=json('READINESS_DIMENSIONS_V1.7.10.json');
const required=['product','customerLanguage','accessibility','mobile','security','privacy','database','email','payments','legal','support','professionalOperations','deployment','liveVerification','recovery'];
assert.equal(readiness.dimensions.length,15);
for(const id of required) assert(readiness.dimensions.some(x=>x.id===id),`missing ${id}`);
assert(/No single percentage/.test(readiness.rule));

const server=text('server.js');
const health=server.slice(server.indexOf("pathName === '/health'"),server.indexOf("pathName === '/api/system/master-rules-pack'",server.indexOf("pathName === '/health'")));
assert(!/features:|operationalReadiness|configuredProviders|providerOrder/.test(health));
assert(server.includes("pathName === '/api/professional-program-status'")&&server.includes("pathName === '/api/owner/ai-status'"));
const program=require('../lib/pilotProgram').publicProgramStatus();
assert.equal(program.applicationsOpen,false); assert.equal(program.paymentOpen,false); assert.equal(program.accountPreparationAvailable,true);

const standards=require('../data/professionalMarketplaceStandards');
assert(Array.isArray(standards.PROFESSIONAL_SERVICE_ROLES)&&standards.PROFESSIONAL_SERVICE_ROLES.length>=10);
for(const role of ['criminal defense','employee','employer','tenant','landlord','injured worker or claimant','employer, carrier, or insurer defense']) assert(standards.PROFESSIONAL_SERVICE_ROLES.includes(role),`missing role ${role}`);
const signup=text('public/professional-signup.html');
assert(/serviceRoles/.test(signup)&&/Criminal defense/.test(signup)&&/Employee/.test(signup)&&/Employer/.test(signup));
const professionalJs=text('public/professional.js');
assert(/request a correction, duplicate review, removal, or suppression review/.test(professionalJs));
assert(/contact\.html\?topic=profile-correction/.test(professionalJs));

const seeds=require('../data/portalPortfolioSeed');
const o=seeds.PORTFOLIO_SEED_OVERRIDES;
for(const [slug,v] of [['general-smarter-justice-start','1.7.10'],['digital-divorce','0.5.0'],['criminal-law-help-center','0.5.0'],['employment-labor-law-help-center','0.8.0'],['accident-injury-help','0.3.0'],['disability-benefits-help','0.4.0'],['housing-tenant-help','0.6.0'],['estate-planning-probate','1.0.36']]) assert(String(o[slug].latestDevelopmentVersion).startsWith(v),`${slug} not reconciled`);
const privateSlugs=seeds.PRIVATE_PORTFOLIO_SEEDS.map(x=>x.slug);
for(const slug of ['stop-sign-project','attorneyride','justice-truck']) assert(privateSlugs.includes(slug),`${slug} boundary missing`);
const matrix=json('PORTAL_CAPABILITY_DEVIATION_MATRIX.json');
assert.equal(matrix.version,'1.1.0'); assert.equal(matrix.generatedForRelease,'1.7.10'); assert.equal(matrix.summary.portalsTracked,15);
for(const [slug,v] of [['digital-divorce','0.5.0'],['criminal-law-help-center','0.5.0'],['employment-labor-law-help-center','0.8.0'],['disability-benefits-help','0.4.0'],['housing-tenant-help','0.6.0']]) assert.equal(matrix.portals.find(x=>x.portalSlug===slug).exactBuildVersion,v);

const forms=json('FORM_DOCUMENT_WORKFLOW_INVENTORY.json');
assert.equal(forms.summary.officialSourceForms,95); assert.equal(forms.summary.guidedFormPaths,10); assert.equal(forms.summary.reviewReadyDraftFoundations,9); assert.equal(forms.summary.automaticFilingPaths,0);
const gov=require('../lib/releaseGovernance').getReleaseGovernance();
assert.equal(gov.releaseVersion,'1.7.10'); assert.equal(gov.summary.improvementItems,39); assert.equal(gov.summary.automaticFilingPaths,0);
for(const name of ['AUDIT_REPORT_V1.7.10.md','NO_CHANGE_LEDGER_V1.7.10.md','CONTINUATION_PROMPT_V1.7.10.md','RELEASE_EVIDENCE_V1.7.10.json','READINESS_DIMENSIONS_V1.7.10.json']) assert(fs.existsSync(path.join(root,name)),`${name} missing`);
for(const name of ['AUDIT_REPORT_V1.7.9.md','NO_CHANGE_LEDGER_V1.7.9.md','CONTINUATION_PROMPT_V1.7.9.md','RELEASE_EVIDENCE_V1.7.9.json']) assert(fs.existsSync(path.join(root,name)),`${name} historical record missing`);
console.log('v1.7.10 release governance and corrective controls tests passed.');
