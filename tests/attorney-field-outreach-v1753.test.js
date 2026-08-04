'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const http=require('http');
const crypto=require('crypto');
const root=path.join(__dirname,'..');
process.env.NODE_ENV='test';
process.env.SMARTER_JUSTICE_STORAGE_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'sj-attorney-field-v1753-'));
process.env.OWNER_CONTROL_CENTER_TOKEN='owner-attorney-field-v1753-token-123456789';
const server=require('../server');
const store=require('../lib/store');
const tour=require('../lib/attorneyPartnerTour');
const fieldKit=require('../ATTORNEY_FIELD_OUTREACH_KIT_V1.7.68.json');
const readiness=require('../ATTORNEY_OUTREACH_READINESS_V1.7.68.json');
function request(base,pathname,options={}){return new Promise((resolve,reject)=>{const url=new URL(pathname,base);const req=http.request(url,{method:options.method||'GET',headers:options.headers||{}},res=>{const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>{const raw=Buffer.concat(chunks).toString('utf8');let data=null;try{data=JSON.parse(raw);}catch{}resolve({status:res.statusCode,headers:res.headers,raw,data});});});req.on('error',reject);req.end();});}
(async()=>{
  assert.equal(require('../package.json').version,'1.7.83');
  assert.equal(require('../server-version-helper').version,'1.7.83');
  assert.equal(fieldKit.releaseVersion,'1.7.68');
  assert.equal(fieldKit.launchState,'NO_GO');
  assert.deepEqual(fieldKit.modes,['self-guided','presenter']);
  assert.equal(fieldKit.privacy.trackingEnabled,false);
  assert.equal(fieldKit.privacy.personalDataInUrls,false);
  assert.equal(fieldKit.privacy.matterDataInUrls,false);
  assert.equal(fieldKit.privacy.qrDestinationContainsCampaignIdentifier,false);
  assert.deepEqual(fieldKit.privacy.allowedTourQueryParameters,['practice','mode','step']);
  assert.equal(fieldKit.practiceHandoffs.length,4);
  assert.equal(new Set(fieldKit.practiceHandoffs.map(x=>x.shortPath)).size,4);
  for(const item of fieldKit.practiceHandoffs){
    assert(/^\/attorney-tour\/(divorce|estate|personal-injury|domestic-violence)$/.test(item.shortPath));
    assert(!/[?&](campaign|email|matter|client)=/i.test(item.shortPath));
    const qrPath=path.join(root,'public',item.qrAsset.replace(/^\//,''));
    assert(fs.existsSync(qrPath),`${item.qrAsset} must exist`);
    const raw=fs.readFileSync(qrPath);
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),item.qrSha256);
    assert(/<svg/i.test(raw.toString('utf8')));
    assert.equal(tour.shortRouteForPath(item.shortPath),item.canonicalDestination);
  }
  assert.equal(readiness.releaseVersion,'1.7.68');
  assert(readiness.readinessItems.some(x=>x.id==='presenter-mode'&&x.status==='READY_FOR_REVIEW'));
  assert(readiness.readinessItems.some(x=>x.id==='field-outreach-kit'&&x.status==='READY_FOR_REVIEW'));

  const divorce=tour.publicTourData('divorce');
  assert.equal(divorce.releaseVersion,'1.7.75');
  assert.deepEqual(divorce.modes,['self-guided','presenter']);
  assert.equal(divorce.fieldKit.shortPath,'/attorney-tour/divorce');
  assert.equal(divorce.fieldKit.qrAsset,'/images/attorney-tour/divorce.svg');
  assert.equal(divorce.fieldKit.trackingEnabled,false);

  const html=fs.readFileSync(path.join(root,'public','attorney-partner-tour.html'),'utf8');
  const js=fs.readFileSync(path.join(root,'public','attorney-partner-tour.js'),'utf8');
  const follow=fs.readFileSync(path.join(root,'public','attorney-tour-follow-up.html'),'utf8');
  const followJs=fs.readFileSync(path.join(root,'public','attorney-tour-follow-up.js'),'utf8');
  const styles=fs.readFileSync(path.join(root,'public','styles.css'),'utf8');
  assert(html.includes('Start Presenter Mode'));
  assert(html.includes('data-tour-mode="self-guided"'));
  assert(html.includes('data-tour-mode="presenter"'));
  assert(html.includes('id="tourPresenterControls"'));
  assert(html.includes('id="tourQrCode"'));
  assert(js.includes("mode=params.get('mode')==='presenter'"));
  assert(js.includes("event.key==='ArrowRight'"));
  assert(js.includes('tracking data'));
  assert(follow.includes('meta name="robots" content="noindex,follow"'));
  assert(follow.includes('Smarter Justice remains NO_GO'));
  assert(followJs.includes('/api/public/attorney-partner-tour'));
  assert(styles.includes('.tour-presenter-controls'));
  assert(styles.includes('.follow-up-sheet'));
  assert(styles.includes('@media print'));
  assert(/No guaranteed leads, clients, revenue, ranking, appointments, or outcomes\./i.test(follow));
  assert(!/we guarantee|guaranteed results|guaranteed return on investment/i.test(follow));

  await store.init();
  const address=await new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address())));
  const base=`http://127.0.0.1:${address.port}`;
  try{
    for(const item of fieldKit.practiceHandoffs){
      const response=await request(base,item.shortPath);
      assert.equal(response.status,302);
      assert.equal(response.headers.location,item.canonicalDestination);
      assert.equal(response.headers['cache-control'],'no-cache');
    }
    const followPage=await request(base,'/attorney-tour-follow-up.html?practice=estate');
    assert.equal(followPage.status,200);
    assert(followPage.raw.includes('Attorney Tour Follow-Up'));
    const api=await request(base,'/api/public/attorney-partner-tour?practice=domestic-violence');
    assert.equal(api.status,200);
    assert.equal(api.data.tour.fieldKit.shortPath,'/attorney-tour/domestic-violence');
    assert.equal(api.data.tour.fieldKit.trackingEnabled,false);
    const owner=await request(base,'/api/owner/control-center',{headers:{'x-owner-control-token':process.env.OWNER_CONTROL_CENTER_TOKEN}});
    assert.equal(owner.status,200);
    assert.equal(owner.data.version,'1.7.83');
    assert.equal(owner.data.attorneyOutreachReadiness.fieldKit.releaseVersion,'1.7.75');
    assert.equal(owner.data.attorneyOutreachReadiness.summary.launchState,'NO_GO');
  } finally {await new Promise(resolve=>server.close(resolve));}
  console.log('attorney-field-outreach-v1753.test.js passed');
})().catch(error=>{console.error(error);try{server.close(()=>{});}catch{}process.exit(1);});
