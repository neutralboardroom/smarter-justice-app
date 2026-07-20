const store = require('./store');
const security = require('./accountSecurity');

const STORE_KEY = 'ownerAccounts.json';
const SESSION_COOKIE = 'sj_owner_session';
const SESSION_HOURS = Math.max(1, Math.min(24, Number(process.env.OWNER_SESSION_HOURS || 8)));
const PASSWORD_MIN_LENGTH = 14;

function now(){ return store.now(); }
function initialState(){ return { schemaVersion:'1.0.0', accounts:[], sessions:[], updatedAt:'' }; }
function normalizeAccount(account = {}){
  return {
    ...account,
    role:'owner',
    status:account.status || 'active',
    mfa:{ enabled:Boolean(account.mfa?.enabled), secret:account.mfa?.secret || '', pendingSecret:account.mfa?.pendingSecret || '', recoveryCodeHashes:Array.isArray(account.mfa?.recoveryCodeHashes) ? account.mfa.recoveryCodeHashes : [], enabledAt:account.mfa?.enabledAt || '' }
  };
}
function readState(){
  const raw = store.readJson(STORE_KEY, initialState());
  return { ...initialState(), ...(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}), accounts:Array.isArray(raw?.accounts) ? raw.accounts.map(normalizeAccount) : [], sessions:Array.isArray(raw?.sessions) ? raw.sessions : [] };
}
function writeState(state){ const next={...state,schemaVersion:'1.0.0',updatedAt:now()}; store.writeJson(STORE_KEY,next); return next; }
function publicAccount(account){ return account ? { id:account.id,email:account.email,displayName:account.displayName,role:'owner',status:account.status,mfaEnabled:Boolean(account.mfa?.enabled),createdAt:account.createdAt,lastLoginAt:account.lastLoginAt || '' } : null; }
function cleanupSessions(state){ const current=Date.now(); state.sessions=state.sessions.filter(session=>Date.parse(session.expiresAt)>current); }
function sessionCookie(token, clear=false){ return security.cookie(SESSION_COOKIE,token,{clear,maxAgeSeconds:SESSION_HOURS*3600,sameSite:'Strict'}); }
function issueSession(accountId, details={}){
  const state=readState(); cleanupSessions(state);
  const token=store.secureToken('ownersession'); const createdAt=now(); const expiresAt=new Date(Date.now()+SESSION_HOURS*3600000).toISOString();
  state.sessions.push({id:store.uid('ownersession',8),accountId,tokenHash:security.hashToken(token),createdAt,expiresAt,lastSeenAt:createdAt,ip:security.clean(details.ip,120),userAgent:security.clean(details.userAgent,300)});
  writeState(state); return {token,expiresAt,cookie:sessionCookie(token)};
}
function accountFromRequest(req){
  const token=security.parseCookies(req)[SESSION_COOKIE] || ''; if(!token) return null;
  const state=readState(); cleanupSessions(state); const session=state.sessions.find(item=>item.tokenHash===security.hashToken(token));
  if(!session){ writeState(state); return null; }
  const account=state.accounts.find(item=>item.id===session.accountId && item.status==='active'); if(!account) return null;
  session.lastSeenAt=now(); writeState(state); return {account:publicAccount(account),rawAccount:account,session};
}
function bootstrapFromEnvironment(){
  const address=security.normalizeEmail(process.env.OWNER_ACCOUNT_EMAIL || '');
  const password=String(process.env.OWNER_ACCOUNT_PASSWORD || '');
  if(!address && !password) return {configured:false,created:false,message:'Owner account environment credentials are not configured.'};
  if(!address || password.length<PASSWORD_MIN_LENGTH) return {configured:false,created:false,error:`Set OWNER_ACCOUNT_EMAIL and an OWNER_ACCOUNT_PASSWORD with at least ${PASSWORD_MIN_LENGTH} characters.`};
  const state=readState();
  const existing=state.accounts.find(item=>item.email===address);
  if(existing) return {configured:true,created:false,account:publicAccount(existing)};
  if(state.accounts.length) return {configured:true,created:false,message:'An owner account already exists; environment bootstrap did not add another account.'};
  const pw=security.hashPassword(password);
  const account=normalizeAccount({id:store.uid('owneracct',10),email:address,displayName:security.clean(process.env.OWNER_ACCOUNT_NAME || 'Smarter Justice Owner',180),passwordSalt:pw.salt,passwordHash:pw.hash,status:'active',createdAt:now(),updatedAt:now(),lastLoginAt:'',mfa:{enabled:false,secret:'',pendingSecret:'',recoveryCodeHashes:[],enabledAt:''}});
  state.accounts.push(account); writeState(state); store.addAudit({actor:'system',action:'owner_account_bootstrapped',details:{accountId:account.id}});
  return {configured:true,created:true,account:publicAccount(account)};
}
function validateSecondFactor(account, input={}){
  if(!account.mfa?.enabled) return {ok:true,method:'not-enabled'};
  const code=String(input.code || input.mfaCode || '').trim();
  if(security.verifyTotp(account.mfa.secret,code)) return {ok:true,method:'totp'};
  const recovery=security.consumeRecoveryCode(code,account.mfa.recoveryCodeHashes || []);
  if(recovery.valid){ account.mfa.recoveryCodeHashes=recovery.remaining; return {ok:true,method:'recovery'}; }
  return {ok:false,error:'Enter a current authenticator code or an unused recovery code.',mfaRequired:true};
}
function login(input={}, details={}){
  const state=readState(); cleanupSessions(state); const address=security.normalizeEmail(input.email); const account=state.accounts.find(item=>item.email===address && item.status==='active');
  if(!account || !security.verifyPassword(String(input.password || ''),account)) return {error:'The owner email or password was not recognized.'};
  const secondFactor=validateSecondFactor(account,input); if(!secondFactor.ok){ writeState(state); return secondFactor; }
  account.lastLoginAt=now(); account.updatedAt=now(); writeState(state);
  const session=issueSession(account.id,details); store.addAudit({actor:'owner-account',action:'owner_login',details:{accountId:account.id,secondFactor:secondFactor.method}});
  return {account:publicAccount(account),session};
}
function logout(req){
  const token=security.parseCookies(req)[SESSION_COOKIE] || ''; const state=readState();
  if(token) state.sessions=state.sessions.filter(item=>item.tokenHash!==security.hashToken(token));
  writeState(state); return {cookie:sessionCookie('',true)};
}
function beginMfa(req){
  const auth=accountFromRequest(req); if(!auth) return {unauthorized:true};
  const state=readState(); const account=state.accounts.find(item=>item.id===auth.account.id); const secret=security.generateTotpSecret();
  account.mfa.pendingSecret=secret; account.updatedAt=now(); writeState(state);
  return {secret,otpAuthUri:security.otpAuthUri({issuer:'Smarter Justice',label:account.email,secret}),account:publicAccount(account)};
}
function confirmMfa(req, code){
  const auth=accountFromRequest(req); if(!auth) return {unauthorized:true};
  const state=readState(); const account=state.accounts.find(item=>item.id===auth.account.id); const secret=account.mfa?.pendingSecret || '';
  if(!secret || !security.verifyTotp(secret,code)) return {error:'The authenticator code could not be verified.'};
  const recoveryCodes=security.generateRecoveryCodes(10);
  account.mfa={enabled:true,secret,pendingSecret:'',recoveryCodeHashes:security.hashRecoveryCodes(recoveryCodes),enabledAt:now()}; account.updatedAt=now();
  state.sessions=state.sessions.filter(item=>item.accountId!==account.id || item.id===auth.session.id); writeState(state);
  store.addAudit({actor:'owner-account',action:'owner_mfa_enabled',details:{accountId:account.id}});
  return {account:publicAccount(account),recoveryCodes};
}
function rotateRecoveryCodes(req, input={}){
  const auth=accountFromRequest(req); if(!auth) return {unauthorized:true};
  const state=readState(); const account=state.accounts.find(item=>item.id===auth.account.id);
  if(!security.verifyPassword(String(input.password || ''),account)) return {error:'Enter the current owner password.'};
  if(account.mfa?.enabled && !security.verifyTotp(account.mfa.secret,input.code)) return {error:'Enter a current authenticator code.'};
  const recoveryCodes=security.generateRecoveryCodes(10); account.mfa.recoveryCodeHashes=security.hashRecoveryCodes(recoveryCodes); account.updatedAt=now(); writeState(state);
  store.addAudit({actor:'owner-account',action:'owner_recovery_codes_rotated',details:{accountId:account.id}}); return {recoveryCodes};
}
function revokeOtherSessions(req){
  const auth=accountFromRequest(req); if(!auth) return {unauthorized:true};
  const state=readState(); state.sessions=state.sessions.filter(item=>item.id===auth.session.id); writeState(state);
  store.addAudit({actor:'owner-account',action:'owner_other_sessions_revoked',details:{accountId:auth.account.id}}); return {revoked:true};
}
function status(){ const state=readState(); cleanupSessions(state); return {accountCount:state.accounts.length,activeSessions:state.sessions.length,mfaEnabledAccounts:state.accounts.filter(item=>item.mfa?.enabled).length,accountAuthenticationReady:state.accounts.length>0,mfaRequiredForAll:state.accounts.length>0 && state.accounts.every(item=>item.mfa?.enabled)}; }

module.exports={STORE_KEY,SESSION_COOKIE,PASSWORD_MIN_LENGTH,bootstrapFromEnvironment,accountFromRequest,login,logout,beginMfa,confirmMfa,rotateRecoveryCodes,revokeOtherSessions,status,sessionCookie,publicAccount};
