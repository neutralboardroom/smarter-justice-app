const fs=require('fs');
const path=require('path');

const ROOT=path.join(__dirname,'..');
function readJson(name){
  const full=path.join(ROOT,name);
  return JSON.parse(fs.readFileSync(full,'utf8'));
}
function getReleaseGovernance(){
  const improvementList=readJson('NEXT_VERSION_IMPROVEMENT_LIST.json');
  const releaseEvidence=readJson('RELEASE_EVIDENCE_V1.7.16.json');
  const readinessDimensions=readJson('READINESS_DIMENSIONS_V1.7.16.json');
  const portalCapabilityMatrix=readJson('PORTAL_CAPABILITY_DEVIATION_MATRIX.json');
  const formWorkflowInventory=readJson('FORM_DOCUMENT_WORKFLOW_INVENTORY.json');
  const items=improvementList.items||[];
  return {
    version:'1.0.0',
    releaseVersion:'1.7.16',
    improvementList,
    releaseEvidence,
    readinessDimensions,
    portalCapabilityMatrix,
    formWorkflowInventory,
    summary:{
      improvementItems:items.length,
      completedItems:items.filter(x=>/^completed in v1\.7\.\d+$/.test(String(x.releaseDisposition))).length,
      partiallyCompletedItems:items.filter(x=>String(x.releaseDisposition).startsWith('partially completed')).length,
      p0Open:items.filter(x=>x.priority==='P0' && !/^completed in v1\.7\.\d+$/.test(String(x.releaseDisposition))).length,
      readinessDimensions:(readinessDimensions.dimensions||[]).length,
      portalsTracked:portalCapabilityMatrix.summary?.portalsTracked||0,
      formPaths:formWorkflowInventory.summary?.guidedFormPaths||0,
      automaticFilingPaths:formWorkflowInventory.summary?.automaticFilingPaths||0
    }
  };
}
module.exports={getReleaseGovernance};
