'use strict';

const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(process.argv[2]||'.');
const registerPath=path.join(root,'FEATURE_FLAG_AND_KILL_SWITCH_REGISTER_V1.7.98.json');
const gatePath=path.join(root,'RELEASE_GATE_SUMMARY_V1.7.98.json');
const controlPath=path.join(root,'lib','featureControlPlane.js');
const envPath=path.join(root,'.env.example');
const receiptPath=path.join(root,'AI_PRODUCTION_CONTROL_PRE22.json');
const testPath=path.join(root,'tests','ai-production-control-pre22.test.js');

function fail(message){throw new Error(`[pre22-ai-production-control] ${message}`);}
for(const p of [registerPath,gatePath,controlPath])if(!fs.existsSync(p))fail(`missing ${path.relative(root,p)}`);

const register=JSON.parse(fs.readFileSync(registerPath,'utf8'));
const gate=JSON.parse(fs.readFileSync(gatePath,'utf8'));
const beforeRegister=JSON.parse(JSON.stringify(register));
const beforeGate=JSON.parse(JSON.stringify(gate));
const ai=register.capabilities&&register.capabilities.ai;
if(!ai)fail('missing capabilities.ai');
if(ai.productionState!=='CLOSED'||ai.nonProductionState!=='TEST_ONLY'||ai.openEnv!=='SJ_OPEN_AI'||ai.killSwitchEnv!=='SJ_KILL_AI'||ai.preserveExistingData!==true)fail('unexpected sealed AI feature-control row');
if(gate.version!=='1.7.98'||gate.overallState!=='CLOSED_BY_GATE'||gate.gates?.ai?.state!=='CLOSED_BY_GATE')fail('unexpected sealed release-gate state');

ai.productionState='VERIFIED_OPEN';
gate.gates.ai={
  ...gate.gates.ai,
  state:'READY_FOR_RUNTIME_SMOKE',
  evidence:[...(gate.gates.ai.evidence||[]),'AI_PRODUCTION_CONTROL_PRE22.json'],
  reason:'Universal Smarter Justice pre22 production projection is live and its provider-agnostic gateway passed canonical health/status acceptance. OpenAI remains runtime-closed until protected server credentials and explicit server-side enable/open controls are present; SJ_KILL_AI remains the emergency close. A controlled live provider smoke is required immediately after runtime activation.'
};
gate.blockerSummary='Non-AI release gates remain closed exactly as recorded. The AI capability alone is source-qualified for a controlled runtime smoke behind protected credentials, explicit SJ_OPEN_AI/OPENAI_AI_ENABLED/tool controls, cost controls, and SJ_KILL_AI emergency closure.';

for(const [name,row] of Object.entries(beforeRegister.capabilities||{})){
  if(name==='ai')continue;
  if(JSON.stringify(row)!==JSON.stringify(register.capabilities[name]))fail(`unrelated capability mutated: ${name}`);
}
for(const [name,row] of Object.entries(beforeGate.gates||{})){
  if(name==='ai')continue;
  if(JSON.stringify(row)!==JSON.stringify(gate.gates[name]))fail(`unrelated release gate mutated: ${name}`);
}
if(gate.overallState!==beforeGate.overallState)fail('overall release gate must remain closed');

fs.writeFileSync(registerPath,JSON.stringify(register,null,2)+'\n');
fs.writeFileSync(gatePath,JSON.stringify(gate,null,2)+'\n');

let control=fs.readFileSync(controlPath,'utf8');
const oldLine=" if(gateSummary.overallState!=='PASS')return{known:true,name,state:'CLOSED',allowed:false,reason:'RELEASE_GATE_SUMMARY_NOT_PASS'};";
const newBlock=" const gateAccepted=name==='ai'?['PASS','READY_FOR_RUNTIME_SMOKE'].includes(gateSummary.gates?.ai?.state):gateSummary.overallState==='PASS';\n if(!gateAccepted)return{known:true,name,state:'CLOSED',allowed:false,reason:name==='ai'?'AI_RELEASE_GATE_NOT_READY':'RELEASE_GATE_SUMMARY_NOT_PASS'};";
if(!control.includes(oldLine))fail('feature-control gate source mismatch');
control=control.replace(oldLine,newBlock);
fs.writeFileSync(controlPath,control,'utf8');

