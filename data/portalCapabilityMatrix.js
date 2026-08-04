const { PORTALS } = require('./portals');

const MATRIX_VERSION = '2.0.0';
const SHARED_BASELINE = [
  'Truthful public status and availability',
  'Meaningful free starting help',
  'Customer-facing plain language',
  'Mobile and accessibility foundations',
  'Privacy and security boundaries',
  'Official-source and exact-source provenance',
  'Separate professional profile, credential, payment, routing, engagement, and outcome states',
  'Claimable professional-profile architecture where appropriate',
  'Exact-artifact testing and rollback',
  'Maintained Next Version Improvement List',
  'Cross-Portal Learning and Adaptation section in every continuation prompt',
  'Portable non-confidential capability and adoption snapshot'
];

const BUILD_TRUTH = {
  'general-smarter-justice-start': { version:'1.7.31', package:'smarter-justice-v1.7.31.zip', buildState:'exact artifact testing required before delivery', deployment:'not deployed; last verified production remains v1.6.1', directory:'233 professionals, 48 firms, 281 public records, and 278 strict qualifying profiles after the Queens-led six-region Phase One batch', improvementList:'v1.7.32 list preserves production acceptance, device acceptance, registry refresh, profile revalidation, and capability-adoption work' },
  'immigration-oasis': { version:'1.10.254 lean overlay plus 1.10.162 full base', package:'verified two-artifact deployment pair', buildState:'exact artifacts and assembled full-source overlay preflight verified', deployment:'separate platform; lean overlay must never be clean-deployed alone', directory:'portal-specific professional operations remain separately governed', improvementList:'audited v1.10.254 continuation prompt requires exact two-artifact workflow' },
  'justice-tax-solutions': { version:'0.1.107', package:'justice-tax-solutions-v0.1.107.zip', buildState:'exact artifact identity and safety verified; dedicated source tests must be rerun in its build chat', deployment:'not confirmed deployed', directory:'tax attorney, CPA, enrolled-agent, accountant, and firm operations remain portal-specific and gated', improvementList:'audited v0.1.107 continuation prompt requires cross-portal learning review' },
  'estate-planning-probate': { version:'1.0.36', package:'estate-help-desk-v1.0.36.zip', buildState:'exact-tested development package', deployment:'not deployed or live verified', directory:'claimable profile foundations tracked in the portal project', improvementList:'portal-specific list required after each release' },
  'digital-divorce': { version:'0.5.0', package:'divorce-law-aid-v0.5.0.zip (owner-recorded current base; dedicated artifact re-verification required)', buildState:'exact-tested development package', deployment:'not deployed or live verified', directory:'real claimable profile foundations included in the portal project', improvementList:'maintained in the portal project' },
  'criminal-law-help-center': { version:'0.5.0', package:'criminal-law-aid-v0.5.0.zip (owner-recorded current base; dedicated artifact re-verification required)', buildState:'exact-tested development package', deployment:'not deployed or live verified', directory:'real claimable profile foundations included in the portal project', improvementList:'maintained in the portal project' },
  'employment-labor-law-help-center': { version:'0.8.0', package:'employment-law-aid-v0.8.0.zip (owner-recorded current base; dedicated artifact re-verification required)', buildState:'exact-tested development package', deployment:'not deployed or live verified', directory:'real claimable profile foundations included in the portal project', improvementList:'maintained in the portal project' },
  'accident-injury-help': { version:'0.3.0', package:'personal-injury-law-aid-v0.3.0.zip', buildState:'exact-tested development package', deployment:'not deployed or live verified', directory:'real claimable profile foundations included in the portal project', improvementList:'maintained in the portal project' },
  'housing-tenant-help': { version:'0.6.0', package:'landlord-tenant-aid-v0.6.0.zip (owner-recorded current base; dedicated artifact re-verification required)', buildState:'exact-tested development package', deployment:'not deployed or live verified', directory:'real claimable profile foundations included in the portal project', improvementList:'maintained in the portal project' },
  'disability-benefits-help': { version:'0.4.0', package:'disability-law-aid-v0.4.0.zip (owner-recorded current base; dedicated artifact re-verification required)', buildState:'exact-tested development package', deployment:'not deployed or live verified', directory:'real claimable profile foundations included in the portal project', improvementList:'maintained in the portal project' },
  'business-launch-desk': { version:'0.2.39', package:'business-launch-desk-v0.2.39-compliance-calendar-continuous-improvement-phase-one-profile-growth-full-build.zip', buildState:'exact artifact identity verified; dedicated source tests must be rerun in its build chat', deployment:'not confirmed deployed', directory:'claimable profile, claim review, outreach, shortlist, source revalidation, and Phase One growth are portal-specific', improvementList:'audited v0.2.39 continuation prompt requires cross-portal learning review' },
  'domestic-violence-safety-support': { version:'0.9.0', package:'stopsignproject-v0.9.0.zip (owner-recorded current base; dedicated artifact re-verification required)', buildState:'exact-tested development package recorded by owner', deployment:'not deployed or live verified in this package', directory:'survivor-centered professional and public-resource rules remain separately governed', improvementList:'maintained in the dedicated Stop Sign Project' }
};

