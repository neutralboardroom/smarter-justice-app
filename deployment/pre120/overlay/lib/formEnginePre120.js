'use strict';

const base = require('./formEnginePre117');

const SOURCE_CHECKED_AT = '2026-08-25T00:00:00Z';

function summary() {
  const prior = base.summary();
  return {
    ...prior,
    version: 'PRE120',
    currentSourceChecks: {
      ...prior.currentSourceChecks,
      checkedAt: SOURCE_CHECKED_AT,
      fresh: true,
      i90: {
        ...prior.currentSourceChecks.i90,
        edition: '01/20/25',
        source: 'USCIS Form I-90 page rechecked 2026-08-25'
      },
      g1145: {
        edition: '09/26/14',
        source: 'USCIS Form G-1145 page rechecked 2026-08-25',
        previousEditionsAcceptedBySourcePage: true
      },
      form4506T: {
        ...prior.currentSourceChecks.form4506T,
        revision: 'April 2025',
        source: 'IRS current revision page and official PDF rechecked 2026-08-25'
      }
    },
    migration: {
      productAuthority: 'SMARTER_JUSTICE_ONLY',
      preservedImmigrationCatalogEntries: 112,
      preservedRoutingQuestions: 124,
      preservedCompletionQuestions: 255,
      preservedFormWorkflows: 113,
      automaticSigning: false,
      automaticFiling: false,
      automaticSubmission: false
    },
    note: 'PRE120 keeps all twelve PRE117 controlled official-PDF review-copy lanes and completes the Smarter Justice immigration-module migration. The wider preserved immigration catalog and workflows are guidance or review lanes until individually requalified for official-PDF generation.'
  };
}

function makePlan(form, answers = {}) {
  const plan = base.makePlan(form, answers);
  plan.review = {
    ...plan.review,
    sourceCheckedAt: SOURCE_CHECKED_AT,
    pre120MigrationRecheck: true,
    productAuthority: 'SMARTER_JUSTICE_ONLY',
    automaticSigning: false,
    automaticFiling: false,
    automaticSubmission: false
  };
  return plan;
}

function recommendImmigration(answers = {}) {
  const prior = base.recommendImmigration(answers);
  return {
    ...prior,
    release: 'PRE120',
    note: `${prior.note || ''} PRE120 adds preserved catalog and questionnaire coverage without converting unqualified workflows into filing-ready forms.`.trim()
  };
}

function recommendTax(answers = {}) {
  const prior = base.recommendTax(answers);
  return { ...prior, release: 'PRE120' };
}

module.exports = {
  ...base,
  SOURCE_CHECKED_AT,
  summary,
  makePlan,
  recommendImmigration,
  recommendTax
};
