# Next Version Improvement List — Smarter Justice v1.7.83

Baseline artifact: `smarter-justice-v1.7.82.zip`  
Baseline SHA-256: `61fea278a69055915e9b4b916e4b64ec514614f1746cacf659a6931ccd0228b1`

Launch state: `NO_GO`

Carry-forward rule: Remove only when verified complete, evidence-backed rejected, superseded, or not applicable.

## 1. Complete detached owner authorization for exact read-only provider discovery

- ID: `detached-provider-discovery-owner-authorization`
- Priority: `P0`
- Status: `OWNER_DECISION_REQUIRED`
- Benefit: Prevents a draft request from becoming executable through mutation, implication, replay, scope escalation, or stale consent.
- Evidence: v1.7.75 restores the complete request-bound authorization lifecycle, including authorize, decline, expiry, revocation, single-use envelope issuance, receipt consumption, replay rejection and hash-chain validation.
- Dependency: Roger must explicitly issue a time-bounded decision for the exact request digest; no provider access is implied.
- Risk: A mismatched, expired, replayed, secret-bearing, write-bearing, or deployment-bearing decision could create false authorization.
- Acceptance: Decision ID, request ID/digest, exact artifact identity, exact scopes, safety acknowledgments, window, confirmation, and unused nonce validate; execution remains read-only and separate from cohort freeze, canary, deployment, and production.
- Next action: Review the exact v1.7.73 recovery request and either issue a detached read-only decision, decline it, or allow it to expire.

## 2. Bind and verify the exact detached v1.7.78 final archive identity in each named deployment environment

- ID: `detached-final-artifact-identity`
- Priority: `P0`
- Status: `IMPLEMENTED_RUNTIME_BINDING_FINAL_RECEIPT_PENDING`
- Benefit: Lets owner and deployment tooling distinguish the exact delivered immutable ZIP from an unbound source candidate without circular self-proof.
- Evidence: v1.7.77 preserves replay-safe detached identity verification; the immutable final receipt is created only after final packaging.
- Dependency: Immutable final v1.7.75 ZIP, detached delivery receipt, and named environment configuration.
- Risk: A stale, forged or wrong-release receipt could be mistaken for the accepted final artifact.
- Acceptance: Receipt schema and release match; configured artifact basename, SHA-256 and byte size match; replay/conflict is rejected; unconfigured state remains truthful; deployment and live gates remain separate.
- Next action: After immutable final packaging, create the detached receipt and bind it through secure environment configuration; verify exact bytes before any deployment decision.

## 3. Revalidate the canonical active master pair and portal continuation bindings on every reuse

- ID: `master-pair-runtime-revalidation`
- Priority: `P0`
- Status: `IMPLEMENTED_AND_REVALIDATION_REQUIRED_ON_CHANGE`
- Benefit: Prevents stale embedded prompt authority, lower-epoch replay, split-brain commits, and continuation use against an uncommitted pair.
- Evidence: v1.7.63 binds receipt MPCR-2026-07-31-E1-R0-05F4296ED378 and tests exact replay/conflict behavior.
- Dependency: Any successor central or portal-family master, pair commit, rollback, or portal continuation change.
- Risk: A stale or conflicting pair could misgovern shared contracts while appearing current.
- Acceptance: Discover the newest exact receipt, verify predecessor/epoch/revision/bytes, reject conflict or replay, preserve rollback pair, and rebind affected continuations.
- Next action: On the next master or continuation change, create exact successor candidates, validate both sides, commit once with compare-and-swap, and preserve the prior pair as rollback.

## 4. Verify prepared owner actions and qualified reviews

- ID: `owner-action-verification`
- Priority: `P0`
- Status: `OWNER_ACTION_REQUESTED_AND_VERIFICATION_PENDING`
- Benefit: Converts passive blockers into concrete secure actions and exact verification receipts.
- Evidence: OWNER_LAUNCH_ACTION_PACKET_V1.7.66.json groups ready-now, qualified-review, candidate-dependent and deferred actions without secrets.
- Dependency: Roger, qualified reviewers, exact artifacts, approved vendors and named environments.
- Risk: Unverified confirmations could be mistaken for acceptance or expose secrets.
- Acceptance: Each request advances through received and builder-verified states with exact artifact/environment scope, expiration, revocation and rollback.
- Next action: Use the protected launch-action packet; execute only ready nonsecret actions and run the recorded builder verification before advancing state.

