'use strict';

const {
  FOUR_PORTAL_LAUNCH_VERSION,
  FOUR_PORTAL_LAUNCH,
  HISTORICAL_THREE_PORTAL_IDS,
  listFourPortalLaunch,
  getFourPortal,
  portalIdForInterest,
  isFourPortal
} = require('./fourPortalLaunchV1751');

const INITIAL_LAUNCH_PILOT_VERSION = FOUR_PORTAL_LAUNCH_VERSION;
const INITIAL_LAUNCH_PILOTS = FOUR_PORTAL_LAUNCH;

function listInitialLaunchPilots(){
  return listFourPortalLaunch().map(item=>({
    ...item,
    publicProfileLocation:'focused-portal',
    simpleScope:[...(item.simpleScope||[])]
  }));
}
function getInitialLaunchPilot(id){
  const item=getFourPortal(id);
  return item?{...item,publicProfileLocation:'focused-portal',simpleScope:[...(item.simpleScope||[])]}:null;
}
function isInitialLaunchPilot(id){ return isFourPortal(id); }

module.exports={
  INITIAL_LAUNCH_PILOT_VERSION,
  INITIAL_LAUNCH_PILOTS,
  HISTORICAL_THREE_PORTAL_IDS,
  listInitialLaunchPilots,
  getInitialLaunchPilot,
  portalIdForInterest,
  isInitialLaunchPilot
};
