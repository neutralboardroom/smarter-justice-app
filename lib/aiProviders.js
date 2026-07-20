const https = require('https');
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 12000);
const ENABLED = /^true|1|yes$/i.test(String(process.env.AI_REVIEW_ENABLED || ''));
const AI_SYSTEM_PROMPT = `You are Smarter Justice's controlled starting-point assistant. Provide plain-language organization only. Do not give legal, tax, medical, benefits, settlement, or professional advice. Do not guarantee outcomes. Identify likely path, missing information, urgency signals, and review lanes. Recommend Human Review Specialist review and professional review where appropriate. Return compact JSON only.`;
function configuredProviders(){
  return [
    { id:'openai', name:'OpenAI', configured:Boolean(process.env.OPENAI_API_KEY), model:process.env.OPENAI_MODEL || 'set OPENAI_MODEL' },
    { id:'anthropic', name:'Anthropic Claude', configured:Boolean(process.env.ANTHROPIC_API_KEY), model:process.env.ANTHROPIC_MODEL || 'set ANTHROPIC_MODEL' },
    { id:'google', name:'Google Gemini', configured:Boolean(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY), model:process.env.GEMINI_MODEL || 'set GEMINI_MODEL' },
    { id:'xai', name:'xAI Grok', configured:Boolean(process.env.XAI_API_KEY), model:process.env.XAI_MODEL || 'set XAI_MODEL' }
  ];
}
function requestJson({hostname, path, method='POST', headers={}, body}){
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({ hostname, path, method, headers:{ 'Content-Type':'application/json', ...(data ? {'Content-Length': data.length} : {}), ...headers }, timeout:AI_TIMEOUT_MS }, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed; try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
        if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`AI provider returned ${res.statusCode}: ${raw.slice(0,300)}`));
        resolve(parsed);
      });
    });
    req.on('timeout', () => req.destroy(new Error('AI provider request timed out')));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}
function extractJson(text){
  const raw = String(text || '').trim().replace(/^```json\s*/i,'').replace(/```$/,'').trim();
  try { return JSON.parse(raw); } catch {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}
function buildFallbackAiReview(input){
  const analysis = input.analysis || {};
  const matter = analysis.matterPath || {};
  return {
    mode:'rules-fallback',
    provider:'none',
    usedModel:'none',
    configuredProviders: configuredProviders().filter(p=>p.configured).map(p=>p.id),
    plainLanguageSummary: matter.userNextPathSummary || analysis.plainLanguageStartingPoint || 'Smarter Justice saved a starting file and can organize the matter for review.',
    likelyNextPath: matter.userNextPathTitle || 'Organized starting file',
    missingInformation: (matter.dynamicMissingInformation || analysis.missingInformation || []).map(x => x.label || x).slice(0,12),
    reviewRecommendation: analysis.professionalReview || analysis.humanReview || 'Human Review Specialist review recommended before completed forms are prepared.',
    safeUseNotice:'This summary is organization support only. It is not legal, tax, benefits, medical, settlement, or professional advice and does not guarantee any outcome.'
  };
}
async function callOpenAI(prompt){
  const body = { model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', input: [{ role:'system', content: AI_SYSTEM_PROMPT }, { role:'user', content: prompt }], text: { format: { type: 'json_object' } } };
  const data = await requestJson({ hostname:'api.openai.com', path:'/v1/responses', headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}` }, body });
  const text = data.output_text || data.output?.flatMap(o => o.content || []).map(c => c.text || '').join('\n') || '';
  return { provider:'openai', model:body.model, data: extractJson(text) || { raw:text } };
}
async function callAnthropic(prompt){
  const body = { model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 900, system: AI_SYSTEM_PROMPT, messages:[{ role:'user', content: prompt }] };
  const data = await requestJson({ hostname:'api.anthropic.com', path:'/v1/messages', headers:{ 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' }, body });
  const text = (data.content || []).map(c => c.text || '').join('\n');
  return { provider:'anthropic', model:body.model, data: extractJson(text) || { raw:text } };
}
async function callGemini(prompt){
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const body = { systemInstruction:{ parts:[{ text:AI_SYSTEM_PROMPT }] }, contents:[{ role:'user', parts:[{ text:prompt }] }], generationConfig:{ responseMimeType:'application/json' } };
  const data = await requestJson({ hostname:'generativelanguage.googleapis.com', path:`/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, body });
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || '';
  return { provider:'google', model, data: extractJson(text) || { raw:text } };
}
async function callXai(prompt){
  const model = process.env.XAI_MODEL || 'grok-4-fast-reasoning';
  const body = { model, messages:[{ role:'system', content:AI_SYSTEM_PROMPT }, { role:'user', content:prompt }], response_format:{ type:'json_object' }, temperature:0.1 };
  const data = await requestJson({ hostname:'api.x.ai', path:'/v1/chat/completions', headers:{ Authorization:`Bearer ${process.env.XAI_API_KEY}` }, body });
  const text = data.choices?.[0]?.message?.content || '';
  return { provider:'xai', model, data: extractJson(text) || { raw:text } };
}
async function generateMatterReview(input){
  const fallback = buildFallbackAiReview(input);
  if (!ENABLED) return fallback;
  const order = String(process.env.AI_PROVIDER_ORDER || 'openai,anthropic,google,xai').split(',').map(x => x.trim()).filter(Boolean);
  const prompt = JSON.stringify({ task:'starting_point_and_missing_information', caseInput: input.caseInput, ruleAnalysis: input.analysis, requiredOutput:{ plainLanguageSummary:'string', likelyNextPath:'string', missingInformation:['string'], reviewRecommendation:'string', safetyNotes:['string'] } }).slice(0,18000);
  for (const provider of order){
    try {
      if (provider === 'openai' && process.env.OPENAI_API_KEY) { const r = await callOpenAI(prompt); return { ...fallback, mode:'ai-provider', provider:r.provider, usedModel:r.model, ...r.data }; }
      if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) { const r = await callAnthropic(prompt); return { ...fallback, mode:'ai-provider', provider:r.provider, usedModel:r.model, ...r.data }; }
      if ((provider === 'google' || provider === 'gemini') && (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY)) { const r = await callGemini(prompt); return { ...fallback, mode:'ai-provider', provider:r.provider, usedModel:r.model, ...r.data }; }
      if (provider === 'xai' && process.env.XAI_API_KEY) { const r = await callXai(prompt); return { ...fallback, mode:'ai-provider', provider:r.provider, usedModel:r.model, ...r.data }; }
    } catch (err) { fallback.lastProviderError = `${provider}: ${err.message}`; }
  }
  return fallback;
}
module.exports = { configuredProviders, generateMatterReview, buildFallbackAiReview };