## 5. Exact four-portal staging plus portal-neutral independent readiness acceptance

- ID: `exact-four-portal-staging`
- Priority: `P0`
- Status: `BLOCKED`
- Benefit: Proves the exact initial cohort and independently approved portals can qualify through product-local receipts without cross-blocking unrelated products.
- Evidence: v1.7.71 adds portal-neutral readiness receipts and a no-cross-blocking aggregate while preserving the exact five-product initial cutover policy; no D4 production acceptance is claimed.
- Dependency: Exact portal artifact, canonical authority receipt, accepted contract, staging environment, suppression and rollback evidence.
- Risk: Calling an untested adapter live could publish stale, mismatched, or unsuppressible professional data.
- Acceptance: Every product-local receipt validates independently; the exact five-product initial cohort remains frozen; non-initial approved portals may be LAUNCH_READY_NOT_SCHEDULED; aggregation does not authorize deployment; staging and rollback journeys pass.
- Next action: Issue and validate exact product-local receipts in staging, keeping each product independent and preserving mismatch, suppression, stale-data, last-known-good, monitoring, support, and rollback evidence.

## 6. Domestic Violence current emergency and resource review

- ID: `domestic-violence-resource-safety-review`
- Priority: `P0`
- Status: `BLOCKED`
- Benefit: Protects survivors from stale emergency information and unsafe routing.
- Evidence: Central routing remains closed and the dedicated portal requires dated authoritative survivor-safety acceptance.
- Dependency: Authoritative current sources, dedicated portal artifact, qualified survivor-safety review and Roger approval.
- Risk: Stale or unsafe resource information can cause material harm.
- Acceptance: Every emergency and resource record has an authoritative source, review date, jurisdiction, correction path and safety acceptance; no confidential location is exposed.
- Next action: Complete dated authoritative emergency/resource and survivor-safety review in the dedicated portal context.

## 7. Production PostgreSQL, SMTP, MFA, monitoring, backup and restore

- ID: `production-services`
- Priority: `P0`
- Status: `LOCAL_DEPLOYMENT_KIT_ACCEPTED_PROVIDER_BINDING_PENDING`
- Benefit: Provides durable authenticated operations and recoverability without false readiness claims.
- Evidence: Local dependency-independent tests pass, while production infrastructure and credentials remain absent or unaccepted.
- Dependency: Production services, credentials, named owners, runbooks and exact acceptance evidence.
- Risk: Opening writes without durable storage, authenticated delivery, monitoring or recovery can lose data and misstate workflow success.
- Acceptance: Production persistence, authenticated SMTP, MFA, monitoring, backup and restore drills pass with receipts, alerts and rollback.
- Next action: Accept PostgreSQL, SMTP, MFA, monitoring, backup and restore with production credentials and exact evidence.

## 8. Browser, mobile, print and accessibility acceptance

- ID: `real-device-accessibility`
- Priority: `P0`
- Status: `READY_FOR_REVIEW`
- Benefit: Confirms attorneys and public users can complete key journeys on real devices and assistive technology.
- Evidence: Code-level tests pass, but rendered local screenshots do not prove device, camera, print or screen-reader acceptance.
- Dependency: Representative devices, browsers, assistive technology, QR camera scans and production-domain routes.
- Risk: Unverified field materials or inaccessible journeys can fail during outreach or exclude users.
- Acceptance: Phone, tablet, laptop, keyboard, touch, zoom, reflow, screen reader, QR camera, print and browser-matrix results are recorded with no unresolved P0 defects.
- Next action: Test phone, tablet, laptop, keyboard, touch, zoom, reflow, screen reader, QR camera, print and browser matrix.

