'use strict';
const authority=require('../INITIAL_PORTAL_AUTHORITY_V1.7.57.json');
const rows=authority.portals.map(row=>Object.freeze({...row}));
module.exports=Object.freeze({releaseVersion:authority.releaseVersion,recordedAt:authority.recordedAt,pilotOrder:Object.freeze([...authority.pilotOrder]),domesticViolenceSeparateSafetyAcceptance:true,portals:Object.freeze(rows)});
