const { portForTest } = require('./test-port');
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const os=require('os');
const {spawn}=require('child_process');
const root=path.join(__dirname,'..');
const pub=path.join(root,'public');
const htmlFiles=fs.readdirSync(pub).filter(name=>name.endsWith('.html'));
const protectedPages=new Set([
  'admin.html','staff.html','control-center.html','dashboard.html','next-path.html',
  'checkout-success.html','checkout-cancel.html','launch-readiness.html','production-readiness.html',
  'ai-summary.html','professional-login.html','professional-signup.html','professional-dashboard.html',
  'owner-login.html','internal-access.html','partner-flyer.html','professional-network.html','launch-activation.html'
]);
for(const name of htmlFiles){
  const html=fs.readFileSync(path.join(pub,name),'utf8');
  if(protectedPages.has(name)){
    assert(/noindex/i.test(html),`${name} must keep noindex metadata`);
  } else {
    assert(/<link[^>]+rel=["']canonical["'][^>]+href=["']https:\/\/smarterjustice\.com\//i.test(html),`${name} missing canonical URL`);
  }
}
const freeTools=fs.readFileSync(path.join(pub,'free-tools.html'),'utf8');
for(const phrase of ['Make useful progress before deciding whether to pay anyone','Find a starting path','Review or compare text','Build a source-linked action plan','Find and compare professionals','What is not active'])assert(freeTools.includes(phrase),`free-tools page missing ${phrase}`);
for(const route of ['/#public-start','/document-tools.html','/professionals.html'])assert(freeTools.includes(`href="${route}`),`free-tools page missing ${route}`);
assert(/application\/ld\+json/.test(freeTools) && /"@type":"WebPage"/.test(freeTools),'free-tools page missing structured data');
const home=fs.readFileSync(path.join(pub,'index.html'),'utf8');
assert(/href="\/free-tools\.html"/.test(home),'homepage missing Free Tools path');
assert(/"@type":"Organization"/.test(home) && /"@type":"WebSite"/.test(home),'homepage missing organization and website structured data');
const sitemap=fs.readFileSync(path.join(pub,'sitemap.xml'),'utf8');
assert(sitemap.includes('/free-tools.html'),'free-tools page missing from sitemap');
for(const name of protectedPages)assert(!sitemap.includes(`/${name}`),`${name} must not be in sitemap`);
const llms=fs.readFileSync(path.join(pub,'llms.txt'),'utf8');
assert(/Free tools: https:\/\/smarterjustice\.com\/free-tools\.html/.test(llms),'llms file missing free-tools route');
const serverSource=fs.readFileSync(path.join(root,'server.js'),'utf8');
assert(/max-age=86400, stale-while-revalidate=604800/.test(serverSource),'server missing deliberate static asset caching');
assert(/X-Robots-Tag/.test(serverSource) && /noindex, nofollow, noarchive/.test(serverSource),'server missing protected-page robots header');

const port=portForTest(3976);
const base=`http://127.0.0.1:${port}`;
const tempStorage=fs.mkdtempSync(path.join(os.tmpdir(),'smarter-justice-v1716-seo-'));
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'test',PORT:String(port),APP_BASE_URL:base,SMARTER_JUSTICE_STORAGE_DIR:tempStorage,OWNER_CONTROL_CENTER_TOKEN:'owner-v1716-seo-token-1234567890',ADMIN_TOKEN:'admin-v1716-seo-token-1234567890',PORTAL_RULES_API_TOKEN:'rules-v1716-seo-token-1234567890',OWNER_NOTIFICATION_EMAIL:''}});
let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  try{
    let ready=false;
    for(let i=0;i<60;i++){try{const r=await fetch(`${base}/health`);if(r.ok){ready=true;break}}catch{}await wait(100)}
    assert(ready,log);
    let response=await fetch(`${base}/styles.css`);
    assert.equal(response.status,200);
    assert(/public, max-age=86400/.test(response.headers.get('cache-control')||''),'static assets need public caching');
    response=await fetch(`${base}/free-tools.html`);
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-cache');
    assert((await response.text()).includes('Make useful progress before deciding whether to pay anyone.'));
    response=await fetch(`${base}/owner-login.html`,{redirect:'manual'});
    assert.equal(response.status,200);
    assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
    response=await fetch(`${base}/health`);
    const health=await response.json();
    assert.equal(health.version,'1.7.83');
    console.log(`seo-performance-v1716.test.js passed: ${htmlFiles.length} HTML pages, canonical coverage, free-tools journey, structured data, caching, and robots headers verified`);
  }catch(error){console.error(log);throw error}finally{child.kill('SIGTERM');fs.rmSync(tempStorage,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1});