const DEVIATIONS = {
  'immigration-oasis': ['Remains a separate immigration-only platform and uses a verified v1.10.162 full-base plus v1.10.254 lean-overlay release model. The lean ZIP must never be clean-deployed alone.'],
  'justice-tax-solutions': ['Large official tax-form assets may justify a future immutable asset-pack architecture, but the current deployment model must not change until the full inventory, overlay rules, form-edition governance, and deployment proof are complete and owner-approved.'],
  'business-launch-desk': ['Compliance-calendar and evidence-organizer lessons may transfer outward, but business formation, licensing, tax, contract, and professional categories remain portal-specific.'],
  'domestic-violence-safety-support': ['Confidential domestic-violence descriptions and uploads remain outside the general Smarter Justice saved-work flow.'],
  'contract-creator': ['Legacy compatibility route only; ContractCreator.com is not owned and is not an official public brand.'],
  'general-smarter-justice-start': ['Umbrella routing and owner portfolio coordination are primary; specialty legal workflows remain in separate portal projects.']
};

function missingBaseline(portal, truth){
  const missing=[];
  if(!truth) missing.push('Exact current build artifact and version have not been reconciled in this package.');
  if(!portal.officialDomain && portal.slug!=='general-smarter-justice-start') missing.push('Official owned domain is not recorded.');
  if(!portal.defaultUrl && portal.status!=='Available Now') missing.push('No verified live destination is configured.');
  if(!truth || !/exact-tested|exact artifact tested/i.test(truth.buildState||'')) missing.push('Exact-artifact evidence is not recorded here.');
  if(portal.status!=='Live — Separate Platform' && portal.status!=='Available Now') missing.push('Deployment and live verification remain incomplete.');
  return missing;
}

function buildPortalCapabilityMatrix(){
  const portals=PORTALS.filter(p=>p.publicVisible!==false).map(portal=>{
    const truth=BUILD_TRUTH[portal.slug] || null;
    return {
      portalSlug:portal.slug,
      portalName:portal.name,
      officialDomain:portal.officialDomain || '',
      publicCatalogStatus:portal.status,
      inheritedCapabilities:SHARED_BASELINE,
      approvedSpecialtyDeviations:DEVIATIONS[portal.slug] || [],
      missingBaselineRequirements:missingBaseline(portal,truth),
      exactBuildVersion:truth?.version || 'not reconciled',
      packageTruth:truth?.package || 'not reconciled',
      buildState:truth?.buildState || 'not reconciled',
      deploymentTruth:truth?.deployment || 'not reconciled',
      professionalDirectoryStatus:truth?.directory || 'portal-specific status not reconciled',
      improvementListStatus:truth?.improvementList || 'portal-specific list status not reconciled',
      publicLinkActive:Boolean(portal.defaultUrl && ['Live — Separate Platform','Available Now'].includes(portal.status)),
      sourceOfTruth:'Dedicated portal project remains authoritative for code, exact checksum, deployment, and specialty requirements.'
    };
  });
  return {
    version:MATRIX_VERSION,
    generatedForRelease:'1.7.31',
    baselineCapabilities:SHARED_BASELINE,
    portals,
    summary:{
      portalsTracked:portals.length,
      exactBuildsRecorded:portals.filter(x=>/exact-tested|exact artifact tested/i.test(x.buildState)).length,
      liveLinksActive:portals.filter(x=>x.publicLinkActive).length,
      portalsWithDocumentedDeviations:portals.filter(x=>x.approvedSpecialtyDeviations.length).length,
      portalsWithMissingBaselineRequirements:portals.filter(x=>x.missingBaselineRequirements.length).length
    }
  };
}

module.exports={MATRIX_VERSION,SHARED_BASELINE,BUILD_TRUTH,buildPortalCapabilityMatrix};
