'use strict';
const crypto=require('crypto');
const data=require('../data/professionalIdentityEvidenceRegistryV1775');
function clone(v){return JSON.parse(JSON.stringify(v));}
function registrationNumber(value){const s=String(value??'').replace(/\D/g,'');if(!/^\d{7}$/.test(s))throw new Error('A seven-digit NY OCA registration number is required.');return s;}
function jurisdictionCredential(value){return `NY-OCA-${registrationNumber(value)}`;}
function normalizeText(v){return String(v??'').trim().replace(/\s+/g,' ');}
function normalizeObservation(row={},context={}){
 const reg=registrationNumber(row.registration_number??row.registrationNumber);
 const observedAt=context.observedAt||new Date(0).toISOString();
 const sourceSnapshotId=context.sourceSnapshotId||'UNBOUND-SNAPSHOT';
 const name=[row.first_name,row.middle_name,row.last_name,row.suffix].map(normalizeText).filter(Boolean).join(' ');
 return{
  centralProfessionalId:`SJ-PRO-${crypto.createHash('sha256').update(`NY-OCA-${reg}`).digest('hex').slice(0,20).toUpperCase()}`,
  jurisdictionCredential:jurisdictionCredential(reg),
  registrationNumber:reg,
  name,
  registrationObservation:{status:normalizeText(row.registration_status??row.registrationStatus)||'UNKNOWN',observedAt,sourceSnapshotId,goodStanding:null,absenceOfDisciplineClaim:null},
  businessContact:{company:normalizeText(row.company_name??row.companyName),street1:normalizeText(row.street_1??row.street1),street2:normalizeText(row.street_2??row.street2),city:normalizeText(row.city),state:normalizeText(row.state),zip:normalizeText(row.zip),county:normalizeText(row.county),country:normalizeText(row.country),phone:normalizeText(row.phone_number??row.phoneNumber),email:normalizeText(row.email)},
  states:{identity:'OBSERVED',registration:'OBSERVED',specialtyEvidence:'UNREVIEWED',portalAcceptance:'NOT_EVALUATED',publication:'CLOSED',claim:'UNCLAIMED',membership:'NONE',opportunityEligibility:'CLOSED',suppression:'NONE'},
  source:{datasetId:'eqw2-r5nb',sourceSnapshotId,observedAt}
 };
}
function publicBusinessContact(observation,{businessStreetReviewed=false,addressMayBeResidential=true}={}){
 const c=observation.businessContact||{};
 const out={company:c.company||null,city:c.city||null,state:c.state||null,county:c.county||null,country:c.country||null,phone:c.phone||null,email:c.email||null};
 if(businessStreetReviewed===true&&addressMayBeResidential===false){out.street1=c.street1||null;out.street2=c.street2||null;out.zip=c.zip||null;}
 else{out.street1=null;out.street2=null;out.zip=null;out.streetSuppressed=true;}
 return out;
}
function publicationEligibility({observation,directoryRecheck,specialtyAcceptance,identityConflict=false,privacyHold=false}={}){
 const reasons=[];
 if(!observation?.jurisdictionCredential)reasons.push('IDENTITY_NOT_BOUND');
 if(identityConflict)reasons.push('IDENTITY_CONFLICT');
 if(privacyHold)reasons.push('PRIVACY_HOLD');
 if(directoryRecheck?.state!=='CURRENT_EXACT_RECHECK')reasons.push('TARGETED_OCA_DIRECTORY_RECHECK_REQUIRED');
 if(specialtyAcceptance?.state!=='ACCEPTED')reasons.push('PORTAL_SPECIALTY_ACCEPTANCE_REQUIRED');
 return{eligible:reasons.length===0,state:reasons.length?'HELD':'ELIGIBLE_FOR_PORTAL_PUBLICATION_REVIEW',reasons,goodStandingInferred:false,absenceOfDisciplineClaimMade:false};
}
function createPortalCandidatePacket({portalId,sourceSnapshotId,candidates=[],conflicts=[],holds=[],rechecksRequired=[]}={}){
 if(!portalId)throw new Error('portalId is required');
 const normalized=candidates.map(x=>x.jurisdictionCredential?clone(x):normalizeObservation(x,{sourceSnapshotId}));
 const digest=crypto.createHash('sha256').update(JSON.stringify({portalId,sourceSnapshotId,credentials:normalized.map(x=>x.jurisdictionCredential).sort()})).digest('hex').slice(0,16).toUpperCase();
 return{schema:data.packetSchema.schema,schemaVersion:data.packetSchema.schemaVersion,packetId:`SJPCP-${portalId.toUpperCase()}-${digest}`,portalId,generatedAt:'CURRENT_BUILD_TIME_REQUIRED',sourceSnapshotId:sourceSnapshotId||'UNBOUND-SNAPSHOT',candidates:normalized.map(x=>({centralProfessionalId:x.centralProfessionalId,jurisdictionCredential:x.jurisdictionCredential,name:x.name,registrationObservation:x.registrationObservation,businessContactProjection:publicBusinessContact(x),specialtyEvidence:[],courtEvidence:[],currentness:'RECHECK_REQUIRED',recommendedDisposition:'HOLD_PENDING_PORTAL_REVIEW'})),conflicts:clone(conflicts),holds:clone(holds),rechecksRequired:clone(rechecksRequired),suppressionState:'CENTRAL_SUPPRESSION_CONTROLS',publicationImplied:false,automaticPortalWriteBack:false};
}
function reconcilePortalReceipt(packet,receipt={}){
 const allowed=new Set(data.receiptLoop.states||[]);
 if(!packet?.packetId||receipt.packetId!==packet.packetId)return{ok:false,state:'RECEIPT_REJECTED',errors:['packet-binding']};
 if(!allowed.has(receipt.state))return{ok:false,state:'RECEIPT_REJECTED',errors:['receipt-state']};
 return{ok:true,state:'RECEIPT_ACCEPTED_FOR_RECONCILIATION',packetId:packet.packetId,portalState:receipt.state,centralIdentityMutated:false,automaticWriteBack:false,suppressionPropagationRequired:receipt.state==='SUPPRESSED'||receipt.state==='CORRECTED'};
}
function validate(){const errors=[];const r=data.registry,p=data.privacy;
 if(r.releaseVersion!=='1.7.75')errors.push('release-version');
 if(r.credentialNamespace!=='NY-OCA-{seven-digit registration number}')errors.push('credential-namespace');
 if(r.canonicalIdentityWriter!=='SMARTER_JUSTICE_CENTRAL_ONLY'||r.automaticPortalWriteBack!==false)errors.push('identity-writer');
 if((r.stateSeparation||[]).length<16)errors.push('state-separation');
 if(p.publishResidentialStreetAddress!==false||p.goodStandingInferenceFromRegistrationProhibited!==true||p.absenceOfDisciplineClaimProhibited!==true||p.outcomeRankingProhibited!==true||p.clientFactHarvestingProhibited!==true)errors.push('truth-privacy');
 if(r.source?.datasetId!=='eqw2-r5nb'||r.source?.observedColumns!==20||r.source?.postingFrequencyLabel!=='Quarterly')errors.push('source-metadata');
 if(r.gates?.liveSourceRefresh!==false||r.gates?.publication!==false||r.gates?.deployment!==false)errors.push('gates');
 const fixture=normalizeObservation({registration_number:'1234567',first_name:'Ada',last_name:'Example',street_1:'1 Private Way',city:'Albany',state:'NY',registration_status:'Currently registered'},{sourceSnapshotId:'TEST',observedAt:'2026-08-01T00:00:00-04:00'});
 if(fixture.jurisdictionCredential!=='NY-OCA-1234567')errors.push('fixture-credential');
 const pub=publicBusinessContact(fixture);if(pub.street1!==null||pub.streetSuppressed!==true)errors.push('street-suppression');
 const held=publicationEligibility({observation:fixture,directoryRecheck:{state:'STALE'},specialtyAcceptance:{state:'PENDING'}});if(held.eligible||!held.reasons.includes('TARGETED_OCA_DIRECTORY_RECHECK_REQUIRED'))errors.push('publication-gate');
 const pkt=createPortalCandidatePacket({portalId:'divorce-law-aid',sourceSnapshotId:'TEST',candidates:[fixture]});if(pkt.publicationImplied!==false||pkt.automaticPortalWriteBack!==false)errors.push('packet-boundary');
 const rec=reconcilePortalReceipt(pkt,{packetId:pkt.packetId,state:'ACCEPTED'});if(!rec.ok||rec.centralIdentityMutated!==false)errors.push('receipt-loop');
 return{ok:errors.length===0,errors,releaseVersion:r.releaseVersion,state:r.state,credentialNamespace:r.credentialNamespace,sourceDatasetId:r.source.datasetId,portalReceiptStateCount:(data.receiptLoop.states||[]).length,launchState:r.launchState};}
function ownerView(){return{releaseVersion:'1.7.75',validation:validate(),registry:clone(data.registry),source:clone(data.source),packetSchema:clone(data.packetSchema),receiptLoop:clone(data.receiptLoop),privacy:clone(data.privacy)};}
module.exports={registrationNumber,jurisdictionCredential,normalizeObservation,publicBusinessContact,publicationEligibility,createPortalCandidatePacket,reconcilePortalReceipt,validate,ownerView};
