'use strict';
const assert=require('assert');
const http=require('http');
const operations=require('../lib/unifiedLiveOperations');
const app=require('../server');
function request(base,path,headers={}){return new Promise((resolve,reject)=>{const req=http.request(base+path,{headers},res=>{let body='';res.on('data',d=>body+=d);res.on('end',()=>resolve({status:res.statusCode,data:JSON.parse(body)}));});req.on('error',reject);req.end();});}
(async()=>{
 const v=operations.validate();assert.equal(v.ok,true,v.errors.join(','));assert.equal(v.releaseVersion,'1.7.83');assert.equal(v.stateCounts.VERIFIED_LIVE||0,0);assert.equal(v.stateCounts.BLOCKED,1);assert.equal(v.launchState,'NO_GO');assert.match(v.oneExactOwnerAction,/canonical GitHub repository/);
 const old=process.env.OWNER_CONTROL_CENTER_TOKEN;process.env.OWNER_CONTROL_CENTER_TOKEN='test-owner-v1779';const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 try{assert.equal((await request(base,'/api/owner/unified-live-operations')).status,403);const allowed=await request(base,'/api/owner/unified-live-operations',{'x-owner-control-token':'test-owner-v1779'});assert.equal(allowed.status,200);assert.equal(allowed.data.appVersion,'1.7.83');assert.equal(allowed.data.unifiedLiveOperations.validation.ok,true);assert.equal(allowed.data.unifiedLiveOperations.register.deployment_authorized,false);}finally{await new Promise(r=>server.close(r));if(old===undefined)delete process.env.OWNER_CONTROL_CENTER_TOKEN;else process.env.OWNER_CONTROL_CENTER_TOKEN=old;}
 console.log('unified-live-operations-v1779.test.js passed');
})().catch(e=>{console.error(e);process.exit(1);});