## 9. Legal, privacy, support, incident and owner launch approval

- ID: `legal-privacy-support-owner-go`
- Priority: `P0`
- Status: `BLOCKED`
- Benefit: Ensures launch obligations, support ownership and truthful public claims are accepted by accountable reviewers.
- Evidence: Launch state remains NO_GO and named approvals are not present.
- Dependency: Named reviewers, accepted policies, support/incident ownership and Roger explicit GO.
- Risk: Launching without accountable review can expose users and the platform to legal, privacy, support and operational failures.
- Acceptance: All named reviews are signed, blockers are closed or formally accepted, support and incident roles are active, and Roger records explicit GO.
- Next action: Obtain named legal, privacy, support, incident and Roger GO acceptances.

## 10. Field ownership and portal projection adoption

- ID: `field-ownership-portal-adoption`
- Priority: `P1`
- Status: `CENTRAL_FOUNDATION_COMPLETE_PORTAL_ACCEPTANCE_BLOCKED`
- Benefit: Prevents central and portal records from silently overwriting newer or specialty-owned truth.
- Evidence: v1.7.54 added the central field ownership matrix, conflict states, correction packets and rollback receipts.
- Dependency: Exact portal contract adoption and staging acceptance.
- Risk: Last-write-wins behavior could corrupt identity, specialty, source or suppression truth.
- Acceptance: Each pilot portal accepts the matrix, carries revision/source metadata, fails closed on conflicts, and demonstrates correction packet plus rollback behavior.
- Next action: Use the v1.7.54 matrix in exact portal staging; preserve correction packets and no automatic write-back.

## 11. Firm, office, roster and seat operational workflows

- ID: `firm-seat-operational-workflows`
- Priority: `P1`
- Status: `FOUNDATION_COMPLETE_REAL_OPERATIONS_BLOCKED`
- Benefit: Allows verified organizations and attorneys to manage relationships without surrendering individual profile control.
- Evidence: v1.7.54 defines complete lifecycle states and authority boundaries; real authenticated operations remain closed.
- Dependency: Durable authentication, firm authority evidence, notification delivery, support and audit storage.
- Risk: Weak authority or offboarding could grant improper control, retain stale access or remove an attorney from their own profile.
- Acceptance: Invitation, expiration, rejection, dispute, transfer, administrator replacement, revocation and offboarding pass with separate firm/attorney authority and durable receipts.
- Next action: Accept invitation, dispute, transfer, offboarding and administrator replacement with authenticated actors and durable infrastructure.

## 12. Lawful profile growth and currentness

- ID: `lawful-profile-growth`
- Priority: `P1`
- Status: `READY_FOR_REVIEW`
- Benefit: Expands useful attorney and firm coverage while preserving neutral source truth and correction rights.
- Evidence: Baseline includes 233 professionals and 48 firms; automatic publication and verification remain closed.
- Dependency: Approved lawful sources, human reviewers and source/currentness procedures.
- Risk: Poor-quality growth can create duplicates, stale offices, unsupported specialty claims or implied endorsement.
- Acceptance: An approved batch records exact before/after counts, source dates, duplicate and relationship review, human acceptance, correction/suppression paths and no automatic publication.
- Next action: Use approved sources and human review; keep automatic publication closed and report exact before/after counts.

## 13. Paid membership, entitlement and professional opportunity acceptance

- ID: `billing-opportunities`
- Priority: `P2`
- Status: `GATED`
- Benefit: Creates a supportable professional-funded model while keeping payment separate from trust, organic rank and representation.
- Evidence: v1.7.61 binds the monthly $15 attorney, $15 firm, and $15 firm-covered-seat structure with one payer per attorney seat; checkout, live billing, and opportunities remain closed.
- Dependency: Approved pricing and terms, Stripe test mode, signed webhook, reconciliation, refund/chargeback policy, support, legal review and Roger approval.
- Risk: Premature activation could create unauthorized entitlements, unfair allocation or misleading lead guarantees.
- Acceptance: Versioned plan/price/terms, idempotent signed payment lifecycle, firm-seat coverage, reconciliation, neutral eligibility, consent/conflict flow, user choice and rollback all pass before gates open.
- Next action: Complete legal, pricing, terms, Stripe test, webhook, refund, chargeback, support, reconciliation and owner acceptance before activation.

