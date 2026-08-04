'use strict';
const crypto=require('crypto');
const {PORTAL_CONTRACT_ALLOWED_FIELDS}=require('../data/professionalNetworkStandard');
const {PROFESSIONAL_PORTAL_HANDOFF_SCHEMA_VERSION,ADAPTER_FIXTURE_VERSION,INTEGRATED_PORTAL_STANDARD_VERSION,INTEGRATED_PORTAL_STANDARD_PATH,REQUIRED_HANDOFF_FIELDS,REQUIRED_STANDARD_FIELDS,REQUIRED_ASSIGNMENT_FIELDS,PROHIBITED_KEY_PATTERNS}=require('../data/professionalPortalHandoffSchema');

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.keys(value).sort().reduce((out,key)=>{out[key]=stable(value[key]);return out;},{});
  return value;
}
function fingerprintPayload(handoff){
  const copy=JSON.parse(JSON.stringify(handoff||{}));
  function clearGenerated(value){
    if(Array.isArray(value))return value.map(clearGenerated);
    if(value&&typeof value==='object')return Object.keys(value).reduce((out,key)=>{out[key]=key==='generatedAt'?null:clearGenerated(value[key]);return out;},{});
    return value;
  }
  return clearGenerated(copy);
}
function sha256(value){return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');}
function scanKeys(value,path='',findings=[]){
  if(Array.isArray(value)){value.forEach((item,index)=>scanKeys(item,`${path}[${index}]`,findings));return findings;}
  if(!value||typeof value!=='object')return findings;
  for(const [key,item] of Object.entries(value)){
    const current=path?`${path}.${key}`:key;
    if(PROHIBITED_KEY_PATTERNS.some((pattern)=>pattern.test(key)))findings.push(current);
    scanKeys(item,current,findings);
  }
  return findings;
}
function validatePublicationPolicy(policy,errors){
  if(!policy||typeof policy!=='object'||Array.isArray(policy)){errors.push('publicationPolicy must be an object.');return;}
  const exact={accountAndBillingSystem:'Smarter Justice',publicProfileSystem:'destination micro-portal',smarterJusticePublicDirectory:false,claimOrCreateEntryPointsAllowed:true,professionalSelfEntryAllowed:true,ownerAssistedEntryAllowed:true,publicationRequiresOwnerApprovedAssignment:true,publicationRequiresCredentialVerification:true,paymentAloneNeverPublishes:true,automaticWrites:false};
  for(const [key,value] of Object.entries(exact))if(policy[key]!==value)errors.push(`publicationPolicy.${key} must equal ${JSON.stringify(value)}.`);
}
function validateHandoff(handoff,expectedPortalId=''){
  const errors=[];const warnings=[];
  if(!handoff||typeof handoff!=='object'||Array.isArray(handoff))return {valid:false,state:'MALFORMED',errors:['Handoff must be an object.'],warnings,prohibitedKeyPaths:[],assignmentResults:[],profileResults:[],firmResults:[]};
  for(const field of REQUIRED_HANDOFF_FIELDS)if(!Object.prototype.hasOwnProperty.call(handoff,field))errors.push(`Missing handoff field: ${field}`);
  if(expectedPortalId&&handoff.destinationPortalId!==expectedPortalId)errors.push('Destination portal ID does not match the requested adapter.');
  if(handoff.sourceSystem!=='smarter-justice')errors.push('Source system must be smarter-justice.');
  const expectedDigest=sha256(fingerprintPayload({...handoff,handoffDigest:''})); if(handoff.handoffDigest!==expectedDigest)errors.push('handoffDigest does not match the stable payload.');
  if(handoff.automaticWrites!==false)errors.push('Automatic writes must be false.');
  if(handoff.liveConnection!==false)errors.push('Live connection must be false in this release.');
  for(const flag of ['containsUserMatterData','containsCredentials','containsPaymentData','containsConfidentialData'])if(handoff[flag]!==false)errors.push(`${flag} must be false.`);
  validatePublicationPolicy(handoff.publicationPolicy,errors);
  const standard=handoff.portalBuildStandard;
  if(!standard||typeof standard!=='object'||Array.isArray(standard))errors.push('portalBuildStandard must be an object.');
  else {
    for(const field of REQUIRED_STANDARD_FIELDS)if(!Object.prototype.hasOwnProperty.call(standard,field))errors.push(`Missing portal-build-standard field: ${field}`);
    if(standard.standardId!=='legal-micro-portal-integrated')errors.push('Integrated portal standard ID is invalid.');
    if(standard.standardVersion!==INTEGRATED_PORTAL_STANDARD_VERSION)errors.push('Integrated portal standard version is not current.');
    if(standard.standardPath!==INTEGRATED_PORTAL_STANDARD_PATH)errors.push('Integrated portal standard path is not current.');
    if(standard.conformanceState!=='REQUIRED_AT_PORTAL_RELEASE')errors.push('Portal release conformance must remain required.');
    for(const flag of ['exactArtifactAuthority','dualMissionRequired','profileMetricsRequired','completeSurfaceAuditRequired','exactArtifactTestingRequired','ownerActivationRequired'])if(standard[flag]!==true)errors.push(`${flag} must be true.`);
  }
  if(!Array.isArray(handoff.assignments))errors.push('Assignments must be an array.');
  if(!Array.isArray(handoff.profiles))errors.push('Profiles must be an array.');
  if(!Array.isArray(handoff.firms))errors.push('Firms must be an array.');
  const assignmentResults=[];const assignmentByProfessional=new Map();const seen=new Set();
  for(const [index,row] of (Array.isArray(handoff.assignments)?handoff.assignments:[]).entries()){
    const rowErrors=[];const rowWarnings=[];
    if(!row||typeof row!=='object'||Array.isArray(row)){rowErrors.push('Assignment must be an object.');assignmentResults.push({index,valid:false,errors:rowErrors,warnings:rowWarnings});continue;}
    for(const field of REQUIRED_ASSIGNMENT_FIELDS)if(!Object.prototype.hasOwnProperty.call(row,field))rowErrors.push(`Missing assignment field: ${field}`);
    for(const key of Object.keys(row))if(!PORTAL_CONTRACT_ALLOWED_FIELDS.includes(key)&&key!=='assignmentId'&&key!=='sourcePortalIds'&&key!=='mappingState')rowErrors.push(`Field is not allowed by the portal contract: ${key}`);
    if(row.portalId!==handoff.destinationPortalId)rowErrors.push('Assignment portal ID does not match destination portal.');
    if(row.assignmentId&&seen.has(row.assignmentId))rowErrors.push('Duplicate assignment ID.');
    if(!Number.isInteger(Number(row.sourceRevision))||Number(row.sourceRevision)<1)rowErrors.push('sourceRevision must be a positive integer.');
    if(!Number.isInteger(Number(row.approvedSourceRevision))||Number(row.approvedSourceRevision)<0)rowErrors.push('approvedSourceRevision must be a non-negative integer.');
    if(!/^[a-f0-9]{64}$/.test(String(row.recordFingerprint||'')))rowErrors.push('recordFingerprint must be a SHA-256 digest.');
    if(!['UPSERT_PUBLIC','UPSERT_PRIVATE','SUPPRESS'].includes(row.distributionAction))rowErrors.push('distributionAction is invalid.');
    if(!['NONE','SUPPRESS'].includes(row.suppressionState))rowErrors.push('suppressionState is invalid.');
    if(row.assignmentId)seen.add(row.assignmentId);
    if(!Array.isArray(row.sourcePortalIds)||!row.sourcePortalIds.length)rowErrors.push('At least one source portal identifier is required.');
    if(!['CANONICAL_ID','LEGACY_ALIAS_MAPPED'].includes(row.mappingState))rowErrors.push('Only resolved canonical assignments may enter a portal handoff.');
    if(row.appointmentEligibility!==false)rowErrors.push('Appointment eligibility must remain false.');
    if(row.publicationEligible===true&&Number(row.approvedSourceRevision)!==Number(row.sourceRevision))rowErrors.push('Publication eligibility requires assignment approval for the exact source revision.');
    if(row.inquiryEligibility===true)rowWarnings.push('Inquiry eligibility is recorded, but public inquiries remain globally closed.');
    if(row.professionalId)assignmentByProfessional.set(row.professionalId,row);
    assignmentResults.push({index,assignmentId:row.assignmentId||'',valid:rowErrors.length===0,errors:rowErrors,warnings:rowWarnings});
  }
  const profileResults=[];const profileIds=new Set();
  for(const [index,row] of (Array.isArray(handoff.profiles)?handoff.profiles:[]).entries()){
    const rowErrors=[];
    if(!row||typeof row!=='object'||Array.isArray(row)){rowErrors.push('Profile must be an object.');profileResults.push({index,valid:false,errors:rowErrors});continue;}
    if(!row.professionalId)rowErrors.push('professionalId is required.');
    if(!Number.isInteger(Number(row.sourceRevision))||Number(row.sourceRevision)<1)rowErrors.push('Profile sourceRevision must be a positive integer.');
    if(!/^[a-f0-9]{64}$/.test(String(row.recordFingerprint||'')))rowErrors.push('Profile recordFingerprint must be a SHA-256 digest.');
    if(row.professionalId&&profileIds.has(row.professionalId))rowErrors.push('Duplicate professional profile payload.');
    if(row.professionalId)profileIds.add(row.professionalId);
    const assignment=assignmentByProfessional.get(row.professionalId);
    if(!assignment)rowErrors.push('Profile must have a matching portal assignment.');
    if(row.publicListingDestination!==handoff.destinationPortalId)rowErrors.push('Profile publicListingDestination must match destination portal.');
    if(row.smarterJusticePublicProfile!==false)rowErrors.push('Smarter Justice public profile must remain false.');
    if(row.paymentCreatesPublication!==false)rowErrors.push('Payment must not create publication.');
    if(row.publicationEligible===true){
      if(Number(row.submittedRevision)!==Number(row.sourceRevision)||row.reviewStatus!=='approved')rowErrors.push('Publication-eligible profile requires the exact source revision to be submitted and approved.');
      if(!assignment?.publicationEligible)rowErrors.push('Profile cannot be publication eligible unless its assignment is eligible.');
      if(row.ownerApprovalState!=='approved')rowErrors.push('Publication-eligible profile requires owner approval.');
      if(row.credentialState!=='verified')rowErrors.push('Publication-eligible profile requires credential verification.');
    }
    profileResults.push({index,professionalId:row.professionalId||'',valid:rowErrors.length===0,errors:rowErrors});
  }
  for(const assignment of (Array.isArray(handoff.assignments)?handoff.assignments:[]))if(assignment.professionalId&&!profileIds.has(assignment.professionalId))errors.push(`Missing profile payload for assignment professional: ${assignment.professionalId}`);
  const firmResults=[];const firmIds=new Set();
  for(const [index,row] of (Array.isArray(handoff.firms)?handoff.firms:[]).entries()){
    const rowErrors=[];
    if(!row||typeof row!=='object'||Array.isArray(row)){rowErrors.push('Firm must be an object.');firmResults.push({index,valid:false,errors:rowErrors});continue;}
    if(!row.firmId)rowErrors.push('firmId is required.');
    if(!Number.isInteger(Number(row.sourceRevision))||Number(row.sourceRevision)<1)rowErrors.push('Firm sourceRevision must be a positive integer.');
    if(!/^[a-f0-9]{64}$/.test(String(row.recordFingerprint||'')))rowErrors.push('Firm recordFingerprint must be a SHA-256 digest.');
    if(row.firmId&&firmIds.has(row.firmId))rowErrors.push('Duplicate firm payload.');
    if(row.firmId)firmIds.add(row.firmId);
    if(row.publicListingDestination!==handoff.destinationPortalId)rowErrors.push('Firm publicListingDestination must match destination portal.');
    if(row.smarterJusticePublicProfile!==false)rowErrors.push('Smarter Justice public firm profile must remain false.');
    if(row.paymentCreatesPublication!==false)rowErrors.push('Payment must not create firm publication.');
    firmResults.push({index,firmId:row.firmId||'',valid:rowErrors.length===0,errors:rowErrors});
  }
  for(const profile of (Array.isArray(handoff.profiles)?handoff.profiles:[]))if(profile.firmId&&!firmIds.has(profile.firmId))errors.push(`Missing firm payload referenced by profile: ${profile.firmId}`);
  const prohibitedKeyPaths=scanKeys(handoff);
  if(prohibitedKeyPaths.length)errors.push('Prohibited key names were detected in the handoff.');
  if(Array.isArray(handoff.assignments)&&handoff.assignments.length===0)warnings.push('Valid empty fixture: no resolved professional assignments currently target this portal.');
  const valid=errors.length===0&&assignmentResults.every((row)=>row.valid)&&profileResults.every((row)=>row.valid)&&firmResults.every((row)=>row.valid);
  return {valid,state:valid?'PASS':'FAIL',schemaVersion:PROFESSIONAL_PORTAL_HANDOFF_SCHEMA_VERSION,errors,warnings,prohibitedKeyPaths,assignmentResults,profileResults,firmResults};
}
function buildFixture(handoff){
  const validation=validateHandoff(handoff,handoff?.destinationPortalId||'');
  const assignments=Array.isArray(handoff?.assignments)?handoff.assignments:[];
  const profiles=Array.isArray(handoff?.profiles)?handoff.profiles:[];
  const firms=Array.isArray(handoff?.firms)?handoff.firms:[];
  const organizations=new Set(assignments.map((row)=>row.organizationId).filter(Boolean));
  const professionals=new Set(assignments.map((row)=>row.professionalId).filter(Boolean));
  const evidenceStates={};const mappingStates={};
  for(const row of assignments){evidenceStates[row.evidenceState]=(evidenceStates[row.evidenceState]||0)+1;mappingStates[row.mappingState]=(mappingStates[row.mappingState]||0)+1;}
  const sourceFingerprint=sha256(fingerprintPayload(handoff));
  return {fixtureVersion:ADAPTER_FIXTURE_VERSION,schemaVersion:PROFESSIONAL_PORTAL_HANDOFF_SCHEMA_VERSION,fixtureId:`professional-adapter-fixture:${handoff?.destinationPortalId||'unknown'}:${sourceFingerprint.slice(0,16)}`,adapterMode:'LOCAL_READ_ONLY_CONSUMER_SIMULATION',portalId:handoff?.destinationPortalId||'',contractState:validation.valid?'D3_ADAPTER_TESTS_PASS':'D2_SCHEMAS_FIXTURES_AND_TESTS_PASS',sourceFingerprint,byteLength:Buffer.byteLength(JSON.stringify(handoff||{})),validation,consumerPreview:{accepted:validation.valid,writeAttempted:false,writeAuthorized:false,emptyState:assignments.length===0,assignmentCount:assignments.length,professionalCount:professionals.size,organizationCount:organizations.size,profilePayloadCount:profiles.length,firmPayloadCount:firms.length,publicationEligibleCount:profiles.filter((row)=>row.publicationEligible===true).length,evidenceStates,mappingStates},handoff};
}
module.exports={stable,sha256,validateHandoff,buildFixture,PROFESSIONAL_PORTAL_HANDOFF_SCHEMA_VERSION,ADAPTER_FIXTURE_VERSION};
