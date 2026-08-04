'use strict';
const professionalNetwork=require('./professionalNetwork');
const {buildFixture}=require('./professionalPortalAdapter');
const {aliasRegistry,PROFESSIONAL_PORTAL_ALIAS_VERSION}=require('../data/professionalPortalAliases');

const PROFESSIONAL_PORTAL_ADAPTER_LAB_VERSION='1.0.0';
function ownerView(){
  const network=professionalNetwork.ownerView();
  const fixtures=network.portalContracts.map((contract)=>buildFixture(professionalNetwork.portalHandoff(contract.portalId)));
  const aliases=aliasRegistry();
  const unresolved=(network.unresolvedPortalAssignments||[]);
  const summary={
    portalContracts:fixtures.length,
    d3AdapterTestsPassed:fixtures.filter((row)=>row.contractState==='D3_ADAPTER_TESTS_PASS').length,
    adapterTestsFailed:fixtures.filter((row)=>row.contractState!=='D3_ADAPTER_TESTS_PASS').length,
    populatedFixtures:fixtures.filter((row)=>!row.consumerPreview.emptyState).length,
    validEmptyFixtures:fixtures.filter((row)=>row.validation.valid&&row.consumerPreview.emptyState).length,
    resolvedCanonicalAssignments:fixtures.reduce((sum,row)=>sum+row.consumerPreview.assignmentCount,0),
    unresolvedLegacyAssignments:unresolved.length,
    mappedLegacyAliases:aliases.filter((row)=>row.state==='LEGACY_ALIAS_MAPPED').length,
    unresolvedAliases:aliases.filter((row)=>row.state==='UNRESOLVED_LEGACY_ALIAS').length,
    prohibitedDataFindings:fixtures.reduce((sum,row)=>sum+row.validation.prohibitedKeyPaths.length,0),
    liveConnections:network.summary.livePortalConnections,
    automaticWrites:network.summary.automaticPortalWrites
  };
  const readiness=summary.adapterTestsFailed===0&&summary.prohibitedDataFindings===0&&summary.liveConnections===0&&summary.automaticWrites===0?'D3_ADAPTER_TESTS_PASS':'ATTENTION_REQUIRED';
  return {generatedAt:new Date().toISOString(),labVersion:PROFESSIONAL_PORTAL_ADAPTER_LAB_VERSION,aliasVersion:PROFESSIONAL_PORTAL_ALIAS_VERSION,readiness,scope:'Local producer-consumer fixtures for nonconfidential professional metadata. No live portal connection and no portal write.',summary,fixtures,unresolvedPortalAssignments:unresolved,aliasRegistry:aliases,boundaries:['No live portal connection.','No automatic portal write.','No user legal matter or uploaded document.','No payment card, bank, secret, or private claim evidence.','Legacy aliases are mapped only when the current destination is unambiguous.','Unresolved legacy aliases remain in an owner-review queue rather than being guessed.']};
}
function fixtureForPortal(portalId){return ownerView().fixtures.find((row)=>row.portalId===portalId)||null;}
function featureStatus(){const view=ownerView();return {labVersion:view.labVersion,readiness:view.readiness,portalContracts:view.summary.portalContracts,d3AdapterTestsPassed:view.summary.d3AdapterTestsPassed,populatedFixtures:view.summary.populatedFixtures,validEmptyFixtures:view.summary.validEmptyFixtures,resolvedCanonicalAssignments:view.summary.resolvedCanonicalAssignments,unresolvedLegacyAssignments:view.summary.unresolvedLegacyAssignments,liveConnections:0,automaticWrites:0};}
module.exports={ownerView,fixtureForPortal,featureStatus,PROFESSIONAL_PORTAL_ADAPTER_LAB_VERSION};
