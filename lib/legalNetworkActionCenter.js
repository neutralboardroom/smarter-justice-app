'use strict';

const crypto = require('crypto');
const store = require('./store');
const portfolioTruth = require('./portfolioTruth');
const ruleManifest = require('../LEGAL_NETWORK_ACTION_CENTER_V1.7.50.json');
const { fourPortalIds, listFourPortalLaunch } = require('../data/fourPortalLaunchV1751');

const STORE_KEY = 'legalNetworkActionCenter.json';
const ACTION_CENTER_VERSION = '1.0.0';
const ALLOWED_DISPOSITIONS = new Set(['ACTIVE', 'ACCEPTED', 'DEFERRED', 'DISMISSED', 'COMPLETED']);
const ALLOWED_TIERS = new Set(['NOW', 'NEXT', 'WATCH', 'PRESERVE']);
const TIER_ORDER = { NOW: 0, NEXT: 1, WATCH: 2, PRESERVE: 3 };
const FOUR_PORTAL_IDS = new Set(fourPortalIds());
const FOUR_PORTAL_ORDER = Object.fromEntries(listFourPortalLaunch().map(item=>[item.portalId,item.order]));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clean(value, max = 1200) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function fingerprint(parts) {
  return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 20);
}

function actionId(ruleId, portalId) {
  return `action:${ruleId}:${portalId || 'legal-network'}`;
}

function makeAction(ruleId, portal, overrides = {}) {
  const rule = (ruleManifest.rules || []).find((row) => row.ruleId === ruleId);
  if (!rule) throw new Error(`Unknown action-center rule: ${ruleId}`);
  const evidenceState = portal?.evidenceState || 'OWNER_RECORDED';
  const nextAction = overrides.nextAction || portal?.nextAction || 'Review the current legal-network evidence.';
  const base = {
    actionId: actionId(ruleId, portal?.portalId),
    ruleId,
    ruleVersion: rule.version,
    tier: overrides.tier || rule.tier,
    priority: Number(overrides.priority ?? rule.priority),
    portalId: portal?.portalId || null,
    portalName: portal?.name || 'Smarter Justice legal network',
    title: overrides.title || rule.title,
    reason: overrides.reason || 'Review current legal-network evidence.',
    nextAction,
    evidenceState,
    health: portal?.health || 'UNKNOWN',
    deployment: portal?.deployment || 'UNKNOWN',
    reviewedAt: portal?.reviewedAt || null,
    decisionOwner: 'Roger',
    automaticAction: false,
    containsUserMatterData: false
  };
  base.fingerprint = fingerprint([
    base.ruleId,
    base.ruleVersion,
    base.portalId,
    base.evidenceState,
    base.health,
    base.deployment,
    base.reviewedAt,
    base.nextAction
  ]);
  return base;
}

