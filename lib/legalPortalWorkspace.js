'use strict';

const store = require('./store');
const portfolioTruth = require('./portfolioTruth');
const legalPortfolioOperatingSystem = require('./legalPortfolioOperatingSystem');
const { fourPortalIds } = require('../data/fourPortalLaunchV1751');

const STORE_KEY = 'legalPortalWorkspace.json';
const LEGAL_PORTAL_WORKSPACE_VERSION = '2.4.0';
const ALLOWED_STATUSES = ['planned', 'active development', 'testing', 'exact artifact tested', 'deployment candidate', 'deployed', 'paused', 'released', 'archived'];
const ALLOWED_PRIORITIES = ['critical', 'high', 'medium', 'low', 'backlog'];
const FOUR_PORTAL_IDS = new Set(fourPortalIds());
const OUT_OF_SCOPE_IDS = new Set(['smarter-money', 'smarter-health', 'smarter-property', 'neutral-boardroom-portfolio-os']);

function clean(value, max = 1800) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function statusFromTruth(row) {
  if (row.portalId === 'general-smarter-justice-start') return row.evidenceState === 'EXACT_VERIFIED' ? 'exact artifact tested' : 'testing';
  if (row.deployment === 'PAUSED') return 'paused';
  if (row.deployment && !['NOT_CONFIRMED', 'NOT_DEPLOYED'].includes(row.deployment)) return 'deployment candidate';
  if (row.evidenceState === 'EXACT_VERIFIED') return 'exact artifact tested';
  if (['OWNER_RECORDED','OWNER_RECORDED_VERSION_ONLY'].includes(row.evidenceState)) return 'testing';
  if (row.evidenceState === 'MISSING') return 'planned';
  return 'active development';
}

function priorityFromTruth(row, index) {
  if (row.portalId === 'general-smarter-justice-start') return 'critical';
  if (row.health === 'BLOCKED' || row.evidenceState === 'CONFLICT') return 'critical';
  if (FOUR_PORTAL_IDS.has(row.portalId)) return 'critical';
  if (row.portalId === 'immigration-oasis') return 'high';
  if (index < 7) return 'high';
  return 'medium';
}

function portalSeeds() {
  return portfolioTruth.enrichedPortals()
    .filter((row) => !OUT_OF_SCOPE_IDS.has(row.portalId))
    .map((row, index) => ({
      id: row.portalId,
      name: row.name,
      status: statusFromTruth(row),
      priority: priorityFromTruth(row, index),
      staffLead: row.portalId === 'general-smarter-justice-start' ? 'Owner' : 'Unassigned',
      latestVersion: row.version || '',
      artifactName: row.artifact || '',
      sha256: row.sha256 == null ? null : row.sha256,
      sizeBytes: row.sizeBytes == null ? null : Number(row.sizeBytes),
      authority: row.sourceOfTruth || 'Dedicated legal-portal artifact remains authoritative.',
      evidenceState: row.evidenceState,
      maturity: row.maturity,
      health: row.health,
      reviewedAt: row.reviewedAt || '',
      freshnessState: row.freshness?.state || 'UNKNOWN',
      identityCompleteness: row.identityCompleteness?.state || 'INCOMPLETE',
      publicIdentity: row.specialty || 'Focused legal portal',
      nextAction: row.nextAction || 'Review the dedicated legal-portal artifact.',
      repositoryTarget: '',
      productionStatus: row.deployment || 'NOT_CONFIRMED',
      operationalNotes: '',
      updatedAt: '',
      updatedBy: ''
    }));
}

const ROLE_MATRIX = legalPortfolioOperatingSystem.ROLE_MATRIX.map((row) => ({
  role: row.role,
  may: [...row.may],
  mayNot: [...row.mayNot]
}));

const ACTIVATION_GATES = legalPortfolioOperatingSystem.ownerView().gates.map((row) => ({
  id: row.id,
  label: row.label,
  open: row.state === 'OPEN',
  state: row.state,
  ownerOnly: true,
  approval: row.approval
}));

const PROHIBITED_DATA = [
  'Legal intake facts, privileged communications, or case files',
  'Medical records or health histories',
  'Financial and tax account numbers, credentials, statements, or transaction histories',
  'Passwords, API keys, payment secrets, government identifiers, or recovery material',
  'Automatic copies of public-user records between legal portals',
  'Confidential data or portal credentials in the Neutral Boardroom handoff'
];