## 14. Appointments and reviews acceptance

- ID: `appointments-reviews`
- Priority: `P2`
- Status: `GATED`
- Benefit: Adds useful scheduling and feedback only after privacy, moderation and representation boundaries are proven.
- Evidence: Public booking and reviews remain closed with zero appointments and reviews.
- Dependency: Availability/calendar security, eligibility, consent, cancellation, moderation, dispute, privacy, support, legal review and rollback.
- Risk: Premature booking or reviews can imply representation, expose private information or enable abuse and defamation.
- Acceptance: Separate appointment and review acceptance suites pass all policy, security, support, accessibility, monitoring and rollback gates without seeded fake activity.
- Next action: Keep closed until separate availability/calendar/privacy and review eligibility/moderation/dispute acceptance passes.

## 15. Transactional notification delivery acceptance

- ID: `notifications-smtp`
- Priority: `P1`
- Status: `CODE_FOUNDATION_COMPLETE_EXTERNAL_ACCEPTANCE_BLOCKED`
- Benefit: Provides reliable, privacy-minimized workflow notices without confusing delivery with business-state success.
- Evidence: v1.7.54 added classification, template version, redaction, idempotency and provider-receipt truth; authenticated SMTP is unaccepted.
- Dependency: Authenticated SMTP/provider, bounce and complaint handling, retry monitoring, verified destinations and support ownership.
- Risk: Uncontrolled notifications can leak sensitive information, duplicate messages or falsely signal workflow completion.
- Acceptance: Provider-authenticated transactional delivery, failure, retry, bounce, suppression, complaint and reconciliation paths pass with minimum-necessary payloads and durable receipts.
- Next action: Accept authenticated SMTP, bounce/retry/suppression/complaint monitoring and provider reconciliation.

## 16. Reproducible dependency installation and vulnerability evidence

- ID: `supply-chain`
- Priority: `P0`
- Status: `BLOCKED`
- Benefit: Makes production installation and PostgreSQL readiness reproducible without weakening architecture or provenance.
- Evidence: Configured registry returns HTTP 404 for xtend-4.0.2.tgz and the audit endpoint; dependency-independent suite passes but clean install and vulnerability audit do not.
- Dependency: Authorized functioning npm registry and audit service or an approved equivalent evidence path.
- Risk: Ignoring the blocker would create unsupported supply-chain and production-readiness claims.
- Acceptance: Lockfile integrity, package provenance, licenses, SBOM, clean npm ci, vulnerability audit, PostgreSQL-dependent readiness and rollback pass from a fresh environment.
- Next action: Repair or authorize a functioning legitimate registry/audit path for xtend and vulnerability evidence without weakening pg or vendoring unreviewed packages.

## 17. Justice Booth verified pilot operations

- ID: `justice-booth`
- Priority: `P1`
- Status: `NOT_STARTED`
- Benefit: Allows truthful field operations only after location, staffing, safety and accessibility are real.
- Evidence: Verified pilot operations remain not started and owner-dependent.
- Dependency: Approved location, schedule, staffing, accessibility, safety, incident plan and Roger approval.
- Risk: Unsupported public status can send people to a nonexistent or unsafe service location.
- Acceptance: Exact record supports PLANNED/SCHEDULED/ACTIVE/COMPLETED/VERIFIED LOCATION status, with staffing, accessibility, safety, support and incident evidence.
- Next action: Require approved location, schedule, staffing, accessibility, safety, incident plan and exact status truth.

## 18. Create an optional product-local import adapter for the device-only Journey Handoff Plan

