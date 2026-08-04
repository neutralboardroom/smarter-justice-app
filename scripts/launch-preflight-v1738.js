#!/usr/bin/env node
'use strict';

const { ownerView, publicStatus } = require('../lib/launchCommandCenter');

const jsonMode = process.argv.includes('--json');
const strict = process.argv.includes('--strict');
const view = ownerView();
const payload = { ok:view.overallStatus !== 'NO_GO', version:view.targetReleaseVersion, overallStatus:view.overallStatus, generatedAt:view.generatedAt, summary:view.summary, lanes:view.lanes.map(lane=>({ id:lane.id, name:lane.name, status:lane.status, passedChecks:lane.passedChecks, requiredChecks:lane.requiredChecks, blockedKeys:lane.blockedKeys })), publicStatus:publicStatus(), evidenceDigest:view.evidenceDigest };

if (jsonMode) console.log(JSON.stringify(payload, null, 2));
else {
  console.log(`Smarter Justice ${payload.version} launch preflight`);
  console.log(`Overall: ${payload.overallStatus}`);
  for (const lane of payload.lanes) {
    console.log(`- ${lane.name}: ${lane.status} (${lane.passedChecks}/${lane.requiredChecks})`);
    if (lane.blockedKeys.length) console.log(`  Blocked: ${lane.blockedKeys.join(', ')}`);
  }
  console.log(`Evidence digest: ${payload.evidenceDigest}`);
}
if (strict && view.overallStatus === 'NO_GO') process.exitCode = 2;
