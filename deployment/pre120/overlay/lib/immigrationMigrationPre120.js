'use strict';

const fs = require('fs');
const path = require('path');
const formCatalog = require('../vendor/pre109/immigration-oasis/data/formCatalog');
const questionEngine = require('../vendor/pre109/immigration-oasis/data/questionEngine');
const universalRouter = require('../vendor/pre109/immigration-oasis/data/universalRouter');
const formCompletion = require('../vendor/pre109/immigration-oasis/data/formCompletion');
const officialLibrary = require('../data/pre109-immigration-form-library.json');

const ROOT = path.resolve(__dirname, '..');
const RELEASE = 'v2.0.0-pre120';
const SOURCE_CHECKED_AT = '2026-08-25T00:00:00Z';
const CONTROLLED_FORMS = new Set(['G-1145', 'I-90']);
const IMMIGRATION_VENDOR_ROOT = path.join(ROOT, 'vendor', 'pre109', 'immigration-oasis');

function clean(value, max = 2500) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, max);
}

function bool(value) {
  if (value === true || value === false) return value;
  const normalized = clean(value, 10).toLowerCase();
  if (['yes', 'true', '1'].includes(normalized)) return true;
  if (['no', 'false', '0'].includes(normalized)) return false;
  return value;
}

function sanitizeAnswers(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output = {};
  for (const [rawKey, rawValue] of Object.entries(input).slice(0, 160)) {
    const key = clean(rawKey, 80).replace(/[^A-Za-z0-9_.-]/g, '');
    if (!key) continue;
    if (Array.isArray(rawValue)) output[key] = rawValue.slice(0, 30).map(value => clean(value, 800));
    else if (rawValue && typeof rawValue === 'object') continue;
    else output[key] = bool(typeof rawValue === 'string' ? clean(rawValue, 4000) : rawValue);
  }
  return output;
}

function countFiles(relativePath) {
  const start = path.join(IMMIGRATION_VENDOR_ROOT, relativePath);
  if (!fs.existsSync(start)) return 0;
  const pending = [start];
  let count = 0;
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(full);
      else if (entry.isFile()) count += 1;
    }
  }
  return count;
}

function sourceStatus() {
  return {
    release: RELEASE,
    productAuthority: 'SMARTER_JUSTICE_ONLY',
    legacyProductRuntimeImported: false,
    navigatorOrCommunityAuthorityImported: false,
    migrationState: 'QUALIFIED_SMARTER_JUSTICE_MODULE',
    sourceCheckedAt: SOURCE_CHECKED_AT,
    officialSources: {
      i90: {
        authority: 'USCIS',
        url: 'https://www.uscis.gov/i-90',
        edition: '01/20/25',
        checked: true
      },
      g1145: {
        authority: 'USCIS',
        url: 'https://www.uscis.gov/g-1145',
        edition: '09/26/14',
        previousEditionsAcceptedBySourcePage: true,
        checked: true
      }
    },
    preservedDonorEvidence: {
      lineage: 'Immigration Oasis v1.10.162 full base plus later qualified lean evidence preserved inside Smarter Justice PRE109',
      vendorFiles: 1361,
      sourceArtifactFileCount: 1361,
      deployedRuntimeVendorFiles: countFiles('.'),
      deployedRuntimePolicy: 'MINIMUM_REQUIRED_RUNTIME_CODE_AND_CONTROLLED_PDFS; FULL DONOR EVIDENCE REMAINS IN THE SEALED PRODUCT ARTIFACT',
      officialFormPdfs: officialLibrary.counts.forms,
      instructionPdfs: officialLibrary.counts.instructions,
      catalogEntries: formCatalog.catalog.length,
      routingQuestions: Object.keys(questionEngine.questionBank).length,
      completionQuestions: Object.keys(formCompletion.completionQuestionBank).length,
      formWorkflows: Object.keys(formCompletion.FORM_SCHEMAS).length,
      v110292SourceAvailable: false,
      v110292HashOnlyNotPromoted: 'bc5f56d3172652a5c8b15baa6d348300af9e31fd7a8722ab76b75b5f36827122'
    },
    deliveryControls: {
      persistence: 'EPHEMERAL_REQUEST_PROCESSING',
      automaticSigning: false,
      automaticFiling: false,
      automaticSubmission: false,
      humanReviewBeforeDelivery: true,
      currentAgencyInstructionsRequiredBeforeFiling: true,
      highRiskMattersRequireAttorneyReview: true
    }
  };
}

function publicForm(item) {
  const form = clean(item.form, 40);
  const workflow = formCompletion.getFormWorkflowProfile(form);
  return {
    agency: clean(item.agency, 80),
    form,
    name: clean(item.name, 220),
    category: clean(item.category, 80),
    risk: clean(item.risk, 80),
    officialSource: clean(item.source, 500),
    onlineFilingMayExist: Boolean(item.online),
    workflowAvailable: Boolean(workflow && workflow.workflowSchema),
    workflowFieldCount: Number(workflow && workflow.fieldCount || 0),
    controlledReviewCopyAvailable: CONTROLLED_FORMS.has(form) && Boolean(workflow && workflow.officialPdfReady),
    readiness: CONTROLLED_FORMS.has(form) && workflow && workflow.officialPdfReady
      ? 'CONTROLLED_OFFICIAL_PDF_REVIEW_COPY'
      : 'GUIDED_PREPARATION_OR_REVIEW_WORKFLOW',
    related: Array.isArray(item.related) ? item.related.slice(0, 20).map(value => clean(value, 40)) : []
  };
}