- ID: `journey-handoff-portal-import-adapter`
- Priority: `P1`
- Status: `CENTRAL_LOCAL_INSPECTION_COMPLETE_PORTAL_IMPORT_ACCEPTANCE_PENDING`
- Benefit: Lets a person deliberately carry a minimal fixed-choice preparation pack into one accepted portal without central storage or automatic synchronization.
- Evidence: v1.7.77 adds strict device-only local import inspection, integrity/expiry verification, destination compatibility guidance, and explicit portal_import_accepted=false.
- Dependency: One exact current portal artifact, portal-local owner acceptance, product-local schema validation, and a no-storage/no-auto-import review.
- Risk: An automatic or overly broad importer could create silent transfer, stale consent, or unnecessary sensitive-data collection.
- Acceptance: Import is user-initiated, product-local, schema-bound, expiry-aware, minimal, revocable before submission, non-automatic, and tested without central persistence.
- Next action: Supply one exact destination portal artifact and obtain product-local schema, privacy, accessibility, and owner acceptance before enabling any portal import adapter.

## 19. Evaluate an accessible local QR representation of the minimal Journey Handoff Plan

- ID: `accessible-local-qr-export`
- Priority: `P1`
- Status: `RESEARCH_AND_PRIVACY_REVIEW_REQUIRED`
- Benefit: Could simplify voluntary device-to-device transfer while preserving a printable and screen-reader-accessible alternative.
- Evidence: The v1.7.76 handoff contract already limits content, binds explicit consent, carries an expiry, and prohibits network transfer and storage.
- Dependency: Accessibility testing, shoulder-surfing and screenshot-risk review, offline decoding, payload-size limits, and a plain-text alternative.
- Risk: A visible QR code could expose the pack to bystanders or be misunderstood as automatic portal submission.
- Acceptance: Generation and decoding remain local; the expiry and privacy warning are visible; no analytics or remote image service is used; a text/download alternative is equivalent.
- Next action: Prototype only in an isolated test and reject it if safe accessible use cannot be demonstrated.

## 20. Revalidate targeted research in the next material release.

- ID: `NVIL-V1762-RESEARCH-REVALIDATION`
- Priority: `P1`
- Status: `RECURRING`
- Benefit: Keeps law, standards, forms, provider and competitor learning current.
- Evidence: dated source records and target dispositions
- Dependency: internet access
- Risk: stale public claims
- Acceptance: ['all release-relevant external facts revalidated']
- Next action: None

## 21. Add deterministic candidate scoring to the V12 dual-track improvement engine without replacing human judgment

- ID: `dual-track-candidate-scoring`
- Priority: `P1`
- Status: `READY_FOR_DESIGN`
- Benefit: Makes connected improvement selection more repeatable while preserving the Core Owner Mission and preventing one-track or cosmetic releases.
- Evidence: v1.7.76 requires tested product value, tested builder/prompt capability, before-and-after deltas, cross-version learning, affected-file evidence, limits, and hard constraints.
- Dependency: A transparent scoring rubric, explicit uncertainty, human override reasons, and tests against gaming by file count or superficial change volume.
- Risk: Opaque scoring could reward quantity over safety, user value, or genuine material progress.
- Acceptance: Scores are reproducible, explainable, subordinate to hard safety constraints, cannot authorize deployment, and cannot pass a release lacking either required track.
- Next action: Design and test a transparent rubric using the cross-version learning ledger and preserve documented human judgment.

## 22. Complete protected OpenAI project, key, deployment and controlled central live smoke

- ID: `openai-central-live-smoke`
- Priority: `P0`
- Status: `OWNER_ACTION_AND_ENVIRONMENT_REQUIRED`
- Benefit: Converts the tested dark gateway into exact live central evidence without exposing the key.
- Evidence: v1.7.78 implements the OpenAI-only central gateway, registry, mock evaluations, kill switch and deterministic fallback.
- Dependency: OpenAI Platform billing and production project, one service-account key, exact central Render service, deployment authorization and synthetic smoke input.
- Risk: Premature activation could expose secrets, incur uncontrolled cost or overstate AI readiness.
- Acceptance: Key exists only in the central protected secret store; one controlled Responses API request passes request-ID, schema, source, logging, cost, kill-switch and fallback checks; no user data is used.
- Next action: Roger creates the project service-account key and pastes it once into the exact protected central Render OPENAI_API_KEY field after the builder supplies that one action.