function generateActions() {
  const truth = portfolioTruth.ownerView();
  const actions = [];
  for (const portal of truth.portals || []) {
    if (portal.health === 'BLOCKED') {
      actions.push(makeAction('SJ-ACT-001', portal, {
        reason: 'A current blocker prevents a required legal-network step.'
      }));
      continue;
    }
    if (portal.evidenceState === 'CONFLICT') {
      actions.push(makeAction('SJ-ACT-002', portal, {
        reason: 'Material current records disagree and cannot safely control implementation or deployment.'
      }));
      continue;
    }
    if (portal.evidenceState === 'MISSING') {
      actions.push(makeAction('SJ-ACT-003', portal, {
        reason: 'The dedicated legal-portal implementation artifact is missing.'
      }));
      continue;
    }
    if (FOUR_PORTAL_IDS.has(portal.portalId)) {
      const pilotOrder = FOUR_PORTAL_ORDER[portal.portalId];
      actions.push(makeAction('SJ-ACT-004', portal, {
        title: `Prepare pilot ${pilotOrder}: ${portal.name}`,
        reason: 'Roger selected this portal for the initial controlled four-portal read-only launch sequence; dedicated exact-artifact verification and staging acceptance remain pending.',
        nextAction: portal.nextAction
      }));
      continue;
    }
    if (portal.portalId === 'immigration-oasis') {
      actions.push(makeAction('SJ-ACT-004', portal, {
        reason: 'Immigration Oasis remains a later priority after the four initial launch portals; no deployment or live integration is authorized from this artifact.'
      }));
      continue;
    }
    if (portal.evidenceState === 'OWNER_RECORDED') {
      actions.push(makeAction('SJ-ACT-005', portal, {
        reason: 'A current exact identity is owner-recorded, but this umbrella build has not independently verified the dedicated artifact or deployment state.'
      }));
      continue;
    }
    if (portal.evidenceState === 'OBSERVED_UNVERIFIED') {
      actions.push(makeAction('SJ-ACT-005', portal, {
        title: 'Complete exact-artifact verification',
        reason: 'The current Smarter Justice candidate is implemented but has not completed the final exact-artifact cycle.'
      }));
      continue;
    }
    if (['M3_EXACT_TESTED_DEVELOPMENT', 'M4_DEPLOYMENT_CANDIDATE'].includes(portal.maturity) && ['NOT_CONFIRMED', 'NOT_DEPLOYED', 'LAST_VERIFIED_PRODUCTION_V1.6.1'].includes(portal.deployment)) {
      actions.push(makeAction('SJ-ACT-006', portal, {
        reason: 'The portal has an independently verified development artifact but no current verified deployment outcome.'
      }));
    }
    if (portal.freshness?.state === 'STALE') {
      actions.push(makeAction('SJ-ACT-007', portal, {
        reason: `The portal record is ${portal.freshness.ageDays} days old and exceeds the current-facing freshness threshold.`
      }));
    }
  }

  actions.push(makeAction('SJ-ACT-008', null, {
    reason: 'Payments, booking, reviews, sensitive uploads, filing, unrestricted routing, automatic writes, and the dormant optional Neutral Boardroom export remain owner-gated.',
    nextAction: 'Keep every high-risk gate closed until a specific lane receives separate owner approval and complete operational evidence.'
  }));

  const unique = new Map();
  for (const action of actions) {
    const current = unique.get(action.actionId);
    if (!current || action.priority > current.priority) unique.set(action.actionId, action);
  }
  return [...unique.values()].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || b.priority - a.priority || String(a.portalName).localeCompare(String(b.portalName)));
}

function seedState() {
  return { schemaVersion: ACTION_CENTER_VERSION, dispositions: {}, updatedAt: '' };
}

function readState() {
  const raw = store.readJson(STORE_KEY, seedState());
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? { ...seedState(), ...raw, dispositions: raw.dispositions && typeof raw.dispositions === 'object' ? raw.dispositions : {} }
    : seedState();
}

function applyDispositions(actions, state) {
  return actions.map((action) => {
    const disposition = state.dispositions[action.actionId] || null;
    const fingerprintChanged = Boolean(disposition && disposition.fingerprint && disposition.fingerprint !== action.fingerprint);
    const effectiveStatus = fingerprintChanged ? 'ACTIVE' : (disposition?.status || 'ACTIVE');
    return {
      ...action,
      disposition: {
        status: effectiveStatus,
        recordedStatus: disposition?.status || 'ACTIVE',
        note: disposition?.note || '',
        reviewAt: disposition?.reviewAt || null,
        updatedAt: disposition?.updatedAt || null,
        fingerprintChanged,
        resurfaced: fingerprintChanged && ['DISMISSED', 'COMPLETED', 'DEFERRED'].includes(disposition?.status)
      }
    };
  });
}

