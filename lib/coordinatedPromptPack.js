'use strict';
const data=require('../data/coordinatedPromptPackV1775');
function clone(v){return JSON.parse(JSON.stringify(v));}
function validate(){const errors=[];
 if(data.releaseVersion!=='1.7.75')errors.push('release-version');
 if(data.packId!=='SJP-2026-08-02-C15-P37-D11-V13')errors.push('pack-id');
 if(data.packState!=='FOUR-FILE PACK FINALIZED — READY FOR SUNDAY DEPLOYMENT EXECUTION')errors.push('pack-state');
 if(data.canonicalActivePairRegisterState!=='COMMIT NOT PROVEN BY THIS PACK')errors.push('canonical-commit-boundary');
 if(data.deploymentInstructionState!=='ACTIVE — INCLUDED — EXACTLY BOUND')errors.push('deployment-file-4-state');
 if(data.centralMaster?.sha256!=='5dad361bae18b25dc8193ce32ca4263a72b12ce90316d6b97dbd191ce2b74223'||data.centralMaster?.sizeBytes!==383921||data.centralMaster?.lineCount!==8204)errors.push('central-master-identity');
 if(data.portalFamilyMaster?.sha256!=='9e158fb5e3eaca32861d067e026513ac179f0b416e6abe6f51d889faaf29a387'||data.portalFamilyMaster?.sizeBytes!==746617||data.portalFamilyMaster?.lineCount!==15240)errors.push('portal-master-identity');
 if(data.deploymentMaster?.sha256!=='3b35a35490fdf159d278c1d949dc2537da51b58c6fa079f387fb036d8c0843a7'||data.deploymentMaster?.sizeBytes!==246306||data.deploymentMaster?.lineCount!==4308)errors.push('deployment-master-identity');
 if(data.manifest?.sha256!=='df7cd874300349ad5054c0f7f2ef5f63e1fb5adb302117796b8eb2ffbea5cd40'||data.manifest?.selfExcludingSha256!=='de3b716b924a51cf9873a757bf0e03385f62b3fed9334728cc51d6c9b4e33916')errors.push('manifest-identity');
 if(data.baseline?.baselineId!=='DRB-2026-08-02-DUR001-DUR086-V13'||data.baseline?.semanticCapsuleSha256!=='fb405d2b8e4301d8a2f02c33951dc28ebe7e492a181f679d6e088ebf31f6196b'||(data.baseline?.orderedActiveRuleIds||[]).length!==86)errors.push('baseline');
 if(data.currentLearningArtifact?.sha256!=='5ed64a1c13de1a536303b07a2277e234a822b9bc316b7ea97cf2547e90811898')errors.push('learning-artifact');
 const inv=data.invariants||{};for(const k of ['masterPackNoChurn','productReleaseDoesNotCreateNewMasterPass','exactFinalContinuationRequired','staleContinuationInvalidated','sameChatExactArtifactReuse','deploymentNotProven','d4d5NotProven','liveOperationNotProven','deploymentFile4Active','protectedOwnerActionsOnly','rawSecretsProhibited'])if(inv[k]!==true)errors.push(`invariant:${k}`);
 return{ok:errors.length===0,errors,releaseVersion:data.releaseVersion,packId:data.packId,ruleCount:(data.baseline?.orderedActiveRuleIds||[]).length,packState:data.packState,deploymentFile4Active:data.deploymentInstructionState==='ACTIVE — INCLUDED — EXACTLY BOUND',canonicalCommitProven:false,launchState:'NO_GO'};}
function ownerView(){return{record:clone(data),validation:validate()};}
module.exports={validate,ownerView};