## 23. Issue exact AI compatibility receipts for the four initial portals

- ID: `five-product-ai-compatibility-receipts`
- Priority: `P0`
- Status: `BLOCKED_EXACT_PORTAL_ARTIFACTS`
- Benefit: Proves each portal uses the central gateway, has no OpenAI key, preserves non-AI use and opens tools independently.
- Evidence: FIVE_PRODUCT_AI_CAPABILITY_MATRIX_V1.7.78.json truthfully separates central TESTED code from portal adapter blockers.
- Dependency: Exact current portal artifacts, authenticated adapters, portal safety overlays, mock evaluations, staging and rollback evidence.
- Risk: A stale or mismatched portal could be called AI enabled without safe integration.
- Acceptance: Exact artifact, gateway contract, tool/prompt/model/source identities, no-key evidence, feature flags, degraded mode, evaluation and rollback validate per portal.
- Next action: Build and validate the Estate Law Aid adapter and receipt first when its exact artifact is otherwise launch-ready.

## 24. Complete protected GitHub-to-Render dark AI release automation

- ID: `github-render-ai-dark-release-automation`
- Priority: `P1`
- Status: `BLOCKED_REPOSITORY_AND_DEPLOYMENT_AUTHORITY`
- Benefit: Reduces ordinary owner work while keeping new AI capabilities dark until smoke and canary gates pass.
- Evidence: v1.7.78 versions gateway code, registries, schemas, flags, evaluations and rollback configuration.
- Dependency: Canonical repository, protected branch/rulesets, Render service identity, deployment hooks, monitoring and rollback authority.
- Risk: Unproven automation could deploy an unaccepted prompt, model, schema or source change.
- Acceptance: CI mocks, injection/security evals, secret scan, exact evidence, protected merge, dark deployment, health/smoke, canary, monitoring and rollback all pass.
- Next action: Bind exact GitHub and Render identities and validate one dark release without opening any AI tool.

## 25. Connect exact provider, repository, deployment, DNS/TLS, health and stabilization evidence to the unified live-operations register

- ID: `unified-live-operations-evidence-connectors`
- Priority: `P0`
- Status: `IMPLEMENTED_BATCH_PREVIEW_EXTERNAL_RECEIPTS_PENDING`
- Benefit: Promotes each dependency independently from explicit evidence and reduces Roger’s routine launch workload.
- Evidence: v1.7.81 adds exact batch reconciliation, conflict/replay detection, deterministic ordering, and all-or-nothing preview over the v1.7.80 single-receipt connector.
- Dependency: Canonical GitHub repository, exact commit, approved Render service, provider records, DNS/TLS and health access.
- Risk: Weak evidence adapters could overstate live readiness or expose secrets.
- Acceptance: Every state promotion carries exact nonsecret evidence, timestamp, rollback, owner action, and automatic regression checks; secrets and user content remain excluded.
- Next action: After canonical GitHub and Render identities are known, collect exact nonsecret receipts, validate one batch, and review the proposed transaction; do not apply it automatically.

## 26. Automate V14 payload inventory freeze, embedded owner receipt verification, and post-package delivery identity reporting

- ID: `v14-receipt-automation`
- Priority: `P1`
- Status: `IMPLEMENTED_DETERMINISTIC_CHECK_MODE`
- Benefit: Makes exact non-self-referential releases repeatable with less manual evidence reconciliation.
- Evidence: v1.7.80 adds deterministic payload-inventory generation and automated owner receipt hash/count and self-reference validation.
- Dependency: Deterministic release script integration and fresh-extraction acceptance harness.
- Risk: Incorrect ordering can reintroduce circular hashes or package untested evidence.
- Acceptance: One command freezes payload, validates receipt/inventory, builds candidates, accepts clean extractions, seals source, builds finals, and reports detached outer identity without mutating delivered bytes.
- Next action: Run the generator/check during each candidate and final freeze; report detached final ZIP identity only after packaging.

