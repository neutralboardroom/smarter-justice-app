'use strict';

const base = require('../NEUTRAL_BOARDROOM_HANDOFF_V1.7.50.json');
const portfolioTruth = require('./portfolioTruth');
const legalPortalWorkspace = require('./legalPortalWorkspace');
const legalNetworkActionCenter = require('./legalNetworkActionCenter');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function build() {
  const truth = portfolioTruth.ownerView();
  const workspace = legalPortalWorkspace.ownerView();
  const actionCenter = legalNetworkActionCenter.ownerView();
  return {
    ...clone(base),
    sourceRelease:'1.7.75',
    generatedAt: new Date().toISOString(),
    summary: {
      legalPortalsTracked: truth.summary?.portalCount || workspace.summary?.portalCount || 0,
      exactVerified: truth.summary?.exactVerified || 0,
      productionVerified: truth.summary?.productionVerified || 0,
      ownerRecorded: truth.summary?.ownerRecorded || 0,
      attentionNeeded: truth.summary?.attentionNeeded || 0,
      blocked: truth.summary?.blocked || 0,
      conflicts: truth.summary?.conflicts || 0,
      closedGates: truth.summary?.closedGates || base.closedGates.length,
      workspaceActiveBuilds: workspace.summary?.activeBuilds || 0,
      actionCenterNow: actionCenter.summary?.now || 0,
      actionCenterNext: actionCenter.summary?.next || 0,
      actionCenterDeferred: actionCenter.summary?.deferred || 0
    },
    primaryLegalNetworkAction: actionCenter.primaryAction
      ? {
          actionId: actionCenter.primaryAction.actionId,
          portalId: actionCenter.primaryAction.portalId,
          portalName: actionCenter.primaryAction.portalName,
          tier: actionCenter.primaryAction.tier,
          title: actionCenter.primaryAction.title,
          reason: actionCenter.primaryAction.reason,
          nextAction: actionCenter.primaryAction.nextAction,
          evidenceState: actionCenter.primaryAction.evidenceState,
          dispositionStatus: actionCenter.primaryAction.disposition?.status || 'ACTIVE'
        }
      : null,
    attentionItems: (truth.attentionItems || []).slice(0, 12).map((item) => ({
      portalId: item.portalId,
      name: item.name,
      evidenceState: item.evidenceState,
      status: item.status,
      reason: item.reason,
      nextAction: item.nextAction
    })),
    risks: (truth.portals || [])
      .filter((row) => row.health === 'BLOCKED' || row.evidenceState === 'CONFLICT' || row.evidenceState === 'MISSING')
      .slice(0, 12)
      .map((row) => ({
        portalId: row.portalId,
        name: row.name,
        health: row.health,
        evidenceState: row.evidenceState,
        nextAction: row.nextAction
      })),
    nextActions: (actionCenter.actions || [])
      .filter((action) => ['NOW', 'NEXT'].includes(action.tier) && !['DISMISSED', 'COMPLETED'].includes(action.disposition?.status))
      .slice(0, 10)
      .map((action) => ({
        actionId: action.actionId,
        portalId: action.portalId,
        tier: action.tier,
        action: action.nextAction,
        evidenceState: action.evidenceState,
        ownerDisposition: action.disposition?.status || 'ACTIVE'
      })),
    automaticWrites: false,
    automaticActions: false,
    liveConnection: false,
    containsUserMatterData: false,
    containsCredentials: false,
    containsPaymentData: false,
    containsConfidentialData: false
  };
}

function markdown() {
  const handoff = build();
  return `# Dormant Optional Neutral Boardroom Export Boundary

Source release: ${handoff.sourceRelease}. Status: ${handoff.releaseStatus}.

## Relationship

- Neutral Boardroom: ${handoff.relationship.neutralBoardroom}
- Smarter Justice: ${handoff.relationship.smarterJustice}
- Legal portals: ${handoff.relationship.legalPortals}
- Launch critical: ${Boolean(handoff.launchCritical)}
- Runtime dependency: ${Boolean(handoff.runtimeDependency)}
- Automatic transmission: ${Boolean(handoff.automaticTransmission)}

## Summary

- Legal portals tracked: ${handoff.summary.legalPortalsTracked}
- Exact verified: ${handoff.summary.exactVerified}
- Owner recorded: ${handoff.summary.ownerRecorded}
- Attention needed: ${handoff.summary.attentionNeeded}
- Blocked: ${handoff.summary.blocked}
- Actions now: ${handoff.summary.actionCenterNow}
- Actions next: ${handoff.summary.actionCenterNext}

## Primary legal-network action

${handoff.primaryLegalNetworkAction ? `- ${handoff.primaryLegalNetworkAction.title} — ${handoff.primaryLegalNetworkAction.portalName}
- Why: ${handoff.primaryLegalNetworkAction.reason}
- Next: ${handoff.primaryLegalNetworkAction.nextAction}` : '- No current primary action.'}

## Boundaries

- No live connection, automatic action, or automatic write.
- No user-matter, confidential, credential, or payment data.
- Dedicated portal exact artifacts remain authoritative.
`;
}

module.exports = { build, markdown };
