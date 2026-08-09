'use strict';

const fs = require('node:fs');
const path = require('node:path');

const applicationRoot = path.resolve(process.argv[2] || '.');
const gatewayPath = path.join(applicationRoot, 'lib', 'centralAiGateway.js');
const envExamplePath = path.join(applicationRoot, '.env.example');
const registryPath = path.join(applicationRoot, 'AI_PROVIDER_REGISTRY_PRE22.json');
const testPath = path.join(applicationRoot, 'tests', 'provider-agnostic-ai-gateway-pre22.test.js');

function fail(message) {
  throw new Error(`[provider-agnostic-ai-overlay] ${message}`);
}

if (!fs.existsSync(gatewayPath)) fail('missing lib/centralAiGateway.js');
let gateway = fs.readFileSync(gatewayPath, 'utf8');
const marker = '// SMARTER JUSTICE PRE22 PROVIDER-AGNOSTIC GATEWAY';
if (gateway.includes(marker)) fail('provider-agnostic gateway overlay already applied');

for (const required of ['function status()', 'function configuredProviders()', 'function publicStatus()', 'function ownerView()', 'module.exports={']) {
  if (!gateway.includes(required)) fail(`central AI gateway contract mismatch: ${required}`);
}

const injection = String.raw`

// SMARTER JUSTICE PRE22 PROVIDER-AGNOSTIC GATEWAY
// OpenAI remains the only executable production provider in this release.
// Future providers are registered fail-closed and require explicit keys,
// qualification, owner activation, and adapter implementation before routing.
const __sjBaseStatus = status;
const __sjBasePublicStatus = publicStatus;
const __sjBaseOwnerView = ownerView;
const __sjProviderDefinitions = Object.freeze([
  Object.freeze({id:'openai',name:'OpenAI',keyEnv:'OPENAI_API_KEY',enabledEnv:'OPENAI_AI_ENABLED',modelEnv:'OPENAI_MODEL',adapterState:'LIVE_CAPABLE'}),
  Object.freeze({id:'google-gemini',name:'Google Gemini',keyEnv:'GOOGLE_AI_API_KEY',enabledEnv:'GOOGLE_GEMINI_AI_ENABLED',modelEnv:'GOOGLE_GEMINI_MODEL',adapterState:'REGISTERED_DISABLED'}),
  Object.freeze({id:'anthropic-claude',name:'Anthropic Claude',keyEnv:'ANTHROPIC_API_KEY',enabledEnv:'ANTHROPIC_CLAUDE_AI_ENABLED',modelEnv:'ANTHROPIC_CLAUDE_MODEL',adapterState:'REGISTERED_DISABLED'}),
  Object.freeze({id:'xai-grok',name:'xAI Grok',keyEnv:'XAI_API_KEY',enabledEnv:'XAI_GROK_AI_ENABLED',modelEnv:'XAI_GROK_MODEL',adapterState:'REGISTERED_DISABLED'})
]);
function __sjProviderFlag(name){return /^(1|true|yes|on)$/i.test(String(process.env[name]||'').trim());}
function __sjProviderRows(){
  const base=__sjBaseStatus();
  return __sjProviderDefinitions.map(def=>{
    const configured=Boolean(String(process.env[def.keyEnv]||'').trim());
    const requestedEnabled=def.id==='openai'?Boolean(base.enabled):__sjProviderFlag(def.enabledEnv);
    const enabled=def.id==='openai'?requestedEnabled:false;
    return {
      id:def.id,
      name:def.name,
      configured,
      enabled,
      requestedEnabled,
      model:String(process.env[def.modelEnv]||'').trim()||null,
      adapterState:def.adapterState,
      productionActive:def.id==='openai'&&Boolean(base.available),
      routingEligible:def.id==='openai'&&Boolean(base.available),
      secretExposed:false
    };
  });
}
status = function(){
  const base=__sjBaseStatus();
  const providers=__sjProviderRows();
  return {
    ...base,
    vendorPolicy:'PROVIDER_AGNOSTIC_OPENAI_ACTIVE',
    provider:'openai',
    activeProvider:'openai',
    providerRoutingMode:'SINGLE_ACTIVE_PROVIDER',
    providerFallbackEnabled:false,
    multiProviderComparisonEnabled:false,
    supportedProviderIds:providers.map(item=>item.id),
    configuredProviderCount:providers.filter(item=>item.configured).length,
    productionActiveProviderCount:providers.filter(item=>item.productionActive).length
  };
};
configuredProviders = function(){return __sjProviderRows();};
publicStatus = function(){
  const base=__sjBasePublicStatus();
  return {
    ...base,
    vendor:'Smarter Justice AI Gateway',
    activeProvider:'openai',
    providerRoutingMode:'single-provider',
    providerFallbackEnabled:false,
    multiProviderComparisonEnabled:false,
    supportedProviderIds:__sjProviderDefinitions.map(item=>item.id),
    providerPolicy:'OpenAI is the only production-enabled provider in this release. Gemini, Claude, and Grok are registered but disabled pending separate credentials, adapter qualification, safety/cost acceptance, and owner activation.'
  };
};
ownerView = function(){
  const base=__sjBaseOwnerView();
  return {
    ...base,
    providerOrchestration:{
      architecture:'PROVIDER_AGNOSTIC_GATEWAY',
      activeProvider:'openai',
      routingMode:'SINGLE_ACTIVE_PROVIDER',
      automaticFallback:false,
      multiModelComparison:false,
      providers:__sjProviderRows(),
      activationRule:'A non-OpenAI provider remains non-routable until its dedicated adapter, credential, evaluation, cost controls, safety controls, live smoke evidence, and owner activation are all accepted.'
    }
  };
};
`;

