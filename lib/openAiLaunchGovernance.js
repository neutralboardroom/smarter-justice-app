'use strict';
const fs=require('fs');const path=require('path');
const ROOT=path.join(__dirname,'..');
const contract=require('../AI_GATEWAY_CONTRACT_V1.7.83.json');const model=require('../AI_MODEL_CONFIGURATION_V1.7.83.json');const registry=require('../AI_TOOL_AND_PROMPT_REGISTRY_V1.7.83.json');const matrix=require('../FIVE_PRODUCT_AI_CAPABILITY_MATRIX_V1.7.83.json');const checkpoint=require('../OPENAI_LAUNCH_OVERLAY_CHECKPOINT_V1.7.83.json');
function clone(v){return JSON.parse(JSON.stringify(v));}
function read(file){return fs.readFileSync(path.join(ROOT,file),'utf8');}
function validate(){const errors=[];
 if(checkpoint.overlaySha256!=='a1d63886e22188304cff36df8ed5754169546c24fe094a4563c6c4184a6e63f4'||checkpoint.launchBatchId!=='SJP-OPENAI-LIVE-2026-08-03-BATCH-02')errors.push('overlay-identity');
 if(contract.vendorPolicy!=='OPENAI_ONLY'||contract.request.arbitraryPromptAccepted!==false||contract.authentication.browserPortalIdentityTrusted!==false||contract.privacy.rawPromptLogging!==false||contract.privacy.rawResponseLogging!==false||contract.privacy.storeResponses!==false)errors.push('gateway-contract');
 if(model.vendor!=='openai'||model.api!=='responses'||model.allowlist.length!==1||model.storeResponses!==false||model.evaluationState!=='MOCK_AND_SYNTHETIC_ACCEPTED_LIVE_SMOKE_PENDING')errors.push('model-config');
 if(registry.launchBatchId!==checkpoint.launchBatchId||registry.arbitraryPromptEndpoint!==false||registry.tools.length!==5)errors.push('tool-registry');
 if(matrix.products.length!==5||matrix.products[0].maturity!=='TESTED'||matrix.products[4].maturity!=='CLOSED_BY_DESIGN'||matrix.launchState!=='NO_GO')errors.push('capability-matrix');
 const active=[read('lib/aiProviders.js'),read('lib/centralAiGateway.js'),read('.env.example'),read('render.yaml')].join('\n');
 for(const token of ['ANTHROPIC_API_KEY','GOOGLE_API_KEY','GEMINI_API_KEY','XAI_API_KEY','AI_PROVIDER_ORDER'])if(active.includes(token))errors.push(`alternate-vendor-active:${token}`);
 for(const token of ['store:false','json_schema','AI_GLOBAL_KILL_SWITCH','AI_COST_HARD_STOP','AI_PORTAL_SERVICE_TOKENS_JSON','X-Client-Request-Id'])if(!active.includes(token))errors.push(`missing-control:${token}`);
 if(!read('public/app.js').includes('does not create an attorney-client relationship')||!read('server.js').includes('/api/owner/ai-operations'))errors.push('transparency-operations');
 return{ok:errors.length===0,errors,releaseVersion:'1.7.83',launchBatchId:checkpoint.launchBatchId,vendorPolicy:'OPENAI_ONLY',registeredTools:registry.tools.length,capabilityProducts:matrix.products.length,liveSmokePassed:false,keyConfigured:false,deploymentAuthorized:false,launchState:'NO_GO'};
}
function ownerView(){return{checkpoint:clone(checkpoint),validation:validate(),contract:clone(contract),modelConfiguration:clone(model),registry:clone(registry),capabilityMatrix:clone(matrix),deploymentAuthorized:false,launchState:'NO_GO'};}
module.exports={validate,ownerView};
