const crypto = require('crypto');
const store = require('./store');
const marketplace = require('./professionalMarketplace');
const mailer = require('./mailer');
const security = require('./accountSecurity');

const STORE_KEY = 'professionalAccounts.json';
const SESSION_COOKIE = 'sj_professional_session';
const SESSION_DAYS = Number(process.env.PROFESSIONAL_SESSION_DAYS || 14);
const PASSWORD_MIN_LENGTH = 10;
const NY_ATTORNEY_SOURCE_URL = 'https://data.ny.gov/Transparency/NYS-Attorney-Registrations/eqw2-r5nb';

function clean(value, max = 500) { return String(value == null ? '' : value).trim().slice(0, max); }
function email(value) { const raw = clean(value, 220).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : ''; }
function now() { return store.now(); }
function initialState() { return { schemaVersion:'1.3.0', accounts:[], sessions:[], passwordResetRequests:[], updatedAt:'' }; }
function normalizeAccount(account = {}) {
  return {
    ...account,
    professionalIds:Array.isArray(account.professionalIds) ? account.professionalIds : [],
    firmIds:Array.isArray(account.firmIds) ? account.firmIds : [],
    pendingClaimProfessionalIds:Array.isArray(account.pendingClaimProfessionalIds) ? account.pendingClaimProfessionalIds : [],
    pendingClaimFirmIds:Array.isArray(account.pendingClaimFirmIds) ? account.pendingClaimFirmIds : [],
    mfa:{ enabled:Boolean(account.mfa?.enabled), secret:account.mfa?.secret || '', pendingSecret:account.mfa?.pendingSecret || '', recoveryCodeHashes:Array.isArray(account.mfa?.recoveryCodeHashes) ? account.mfa.recoveryCodeHashes : [], enabledAt:account.mfa?.enabledAt || '' }
  };
}
function readState() {
  const raw = store.readJson(STORE_KEY, initialState());
  return {
    ...initialState(),
    ...(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}),
    accounts:Array.isArray(raw?.accounts) ? raw.accounts.map(normalizeAccount) : [],
    sessions:Array.isArray(raw?.sessions) ? raw.sessions : [],
    passwordResetRequests:Array.isArray(raw?.passwordResetRequests) ? raw.passwordResetRequests : []
  };
}
function writeState(state) { const next = { ...state, schemaVersion:'1.3.0', updatedAt:now() }; store.writeJson(STORE_KEY, next); return next; }
function base64url(buffer) { return Buffer.from(buffer).toString('base64url'); }
function hashToken(token) { return crypto.createHash('sha256').update(String(token || '')).digest('hex'); }
function hashPassword(password, salt = crypto.randomBytes(16)) { const derived = crypto.scryptSync(String(password), salt, 64, { N:16384, r:8, p:1 }); return { salt:base64url(salt), hash:base64url(derived) }; }
function verifyPassword(password, account) {
  try {
    const salt = Buffer.from(account.passwordSalt, 'base64url');
    const expected = Buffer.from(account.passwordHash, 'base64url');
    const actual = crypto.scryptSync(String(password), salt, expected.length, { N:16384, r:8, p:1 });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch { return false; }
}
function parseCookies(req) {
  const result = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) result[decodeURIComponent(part.slice(0, i).trim())] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return result;
}
function sessionCookie(token, clear = false) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);
  const maxAge = clear ? 0 : SESSION_DAYS * 86400;
  return `${SESSION_COOKIE}=${clear ? '' : encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
function publicAccount(account) {
  const normalized = normalizeAccount(account);
  return {
    id:normalized.id, email:normalized.email, displayName:normalized.displayName, accountType:normalized.accountType,
    status:normalized.status, professionalIds:normalized.professionalIds, firmIds:normalized.firmIds,
    pendingClaimProfessionalIds:normalized.pendingClaimProfessionalIds, pendingClaimFirmIds:normalized.pendingClaimFirmIds,
    createdAt:normalized.createdAt, lastLoginAt:normalized.lastLoginAt || '', membershipTarget:normalized.membershipTarget || null, mfaEnabled:Boolean(normalized.mfa?.enabled)
  };
}
function cleanupSessions(state) { const t = Date.now(); state.sessions = state.sessions.filter(x => Date.parse(x.expiresAt) > t); }
function issueSession(accountId) {
  const state = readState(); cleanupSessions(state);
  const token = store.secureToken('prosession'); const createdAt = now(); const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  state.sessions.push({ id:store.uid('prosession', 8), accountId, tokenHash:hashToken(token), createdAt, expiresAt, lastSeenAt:createdAt });
  writeState(state); return { token, expiresAt, cookie:sessionCookie(token) };
}
function accountFromRequest(req) {
  const token = parseCookies(req)[SESSION_COOKIE] || ''; if (!token) return null;
  const state = readState(); cleanupSessions(state); const session = state.sessions.find(x => x.tokenHash === hashToken(token));
  if (!session) { writeState(state); return null; }
  const account = state.accounts.find(x => x.id === session.accountId && x.status === 'active'); if (!account) return null;
  session.lastSeenAt = now(); writeState(state); return { account:publicAccount(account), rawAccount:account, session };
}
function officialAttorneySeedInput(input, address, displayName) {
  const registrationNumber = clean(input.registrationNumber || input.officialRegistrationNumber, 80);
  if (!registrationNumber) return {};
  return {
    seededFromPublicInfo:true,
    externalSourceId:`nys-attorney-registration:${registrationNumber}`,
    externalSourceIds:[`nys-attorney-registration:${registrationNumber}`],
    publicFacts:{ registrationNumber, directoryInclusion:'Official New York attorney registration dataset record selected during signup.' },
    sourceRecords:[{
      sourceType:'official attorney registration dataset', sourceName:'NYS Attorney Registrations', sourceUrl:NY_ATTORNEY_SOURCE_URL,
      authorityLevel:'primary', reviewStatus:'pending review', externalSourceId:registrationNumber,
      datasetId:'eqw2-r5nb', publisher:'New York State Unified Court System',
      factsSupported:['Attorney name','New York registration number','Public registration record selected during signup'],
      termsOrUseNotes:'Imported only from official public data. Credential and identity verification remain required before profile claim or marketplace eligibility.',
      notes:`Signup selected official registration record ${registrationNumber} for ${displayName || address}.`
    }],
    credentials:[{
      credentialType:'New York attorney registration', jurisdiction:'New York', identifier:registrationNumber,
      status:'pending', verificationSource:NY_ATTORNEY_SOURCE_URL,
      notes:'Official record selected during signup. Owner verification is required before the credential may be marked active.'
    }]
  };
}
function createAccount(input = {}) {
  const state = readState(); const address = email(input.email); const password = String(input.password || '');
  const displayName = clean(input.displayName || input.contactName, 180); const accountType = ['individual','firm'].includes(input.accountType) ? input.accountType : 'individual';
  if (!address) return { error:'Add a valid professional email address.' };
  if (password.length < PASSWORD_MIN_LENGTH) return { error:`Use a password with at least ${PASSWORD_MIN_LENGTH} characters.` };
  if (displayName.length < 2) return { error:'Add your name or firm contact name.' };
  if (state.accounts.some(x => x.email === address)) return { error:'An account with that email address already exists.' };
  const pw = hashPassword(password);
  const account = normalizeAccount({
    id:store.uid('proacct',10), email:address, passwordSalt:pw.salt, passwordHash:pw.hash, displayName, accountType, status:'active',
    professionalIds:[], firmIds:[], pendingClaimProfessionalIds:[], pendingClaimFirmIds:[], membershipTarget:null, createdAt:now(), updatedAt:now(), lastLoginAt:now(),
    termsAcceptedAt:input.acceptTerms ? now() : '', privacyAcceptedAt:input.acceptPrivacy ? now() : '', sourceCampaignCode:clean(input.campaignCode,80)
  });
  if (!account.termsAcceptedAt || !account.privacyAcceptedAt) return { error:'Accept the professional membership terms and privacy notice to create an account.' };
  if (accountType === 'firm') {
    const requestedFirmId=clean(input.claimFirmId,180);
    if (requestedFirmId) {
      const requestedFirm=marketplace.getOwnerData().firms.find(x=>x.id===requestedFirmId || x.publicProfileSlug===requestedFirmId);
      if (!requestedFirm) return { error:'The firm profile you selected could not be found. Return to the directory and try again.' };
    }
    if (!requestedFirmId) {
      const created = marketplace.createFirm({
        name:clean(input.firmName || displayName,180), email:address, phone:input.phone, website:input.website,
        locations:input.officeLocation ? [input.officeLocation] : [], jurisdictions:input.jurisdictions || ['New York'],
        portalEligibility:input.portalEligibility || ['general-smarter-justice-start'], seatCount:input.seatCount || 2,
        billingAdministratorName:displayName, billingAdministratorEmail:address, outreachCampaignId:clean(input.campaignCode,80)
      }, 'professional-signup');
      if (created.error) return created;
      account.firmIds = [created.firm.id];
      account.membershipTarget = { kind:'firm', id:created.firm.id, planId:'nyc-founding-firm', seatCount:created.firm.seatCount || 2 };
    }
  } else {
    const requestedProfessionalId=clean(input.claimProfessionalId,180);
    if (requestedProfessionalId) {
      const requestedProfessional=marketplace.getOwnerData().professionals.find(x=>x.id===requestedProfessionalId || x.publicProfileSlug===requestedProfessionalId);
      if (!requestedProfessional) return { error:'The professional profile you selected could not be found. Return to the directory and try again.' };
    } else {
      const officialSeed = officialAttorneySeedInput(input, address, displayName);
      const created = marketplace.createProfessional({
        ...officialSeed, displayName, firstName:input.firstName, lastName:input.lastName,
        professionalType:input.professionalType || 'attorney', email:address, phone:input.phone, website:input.website,
        officeLocations:input.officeLocation ? [input.officeLocation] : [], jurisdictions:input.jurisdictions || ['New York'],
        practiceAreas:input.practiceAreas || [], portalEligibility:input.portalEligibility || ['general-smarter-justice-start'],
        outreachCampaignId:clean(input.campaignCode,80)
      }, 'professional-signup');
      if (created.error) return created;
      account.professionalIds = [created.professional.id];
      account.membershipTarget = { kind:'professional', id:created.professional.id, planId:'nyc-founding-professional', seatCount:1 };
      if (officialSeed.seededFromPublicInfo) {
        marketplace.updateProfessional(created.professional.id, {
          profileStatus:'claim pending', claimStatus:'verification pending', publicProfileEnabled:false,
          ownerApprovalStatus:'pending', verificationStatus:'in progress'
        }, 'professional-signup');
      }
    }
  }
  state.accounts.push(account); writeState(state);
  store.addAudit({ actor:'professional-account', action:'professional_account_created', details:{ accountId:account.id, accountType, emailDomain:address.split('@')[1] || '', campaignCode:account.sourceCampaignCode } });
  const session = issueSession(account.id); return { account:publicAccount(account), session };
}
function validateSecondFactor(account, input = {}) {
  if (!account.mfa?.enabled) return { ok:true, method:'not-enabled' };
  const code = String(input.code || input.mfaCode || '').trim();
  if (security.verifyTotp(account.mfa.secret, code)) return { ok:true, method:'totp' };
  const recovery = security.consumeRecoveryCode(code, account.mfa.recoveryCodeHashes || []);
  if (recovery.valid) { account.mfa.recoveryCodeHashes = recovery.remaining; return { ok:true, method:'recovery' }; }
  return { ok:false, error:'Enter a current authenticator code or an unused recovery code.', mfaRequired:true };
}
function login(input = {}) {
  const state = readState(); const address = email(input.email); const account = state.accounts.find(x => x.email === address);
  if (!account || !verifyPassword(input.password, account)) return { error:'Email or password was not recognized.' };
  if (account.status !== 'active') return { error:'This professional account is not active.' };
  const secondFactor = validateSecondFactor(account, input); if (!secondFactor.ok) { writeState(state); return secondFactor; }
  account.lastLoginAt = now(); account.updatedAt = now(); writeState(state);
  store.addAudit({ actor:'professional-account', action:'professional_account_login', details:{ accountId:account.id, secondFactor:secondFactor.method } });
  return { account:publicAccount(account), session:issueSession(account.id) };
}
function logout(req) {
  const token = parseCookies(req)[SESSION_COOKIE] || ''; const state = readState();
  if (token) state.sessions = state.sessions.filter(x => x.tokenHash !== hashToken(token)); writeState(state);
  return { cookie:sessionCookie('', true) };
}

async function requestPasswordReset(addressValue) {
  const state = readState(); const address = email(addressValue); const account = state.accounts.find(x => x.email === address && x.status === 'active');
  state.passwordResetRequests = state.passwordResetRequests.filter(x => Date.parse(x.expiresAt) > Date.now() && !x.usedAt);
  if (!account) { writeState(state); return { accepted:true }; }
  state.passwordResetRequests = state.passwordResetRequests.filter(x => x.accountId !== account.id);
  const token = store.secureToken('proreset'); const createdAt = now(); const expiresAt = new Date(Date.now() + 30 * 60000).toISOString();
  state.passwordResetRequests.push({ id:store.uid('proreset',8), accountId:account.id, tokenHash:hashToken(token), createdAt, expiresAt, usedAt:'' }); writeState(state);
  const resetLink = `${String(process.env.APP_BASE_URL || '').replace(/\/$/,'')}/professional-login.html#reset_token=${encodeURIComponent(token)}`;
  let delivery = { sent:false, reason:'delivery-error' };
  try {
    delivery = await mailer.sendNotification({ kind:'professional_password_reset', to:account.email, payload:{ message:'A password reset was requested for your professional account.', continuationLink:resetLink } });
  } catch {}
  store.addAudit({ actor:'professional-account', action:'professional_password_reset_requested', details:{ accountId:account.id, delivery:delivery.sent ? 'sent' : clean(delivery.reason || 'not-sent',80) } });
  return { accepted:true, ...(process.env.NODE_ENV === 'test' ? { testToken:token } : {}) };
}
function resetPassword(tokenValue, password) {
  const state = readState(); const tokenHash = hashToken(String(tokenValue || '')); const request = state.passwordResetRequests.find(x => x.tokenHash === tokenHash && !x.usedAt && Date.parse(x.expiresAt) > Date.now());
  if (!request) return { error:'This password-reset link is invalid or expired.' };
  if (String(password || '').length < PASSWORD_MIN_LENGTH) return { error:`Use a password with at least ${PASSWORD_MIN_LENGTH} characters.` };
  const account = state.accounts.find(x => x.id === request.accountId && x.status === 'active'); if (!account) return { error:'This professional account is not active.' };
  const pw = hashPassword(password); account.passwordSalt = pw.salt; account.passwordHash = pw.hash; account.updatedAt = now(); for (const item of state.passwordResetRequests) if (item.accountId === account.id) item.usedAt = now(); state.sessions = state.sessions.filter(x => x.accountId !== account.id); writeState(state);
  store.addAudit({ actor:'professional-account', action:'professional_password_reset_completed', details:{ accountId:account.id } }); return { account:publicAccount(account) };
}
function beginMfa(req) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id); const secret = security.generateTotpSecret(); account.mfa.pendingSecret = secret; account.updatedAt = now(); writeState(state);
  return { secret, otpAuthUri:security.otpAuthUri({issuer:'Smarter Justice',label:account.email,secret}), account:publicAccount(account) };
}
function confirmMfa(req, code) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id); const secret = account.mfa?.pendingSecret || '';
  if (!secret || !security.verifyTotp(secret,code)) return { error:'The authenticator code could not be verified.' };
  const recoveryCodes = security.generateRecoveryCodes(10); account.mfa = {enabled:true,secret,pendingSecret:'',recoveryCodeHashes:security.hashRecoveryCodes(recoveryCodes),enabledAt:now()}; account.updatedAt=now(); state.sessions=state.sessions.filter(x=>x.accountId!==account.id || x.id===auth.session.id); writeState(state);
  store.addAudit({ actor:'professional-account', action:'professional_mfa_enabled', details:{ accountId:account.id } }); return { account:publicAccount(account), recoveryCodes };
}
function disableMfa(req, input = {}) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id);
  if (!verifyPassword(String(input.password || ''),account)) return { error:'Enter your current password.' };
  if (account.mfa?.enabled && !security.verifyTotp(account.mfa.secret,input.code)) return { error:'Enter a current authenticator code.' };
  account.mfa={enabled:false,secret:'',pendingSecret:'',recoveryCodeHashes:[],enabledAt:''}; account.updatedAt=now(); writeState(state); store.addAudit({actor:'professional-account',action:'professional_mfa_disabled',details:{accountId:account.id}}); return {account:publicAccount(account)};
}
function revokeOtherSessions(req) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  const state = readState(); state.sessions = state.sessions.filter(x => x.id === auth.session.id); writeState(state); store.addAudit({actor:'professional-account',action:'professional_other_sessions_revoked',details:{accountId:auth.account.id}}); return {revoked:true};
}

