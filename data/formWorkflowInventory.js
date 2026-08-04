const { FORM_PATHS, FORM_PATH_READINESS } = require('./formPaths');
const { REVIEW_READY_DRAFT_PATHS, REVIEW_READY_DRAFT_LEVELS } = require('./reviewReadyDrafts');
const { listCatalog } = require('./officialSourceCatalog');

const INVENTORY_VERSION='1.0.0';

function sourceRows(){
  return listCatalog().flatMap(source=>(source.forms||[]).map(form=>({
    practiceSlug:source.practiceSlug,
    sourceName:source.sourceName,
    jurisdiction:source.jurisdiction,
    officialUrl:source.officialUrl,
    catalogStatus:source.catalogStatus,
    sourceReadinessLevel:source.readinessLevel,
    sourceReadinessLabel:source.readinessLabel,
    formName:form.name,
    formNumber:form.number,
    automationBoundary:form.automation,
    formReadinessLevel:form.readinessLevel,
    formReadinessLabel:form.readinessLabel,
    sourceVerificationNote:source.sourceVerificationNote
  })));
}
function buildFormWorkflowInventory(){
  const sources=sourceRows();
  const paths=FORM_PATHS.map(path=>({
    workflowId:path.id,
    practiceSlug:path.practiceSlug,
    title:path.title,
    readinessLevel:path.readinessLevel,
    readinessLabel:FORM_PATH_READINESS.find(x=>x.level===path.readinessLevel)?.label || 'Unknown',
    jurisdiction:path.jurisdiction,
    officialSourceName:path.officialSourceName,
    officialForms:path.officialForms || [],
    conditionalLogicStatus:(path.requiredFields||[]).length?'required fields recorded; full field-level conditional map remains path-specific':'not recorded',
    validationStatus:'starter-field and missing-information checks only unless a higher verified level is recorded',
    signatureStatus:'signature requirements must be verified from the current official source before delivery',
    feeStatus:'current official fees must be reverified before filing-ready use',
    evidenceStatus:(path.reviewerChecklist||[]).length?'review checklist recorded':'review checklist missing',
    printFidelityStatus:'not filing-ready unless separately visual-QA approved',
    reviewGate:'Human Review Specialist and/or qualified professional review as stated by the path',
    filingReadiness:path.readinessLevel>=3?'review candidate only; filing remains separately gated':'not filing ready',
    languageStatus:'English foundation; translated output requires separate human review',
    accessibilityStatus:'web workflow foundation; final generated document requires accessible-output QA',
    ownerApprovalStatus:'not approved for automatic filing',
    lastVerificationStatus:'official source must be checked again before delivery',
    releaseStatus:'available as an organizer or worksheet only within recorded boundaries',
    deliveryType:path.deliveryType
  }));
  const drafts=REVIEW_READY_DRAFT_PATHS.map(path=>({
    draftId:path.id,
    title:path.title,
    practiceSlug:path.practiceSlug,
    relatedFormPathIds:path.relatedFormPathIds || [],
    officialSourceName:path.officialSourceName,
    officialFormNumbers:path.officialFormNumbers || [],
    officialUrl:path.officialUrl || '',
    sourceCheckedDate:path.sourceCheckedDate || '',
    reviewerRequired:Boolean(path.reviewerRequired),
    automationBoundary:path.automationBoundary,
    safePathReason:path.safePathReason,
    requiredDocuments:path.requiredDocuments || [],
    fieldCount:(path.fields||[]).length,
    ownerApprovalStatus:'review required; no automatic filing approval',
    deliveryStatus:'prepared-for-review foundation only'
  }));
  return {
    version:INVENTORY_VERSION,
    generatedForRelease:'1.7.9',
    readinessLevels:FORM_PATH_READINESS,
    draftReadinessLevels:REVIEW_READY_DRAFT_LEVELS,
    summary:{
      officialSourceForms:sources.length,
      guidedFormPaths:paths.length,
      reviewReadyDraftFoundations:drafts.length,
      automaticFilingPaths:0,
      ownerApprovedAutomaticFilingPaths:0
    },
    officialSources:sources,
    guidedPaths:paths,
    reviewReadyDrafts:drafts,
    globalBoundary:'No workflow in v1.7.9 is approved for automatic filing. Official source, edition, fees, signatures, evidence, print fidelity, language, accessibility, review, and owner approval must be verified for the exact path before filing-ready use.'
  };
}
module.exports={INVENTORY_VERSION,buildFormWorkflowInventory};