## 27. Connect exact nonsecret evidence adapters for GitHub, Render, DNS/TLS/health, PostgreSQL, SMTP, billing, and OpenAI smoke

- ID: `live-evidence-provider-adapters`
- Priority: `P0`
- Status: `BLOCKED_EXACT_EXTERNAL_IDENTITIES`
- Benefit: Allows individual live-operation states to advance only from current exact evidence.
- Evidence: v1.7.80 provides the receipt contract and preview validator but no external connector or live receipt.
- Dependency: Canonical repository, approved services, protected credentials, and owner-authorized read-only observation.
- Risk: A stale, secret-bearing, write-bearing, or mismatched receipt could falsely promote readiness.
- Acceptance: Each adapter emits a current digest-bound nonsecret receipt with all required checks; preview passes; a separate audited owner action applies any state change.
- Next action: Identify canonical GitHub and Render first, then add one read-only adapter at a time.

## 28. Automate detached final delivery receipt after immutable packaging

- ID: `v14-detached-final-delivery-receipt`
- Priority: `P1`
- Status: `IMPLEMENTED_POST_PACKAGE_DETACHED_GENERATOR`
- Benefit: Binds the delivered outer ZIP without embedding a self-referential identity.
- Evidence: v1.7.81 adds deterministic final-twin comparison and seventeen-field detached delivery receipt generation/verification outside the ZIP.
- Dependency: Immutable final ZIP bytes and detached delivery channel.
- Risk: Embedding the final ZIP identity would make the archive self-referential; reporting an earlier candidate would misidentify delivery.
- Acceptance: After final packaging, compute exact SHA-256/size, compare two deterministic builds, and emit a detached receipt linked to the accepted embedded candidate evidence.
- Next action: After immutable final packaging, generate and validate the detached receipt, then deliver it beside the final ZIP without modifying either file.

## 29. Add a single-use audited owner authorization for applying a validated evidence batch

- ID: `v14-evidence-batch-application-authorization`
- Priority: `P0`
- Status: `BLOCKED_EXACT_LIVE_RECEIPTS_AND_OWNER_AUTHORITY`
- Benefit: Would allow a fully validated promotion transaction to update only approved dependency states while preserving rollback and audit evidence.
- Evidence: v1.7.81 creates an all-or-nothing preview transaction but intentionally exposes no apply path.
- Dependency: Exact live receipts, authenticated owner decision, nonce/replay control, reversible state store, audit log, and deployment boundary review.
- Risk: An implicit or replayable apply action could promote stale evidence or create hidden deployment authority.
- Acceptance: All listed acceptance checks pass against exact live receipts, detached owner authorization, replay controls, reversible state changes, audit evidence, and separate deployment authority.
- Next action: Design only after exact canonical repository/deployment evidence exists; do not add an apply endpoint from synthetic fixtures.

## 30. Publish the detached final delivery receipt beside the immutable ZIP

- ID: `v14-detached-receipt-publication`
- Priority: `P1`
- Status: `READY_AFTER_FINAL_PACKAGING`
- Benefit: Lets the owner and later build verify the delivered outer archive without opening or modifying it.
- Evidence: v1.7.81 generates and verifies a detached receipt with final SHA-256, size, deterministic twin identity, candidate/source linkage, inventories, package hashes, and test-log identity.
- Dependency: Immutable final ZIP pair and delivery location.
- Risk: Publishing an unverified or mismatched receipt would misidentify the delivered artifact.
- Acceptance: The detached receipt validates against both immutable final builds, remains outside the ZIP, differs from the candidate identity, matches all seventeen comparison fields, and ships beside the final ZIP.
- Next action: Generate after the final pair is immutable and include the detached receipt in the final owner handoff.

## 31. Use the dependency-aware evidence readiness planner with exact external receipts

