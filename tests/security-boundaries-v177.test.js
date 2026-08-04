const { portForTest } = require('./test-port');
const assert=require('assert');
const {spawn}=require('child_process');
const fs=require('fs');
const os=require('os');
const path=require('path');

const root=path.join(__dirname,'..');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function cookiesFrom(response){
  const raw=typeof response.headers.getSetCookie==='function'?response.headers.getSetCookie():[response.headers.get('set-cookie')||''];
  return raw.flatMap(x=>String(x).split(/,(?=\s*[^;,]+=)/)).map(x=>x.split(';')[0].trim()).filter(Boolean);
}
function mergeCookies(...groups){
  const jar=new Map();
  for(const item of groups.flat()) { const i=item.indexOf('='); if(i>0)jar.set(item.slice(0,i),item); }
  return [...jar.values()].join('; ');
}
function cookieValue(cookieHeader,name){
  const found=String(cookieHeader).split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));
  return found?decodeURIComponent(found.slice(name.length+1)):'';
}
async function read(response){const text=await response.text();let data;try{data=JSON.parse(text)}catch{data=text}return{response,data,text};}
async function start(port,storage,extra={}){
  const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),APP_BASE_URL:`http://127.0.0.1:${port}`,SMARTER_JUSTICE_STORAGE_DIR:storage,OWNER_NOTIFICATION_EMAIL:'',SMTP_HOST:'',...extra}});
  let log=''; child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
  for(let i=0;i<80&&!log.includes('listening');i++){if(child.exitCode!==null)throw new Error(log);await wait(100);}
  return{child,base:`http://127.0.0.1:${port}`,log:()=>log};
}
(async()=>{
  const dirs=[]; const servers=[];
  try{
    const authDir=fs.mkdtempSync(path.join(os.tmpdir(),'sj-v177-auth-'));dirs.push(authDir);
    const auth=await start(portForTest(3981),authDir,{ENFORCE_CSRF_PROTECTION:'true',OWNER_ACCOUNT_NAME:'Boundary Owner',OWNER_ACCOUNT_EMAIL:'boundary-owner@example.test',OWNER_ACCOUNT_PASSWORD:'BoundaryOwnerPassword!123',ADMIN_TOKEN:'authorized-team-code-1234567890'});servers.push(auth.child);
    let r=await read(await fetch(auth.base+'/api/owner/auth/status'));
    let ownerCookies=mergeCookies(cookiesFrom(r.response));
    r=await read(await fetch(auth.base+'/api/owner/auth/login',{method:'POST',headers:{'Content-Type':'application/json','Cookie':ownerCookies},body:JSON.stringify({email:'boundary-owner@example.test',password:'BoundaryOwnerPassword!123'})}));
    assert.equal(r.response.status,200,JSON.stringify(r.data)); ownerCookies=mergeCookies(ownerCookies,cookiesFrom(r.response));
    const csrf=cookieValue(ownerCookies,'sj_csrf'); assert(csrf);
    r=await read(await fetch(auth.base+'/api/owner/auth/mfa/begin',{method:'POST',headers:{'Content-Type':'application/json','Cookie':ownerCookies},body:'{}'}));
    assert.equal(r.response.status,403,'cookie-authenticated mutation must require CSRF token');
    r=await read(await fetch(auth.base+'/api/owner/auth/mfa/begin',{method:'POST',headers:{'Content-Type':'application/json','Cookie':ownerCookies,'X-CSRF-Token':csrf},body:'{}'}));
    assert.equal(r.response.status,200,JSON.stringify(r.data));
    r=await read(await fetch(auth.base+'/api/owner/auth/mfa/begin',{method:'POST',headers:{'Content-Type':'application/json','Cookie':ownerCookies,'X-CSRF-Token':csrf,'Origin':'https://evil.example'},body:'{}'}));
    assert.equal(r.response.status,403,'an unapproved origin must be rejected even with a matching token');

    const signup=await read(await fetch(auth.base+'/api/professional/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountType:'individual',displayName:'Boundary Professional',email:'boundary-professional@example.test',password:'BoundaryProfessional!123',professionalType:'attorney',acceptTerms:true,acceptPrivacy:true})}));
    assert.equal(signup.response.status,201,JSON.stringify(signup.data));
    const verified=await read(await fetch(auth.base+'/api/professional/auth/email-verification/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:signup.data.verification.testToken})}));
    assert.equal(verified.response.status,200,JSON.stringify(verified.data));const professionalCookies=mergeCookies(cookiesFrom(verified.response));const professionalCsrf=cookieValue(professionalCookies,'sj_csrf');assert(professionalCsrf);
    r=await read(await fetch(auth.base+'/api/professional/auth/mfa/begin',{method:'POST',headers:{'Content-Type':'application/json','Cookie':professionalCookies},body:'{}'}));assert.equal(r.response.status,403);
    r=await read(await fetch(auth.base+'/api/professional/auth/mfa/begin',{method:'POST',headers:{'Content-Type':'application/json','Cookie':professionalCookies,'X-CSRF-Token':professionalCsrf},body:'{}'}));assert.equal(r.response.status,200,JSON.stringify(r.data));

    r=await read(await fetch(auth.base+'/control-center.html',{redirect:'manual'}));
    assert.equal(r.response.status,302); assert(/owner-login\.html/.test(r.response.headers.get('location')||'')); assert.equal(r.response.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
    r=await read(await fetch(auth.base+'/control-center.html',{headers:{Cookie:ownerCookies},redirect:'manual'})); assert.equal(r.response.status,200);

    r=await read(await fetch(auth.base+'/api/staff/auth/status')); let staffCookies=mergeCookies(cookiesFrom(r.response));
    r=await read(await fetch(auth.base+'/api/staff/auth/login',{method:'POST',headers:{'Content-Type':'application/json','Cookie':staffCookies},body:JSON.stringify({token:'authorized-team-code-1234567890'})}));
    assert.equal(r.response.status,200,JSON.stringify(r.data)); staffCookies=mergeCookies(staffCookies,cookiesFrom(r.response));
    r=await read(await fetch(auth.base+'/staff.html',{headers:{Cookie:staffCookies},redirect:'manual'})); assert.equal(r.response.status,200);
    r=await read(await fetch(auth.base+'/staff.html',{redirect:'manual'})); assert.equal(r.response.status,302); assert(/internal-access\.html/.test(r.response.headers.get('location')||''));

    const closedDir=fs.mkdtempSync(path.join(os.tmpdir(),'sj-v177-closed-'));dirs.push(closedDir);
    fs.writeFileSync(path.join(closedDir,'cases.json'),JSON.stringify([{id:'case_seed',continuationToken:'continue_existing_private_token',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),attachments:[]}],null,2));
    const closed=await start(portForTest(3982),closedDir,{ENFORCE_SENSITIVE_TRAFFIC_GATE:'true',SENSITIVE_TRAFFIC_APPROVED:'false'});servers.push(closed.child);
    for(const [url,options] of [
      ['/api/cases/continue_existing_private_token',{}],
      ['/api/cases/continue_existing_private_token/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({attachments:[]})}],
      ['/api/cases/continue_existing_private_token/review-package',{}]
    ]){
      r=await read(await fetch(closed.base+url,options));assert.equal(r.response.status,503,`${url} must close immediately when sensitive traffic is paused`);
    }
    r=await read(await fetch(closed.base+'/api/public/story-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'I received a tax notice and need a starting point.'})}));
    assert.equal(r.response.status,200); const publicText=JSON.stringify(r.data); assert(!/routing preview|matter-file workflow|SMTP/i.test(publicText));
    r=await read(await fetch(closed.base+'/api/public-config')); assert.equal(r.data.publicServiceInitiatives.stopDomesticViolence.configured,false);

    const lifecycleDir=fs.mkdtempSync(path.join(os.tmpdir(),'sj-v177-lifecycle-'));dirs.push(lifecycleDir);
    const lifecycle=await start(portForTest(3983),lifecycleDir,{ADMIN_TOKEN:'lifecycle-admin-token-1234567890'});servers.push(lifecycle.child);
    const fakePdf={name:'notice.pdf',mimeType:'application/pdf',dataBase64:Buffer.from('not a pdf').toString('base64')};
    r=await read(await fetch(lifecycle.base+'/api/free-question',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'I received an IRS notice.',attachments:[fakePdf]})}));
    assert.equal(r.response.status,200,JSON.stringify(r.data));assert.equal(r.data.case.attachments.length,0);assert(r.data.case.uploadWarnings.some(x=>/contents did not match/i.test(x)));
    const validPdf={name:'notice.pdf',mimeType:'application/pdf',dataBase64:Buffer.from('%PDF-1.4\n% lifecycle test\n%%EOF').toString('base64')};
    r=await read(await fetch(lifecycle.base+'/api/free-question',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'I received another IRS notice.',attachments:[validPdf]})}));
    assert.equal(r.response.status,200,JSON.stringify(r.data));assert.equal(r.data.case.attachments.length,1);const oldToken=r.data.case.id;
    r=await read(await fetch(lifecycle.base+'/api/admin/cases/'+encodeURIComponent(oldToken),{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Token':'lifecycle-admin-token-1234567890'},body:JSON.stringify({rotateContinuationAccess:true})}));
    assert.equal(r.response.status,200,JSON.stringify(r.data));const newToken=r.data.case.id;assert.notEqual(newToken,oldToken);
    r=await read(await fetch(lifecycle.base+'/api/cases/'+encodeURIComponent(oldToken)));assert.equal(r.response.status,404,'rotated continuation token must stop working');
    r=await read(await fetch(lifecycle.base+'/api/cases/'+encodeURIComponent(newToken)));assert.equal(r.response.status,200);
    r=await read(await fetch(lifecycle.base+'/api/admin/cases/'+encodeURIComponent(newToken),{method:'POST',headers:{'Content-Type':'application/json','X-Admin-Token':'lifecycle-admin-token-1234567890'},body:JSON.stringify({revokeContinuationAccess:true,continuationAccessRevokedReason:'security test'})}));assert.equal(r.response.status,200);
    r=await read(await fetch(lifecycle.base+'/api/cases/'+encodeURIComponent(newToken)));assert.equal(r.response.status,404,'revoked continuation token must stop working');

    const story=fs.readFileSync(path.join(root,'public','our-story.html'),'utf8');
    assert(!/href="https:\/\/stopsignproject\.org/i.test(story),'unverified Stop Sign Project destination must not be an unconditional link');
    console.log('security-boundaries-v177.test.js passed');
  }catch(error){console.error(error);for(const s of servers)console.error('server exit',s.exitCode);process.exitCode=1;}
  finally{for(const s of servers)s.kill('SIGTERM');for(const d of dirs)fs.rmSync(d,{recursive:true,force:true});}
})();