const OWNER_DECISIONS = legalPortfolioOperatingSystem.ownerView().decisions.map((row) => ({
  id: row.id,
  date: row.date,
  decision: row.decision,
  scope: row.scope,
  rationale: row.rationale,
  status: row.status,
  supersedes: row.supersedes || [],
  ownerApproved: row.ownerIdentity === 'Roger',
  implementationComplete: Boolean(row.implementationComplete)
}));

function seedState() {
  return {
    schemaVersion: LEGAL_PORTAL_WORKSPACE_VERSION,
    scope: 'Smarter Justice and its separate legal micro- and mid-sized portals only',
    sourceRelease: 'Smarter Justice v1.7.53',
    sourceRegistry: 'PORTFOLIO_TRUTH_V1.7.75.json',
    portfolioRelationship: 'Roger is the final owner authority. Smarter Justice is the active self-contained legal-portfolio operating and governance system. Neutral Boardroom is dormant optional export-only and noncritical.',
    portals: portalSeeds(),
    roles: clone(ROLE_MATRIX),
    activationGates: clone(ACTIVATION_GATES),
    prohibitedData: clone(PROHIBITED_DATA),
    decisions: clone(OWNER_DECISIONS),
    updatedAt: ''
  };
}

function normalize(raw) {
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : seedState();
  const saved = Array.isArray(base.portals) ? base.portals : [];
  const byId = new Map(saved.filter((row) => row && !OUT_OF_SCOPE_IDS.has(row.id)).map((row) => [row.id, row]));
  const decisions = new Map(OWNER_DECISIONS.map((row) => [row.id, row]));
  for (const row of Array.isArray(base.decisions) ? base.decisions : []) {
    if (!/cross-sector|smarter (money|health|property) administration|neutral boardroom.*top-level|neutral boardroom.*final owner/i.test(JSON.stringify(row)) && row.id !== 'decision-neutral-boardroom-top-layer') decisions.set(row.id || `legacy-${decisions.size}`, row);
  }
  return {
    ...seedState(),
    ...base,
    schemaVersion: LEGAL_PORTAL_WORKSPACE_VERSION,
    scope: seedState().scope,
    sourceRelease: 'Smarter Justice v1.7.53',
    sourceRegistry: 'PORTFOLIO_TRUTH_V1.7.75.json',
    portfolioRelationship: seedState().portfolioRelationship,
    portals: portalSeeds().map((seed) => ({
      ...seed,
      ...(byId.get(seed.id) || {}),
      id: seed.id,
      name: seed.name,
      artifactName: seed.artifactName,
      sha256: seed.sha256,
      sizeBytes: seed.sizeBytes,
      latestVersion: seed.latestVersion,
      authority: seed.authority,
      evidenceState: seed.evidenceState,
      maturity: seed.maturity,
      health: seed.health,
      reviewedAt: seed.reviewedAt,
      freshnessState: seed.freshnessState,
      identityCompleteness: seed.identityCompleteness,
      productionStatus: seed.productionStatus
    })),
    roles: clone(ROLE_MATRIX),
    activationGates: clone(ACTIVATION_GATES),
    prohibitedData: clone(PROHIBITED_DATA),
    decisions: [...decisions.values()].slice(0, 100)
  };
}

function read() {
  return normalize(store.readJson(STORE_KEY, seedState()));
}

function summary(state) {
  return {
    portalCount: state.portals.length,
    assignedLeads: state.portals.filter((row) => row.staffLead && row.staffLead !== 'Unassigned').length,
    activeBuilds: state.portals.filter((row) => ['active development', 'testing', 'deployment candidate'].includes(row.status)).length,
    exactIdentityRecords: state.portals.filter((row) => /^[a-f0-9]{64}$/.test(row.sha256) && row.sizeBytes > 0).length,
    independentlyExactVerified: state.portals.filter((row) => row.evidenceState === 'EXACT_VERIFIED').length,
    candidatePendingExactAcceptance: state.portals.filter((row) => row.evidenceState === 'CANDIDATE_PENDING_FINAL_EXACT_ACCEPTANCE').length,
    finalPackageAcceptedDetachedIdentity: state.portals.filter((row) => row.evidenceState === 'FINAL_PACKAGE_ACCEPTED_DETACHED_IDENTITY').length,
    ownerRecorded: state.portals.filter((row) => row.evidenceState === 'OWNER_RECORDED').length,
    blocked: state.portals.filter((row) => row.health === 'BLOCKED').length,
    openActivationGates: state.activationGates.filter((row) => row.open).length,
    outOfScopeRecords: 0,
    neutralBoardroomConnection: 'DORMANT_OPTIONAL_EXPORT_ONLY'
  };
}