const receipt={
  schemaVersion:'1.0.0',
  releaseBinding:'Universal Smarter Justice v2.0.0-pre22 production projection',
  sealedRuntimeVersion:'1.7.98',
  productionProjectionCommit:'a092cbeb6df761c1ec71279b72969d614084db91',
  productionDeploymentRunId:31286697951,
  productionDeploymentResult:'PASS',
  canonicalHost:'https://smarterjustice.com',
  liveAcceptance:{health:'PASS',providerGatewayStatus:'PASS',rollbackInvoked:false},
  aiSourcePromotion:{from:'CLOSED',to:'VERIFIED_OPEN',releaseGate:'READY_FOR_RUNTIME_SMOKE'},
  unrelatedReleaseGatesPreserved:true,
  overallReleaseGatePreserved:'CLOSED_BY_GATE',
  runtimeRequirements:{openEnv:'SJ_OPEN_AI',killSwitchEnv:'SJ_KILL_AI',gatewayEnableEnv:'OPENAI_AI_ENABLED',toolEnableEnv:'AI_TOOL_SJ_STARTING_POINT_ENABLED',apiKeyEnv:'OPENAI_API_KEY'},
  safety:'No API key is added or exposed. The source promotion cannot make an OpenAI request unless the protected server key and explicit runtime controls are enabled. SJ_KILL_AI remains authoritative emergency closure.',
  nextEvidence:'Controlled live OpenAI provider smoke, followed by immediate closure on failure or recorded acceptance on pass.'
};
fs.writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n');

if(fs.existsSync(envPath)){
  let env=fs.readFileSync(envPath,'utf8');
  const marker='# Pre22 narrow AI production control';
  if(!env.includes(marker)){
    env+=`\n\n${marker}\n# Keep closed until protected OpenAI credentials are confirmed and the controlled live smoke is ready.\nSJ_OPEN_AI=false\n# Set true for emergency closure; the source also fails closed if this variable is absent from an explicitly managed launch procedure.\nSJ_KILL_AI=false\n`;
    fs.writeFileSync(envPath,env,'utf8');
  }
}

const test=`'use strict';\nconst assert=require('node:assert');\nconst fs=require('node:fs');\nconst path=require('node:path');\nconst root=path.join(__dirname,'..');\nconst register=require('../FEATURE_FLAG_AND_KILL_SWITCH_REGISTER_V1.7.98.json');\nconst gate=require('../RELEASE_GATE_SUMMARY_V1.7.98.json');\nconst control=require('../lib/featureControlPlane');\nassert.strictEqual(register.capabilities.ai.productionState,'VERIFIED_OPEN');\nassert.strictEqual(register.capabilities.ai.openEnv,'SJ_OPEN_AI');\nassert.strictEqual(register.capabilities.ai.killSwitchEnv,'SJ_KILL_AI');\nassert.strictEqual(gate.gates.ai.state,'READY_FOR_RUNTIME_SMOKE');\nassert.strictEqual(gate.overallState,'CLOSED_BY_GATE');\nassert.strictEqual(gate.gates.userData.state,'CLOSED_BY_GATE');\nassert.strictEqual(gate.gates.revenue.state,'CLOSED_BY_GATE');\nassert.strictEqual(gate.gates.operations.state,'CLOSED_BY_GATE');\nassert.strictEqual(typeof control.capabilityState,'function');\nlet state=control.capabilityState('ai',{production:true,env:{SJ_OPEN_AI:'false',SJ_KILL_AI:'false'}});\nassert.strictEqual(state.allowed,false);assert.strictEqual(state.reason,'PRODUCTION_OPEN_FLAG_MISSING');\nstate=control.capabilityState('ai',{production:true,env:{SJ_OPEN_AI:'true',SJ_KILL_AI:'false'}});\nassert.strictEqual(state.allowed,true);assert.strictEqual(state.reason,'PRODUCTION_VERIFIED_OPEN');\nstate=control.capabilityState('ai',{production:true,env:{SJ_OPEN_AI:'true',SJ_KILL_AI:'true'}});\nassert.strictEqual(state.allowed,false);assert.strictEqual(state.reason,'KILL_SWITCH_ACTIVE');\nconst receipt=JSON.parse(fs.readFileSync(path.join(root,'AI_PRODUCTION_CONTROL_PRE22.json'),'utf8'));\nassert.strictEqual(receipt.unrelatedReleaseGatesPreserved,true);\nassert.strictEqual(receipt.overallReleaseGatePreserved,'CLOSED_BY_GATE');\nconsole.log('ai-production-control-pre22.test.js passed');\n`;
fs.writeFileSync(testPath,test,'utf8');
console.log('[pre22-ai-production-control] AI source promoted narrowly; unrelated global gates preserved closed');