function ownerView() {
  const state = readState();
  const actions = applyDispositions(generateActions(), state);
  const visible = actions.filter((action) => !['DISMISSED', 'COMPLETED'].includes(action.disposition.status));
  const lanes = Object.fromEntries([...ALLOWED_TIERS].map((tier) => [tier, visible.filter((action) => action.tier === tier)]));
  const primaryAction = visible.find((action) => action.tier === 'NOW') || visible.find((action) => action.tier === 'NEXT') || visible[0] || null;
  return {
    schemaVersion: ACTION_CENTER_VERSION,
    releaseVersion:'1.7.75',
    generatedAt: store.now(),
    purpose: ruleManifest.purpose,
    boundaries: clone(ruleManifest.boundaries),
    summary: {
      generated: actions.length,
      visible: visible.length,
      now: lanes.NOW.length,
      next: lanes.NEXT.length,
      watch: lanes.WATCH.length,
      preserve: lanes.PRESERVE.length,
      accepted: actions.filter((action) => action.disposition.status === 'ACCEPTED').length,
      deferred: actions.filter((action) => action.disposition.status === 'DEFERRED').length,
      resurfaced: actions.filter((action) => action.disposition.resurfaced).length
    },
    primaryAction,
    lanes,
    actions,
    rules: clone(ruleManifest.rules),
    dispositionStates: [...ALLOWED_DISPOSITIONS],
    updatedAt: state.updatedAt
  };
}

async function updateDisposition(id, input = {}) {
  const current = generateActions().find((action) => action.actionId === id);
  if (!current) return { error: 'That legal-network action is no longer current.' };
  const status = clean(input.status, 40).toUpperCase();
  if (!ALLOWED_DISPOSITIONS.has(status)) return { error: 'Choose a valid action disposition.' };
  const reviewAt = clean(input.reviewAt, 40);
  if (reviewAt && !/^\d{4}-\d{2}-\d{2}$/.test(reviewAt)) return { error: 'Review date must use YYYY-MM-DD.' };
  const note = clean(input.note, 1200);
  const tx = await store.mutateJson(STORE_KEY, seedState(), async (raw) => {
    const state = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...seedState(), ...raw } : seedState();
    state.dispositions = state.dispositions && typeof state.dispositions === 'object' ? state.dispositions : {};
    state.dispositions[id] = {
      actionId: id,
      status,
      note,
      reviewAt: reviewAt || null,
      fingerprint: current.fingerprint,
      updatedAt: store.now(),
      updatedBy: 'owner'
    };
    state.updatedAt = state.dispositions[id].updatedAt;
    return { value: state, result: { disposition: state.dispositions[id] } };
  }, {
    event: (result) => ({
      eventType: 'legal_network_action_disposition',
      payload: { actionId: id, status: result?.disposition?.status, reviewAt: result?.disposition?.reviewAt }
    })
  });
  return tx.result;
}

function exportBundle() {
  const view = ownerView();
  return {
    schemaVersion: view.schemaVersion,
    releaseVersion: view.releaseVersion,
    generatedAt: view.generatedAt,
    purpose: view.purpose,
    summary: view.summary,
    primaryAction: view.primaryAction,
    actions: view.actions,
    rules: view.rules,
    boundaries: view.boundaries,
    automaticActions: false,
    livePortalWrites: false,
    containsUserMatterData: false,
    containsConfidentialData: false
  };
}

function markdown() {
  const bundle = exportBundle();
  const sections = ['NOW', 'NEXT', 'WATCH', 'PRESERVE'].map((tier) => {
    const rows = bundle.actions.filter((action) => action.tier === tier && !['DISMISSED', 'COMPLETED'].includes(action.disposition.status));
    return `## ${tier}\n\n${rows.map((action) => `- **${action.title} — ${action.portalName}**\n  - Why: ${action.reason}\n  - Next: ${action.nextAction}\n  - Evidence: ${action.evidenceState}; owner disposition ${action.disposition.status}`).join('\n') || '- No current actions.'}`;
  });
  return `# Smarter Justice Legal-Network Action Center\n\nGenerated ${bundle.generatedAt}. Deterministic owner execution guidance only; no automatic portal action or deployment.\n\n${sections.join('\n\n')}\n`;
}

module.exports = {
  ACTION_CENTER_VERSION,
  ALLOWED_DISPOSITIONS,
  generateActions,
  ownerView,
  updateDisposition,
  exportBundle,
  markdown
};