gateway = gateway.replace('\nmodule.exports={', `${injection}\nmodule.exports={`);
if (!gateway.includes(marker)) fail('failed to inject provider gateway');
fs.writeFileSync(gatewayPath, gateway, 'utf8');

const registry = {
  schemaVersion: '1.0.0',
  releaseBinding: 'Universal Smarter Justice v2.0.0-pre22 deployment projection',
  architecture: 'PROVIDER_AGNOSTIC_GATEWAY',
  activeProvider: 'openai',
  routingMode: 'SINGLE_ACTIVE_PROVIDER',
  automaticFallback: false,
  multiModelComparison: false,
  providers: [
    {id:'openai',name:'OpenAI',status:'ACTIVE_ADAPTER_FAIL_CLOSED_UNTIL_ENV_ENABLED',keyEnv:'OPENAI_API_KEY',enabledEnv:'OPENAI_AI_ENABLED',modelEnv:'OPENAI_MODEL'},
    {id:'google-gemini',name:'Google Gemini',status:'REGISTERED_DISABLED',keyEnv:'GOOGLE_AI_API_KEY',enabledEnv:'GOOGLE_GEMINI_AI_ENABLED',modelEnv:'GOOGLE_GEMINI_MODEL'},
    {id:'anthropic-claude',name:'Anthropic Claude',status:'REGISTERED_DISABLED',keyEnv:'ANTHROPIC_API_KEY',enabledEnv:'ANTHROPIC_CLAUDE_AI_ENABLED',modelEnv:'ANTHROPIC_CLAUDE_MODEL'},
    {id:'xai-grok',name:'xAI Grok',status:'REGISTERED_DISABLED',keyEnv:'XAI_API_KEY',enabledEnv:'XAI_GROK_AI_ENABLED',modelEnv:'XAI_GROK_MODEL'}
  ],
  secretPolicy: 'Provider keys are server-side secrets only and are never emitted by status APIs, logs, source artifacts, screenshots, or public pages.',
  futureRoutingPolicy: 'Add providers one at a time behind the gateway after dedicated qualification. Do not silently reuse or copy another product secret.'
};
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n', 'utf8');

if (fs.existsSync(envExamplePath)) {
  let env = fs.readFileSync(envExamplePath, 'utf8');
  const envMarker = '# Provider-agnostic Smarter Justice AI gateway — pre22 projection';
  if (!env.includes(envMarker)) {
    env += `\n\n${envMarker}\n` +
      '# OpenAI is the only executable production adapter for this release.\n' +
      'SJ_AI_ACTIVE_PROVIDER=openai\n' +
      'SJ_AI_ROUTING_MODE=single-provider\n' +
      'GOOGLE_GEMINI_AI_ENABLED=false\nGOOGLE_AI_API_KEY=\nGOOGLE_GEMINI_MODEL=\n' +
      'ANTHROPIC_CLAUDE_AI_ENABLED=false\nANTHROPIC_API_KEY=\nANTHROPIC_CLAUDE_MODEL=\n' +
      'XAI_GROK_AI_ENABLED=false\nXAI_API_KEY=\nXAI_GROK_MODEL=\n';
    fs.writeFileSync(envExamplePath, env, 'utf8');
  }
}

const test = String.raw`'use strict';
const assert=require('node:assert');
const gateway=require('../lib/centralAiGateway');
const markers={OPENAI_API_KEY:'sj-openai-secret-marker',GOOGLE_AI_API_KEY:'sj-google-secret-marker',ANTHROPIC_API_KEY:'sj-anthropic-secret-marker',XAI_API_KEY:'sj-xai-secret-marker'};
for(const [key,value] of Object.entries(markers))process.env[key]=value;
process.env.OPENAI_AI_ENABLED='false';
process.env.GOOGLE_GEMINI_AI_ENABLED='true';
process.env.ANTHROPIC_CLAUDE_AI_ENABLED='true';
process.env.XAI_GROK_AI_ENABLED='true';
const providers=gateway.configuredProviders();
assert.deepStrictEqual(providers.map(x=>x.id),['openai','google-gemini','anthropic-claude','xai-grok']);
assert.strictEqual(providers.find(x=>x.id==='google-gemini').enabled,false);
assert.strictEqual(providers.find(x=>x.id==='anthropic-claude').enabled,false);
assert.strictEqual(providers.find(x=>x.id==='xai-grok').enabled,false);
assert.strictEqual(gateway.status().activeProvider,'openai');
assert.strictEqual(gateway.status().providerFallbackEnabled,false);
assert.strictEqual(gateway.publicStatus().vendor,'Smarter Justice AI Gateway');
const serialized=JSON.stringify({providers,status:gateway.status(),public:gateway.publicStatus(),owner:gateway.ownerView()});
for(const secret of Object.values(markers))assert(!serialized.includes(secret),'provider secret leaked into status output');
console.log('provider-agnostic-ai-gateway-pre22.test.js passed');
`;
fs.writeFileSync(testPath, test, 'utf8');

console.log('[provider-agnostic-ai-overlay] OpenAI active adapter preserved; Gemini, Claude, and Grok registered disabled');