function ownerView() {
  const state = read();
  return {
    schemaVersion: state.schemaVersion,
    scope: state.scope,
    sourceRelease: state.sourceRelease,
    sourceRegistry: state.sourceRegistry,
    portfolioRelationship: state.portfolioRelationship,
    summary: summary(state),
    portals: state.portals,
    roles: state.roles,
    activationGates: state.activationGates,
    prohibitedData: state.prohibitedData,
    decisions: state.decisions,
    updatedAt: state.updatedAt
  };
}

async function updatePortal(id, input = {}) {
  if (OUT_OF_SCOPE_IDS.has(id)) return { error: 'This platform is outside the Smarter Justice legal-only scope.' };
  if (!portalSeeds().some((row) => row.id === id)) return { error: 'Unknown legal portal.' };
  const tx = await store.mutateJson(STORE_KEY, seedState(), async (raw) => {
    const state = normalize(raw);
    const row = state.portals.find((item) => item.id === id);
    row.status = ALLOWED_STATUSES.includes(input.status) ? input.status : row.status;
    row.priority = ALLOWED_PRIORITIES.includes(input.priority) ? input.priority : row.priority;
    row.staffLead = clean(input.staffLead, 160) || 'Unassigned';
    row.nextAction = clean(input.nextAction, 1000) || row.nextAction;
    row.operationalNotes = clean(input.operationalNotes, 1800);
    row.updatedAt = store.now();
    row.updatedBy = 'owner-or-authorized-legal-network-staff';
    state.updatedAt = row.updatedAt;
    return { value: state, result: { portal: row } };
  }, {
    event: (result) => ({
      eventType: 'legal_portal_workspace_update',
      portalId: id,
      payload: { portalId: id, status: result?.portal?.status, priority: result?.portal?.priority }
    })
  });
  return tx.result;
}

function exportBundle() {
  const state = read();
  return {
    schemaVersion: LEGAL_PORTAL_WORKSPACE_VERSION,
    generatedAt: store.now(),
    generatedBy: 'Smarter Justice v1.7.53 self-contained legal-network workspace',
    purpose: 'Coordinate non-confidential release and operational metadata for Smarter Justice and its separate legal portals only.',
    scope: state.scope,
    sourceRegistry: state.sourceRegistry,
    portfolioRelationship: state.portfolioRelationship,
    portals: state.portals,
    roles: state.roles,
    activationGates: state.activationGates,
    prohibitedData: state.prohibitedData,
    decisions: state.decisions,
    automaticWrites: false,
    importRules: [
      'Treat every dedicated legal-portal artifact as independently authoritative.',
      'Do not infer deployment from artifact existence.',
      'Reject Smarter Money, Smarter Health, Smarter Property, and cross-pillar administration records.',
      'Do not import confidential public-user records.',
      'Keep every activation gate closed until separately approved and evidenced.',
      'Record supersession without deleting historical checksums.',
      'Do not transmit anything to Neutral Boardroom unless a future non-confidential export is separately approved.'
    ]
  };
}

function markdown() {
  const bundle = exportBundle();
  return `# Smarter Justice Legal-Network Control Center — v2.4.0 Export\n\nScope: ${bundle.scope}. Roger is the final owner authority and Smarter Justice is the active self-contained legal-portfolio operating system. Neutral Boardroom is dormant optional export-only and noncritical. This export contains non-confidential legal-network coordination metadata only.\n\n## Legal portals\n\n${bundle.portals.map((row) => `- **${row.name}** — ${row.latestVersion || 'version not verified'}; ${row.artifactName || 'artifact not verified'}; ${row.evidenceState}; ${row.status}; lead ${row.staffLead}.`).join('\n')}\n\n## Closed activation gates\n\n${bundle.activationGates.map((row) => `- ${row.label}: ${row.open ? 'OPEN' : 'closed'}`).join('\n')}\n\n## Data that must not be imported\n\n${bundle.prohibitedData.map((row) => `- ${row}`).join('\n')}\n`;
}

module.exports = {
  LEGAL_PORTAL_WORKSPACE_VERSION,
  ALLOWED_STATUSES,
  ALLOWED_PRIORITIES,
  OUT_OF_SCOPE_IDS,
  portalSeeds,
  ownerView,
  updatePortal,
  exportBundle,
  markdown
};