function attachClaim(accountId, professionalId) {
  const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return { error:'Professional account not found.' };
  const owner = marketplace.getOwnerData(); const pro = owner.professionals.find(x => x.id === professionalId || x.publicProfileSlug === professionalId);
  if (!pro) return { error:'Professional profile not found.' };
  if ((account.professionalIds || []).includes(pro.id)) return { account:publicAccount(account), alreadyLinked:true };
  if ((account.pendingClaimProfessionalIds || []).includes(pro.id)) return { account:publicAccount(account), alreadyPending:true };
  const duplicateOwner = state.accounts.find(x => x.id !== account.id && (x.professionalIds || []).includes(pro.id));
  if (duplicateOwner) return { error:'That profile is already connected to another professional account.' };
  const duplicatePending = state.accounts.find(x => x.id !== account.id && (x.pendingClaimProfessionalIds || []).includes(pro.id));
  if (duplicatePending) return { error:'A claim request for that profile is already under review.' };
  const request = marketplace.createProfileRequest({
    profileId:pro.id, requestType:'claim', requesterName:account.displayName, requesterEmail:account.email,
    requesterRelationship:'Professional account holder requesting profile control',
    details:'Professional account requests control of this public profile. Identity, authority, and credential review are required before account control is granted.',
    evidenceUrls:[]
  }, 'professional-account');
  if (request.error) return request;
  account.pendingClaimProfessionalIds = [...(account.pendingClaimProfessionalIds || []), pro.id]; account.updatedAt = now(); writeState(state);
  store.addAudit({ actor:'professional-account', action:'public_profile_claim_requested', details:{ accountId:account.id, professionalId:pro.id, profileRequestId:request.request.id } });
  return { account:publicAccount(account), profileRequest:request.request };
}
function attachFirmClaim(accountId, firmId) {
  const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return { error:'Professional account not found.' };
  const owner = marketplace.getOwnerData(); const firm = owner.firms.find(x => x.id === firmId || x.publicProfileSlug === firmId);
  if (!firm) return { error:'Firm profile not found.' };
  if ((account.firmIds || []).includes(firm.id)) return { account:publicAccount(account), alreadyLinked:true };
  if ((account.pendingClaimFirmIds || []).includes(firm.id)) return { account:publicAccount(account), alreadyPending:true };
  const duplicateOwner = state.accounts.find(x => x.id !== account.id && (x.firmIds || []).includes(firm.id));
  if (duplicateOwner) return { error:'That firm profile is already connected to another account.' };
  const duplicatePending = state.accounts.find(x => x.id !== account.id && (x.pendingClaimFirmIds || []).includes(firm.id));
  if (duplicatePending) return { error:'A claim request for that firm profile is already under review.' };
  const request = marketplace.createProfileRequest({
    profileId:firm.id, requestType:'claim', requesterName:account.displayName, requesterEmail:account.email,
    requesterRelationship:'Firm account holder requesting firm profile control',
    details:'A firm account requests control of this public firm profile. Identity and authority review are required before account control is granted.',
    evidenceUrls:[]
  }, 'professional-account');
  if (request.error) return request;
  account.pendingClaimFirmIds = [...(account.pendingClaimFirmIds || []), firm.id]; account.updatedAt = now(); writeState(state);
  store.addAudit({ actor:'professional-account', action:'public_firm_profile_claim_requested', details:{ accountId:account.id, firmId:firm.id, profileRequestId:request.request.id } });
  return { account:publicAccount(account), profileRequest:request.request };
}
function ownerApproveFirmClaim(accountId, firmId, profileRequestId = '') {
  const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return { error:'Professional account not found.' };
  const owner = marketplace.getOwnerData(); const firm = owner.firms.find(x => x.id === firmId || x.publicProfileSlug === firmId); if (!firm) return { error:'Firm profile not found.' };
  const otherOwner = state.accounts.find(x => x.id !== account.id && (x.firmIds || []).includes(firm.id)); if (otherOwner) return { error:'That firm profile is already connected to another account.' };
  const pendingForAccount = (account.pendingClaimFirmIds || []).includes(firm.id);
  if (!pendingForAccount && !(account.firmIds || []).includes(firm.id)) return { error:'That firm profile is not pending approval for this account.' };
  if (profileRequestId) {
    const request = owner.profileRequests.find(x => x.id === profileRequestId);
    if (!request || request.profileId !== firm.id || request.requesterEmail !== account.email || request.requestType !== 'claim') return { error:'The selected firm claim request does not match this account and profile.' };
  }
  account.pendingClaimFirmIds = (account.pendingClaimFirmIds || []).filter(x => x !== firm.id);
  if (!(account.firmIds || []).includes(firm.id)) account.firmIds.push(firm.id);
  account.membershipTarget = { kind:'firm', id:firm.id, planId:'nyc-founding-firm', seatCount:firm.seatCount || 2 }; account.updatedAt = now(); writeState(state);
  marketplace.updateFirm(firm.id, { claimStatus:'claimed', profileStatus:firm.verificationStatus === 'verified' ? 'verified' : 'claimed' }, 'owner-firm-claim-approval');
  if (profileRequestId) marketplace.updateProfileRequest(profileRequestId, { status:'approved', resolutionNotes:'Owner approved account control of this firm profile. Membership, credential verification, and marketplace eligibility remain separate.' });
  store.addAudit({ actor:'owner-control-center', action:'firm_profile_account_link_approved', details:{ accountId:account.id, firmId:firm.id, profileRequestId } });
  return { account:publicAccount(account), firmId:firm.id };
}
function ownerApproveClaim(accountId, professionalId, profileRequestId = '') {
  const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return { error:'Professional account not found.' };
  const owner = marketplace.getOwnerData(); const pro = owner.professionals.find(x => x.id === professionalId || x.publicProfileSlug === professionalId); if (!pro) return { error:'Professional profile not found.' };
  const otherOwner = state.accounts.find(x => x.id !== account.id && (x.professionalIds || []).includes(pro.id)); if (otherOwner) return { error:'That profile is already connected to another professional account.' };
  const pendingForAccount = (account.pendingClaimProfessionalIds || []).includes(pro.id);
  if (!pendingForAccount && !(account.professionalIds || []).includes(pro.id)) return { error:'That profile is not pending approval for this professional account.' };
  if (profileRequestId) {
    const request = owner.profileRequests.find(x => x.id === profileRequestId);
    if (!request || request.profileId !== pro.id || request.requesterEmail !== account.email || request.requestType !== 'claim') return { error:'The selected profile claim request does not match this account and profile.' };
  }
  account.pendingClaimProfessionalIds = (account.pendingClaimProfessionalIds || []).filter(x => x !== pro.id);
  if (!(account.professionalIds || []).includes(pro.id)) account.professionalIds.push(pro.id);
  account.membershipTarget = { kind:'professional', id:pro.id, planId:'nyc-founding-professional', seatCount:1 }; account.updatedAt = now(); writeState(state);
  marketplace.updateProfessional(pro.id, { claimStatus:'claimed', profileStatus:pro.verificationStatus === 'verified' ? 'verified' : 'claimed' }, 'owner-claim-approval');
  if (profileRequestId) marketplace.updateProfileRequest(profileRequestId, { status:'approved', resolutionNotes:'Owner approved account control of this profile. Credential verification and marketplace eligibility remain separate.' });
  store.addAudit({ actor:'owner-control-center', action:'professional_profile_account_link_approved', details:{ accountId:account.id, professionalId:pro.id, profileRequestId } });
  return { account:publicAccount(account), professionalId:pro.id };
}
function dashboard(req) {
  const auth = accountFromRequest(req); if (!auth) return null; const owner = marketplace.getOwnerData();
  const professionals = owner.professionals.filter(x => (auth.rawAccount.professionalIds || []).includes(x.id));
  const pendingClaimProfiles = owner.professionals.filter(x => (auth.rawAccount.pendingClaimProfessionalIds || []).includes(x.id));
  const firms = owner.firms.filter(x => (auth.rawAccount.firmIds || []).includes(x.id));
  const pendingClaimFirms = owner.firms.filter(x => (auth.rawAccount.pendingClaimFirmIds || []).includes(x.id));
  const requests = owner.profileRequests.filter(x => x.requesterEmail === auth.rawAccount.email || professionals.some(p => p.id === x.profileId) || pendingClaimProfiles.some(p => p.id === x.profileId) || firms.some(f => f.id === x.profileId) || pendingClaimFirms.some(f => f.id === x.profileId));
  return { account:auth.account, professionals, pendingClaimProfiles, firms, pendingClaimFirms, profileRequests:requests, membershipPlans:owner.membershipPlans.filter(x => ['active','pilot'].includes(x.status)), firmVolumeDiscountTiers:owner.firmVolumeDiscountTiers, featureStatus:marketplace.publicFeatureStatus() };
}
function updateProfessionalForAccount(req, professionalId, input) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  if (!(auth.rawAccount.professionalIds || []).includes(professionalId)) return { forbidden:true };
  const permitted = {
    displayName:input.displayName, firstName:input.firstName, lastName:input.lastName, email:auth.rawAccount.email,
    phone:input.phone, website:input.website, photoUrl:input.photoUrl, biography:input.biography, languages:input.languages,
    officeLocations:input.officeLocations, jurisdictions:input.jurisdictions, practiceAreas:input.practiceAreas,
    portalEligibility:input.portalEligibility, consultationServices:input.consultationServices
  };
  return marketplace.updateProfessional(professionalId, permitted, 'professional-account');
}
function updateFirmForAccount(req, firmId, input) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  if (!(auth.rawAccount.firmIds || []).includes(firmId)) return { forbidden:true };
  const permitted = {
    name:input.name, email:auth.rawAccount.email, phone:input.phone, website:input.website, locations:input.locations,
    jurisdictions:input.jurisdictions, portalEligibility:input.portalEligibility, seatCount:input.seatCount,
    billingAdministratorName:input.billingAdministratorName, billingAdministratorEmail:auth.rawAccount.email
  };
  return marketplace.updateFirm(firmId, permitted, 'professional-account');
}
function addProfessionalToFirm(req, firmId, input = {}) {
  const auth = accountFromRequest(req); if (!auth) return { unauthorized:true };
  if (!(auth.rawAccount.firmIds || []).includes(firmId)) return { forbidden:true };
  const owner = marketplace.getOwnerData(); const firm = owner.firms.find(x => x.id === firmId); if (!firm) return { error:'Firm record not found.' };
  const currentCount = owner.professionals.filter(x => x.firmId === firmId && !['archived'].includes(x.profileStatus)).length;
  if (currentCount >= Number(firm.seatCount || 1)) return { error:'Add or purchase another firm seat before adding another professional profile.' };
  const displayName = clean(input.displayName || [input.firstName,input.lastName].filter(Boolean).join(' '),180);
  if (displayName.length < 2) return { error:'Add the professional’s name.' };
  const created = marketplace.createProfessional({
    displayName, firstName:input.firstName, lastName:input.lastName, professionalType:input.professionalType || 'attorney',
    email:input.email, phone:input.phone, website:input.website, firmId,
    officeLocations:Array.isArray(input.officeLocations) ? input.officeLocations : (input.officeLocation ? [input.officeLocation] : firm.locations),
    jurisdictions:input.jurisdictions || firm.jurisdictions || ['New York'], practiceAreas:input.practiceAreas || [],
    portalEligibility:input.portalEligibility || firm.portalEligibility || ['general-smarter-justice-start'],
    outreachCampaignId:firm.outreachCampaignId || '',
    membership:{ coveredByFirmId:firmId, status:'none', planId:'', seatCount:1, foundingRate:Boolean(firm.membership?.foundingRate) }
  }, 'firm-professional-account');
  if (created.error) return created;
  if (!(auth.rawAccount.professionalIds || []).includes(created.professional.id)) {
    const state = readState(); const account = state.accounts.find(x => x.id === auth.account.id);
    account.professionalIds = [...(account.professionalIds || []), created.professional.id]; account.updatedAt = now(); writeState(state);
  }
  store.addAudit({ actor:'professional-account', action:'firm_professional_profile_added', details:{ accountId:auth.account.id, firmId, professionalId:created.professional.id } });
  return { professional:created.professional, account:getAccountById(auth.account.id) };
}
function setMembershipTarget(accountId, target) { const state = readState(); const account = state.accounts.find(x => x.id === accountId); if (!account) return null; account.membershipTarget = target; account.updatedAt = now(); writeState(state); return publicAccount(account); }
function getAccountById(id) { const state = readState(); const account = state.accounts.find(x => x.id === id); return account ? publicAccount(account) : null; }
function ownerSummary() { const state = readState(); return { accounts:state.accounts.map(publicAccount), activeSessions:state.sessions.filter(x => Date.parse(x.expiresAt) > Date.now()).length, pendingProfileClaims:state.accounts.reduce((n,x) => n + (x.pendingClaimProfessionalIds || []).length + (x.pendingClaimFirmIds || []).length, 0) }; }

module.exports = {
  STORE_KEY, SESSION_COOKIE, PASSWORD_MIN_LENGTH, sessionCookie, accountFromRequest, createAccount, login, logout, requestPasswordReset, resetPassword, beginMfa, confirmMfa, disableMfa, revokeOtherSessions,
  attachClaim, attachFirmClaim, ownerApproveClaim, ownerApproveFirmClaim, dashboard, updateProfessionalForAccount, updateFirmForAccount, addProfessionalToFirm, setMembershipTarget, getAccountById, ownerSummary
};
