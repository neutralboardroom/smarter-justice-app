'use strict';

const LAUNCH_SPRINT_STANDARD_VERSION = '1.0.0';
const TARGET_RELEASE_VERSION = '1.7.75';

const LAUNCH_SPRINT = Object.freeze({
  standardVersion: LAUNCH_SPRINT_STANDARD_VERSION,
  targetReleaseVersion: TARGET_RELEASE_VERSION,
  objective: 'Prepare Smarter Justice for a controlled public-customer launch and a bounded founding-attorney launch within 48 hours without weakening privacy, security, professional, payment, or deployment gates.',
  launchLanes: [
    {
      id: 'public-free',
      name: 'Public starting help',
      promise: 'People can use the non-saved starting-point experience and public preparation tools without payment.',
      prohibitedUntilSeparatelyApproved: ['Saved legal stories', 'Confidential uploads', 'Paid Human Review', 'Guaranteed routing or outcomes']
    },
    {
      id: 'attorney-applications',
      name: 'Founding-attorney applications',
      promise: 'Attorneys can create secure accounts, prepare or claim profiles, and apply to the bounded founding program when the application gate is approved.',
      prohibitedUntilSeparatelyApproved: ['Automatic profile verification', 'Automatic portal eligibility', 'Guaranteed leads', 'Payment before approval']
    },
    {
      id: 'paid-professional-growth',
      name: 'Paid sponsored visibility and case opportunities',
      promise: 'Only active paid members who independently satisfy claim, verification, specialty, terms, advertising, fee, disclosure, and owner-approval requirements may receive clearly labeled sponsored visibility or case opportunities.',
      prohibitedUntilSeparatelyApproved: ['Unlabeled paid placement', 'Percentage of legal fees', 'Outcome-contingent charges', 'Pay-to-verify', 'Paid organic ranking', 'Guaranteed leads or work']
    },
    {
      id: 'paid-pilot',
      name: 'Paid founding-attorney pilot',
      promise: 'Only individually approved professionals may proceed to payment after machine checks, owner-reviewed evidence, cohort limits, and explicit activation all pass.',
      prohibitedUntilSeparatelyApproved: ['Broad public checkout', 'Appointments', 'Sponsored ranking', 'Ratings and reviews', 'Automatic cross-portal writes']
    }
  ],
  timeline: [
    { window: 'Hours 0–12', focus: 'Freeze launch scope; verify legal pages, support ownership, cohort, configuration contract, and public/attorney launch boundaries.' },
    { window: 'Hours 12–24', focus: 'Configure and verify production database, owner security, professional authentication, email, monitoring, backup, restore, and rollback.' },
    { window: 'Hours 24–36', focus: 'Run browser, phone, tablet, keyboard, zoom, screen-reader, signup, claim, support, payment-test, cancellation, refund, and failure-path acceptance.' },
    { window: 'Hours 36–48', focus: 'Resolve blockers, run exact preflight, stage the approved artifact, verify health and rollback, then record a separate owner go/no-go decision.' }
  ],
  principles: [
    'Public starting help, free basic profile control, paid membership, and paid professional growth are separate gates.',
    'A code foundation or configured secret is not operational evidence.',
    'Every gate fails closed when required evidence is absent or contradictory.',
    'No initial legal story is sold or automatically transferred.',
    'Payment never creates verification, specialty evidence, ranking, availability, inquiries, clients, revenue, or outcomes.',
    'Deployment and commercial activation require separate explicit owner approval.'
  ]
});

module.exports = { LAUNCH_SPRINT_STANDARD_VERSION, TARGET_RELEASE_VERSION, LAUNCH_SPRINT };
