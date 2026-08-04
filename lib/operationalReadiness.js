const store = require('./store');
const mailer = require('./mailer');
const ownerAccounts = require('./ownerAccounts');
const professionalAccounts = require('./professionalAccounts');

const OPERATIONAL_READINESS_STANDARD_VERSION = '1.0.0';

function flag(name) {
  return /^(1|true|yes|on)$/i.test(String(process.env[name] || '').trim());
}
function httpsUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'https:';
  } catch { return false; }
}
function check(key, label, ready, detail, evidenceKey = '') {
  return { key, label, ready:Boolean(ready), status:ready ? 'ready' : 'blocked', detail:String(detail || ''), evidenceKey };
}
function environmentName() {
  if (process.env.RENDER || process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'test';
  return process.env.NODE_ENV || 'development';
}
function machineChecks() {
  const storage = store.storageStatus();
  const owner = ownerAccounts.status();
  const professional = professionalAccounts.securityStatus();
  const productionRuntime = storage.productionRuntime;
  const stripeSecret = Boolean(String(process.env.STRIPE_SECRET_KEY || '').trim());
  const stripeWebhook = Boolean(String(process.env.STRIPE_WEBHOOK_SECRET || '').trim());
  const explicitActivation = flag('PROFESSIONAL_PILOT_ACTIVATION_APPROVED');
  const smtpStatus = mailer.status();
  let checks = [
    check('production_runtime','Production runtime selected',productionRuntime,productionRuntime ? 'Production runtime is active.' : 'Paid pilot activation is limited to the production runtime.','production_database'),
    check('https_canonical_base','Canonical HTTPS base URL',httpsUrl(process.env.APP_BASE_URL),httpsUrl(process.env.APP_BASE_URL) ? 'APP_BASE_URL uses HTTPS.' : 'APP_BASE_URL must be a verified HTTPS URL.','monitoring_rollback'),
    check('database_selected','Managed PostgreSQL selected',storage.databaseUrlPresent,storage.databaseUrlPresent ? 'DATABASE_URL is present.' : 'DATABASE_URL is not configured.','production_database'),
    check('database_healthy','PostgreSQL connection healthy',storage.databaseReady && !storage.persistenceBlocked,storage.databaseReady && !storage.persistenceBlocked ? 'The selected database initialized successfully.' : (storage.databaseInitError || 'The selected database is not ready.'),'production_database'),
    check('database_transactions','Database transactions available',storage.databaseTransactionsReady,storage.databaseTransactionsReady ? 'Transactional mutation support is available.' : 'Database transaction support is not ready.','transactional_writes'),
    check('database_schema_current','Database migrations current',storage.databaseSchemaCurrent,storage.databaseSchemaCurrent ? `Current migration ${storage.migrationStatus?.currentVersion || ''} is applied.` : (storage.migrationStatus?.error || 'Required migrations are pending.'),'production_database'),
    check('owner_account','Durable owner account exists',owner.accountAuthenticationReady,owner.accountAuthenticationReady ? `${owner.accountCount} owner account(s) found.` : 'Create and persist the owner account.','owner_security'),
    check('owner_mfa','Owner MFA and recovery ready',owner.mfaRequiredForAll && owner.recoveryReadyForAll,owner.mfaRequiredForAll && owner.recoveryReadyForAll ? 'Every owner account has MFA and recovery codes.' : 'Enable MFA and preserve recovery codes for every owner account.','owner_security'),
    check('owner_bootstrap_removed','Owner bootstrap credentials removed',owner.bootstrapCredentialsRemoved,owner.bootstrapCredentialsRemoved ? 'Owner bootstrap credentials are no longer present.' : 'Remove OWNER_ACCOUNT_EMAIL and OWNER_ACCOUNT_PASSWORD after durable bootstrap.','owner_security'),
    check('legacy_owner_token_disabled','Legacy owner token disabled',owner.legacyTokenDisabledInProduction,owner.legacyTokenDisabledInProduction ? 'Legacy owner-token access is disabled for production.' : 'Disable ALLOW_LEGACY_OWNER_TOKEN in production.','owner_security'),
    check('professional_email_verification','Professional email verification implemented',professional.emailVerificationFoundation,professional.emailVerificationFoundation ? 'New professional accounts require email verification.' : 'Professional email verification is not implemented.','professional_security'),
    check('professional_password_reset','Professional password reset implemented',professional.passwordResetFoundation,professional.passwordResetFoundation ? 'Password-reset flow is available.' : 'Password-reset flow is unavailable.','professional_security'),
    check('professional_mfa','Professional MFA and session revocation implemented',professional.mfaFoundation && professional.sessionRevocationFoundation,professional.mfaFoundation && professional.sessionRevocationFoundation ? 'MFA, recovery, and session revocation foundations are present.' : 'Professional MFA or session revocation is incomplete.','professional_security'),
    check('professional_accounts_verified','First-cohort professional accounts verified',professional.activeAccountCount > 0 && professional.allActiveAccountsEmailVerified,professional.activeAccountCount > 0 && professional.allActiveAccountsEmailVerified ? 'All active professional accounts have verified email addresses.' : 'Create the bounded first-cohort accounts and verify every active email address.','professional_security'),
    check('professional_accounts_mfa','First-cohort professional MFA enabled',professional.activeAccountCount > 0 && professional.allActiveAccountsMfaEnabled,professional.activeAccountCount > 0 && professional.allActiveAccountsMfaEnabled ? 'Every active professional account has MFA enabled.' : 'Enable MFA for every active first-cohort professional account.','professional_security'),
    check('smtp_configured','Authenticated transactional email configured',smtpStatus.configured,smtpStatus.configured ? 'SMTP host, credentials, and sender identity are configured; SPF, DKIM, DMARC, delivery, bounce, and reply evidence remain separately required.' : `SMTP incomplete: host=${smtpStatus.hostConfigured}, credentials=${smtpStatus.credentialsConfigured}, sender=${smtpStatus.senderConfigured}.`,'authenticated_email'),
    check('stripe_secret','Stripe secret configured',stripeSecret,stripeSecret ? 'Stripe API access is configured.' : 'STRIPE_SECRET_KEY is not configured.','stripe_lifecycle'),
    check('stripe_webhook','Signed Stripe webhook configured',stripeWebhook,stripeWebhook ? 'Stripe webhook verification secret is configured.' : 'STRIPE_WEBHOOK_SECRET is not configured.','stripe_lifecycle'),
    check('explicit_owner_activation','Explicit production activation approval',explicitActivation,explicitActivation ? 'PROFESSIONAL_PILOT_ACTIVATION_APPROVED is enabled.' : 'Keep PROFESSIONAL_PILOT_ACTIVATION_APPROVED=false until the named cohort and all evidence are accepted.','first_cohort_approval')
  ];
  const testOverride = process.env.NODE_ENV === 'test' && flag('ALLOW_TEST_PAID_PILOT_GATE');
  if (testOverride) checks = checks.map(item => ({ ...item, ready:true, status:'ready', detail:`Test-only readiness override: ${item.label}` }));
  return {
    standardVersion:OPERATIONAL_READINESS_STANDARD_VERSION,
    environment:environmentName(),
    generatedAt:store.now(),
    checks,
    ready:checks.every(item => item.ready),
    blockedKeys:checks.filter(item => !item.ready).map(item => item.key),
    storage,
    ownerSecurity:owner,
    professionalSecurity:professional,
    emailConfigured:smtpStatus.configured,
    emailStatus:smtpStatus,
    stripeConfigured:stripeSecret && stripeWebhook,
    explicitActivation:testOverride || explicitActivation
  };
}
function activationGate(manualEvidenceSummary = null) {
  const machine = machineChecks();
  const manualReady = Boolean(manualEvidenceSummary?.ready);
  const reasons = [];
  if (!machine.ready) reasons.push('Production machine checks are incomplete.');
  if (!manualReady) reasons.push('Required owner-reviewed launch evidence is incomplete.');
  return {
    available:machine.ready && manualReady,
    reasons,
    machine,
    manualEvidence:manualEvidenceSummary || { ready:false, incompleteKeys:[] }
  };
}
async function databaseCheck() {
  const result = await store.verifyDatabaseConnection();
  return {
    standardVersion:OPERATIONAL_READINESS_STANDARD_VERSION,
    checkedAt:store.now(),
    environment:environmentName(),
    ...result
  };
}
module.exports = { OPERATIONAL_READINESS_STANDARD_VERSION, machineChecks, activationGate, databaseCheck, environmentName };