function catalog(query = '', limit = 30) {
  const q = clean(query, 120);
  const max = Math.max(1, Math.min(100, Number(limit) || 30));
  const rows = (q ? formCatalog.searchCatalog(q) : formCatalog.getCatalog()).slice(0, max).map(publicForm);
  return {
    release: RELEASE,
    query: q,
    count: rows.length,
    totalCatalogEntries: formCatalog.catalog.length,
    forms: rows,
    notice: 'Catalog matches are starting information, not a filing or eligibility decision. Check the current agency page before filing.'
  };
}

function customerHandling(route) {
  if (route.attorneyReviewRequired) return 'ATTORNEY_REVIEW_REQUIRED';
  if (route.attorneyReviewRecommended) return 'ATTORNEY_REVIEW_RECOMMENDED';
  if (route.handlingMode === universalRouter.SERVICE_MODES.governmentPortalWorksheet) return 'OFFICIAL_PORTAL_WORKSHEET_WITH_REVIEW';
  if (route.handlingMode === universalRouter.SERVICE_MODES.notSupportedYet) return 'HUMAN_REVIEW_REQUIRED';
  return 'GUIDED_PREPARATION_WITH_HUMAN_REVIEW';
}

function route(input = {}) {
  const answers = sanitizeAnswers(input.answers || input);
  const question = clean(input.question || input.story || answers.story, 2500);
  if (question.length < 8 && !clean(answers.goal, 80)) {
    throw new Error('Describe the immigration issue or choose a goal so Smarter Justice can identify a starting point.');
  }
  const raw = universalRouter.routeIssue({ answers, question });
  const forms = (raw.formDetails || []).map(publicForm);
  return {
    release: RELEASE,
    primaryIssue: clean(raw.primaryIssueLabel, 220),
    primaryIssueKey: clean(raw.primaryIssueFamily, 80),
    matchedIssueKeys: (raw.matchedIssueFamilies || []).slice(0, 12).map(value => clean(value, 80)),
    possibleForms: forms,
    handling: customerHandling(raw),
    attorneyReviewRecommended: Boolean(raw.attorneyReviewRecommended),
    attorneyReviewRequired: Boolean(raw.attorneyReviewRequired),
    riskSignals: (raw.riskTriggers || []).slice(0, 20).map(value => clean(value, 80)),
    nextStep: raw.attorneyReviewRequired
      ? 'Preserve every notice and deadline and arrange immigration-attorney review before relying on a form or filing instruction.'
      : 'Continue the private guided questions, then review current agency instructions, eligibility, fees, addresses, signatures, and every generated page before filing.',
    privacy: 'This route is processed for this response and is not saved by the PRE120 immigration route.',
    automaticSigning: false,
    automaticFiling: false,
    automaticSubmission: false
  };
}

function intakePreview(input = {}) {
  const answers = sanitizeAnswers(input.answers || input);
  const preview = questionEngine.preview(answers);
  const language = answers.language === 'es' ? 'es' : 'en';
  return {
    release: RELEASE,
    language,
    readyForReviewPlan: Boolean(preview.ready),
    progress: preview.progress,
    nextQuestions: (preview.nextQuestions || []).slice(0, 6).map(question => ({
      id: clean(question.id, 80),
      type: clean(question.type, 40),
      required: Boolean(question.required),
      label: clean(question.label, 500),
      placeholder: clean(question.placeholder, 300),
      choices: (question.choices || []).slice(0, 30).map(choice => ({ value:clean(choice.value, 100), label:clean(choice.label, 250) }))
    })),
    privacy: language === 'es'
      ? 'Las respuestas se procesan para esta solicitud y no se guardan en esta ruta PRE120.'
      : 'Answers are processed for this request and are not saved by this PRE120 route.',
    deliveryGate: 'HUMAN_REVIEW_BEFORE_DELIVERY',
    automaticSubmission: false
  };
}

function workflow(formNumber = '') {
  const form = clean(formNumber, 40).toUpperCase();
  if (!form) throw new Error('Choose an immigration form.');
  const profile = formCompletion.getFormWorkflowProfile(form);
  if (!profile || !profile.form) throw new Error('That form does not have a preserved PRE120 workflow.');
  return {
    release: RELEASE,
    form: clean(profile.form, 40),
    agency: clean(profile.agency, 80),
    name: clean(profile.name, 220),
    category: clean(profile.category, 80),
    risk: clean(profile.risk, 80),
    workflowAvailable: Boolean(profile.workflowSchema),
    fallbackWorkflow: Boolean(profile.fallbackSchema),
    fieldCount: Number(profile.fieldCount || 0),
    fields: (profile.fieldDefinitions || []).slice(0, 180).map(field => ({
      id: clean(field.id, 100),
      section: clean(field.section, 100),
      type: clean(field.type, 50),
      label: clean(field.label, 500),
      required: Boolean(field.requiredByQuestion),
      exactValueRequired: Boolean(field.exactData),
      officialPdfMapped: Boolean(field.officialPdfMapped)
    })),
    controlledReviewCopyAvailable: CONTROLLED_FORMS.has(form) && Boolean(profile.officialPdfReady),
    publicPdfLimited: Boolean(profile.officialPdfPubliclyLimited),
    deliveryGate: 'HUMAN_REVIEW_BEFORE_DELIVERY',
    automaticSigning: false,
    automaticFiling: false,
    automaticSubmission: false
  };
}

module.exports = {
  RELEASE,
  SOURCE_CHECKED_AT,
  sourceStatus,
  catalog,
  route,
  intakePreview,
  workflow,
  sanitizeAnswers
};
