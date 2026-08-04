'use strict';
const canonical=require('../data/initialPortalAuthorityV1775');
const receipt=require('../INITIAL_PORTAL_CURRENTNESS_RECEIPT_V1.7.75.json');
const truth=require('../PORTFOLIO_TRUTH_V1.7.75.json');
const registry=require('../ARTIFACT_REGISTRY_V1.7.75.json');
const evidence=require('../PORTAL_EVIDENCE_STATE_REGISTER_V1.7.75.json');
const snapshot=require('../PORTAL_RELEASE_SNAPSHOT_V1.7.75.json');
const operating=require('./legalPortfolioOperatingSystem');
function clone(v){return JSON.parse(JSON.stringify(v));}
function index(rows,key='portalId'){return new Map((rows||[]).map(x=>[x[key],x]));}
function validate(){const errors=[];const maps={receipt:index(receipt.portals),truth:index(truth.portals),registry:index(registry.portalArtifacts),evidence:index(evidence.portals),snapshot:index(snapshot.records,'slug'),operating:index(operating.PILOTS)};
 for(const expected of canonical.portals||[]){const id=expected.portalId;const exact=expected.identityCompleteness==='VERSION_FILENAME_SHA_SIZE';const expectedState=expected.evidenceState;
  const surfaces=[
   ['receipt',maps.receipt.get(id),{version:expected.version,artifactFilename:expected.artifactFilename,ownerRecordedSha256:expected.ownerRecordedSha256,ownerRecordedSizeBytes:expected.ownerRecordedSizeBytes,evidenceState:expectedState,independentlyVerifiedInThisBuild:false}],
   ['truth',maps.truth.get(id),{version:expected.version,artifact:expected.artifactFilename,sha256:expected.ownerRecordedSha256,sizeBytes:expected.ownerRecordedSizeBytes,evidenceState:expectedState,independentlyVerifiedInThisBuild:false}],
   ['registry',maps.registry.get(id),{version:expected.version,filename:expected.artifactFilename,sha256:expected.ownerRecordedSha256,sizeBytes:expected.ownerRecordedSizeBytes,evidenceState:expectedState,independentlyVerifiedInThisBuild:false}],
   ['evidence',maps.evidence.get(id),{version:expected.version,artifactFilename:expected.artifactFilename,ownerRecordedSha256:expected.ownerRecordedSha256,ownerRecordedSizeBytes:expected.ownerRecordedSizeBytes,exactArtifactInspectionState:expectedState}],
   ['snapshot',maps.snapshot.get(id),{latestDevelopmentVersion:expected.version,latestZipName:expected.artifactFilename,sha256:expected.ownerRecordedSha256,sizeBytes:expected.ownerRecordedSizeBytes,evidenceLevel:expectedState}],
   ['operating',maps.operating.get(id),{'artifact.version':expected.version,'artifact.filename':expected.artifactFilename,'artifact.sha256':expected.ownerRecordedSha256,'artifact.sizeBytes':expected.ownerRecordedSizeBytes,'artifact.evidenceState':expectedState}]
  ];
  for(const [name,row,want] of surfaces){if(!row){errors.push(`${id}:${name}:missing`);continue;}for(const [field,value] of Object.entries(want)){const got=field.startsWith('artifact.')?row.artifact?.[field.slice(9)]:row[field];if(got!==value)errors.push(`${id}:${name}:${field}:${String(got)}!=${String(value)}`);}}
  if(exact&&(!/^[a-f0-9]{64}$/.test(expected.ownerRecordedSha256||'')||!(expected.ownerRecordedSizeBytes>0)))errors.push(`${id}:canonical-full-identity-invalid`);
  if(!exact&&(expected.ownerRecordedSha256!==null||expected.ownerRecordedSizeBytes!==null))errors.push(`${id}:canonical-partial-identity-invalid`);
 }
 return{ok:errors.length===0,status:errors.length?'CONFLICT':'CURRENT_RUNTIME_AUTHORITY',errors,portalCount:(canonical.portals||[]).length,releaseVersion:canonical.releaseVersion,authoritySource:'INITIAL_PORTAL_AUTHORITY_V1.7.75.json'};}
function ownerView(){return{...clone(receipt),canonicalAuthority:clone(canonical),validation:validate()};}
module.exports={validate,ownerView};
