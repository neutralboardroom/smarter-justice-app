const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const security = require('../lib/accountSecurity');

const port = 3963;
const base = `http://127.0.0.1:${port}`;
const tempStorage = fs.mkdtempSync(path.join(os.tmpdir(), 'smarter-justice-security-'));
const ownerEmail = 'owner-security@example.test';
const ownerPassword = 'OwnerPassword!12345';
const server = spawn(process.execPath, ['server.js'], {
  cwd:path.join(__dirname,'..'),
  env:{...process.env,NODE_ENV:'test',PORT:String(port),APP_BASE_URL:base,SMARTER_JUSTICE_STORAGE_DIR:tempStorage,OWNER_ACCOUNT_EMAIL:ownerEmail,OWNER_ACCOUNT_PASSWORD:ownerPassword,OWNER_ACCOUNT_NAME:'Security Test Owner',OWNER_NOTIFICATION_EMAIL:'',SMTP_HOST:'',SMTP_USER:'',SMTP_PASS:''}
});
let log=''; server.stdout.on('data',d=>log+=d); server.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function result(url,opts={}){ const response=await fetch(url,opts); const text=await response.text(); let data; try{data=JSON.parse(text);}catch{data=text;} return {response,data,text}; }
async function json(url,opts={}){ const r=await result(url,opts); if(!r.response.ok)throw new Error(`${r.response.status}: ${JSON.stringify(r.data)}`); return r.data; }
function post(body={},headers={}){ return {method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)}; }
function cookieFrom(response){ return String(response.headers.get('set-cookie')||'').split(';')[0]; }

(async()=>{
  try{
    for(let i=0;i<60&&!log.includes('listening');i++){ if(server.exitCode!==null)throw new Error(`Server exited: ${log}`); await wait(100); }
    const status=await json(`${base}/api/owner/auth/status`);
    assert.equal(status.accountAuthenticationReady,true);
    assert.equal(status.authenticated,false);
    let r=await result(`${base}/api/owner/auth/login`,post({email:ownerEmail,password:'wrong-password'}));
    assert.equal(r.response.status,401);
    r=await result(`${base}/api/owner/auth/login`,post({email:ownerEmail,password:ownerPassword}));
    assert.equal(r.response.status,200,JSON.stringify(r.data));
    let ownerCookie=cookieFrom(r.response); assert(/sj_owner_session=/.test(ownerCookie));
    const begin=await json(`${base}/api/owner/auth/mfa/begin`,post({}, {Cookie:ownerCookie}));
    assert(/^[A-Z2-7]+$/.test(begin.secret));
    const confirm=await json(`${base}/api/owner/auth/mfa/confirm`,post({code:security.totp(begin.secret)}, {Cookie:ownerCookie}));
    assert.equal(confirm.account.mfaEnabled,true); assert.equal(confirm.recoveryCodes.length,10);
    const controlCenter=await json(`${base}/api/owner/control-center`,{headers:{Cookie:ownerCookie}});
    assert(controlCenter.capabilityRegistry.capabilityCount>=60,'capability registry should be first-class Control Center data');
    assert(controlCenter.capabilityRegistry.successPatternCount>=7);
    await json(`${base}/api/owner/auth/logout`,post({}, {Cookie:ownerCookie}));
    r=await result(`${base}/api/owner/auth/login`,post({email:ownerEmail,password:ownerPassword}));
    assert.equal(r.response.status,401); assert.equal(r.data.mfaRequired,true);
    r=await result(`${base}/api/owner/auth/login`,post({email:ownerEmail,password:ownerPassword,mfaCode:security.totp(begin.secret)}));
    assert.equal(r.response.status,200,JSON.stringify(r.data)); ownerCookie=cookieFrom(r.response);
    await json(`${base}/api/owner/auth/logout`,post({}, {Cookie:ownerCookie}));
    r=await result(`${base}/api/owner/auth/login`,post({email:ownerEmail,password:ownerPassword,mfaCode:confirm.recoveryCodes[0]}));
    assert.equal(r.response.status,200,'an unused owner recovery code should work once');

    const signup=await result(`${base}/api/professional/auth/signup`,post({accountType:'individual',displayName:'Security Test Professional',email:'security-professional@example.test',password:'Professional!123',professionalType:'attorney',acceptTerms:true,acceptPrivacy:true}));
    assert.equal(signup.response.status,201,JSON.stringify(signup.data));
    let professionalCookie=cookieFrom(signup.response);
    const firstResetRequest=await json(`${base}/api/professional/auth/password-reset/request`,post({email:'security-professional@example.test'}));
    assert(firstResetRequest.testToken,'test reset token should be exposed only in test mode');
    const resetRequest=await json(`${base}/api/professional/auth/password-reset/request`,post({email:'security-professional@example.test'}));
    assert(resetRequest.testToken,'a replacement reset token should be generated');
    const persistedSecurityState=fs.readdirSync(tempStorage).filter(name=>name.endsWith('.json')).map(name=>fs.readFileSync(path.join(tempStorage,name),'utf8')).join('\n');
    assert(!persistedSecurityState.includes(firstResetRequest.testToken),'raw password-reset tokens must not be persisted in notifications, audit records, or account state');
    assert(!persistedSecurityState.includes(resetRequest.testToken),'the current raw password-reset token must remain delivery-only and hashed at rest');
    r=await result(`${base}/api/professional/auth/password-reset/confirm`,post({token:firstResetRequest.testToken,password:'ShouldNotWork!789'}));
    assert.equal(r.response.status,400,'issuing a new reset request must invalidate the earlier token');
    const reset=await json(`${base}/api/professional/auth/password-reset/confirm`,post({token:resetRequest.testToken,password:'NewProfessional!456'}));
    assert(/reset/i.test(reset.message));
    r=await result(`${base}/api/professional/dashboard`,{headers:{Cookie:professionalCookie}});
    assert.equal(r.response.status,401,'password reset should revoke existing sessions');
    r=await result(`${base}/api/professional/auth/login`,post({email:'security-professional@example.test',password:'NewProfessional!456'}));
    assert.equal(r.response.status,200); professionalCookie=cookieFrom(r.response);
    const professionalMfa=await json(`${base}/api/professional/auth/mfa/begin`,post({}, {Cookie:professionalCookie}));
    const professionalConfirm=await json(`${base}/api/professional/auth/mfa/confirm`,post({code:security.totp(professionalMfa.secret)}, {Cookie:professionalCookie}));
    assert.equal(professionalConfirm.account.mfaEnabled,true); assert.equal(professionalConfirm.recoveryCodes.length,10);
    await json(`${base}/api/professional/auth/logout`,post({}, {Cookie:professionalCookie}));
    r=await result(`${base}/api/professional/auth/login`,post({email:'security-professional@example.test',password:'NewProfessional!456'}));
    assert.equal(r.response.status,401); assert.equal(r.data.mfaRequired,true);
    r=await result(`${base}/api/professional/auth/login`,post({email:'security-professional@example.test',password:'NewProfessional!456',mfaCode:security.totp(professionalMfa.secret)}));
    assert.equal(r.response.status,200);
    console.log('security-readiness.test.js passed');
  } catch(err){ console.error(err); console.error(log); process.exitCode=1; }
  finally{ server.kill('SIGTERM'); fs.rmSync(tempStorage,{recursive:true,force:true}); }
})();
