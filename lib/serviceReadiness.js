'use strict';

const store = require('./store');
const mailer = require('./mailer');
const launchCommandCenter = require('./launchCommandCenter');

const STANDARD_VERSION = '1.0.0';
const TARGET_RELEASE_VERSION = '1.7.75';
const LANE_IDS = Object.freeze([
  'public-free',
  'free-professional-profiles',
  'paid-membership',
  'paid-professional-growth'
]);

function clean(value, max = 120) {
  return String(value ?? '').trim().slice(0, max);
}
function configuredLane(value) {
  const requested = clean(value || process.env.LAUNCH_READINESS_LANE || 'free-professional-profiles');
  return LANE_IDS.includes(requested) ? requested : 'free-professional-profiles';
}
function machineCheck(command, key) {
  return (command.machine?.checks || []).find(item => item.key === key) || { ready:false, status:'blocked' };
}
function safeBlockedChecks(lane) {
  return (lane?.checks || []).filter(item => !item.ready).map(item => ({
    key:item.key,
    label:item.label,
    category:item.category,
    evidenceType:item.evidenceType
  }));
}
function liveness() {
  return {
    ok:true,
    status:'alive',
    app:'Smarter Justice',
    version:TARGET_RELEASE_VERSION,
    standardVersion:STANDARD_VERSION,
    checkedAt:new Date().toISOString(),
    processAlive:true
  };
}
function readiness(laneInput) {
  const command = launchCommandCenter.ownerView();
  const laneId = configuredLane(laneInput);
  const lane = command.lanes.find(item => item.id === laneId) || command.lanes[0];
  const storage = store.storageStatus();
  const email = mailer.status();
  const canonicalHttps = machineCheck(command, 'https_canonical_base');
  const productionRuntime = machineCheck(command, 'production_runtime');
  const ready = Boolean(lane?.ready);
  return {
    ok:ready,
    status:ready ? 'ready' : 'not-ready',
    app:'Smarter Justice',
    version:TARGET_RELEASE_VERSION,
    standardVersion:STANDARD_VERSION,
    checkedAt:new Date().toISOString(),
    selectedLane:laneId,
    lane:{
      id:lane?.id || laneId,
      name:lane?.name || laneId,
      status:lane?.status || 'NO_GO',
      ready,
      passedChecks:lane?.passedChecks || 0,
      requiredChecks:lane?.requiredChecks || 0,
      blockedCount:(lane?.blockedKeys || []).length
    },
    blocked:safeBlockedChecks(lane),
    dependencies:{
      productionRuntime:Boolean(productionRuntime.ready),
      canonicalHttps:Boolean(canonicalHttps.ready),
      database:{
        selected:Boolean(storage.databaseUrlPresent),
        healthy:Boolean(storage.databaseReady && !storage.persistenceBlocked),
        transactions:Boolean(storage.databaseTransactionsReady),
        schemaCurrent:Boolean(storage.databaseSchemaCurrent)
      },
      email:{configured:Boolean(email.configured)},
      privateUploadStorage:{ready:Boolean(storage.privateUploadStorageReady)}
    },
    failClosed:true,
    retryAfterSeconds:ready ? 0 : 60,
    monitoringGuidance:{
      livenessPath:'/livez',
      readinessPath:`/readyz?lane=${encodeURIComponent(laneId)}`,
      useLivenessFor:'Process restart detection only.',
      useReadinessFor:'Traffic eligibility for the selected launch lane.'
    }
  };
}
function publicStatus() {
  const launch = launchCommandCenter.publicStatus();
  const selectedLane = configuredLane();
  const ready = readiness(selectedLane);
  const publicHelpAvailable = Boolean(launch.publicStartingHelp?.available);
  const profileControlAvailable = Boolean(launch.professionalApplications?.available);
  const overall = profileControlAvailable && ready.ok ? 'operational' : (publicHelpAvailable ? 'limited' : 'unavailable');
  return {
    ok:true,
    version:TARGET_RELEASE_VERSION,
    standardVersion:STANDARD_VERSION,
    updatedAt:new Date().toISOString(),
    overall:{
      status:overall,
      label:overall === 'operational' ? 'Core launch services operational' : overall === 'limited' ? 'Limited availability' : 'Service unavailable',
      detail:overall === 'operational'
        ? 'Free public starting help and approved free professional profile-control services are available.'
        : overall === 'limited'
          ? 'Free non-saved public starting help remains available. Professional profile launch services are not yet fully approved or ready.'
          : 'The service is not currently available. Use the contact path for support.'
    },
    services:{
      publicStartingHelp:launch.publicStartingHelp,
      professionalAccounts:launch.professionalAccounts,
      professionalApplications:launch.professionalApplications,
      paidMembership:launch.paidMembership,
      professionalGrowth:launch.professionalGrowth
    },
    selectedReadinessLane:{
      id:ready.lane.id,
      name:ready.lane.name,
      status:ready.lane.status,
      ready:ready.lane.ready
    },
    support:launch.support,
    boundaries:launch.boundaries,
    privacy:{
      exposesSecrets:false,
      exposesDatabaseErrors:false,
      exposesPersonalInformation:false
    }
  };
}
function ownerDiagnostics() {
  const command = launchCommandCenter.ownerView();
  const selected = readiness();
  return {
    ok:true,
    version:TARGET_RELEASE_VERSION,
    standardVersion:STANDARD_VERSION,
    generatedAt:new Date().toISOString(),
    selected,
    lanes:command.lanes.map(lane => ({
      id:lane.id,
      name:lane.name,
      status:lane.status,
      ready:lane.ready,
      passedChecks:lane.passedChecks,
      requiredChecks:lane.requiredChecks,
      blocked:safeBlockedChecks(lane)
    })),
    endpoints:{
      liveness:'/livez',
      readiness:'/readyz',
      publicStatus:'/api/public/service-status',
      ownerDiagnostics:'/api/owner/service-readiness'
    },
    operatorBoundary:{
      healthDoesNotAuthorizeLaunch:true,
      readinessDoesNotReplaceOwnerApproval:true,
      readinessDoesNotReplacePortalStaging:true,
      readinessDoesNotOpenPaidGrowth:true,
      statement:'A green readiness probe only means the selected lane has satisfied its recorded machine, evidence, and approval checks. It does not create legal approval, portal acceptance, or deployment authorization.'
    }
  };
}

module.exports = {
  STANDARD_VERSION,
  TARGET_RELEASE_VERSION,
  LANE_IDS,
  configuredLane,
  liveness,
  readiness,
  publicStatus,
  ownerDiagnostics
};
