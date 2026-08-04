'use strict';
const truth=require('../PORTFOLIO_TRUTH_V1.7.75.json');
const PORTAL_RELEASE_SNAPSHOT_VERSION='1.7.75';
const SNAPSHOT_RECORDED_AT=truth.generatedAt;
function relationship(row){
  if(row.portalId==='general-smarter-justice-start')return'umbrella platform';
  if(['immigration-oasis','contract-creator','justice-truck','stop-sign-project','attorneyride'].includes(row.portalId))return'independent or separate legal platform coordinated with Smarter Justice';
  return'focused Smarter Justice legal micro-portal';
}
function deploymentStatus(row){
  if(row.portalId==='general-smarter-justice-start')return'last verified production v1.6.1; v1.7.75 not deployed';
  if(row.deployment==='NOT_DEPLOYED')return'not deployed';
  if(row.deployment==='PAUSED')return'paused; deployment not confirmed';
  return'not confirmed deployed';
}
const PORTAL_RELEASE_SNAPSHOT_V1720=Object.freeze((truth.portals||[]).map(row=>Object.freeze({
  slug:row.portalId,name:row.name,domain:row.domain||'',latestDevelopmentVersion:row.version||'not built',latestZipName:row.artifact||'artifact not available',relationship:relationship(row),evidenceLevel:row.evidenceState,deploymentStatus:deploymentStatus(row),sensitiveTrafficApproved:false,nextAction:row.nextAction,releaseId:row.releaseId,artifactId:row.artifactId,reviewedAt:row.reviewedAt
})));
function getPortalReleaseSnapshot(){return{version:PORTAL_RELEASE_SNAPSHOT_VERSION,recordedAt:SNAPSHOT_RECORDED_AT,records:PORTAL_RELEASE_SNAPSHOT_V1720.map(row=>({...row})),boundaries:['Each dedicated portal exact artifact remains authoritative for that portal.','OWNER_RECORDED, MISSING, STALE, and CONFLICT states do not prove deployment or current implementation.','No sensitive, paid, professional-routing, review, booking, filing, upload, or automatic transfer gate is opened by this snapshot.']};}
module.exports={PORTAL_RELEASE_SNAPSHOT_VERSION,SNAPSHOT_RECORDED_AT,PORTAL_RELEASE_SNAPSHOT_V1720,getPortalReleaseSnapshot};