- ID: `v14-evidence-readiness-gap-planner`
- Priority: `P0`
- Status: `IMPLEMENTED_PREVIEW_ONLY_EXTERNAL_RECEIPTS_PENDING`
- Benefit: Turns a partial exact receipt set into deterministic coverage, dependency blockers, prioritized gaps, and one exact next owner action without applying state.
- Evidence: v1.7.82 adds V14_EVIDENCE_READINESS_PLANNER_CONTRACT_V1.7.82.json, lib/v14EvidenceReadinessPlanner.js, protected owner routes, and focused acceptance.
- Dependency: Canonical external identities and current nonsecret receipts.
- Risk: A planner that inferred missing evidence or silently promoted state could create false launch readiness.
- Acceptance: All eight components are classified from exact receipt validation; dependencies and gaps are deterministic; no persistence, provider call, state mutation, owner GO, deployment, or production activation occurs.
- Next action: After GitHub and Render identities are known, collect the exact first nonsecret receipt named by the planner and rerun the plan.

## 32. Use the canonical segmented acceptance manifest for every release

- ID: `v14-segmented-acceptance-runner`
- Priority: `P1`
- Status: `IMPLEMENTED_143_COMMAND_CANONICAL_MANIFEST`
- Benefit: Distinguishes product failures from external runner limits and makes every dependency-independent command independently attributable.
- Evidence: v1.7.82 adds ACCEPTANCE_SUITE_MANIFEST_V1.7.82.json, lib/v14SegmentedAcceptanceRunner.js, scripts/run-segmented-acceptance.js, and focused tests.
- Dependency: Keep the package test chain and manifest synchronized on every material change.
- Risk: A stale or reordered manifest could omit tests or misrepresent acceptance.
- Acceptance: Version, count, order, command text, unique IDs, per-command outcomes, stable combined log, and log SHA-256 validate; the separate PostgreSQL part remains unclaimed.
- Next action: Regenerate the manifest after any test-chain change and run the canonical segmented runner twice with byte-identical logs.

## 33. Use the deterministic nonsecret evidence collection packet for the first readiness gap

- ID: `v14-nonsecret-evidence-collection-packet`
- Priority: `P0`
- Status: `IMPLEMENTED_PREVIEW_ONLY_EXTERNAL_IDENTITIES_PENDING`
- Benefit: Turns the first exact readiness gap into one owner-downloadable, provider-specific collection checklist without asking for secrets or opening provider access.
- Evidence: v1.7.83 adds V14_EVIDENCE_COLLECTION_PACKET_CONTRACT_V1.7.83.json, lib/v14EvidenceCollectionPacket.js, protected owner routes, text/JSON exports, and focused tests.
- Dependency: Canonical external identities and owner collection of nonsecret references.
- Risk: A packet that requested credentials, outlived its scope, or implied deployment authority could create unsafe owner work.
- Acceptance: First-gap component, exact source/packet identity, nonsecret identifier allowlist, required checks, dependencies, eight-hour maximum window, digest, forbidden inputs, and closed boundaries validate.
- Next action: Use the packet for the first gap only; enter nonsecret identifiers and evidence references, never credentials or API keys.

## 34. Run the dynamic V14 acceptance evidence bundle on every freeze

- ID: `v14-dynamic-acceptance-evidence-bundle`
- Priority: `P1`
- Status: `IMPLEMENTED_NON_PERSISTED_DYNAMIC_VALIDATION`
- Benefit: Cross-checks the canonical suite, working receipt, package identities, both inventories, owner receipt, exact source/packet binding, and detached-final boundary without adding a self-referential file.
- Evidence: v1.7.83 adds V14_ACCEPTANCE_EVIDENCE_BUNDLE_CONTRACT_V1.7.83.json, lib/v14AcceptanceEvidenceBundle.js, a check script, owner visibility, and focused tests.
- Dependency: Keep the 145-command manifest, working receipt, package hashes, inventories, and owner receipt synchronized.
- Risk: Persisting computed inventory hashes inside the payload or accepting stale command results could create circular or false evidence.
- Acceptance: All required files exist; 145 unique ordered commands match package.json; working runs are identical; hashes and inventories validate; owner receipt is non-self-referential; final ZIP identity remains detached.
- Next action: Run the dynamic bundle check after each inventory regeneration and before packaging.

