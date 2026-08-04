(function(){
  const PRACTICES_URL = '/api/practice-areas';
  let practices = [];
  let defaultDocumentTypes = [];
  let activeSchema = null;
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  function qs(name){ return new URLSearchParams(location.search).get(name) || ''; }
  function cookieValue(name){
    const prefix=encodeURIComponent(name)+'=';
    for(const part of document.cookie.split(';')){const value=part.trim();if(value.startsWith(prefix))return decodeURIComponent(value.slice(prefix.length));}
    return '';
  }
  const browserFetch=window.fetch.bind(window);
  window.fetch=function(input,init={}){
    const requestUrl=typeof input==='string'?input:(input&&input.url)||'';
    const method=String(init.method||(input&&input.method)||'GET').toUpperCase();
    const sameOrigin=!/^https?:\/\//i.test(requestUrl)||new URL(requestUrl,location.href).origin===location.origin;
    if(sameOrigin&&['POST','PUT','PATCH','DELETE'].includes(method)){
      const token=cookieValue('sj_csrf');
      if(token){const headers=new Headers(init.headers||(input&&input.headers)||{});headers.set('X-CSRF-Token',token);init={...init,headers};}
    }
    return browserFetch(input,init);
  };

  function escapeHtml(str){ return String(str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function friendlyFieldName(el){
    const label = el.closest('label');
    if (label) return label.childNodes[0]?.textContent?.trim() || el.name || 'This field';
    return el.name || 'This field';
  }
  function setErrorSummary(form, messages){
    const box = form.querySelector('[data-error-summary]');
    if (!box) return;
    if (!messages.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = `<strong>Please fix ${messages.length === 1 ? 'this item' : 'these items'}:</strong><ul>${messages.map(m=>`<li>${escapeHtml(m)}</li>`).join('')}</ul>`;
    box.focus({ preventScroll:false });
  }
  function currentStep(form){ return Number(form.dataset.currentStep || 1); }
  function setStep(form, step){
    const steps = Array.from(form.querySelectorAll('[data-step]'));
    const max = steps.length || 1;
    const next = Math.min(Math.max(1, step), max);
    form.dataset.currentStep = String(next);
    steps.forEach(sec => { sec.hidden = Number(sec.dataset.step) !== next; });
    form.querySelectorAll('[data-step-dot]').forEach(dot => dot.classList.toggle('active', Number(dot.dataset.stepDot) === next));
    const heading = form.querySelector(`[data-step="${next}"] h3`);
    if (heading) heading.setAttribute('tabindex','-1'), heading.focus({ preventScroll:true });
  }
  function validateStartForm(form, mode='submit'){
    const messages = [];
    const question = form.querySelector('textarea[name="question"]');
    const email = form.querySelector('input[name="email"]');
    const practice = form.querySelector('[name="practiceArea"]');
    const state = form.querySelector('[name="state"]');
    const selectedPractice = practices.find(p => practice && p.slug === practice.value);
    if (mode === 'step') {
      const step = currentStep(form);
      if (step === 2 && question && !question.value.trim()) messages.push('Please describe what happened or what you need help with.');
      if (step === 3 && selectedPractice?.requiresJurisdiction && state && !state.value) messages.push('Please choose a state because this area depends on state or local rules.');
      return messages;
    }
    if (question && !question.value.trim()) messages.push('Please describe what happened or what you need help with.');
    if (email && form.dataset.emailRequired !== undefined && !/.+@.+\..+/.test(email.value.trim())) messages.push('Please enter your email so we can send or save your private continuation link.');
    if (selectedPractice?.requiresJurisdiction && state && !state.value) messages.push('Please choose a state because this area depends on state or local rules.');
    form.querySelectorAll('[required]').forEach(el => { if(!el.value.trim() && !messages.some(m=>m.includes(friendlyFieldName(el)))) messages.push(`${friendlyFieldName(el)} is required.`); });
    return messages;
  }
  function saveLocalCase(c){
    const arr = JSON.parse(localStorage.getItem('smarterJusticeCases') || '[]').filter(x => x.id !== c.id);
    arr.unshift({ id:c.id, token:(c.continuationLink||'').split('case=')[1] || c.id, title:c.practiceName, status:c.status, createdAt:c.createdAt, link:c.continuationLink });
    localStorage.setItem('smarterJusticeCases', JSON.stringify(arr.slice(0,30)));
  }
  function statusPill(text){ return `<span class="status-pill">${escapeHtml(text || 'Not set')}</span>`; }
  function friendlyStatus(value){
    const raw=String(value || 'Not set').replace(/_/g,' ').trim();
    const customerLabels={
      'paid via stripe checkout':'Paid online',
      'paid via stripe webhook':'Paid online',
      'payment link created':'Payment link available',
      'payment session expired':'Payment link expired',
      'refunded/not applicable':'Refunded or not applicable'
    };
    return customerLabels[raw.toLowerCase()] || raw.replace(/\b\w/g, m => m.toUpperCase());
  }
  function caseAccessToken(c){
    try { return new URL(c.continuationLink || '', location.origin).searchParams.get('case') || c.id; }
    catch { return (c.continuationLink || '').split('case=')[1] || c.id; }
  }
  function visibleUploadState(value){
    return /quarantined|awaiting/i.test(String(value || '')) ? 'saved securely for review' : friendlyStatus(value || 'saved for review');
  }
  function portalCanOpen(portal){
    return Boolean(portal?.publicUrl && (portal.status === 'Live — Separate Platform' || portal.status === 'Available Now'));
  }
  function customerText(value){
    return String(value || '')
      .replace(/source[- ]checked/gi,'confirmed against the official instructions')
      .replace(/source check needed/gi,'needs confirmation')
      .replace(/review[- ]ready/gi,'prepared for review')
      .replace(/starting file/gi,'starting summary')
      .replace(/matter file/gi,'saved work')
      .replace(/delivery blockers?/gi,'items still needed')
      .replace(/Human Review Specialist approval/gi,'human review')
      .replace(/staff approval/gi,'review')
      .replace(/storage and security approval/gi,'secure service availability')
      .replace(/production upload/gi,'confidential upload')
      .replace(/routing preview/gi,'starting-point suggestion')
      .replace(/starting preview/gi,'starting-point suggestion');
  }
  function customerCaseStatus(value){
    const raw=String(value||'').toLowerCase();
    if(/complete|delivered|closed/.test(raw)) return 'Completed';
    if(/wait|need|pending|review/.test(raw)) return 'Waiting for the next step';
    if(/cancel|withdraw|declin|reject/.test(raw)) return 'Not continuing';
    return 'In progress';
  }
  function customerReviewStatus(value){
    const raw=String(value||'').toLowerCase();
    if(/complete|approved|reviewed/.test(raw)) return 'Reviewed';
    if(/required|recommended|needed/.test(raw)) return 'Review may be needed';
    if(/pending|wait|queue/.test(raw)) return 'Waiting for review';
    if(/not required|not needed|none/.test(raw)) return 'Not currently needed';
    if(/unavailable|closed|disabled/.test(raw)) return 'Not available yet';
    return 'Not selected yet';
  }
  function customerPortalStatus(portal){
    if(portalCanOpen(portal)) return 'Available now';
    return 'Separate website not open yet';
  }
  function renderCase(c){
    if (!c) return '<p>Saved work not found. Check the access code and try again.</p>';
    const concerns = (c.analysis?.concerns || []).map(x=>`<li>${escapeHtml(customerText(x))}</li>`).join('') || '<li>No urgent concern has been identified from the information available.</li>';
    const steps = (c.analysis?.nextSteps || []).map(x=>`<li>${escapeHtml(customerText(x))}</li>`).join('') || '<li>Add any important dates, notices, or documents you have.</li>';
    const sources = (c.analysis?.catalogSummary || []).map(source=>`<li><strong>${escapeHtml(source.sourceName)}</strong> — ${escapeHtml(customerText(source.readinessLabel || 'Needs confirmation'))} <small>${escapeHtml(source.jurisdiction || '')}</small></li>`).join('') || '<li>No official source has been selected yet.</li>';
    const smart = Object.entries(c.smartAnswers || {}).filter(([,v]) => v).map(([k,v]) => `<li><strong>${escapeHtml(k.replace(/([A-Z])/g,' $1'))}:</strong> ${escapeHtml(v)}</li>`).join('');
    const files = (c.attachments || []).map(a => `<li>${escapeHtml(a.originalName || a.name)} <small>${escapeHtml(a.documentType || a.mimeType || '')} · ${Math.round((a.sizeBytes||0)/1024)} KB · ${escapeHtml(visibleUploadState(a.uploadState))}</small></li>`).join('') || '<li>No documents have been added.</li>';
    const warnings = (c.uploadWarnings || []).map(x => `<li>${escapeHtml(customerText(x))}</li>`).join('');
    const paths = (c.verifiedFormPaths || c.analysis?.verifiedFormPaths || []).map(path => `<li><strong>${escapeHtml(path.title)}</strong><br><small>${escapeHtml(customerText(path.deliveryType || 'A worksheet may be prepared after the required information is confirmed.'))}</small>${(path.missingFieldLabels||path.missingFields||[]).length ? `<br><em>Helpful missing details:</em> ${escapeHtml((path.missingFieldLabels||path.missingFields).join(', '))}` : ''}</li>`).join('') || '<li>No specific form or worksheet has been selected yet. Your information can still be organized for review.</li>';
    const privateToken = caseAccessToken(c);
    const packageUrl = `/api/cases/${encodeURIComponent(privateToken)}/review-package`;
    const draftUrl = `/api/cases/${encodeURIComponent(privateToken)}/draft-package`;
    const reviewReadyDraftUrl = `/api/cases/${encodeURIComponent(privateToken)}/review-ready-draft`;
    const actionNeeded = c.userActionNeeded || c.userFacingNote ? `<section class="card alert"><h4>Message from Smarter Justice</h4>${c.userActionNeeded ? `<p><strong>Action needed:</strong> ${escapeHtml(customerText(c.userActionNeeded))}</p>` : ''}${c.userFacingNote ? `<p>${escapeHtml(customerText(c.userFacingNote))}</p>` : ''}</section>` : '';
    const readinessPercent = c.formPathEvaluation?.completionPercent || c.reviewReadyDraft?.completionPercent || 0;
    const evalBox = `<div class="mini-card"><strong>Starting information</strong><br>${escapeHtml(String(readinessPercent))}% complete<br><small>You can add details later.</small></div>`;
    const processPath = c.matterPath || c.analysis?.matterPath || null;
    const processTimeline = processPath?.timeline?.length ? `<section class="card soft"><h4>Where this may be in the process</h4><ol class="timeline">${processPath.timeline.map(item=>`<li class="${item.isCurrent?'current':''}"><strong>${escapeHtml(customerText(item.name))}</strong><br><small>${escapeHtml(customerText(item.status))}</small></li>`).join('')}</ol></section>` : '';
    const missingPath = (processPath?.dynamicMissingInformation || c.dynamicMissingInformation || []).map(x=>`<li>${escapeHtml(customerText(x.label || x))}</li>`).join('') || '<li>No additional details are listed right now.</li>';
    const nextPath = processPath ? `<section class="card highlighted"><p class="eyebrow">Recommended next step</p><h4>${escapeHtml(customerText(processPath.userNextPathTitle || processPath.stageName || 'Your suggested next step'))}</h4><p>${escapeHtml(customerText(processPath.userNextPathSummary || ''))}</p><p><strong>Starting information complete:</strong> ${escapeHtml(String(processPath.formReadinessScore || 0))}%</p><details><summary>Helpful missing details</summary><ul>${missingPath}</ul></details></section>` : '';
    const aiReview = c.aiReview || c.analysis?.aiReview;
    const assistanceLabel = aiReview?.assistanceLabel || (c.externalAiUsed ? 'AI-assisted organization' : 'Guided rules-based organization');
    const aiBox = aiReview ? `<section class="card soft"><h4>${escapeHtml(assistanceLabel)}</h4><p>${escapeHtml(customerText(aiReview.plainLanguageSummary || ''))}</p>${aiReview.availabilityNote?`<p class="fine-print">${escapeHtml(customerText(aiReview.availabilityNote))}</p>`:''}<p class="fine-print">This summary organizes a starting point. It is not legal or tax advice.</p></section>` : '';
    const assistancePreferenceSection = `<section class="card soft"><h4>Choose how this saved work is organized</h4><form data-assistance-preference="${escapeHtml(privateToken)}"><label class="check"><input type="radio" name="aiPreference" value="rules-only" ${c.aiPreference!=='ai-assisted'?'checked':''}> Use guided rules-based organization without external AI</label><label class="check"><input type="radio" name="aiPreference" value="ai-assisted" ${c.aiPreference==='ai-assisted'?'checked':''}> Request optional AI-assisted organization when available</label><button class="secondary">Save Assistance Choice</button><span class="fine-print" data-assistance-result></span></form><p class="fine-print">Your choice remains in effect for this saved work until you change it. OpenAI-assisted organization is optional, has a specific organization-only purpose, and never replaces professional judgment. It is not an attorney, does not create an attorney-client relationship or privilege, and you should enter only the fields requested, review and correct the result, or continue with the non-AI path.</p></section>`;
    const portal = c.recommendedPortal || c.analysis?.recommendedPortal || null;
    const portalOpen = portalCanOpen(portal);
    const portalBox = portal ? `<section class="card highlighted"><p class="eyebrow">Recommended focused website</p><h4>${escapeHtml(portal.name || 'Smarter Justice General Start')}</h4><p>${escapeHtml(customerText(portal.userRouteMessage || portal.summary || ''))}</p><p><span class="status-pill">${escapeHtml(customerPortalStatus(portal))}</span></p>${portalOpen ? `<p><a class="secondary link-btn" href="${escapeHtml(portal.publicUrl)}">Open focused website</a></p>` : '<p class="fine-print">You can continue through Smarter Justice now.</p>'}<p class="fine-print">A separate website may have its own terms, pricing, and review options.</p></section>` : '';
    const missingDraftFields = (c.reviewReadyDraft?.missingRequiredFields || []).slice(0,8);
    const draftDetailForm = missingDraftFields.length ? `<section class="card highlighted"><h4>Add helpful details</h4><p class="fine-print">These answers can make a future worksheet or draft easier to review. A draft is shown only after the required information and review needs are confirmed.</p><form data-draft-details="${escapeHtml(privateToken)}"><div class="form-grid two">${missingDraftFields.map(f=>`<label>${escapeHtml(f.label || f.key)}<input name="${escapeHtml(f.key || f.label)}" placeholder="Add if known"></label>`).join('')}</div><button class="secondary">Save details</button><span class="fine-print" data-draft-details-result></span></form></section>` : '';
    const remainingItems = c.reviewReadyDraft?.deliveryBlockers?.length ? `<section class="card soft"><h4>What is still needed before a draft can be shown</h4><ul>${c.reviewReadyDraft.deliveryBlockers.map(x=>`<li>${escapeHtml(customerText(x))}</li>`).join('')}</ul></section>` : '';
    const paidOrders=(c.paidServiceOrders||[]).map(order=>`<li><strong>${escapeHtml(order.serviceName||'Human review service')}</strong> — ${escapeHtml(customerText(friendlyStatus(order.userFacingStatus||order.status||'requested')))}${order.priceCents?` · ${money(order.priceCents)}`:''}</li>`).join('');
    const paidReviewSection=`<section class="card soft"><h4>Optional human review</h4><p>A Human Review Specialist may check completeness, organization, visible dates, or preparation for a separately engaged professional. This is not legal, tax, accounting, insurance, or other licensed advice.</p>${paidOrders?`<h5>Your review requests</h5><ul>${paidOrders}</ul>`:''}<form data-checkout-form="${escapeHtml(privateToken)}"><label>Service of interest<select name="serviceType"><option value="starter_review">Starting information completeness review</option><option value="notice_review">Notice and deadline organization review</option><option value="form_prep">Form and supporting-document organization review</option><option value="professional_review_preparation">Professional review preparation</option></select></label><label>Email for confirmations and support<input type="email" name="email" value="${escapeHtml(c.email||'')}" required autocomplete="email"></label><div class="review-acknowledgments"><label class="checkbox-label"><input type="checkbox" name="scopeUnderstood" required> I understand the selected review scope.</label><label class="checkbox-label"><input type="checkbox" name="notProfessionalAdvice" required> I understand this is not licensed professional advice.</label><label class="checkbox-label"><input type="checkbox" name="feesSeparate" required> I understand professional, government, court, and third-party fees are separate.</label><label class="checkbox-label"><input type="checkbox" name="refundPolicyAccepted" required> I reviewed the <a href="/human-review-services.html" target="_blank" rel="noopener">scope, cancellation, and refund information</a>.</label><label class="checkbox-label"><input type="checkbox" name="electronicCommunicationsAccepted" required> I agree to receive service and support communications electronically.</label></div><button class="primary">Check availability and continue</button><span class="fine-print" data-checkout-result></span></form><p class="fine-print">These services are not currently available for purchase. No payment is taken when a service is unavailable. Attorney and tax-professional services require a separate engagement.</p></section>`;
    return `<div class="case-overview"><div><h3>${escapeHtml(c.practiceName)}${c.subcategory?' — '+escapeHtml(c.subcategory):''}</h3><p>${statusPill(customerCaseStatus(c.status))} ${statusPill('Human review: '+customerReviewStatus(c.humanReviewLane))} ${statusPill('Professional review: '+customerReviewStatus(c.professionalReviewLane))}</p></div>${evalBox}</div>${portalBox}${nextPath}${processTimeline}${aiBox}${assistancePreferenceSection}${actionNeeded}${remainingItems}${draftDetailForm}<div class="dashboard-grid"><section><h4>Your saved work</h4><p><strong>Service payment:</strong> ${escapeHtml(customerText(friendlyStatus(c.paymentStatus)))}</p><p><strong>Documents and worksheets:</strong> ${escapeHtml(customerText(friendlyStatus(c.deliveryStatus || 'not ready yet')))}</p><p><strong>Return link:</strong><br><a href="${escapeHtml(c.continuationLink)}">Open this saved work</a></p><form data-email-link="${escapeHtml(privateToken)}"><label>Email my return link<input type="email" name="email" value="${escapeHtml(c.email||'')}" placeholder="you@example.com"></label><button class="secondary">Email link</button><span class="fine-print" data-email-link-result></span></form><p><a class="button secondary" href="${escapeHtml(packageUrl)}" target="_blank" rel="noopener">Open organized summary</a></p><p><a class="button secondary" href="${escapeHtml(draftUrl)}" target="_blank" rel="noopener">Open information worksheet</a></p><p><a class="button secondary" href="${escapeHtml(reviewReadyDraftUrl)}" target="_blank" rel="noopener">Open available draft</a></p><p><strong>Draft status:</strong> ${escapeHtml(customerText(friendlyStatus(c.reviewReadyDraftStatus || 'not reviewed yet')))}</p></section><section><h4>Location and document details</h4><p>${escapeHtml([c.jurisdiction?.city,c.jurisdiction?.county,c.jurisdiction?.state].filter(Boolean).join(', ') || 'Not provided yet')}</p><p><strong>Document type:</strong> ${escapeHtml(c.documentType || 'Not selected')}</p><p><strong>Date or deadline shown:</strong> ${escapeHtml(c.deadlineDate || c.futureLeadFieldsCaptured?.deadlineDate || 'Not provided')}</p></section></div>${paidReviewSection}<h4>Possible form or worksheet</h4><ul>${paths}</ul><h4>Questions or concerns to review</h4><ul>${concerns}</ul><h4>Useful next steps</h4><ul>${steps}</ul>${smart?`<h4>Additional details</h4><ul>${smart}</ul>`:''}<h4>Official information to confirm</h4><ul>${sources}</ul><h4>Saved documents</h4><ul>${files}</ul>${warnings?`<div class="notice"><strong>Document notes</strong><ul>${warnings}</ul></div>`:''}<form data-upload-more="${escapeHtml(privateToken)}"><label>Add documents<input type="file" name="attachments" multiple></label><button class="secondary">Add to saved work</button></form>`;
  }
  
  async function fileToBase64(file){
    return new Promise((resolve,reject)=>{ const r = new FileReader(); r.onload=()=>resolve({ name:file.name, mimeType:file.type, sizeBytes:file.size, dataBase64:String(r.result).split(',')[1]||'' }); r.onerror=reject; r.readAsDataURL(file); });
  }
  function initCounters(){
    $$('textarea[data-maxlength]').forEach(t => {
      const max = Number(t.dataset.maxlength || t.getAttribute('maxlength') || 2500);
      const counter = t.parentElement.querySelector('.counter') || document.querySelector(`[data-counter-for="${t.name}"]`);
      const update = () => { if (counter) counter.textContent = `${Math.max(0,max - t.value.length)} characters left`; };
      t.addEventListener('input', update); update();
    });
  }
  function fieldInput(field){
    const name = 'smart_' + field.name;
    if (field.type === 'select') return `<select name="${escapeHtml(name)}"><option value="">Choose if known</option>${(field.options||[]).map(o=>`<option>${escapeHtml(o)}</option>`).join('')}</select>`;
    if (field.type === 'date') return `<input name="${escapeHtml(name)}" type="date">`;
    return `<input name="${escapeHtml(name)}" placeholder="Optional">`;
  }
  function renderSmartQuestions(schema, practice){
    const panel = $('#smartQuestions');
    if (!panel) return;
    if (!schema) { panel.hidden = true; panel.innerHTML = ''; return; }
    const jurisdictionNote = practice?.requiresJurisdiction ? '<p class="fine-print"><strong>State/local detail matters here.</strong> Choose state, county, city, court, agency, or office when you can.</p>' : '<p class="fine-print">This area is often federal or national, but state/local details can still help.</p>';
    panel.hidden = false;
    panel.innerHTML = `<h3>${escapeHtml(schema.title || 'Helpful starting details')}</h3><p>${escapeHtml(schema.note || '')}</p>${jurisdictionNote}<div class="form-grid two">${(schema.followUps||[]).map(field => `<label>${escapeHtml(field.label)}${fieldInput(field)}</label>`).join('')}</div>`;
  }
  async function loadSmartSchema(slug){
    if (!slug) { activeSchema = null; renderSmartQuestions(null); return; }
    try {
      const data = await fetch('/api/intake-schema/' + encodeURIComponent(slug)).then(r=>r.json());
      activeSchema = data.schema || null;
      if (activeSchema && data.matterPath?.questions?.length) {
        const existing = new Set((activeSchema.followUps || []).map(f => f.name));
        activeSchema.followUps = [...(activeSchema.followUps || []), ...data.matterPath.questions.filter(f => !existing.has(f.name)).slice(0,8)];
        activeSchema.note = activeSchema.note || data.matterPath.note;
      }
      renderSmartQuestions(activeSchema, practices.find(p => p.slug === slug));
    } catch { activeSchema = null; renderSmartQuestions(null); }
  }
  async function loadPractices(){
    try { const data = await fetch(PRACTICES_URL).then(r=>r.json()); practices = data.practiceAreas || []; defaultDocumentTypes = data.defaultDocumentTypes || []; } catch { practices = []; }
    const select = $('#practiceArea');
    const sub = $('#subcategory');
    const docType = $('#documentType');
    if (docType && defaultDocumentTypes.length) docType.innerHTML = '<option value="">Choose if uploading or describing a document</option>' + defaultDocumentTypes.map(x=>`<option>${escapeHtml(x)}</option>`).join('');
    if (select && practices.length) {
      const current = select.value;
      select.innerHTML = '<option value="">Not sure — help me choose</option>' + practices.map(p => `<option value="${escapeHtml(p.slug)}">${escapeHtml(p.name)}</option>`).join('');
      const requested = qs('practice') || localStorage.getItem('smarterJusticePreferredPractice') || current;
      if (requested && practices.some(p => p.slug === requested)) select.value = requested;
      if (localStorage.getItem('smarterJusticePreferredPractice')) localStorage.removeItem('smarterJusticePreferredPractice');
    }
    function fillSub(){
      if (!select || !sub) return;
      const p = practices.find(x => x.slug === select.value);
      sub.innerHTML = '<option value="">Choose a topic</option>' + (p ? p.subcategories.map(s=>`<option>${escapeHtml(s)}</option>`).join('') : '');
      loadSmartSchema(select.value);
    }
    if (select) select.addEventListener('change', fillSub);
    fillSub();
  }
  async function initPortalStartContext(){
    const slug = qs('portal');
    if (!slug) return;
    const hidden = document.querySelector('input[name="requestedPortal"]');
    if (hidden) hidden.value = slug;
    const panel = $('#portalStartContext');
    try {
      const res = await fetch('/api/portals/'+encodeURIComponent(slug)).then(r=>r.json());
      if (!res.ok) return;
      const portal = res.portal;
      if (panel) {
        panel.hidden = false;
        panel.innerHTML = `<strong>Starting with ${escapeHtml(portal.name)}</strong><span>${escapeHtml(portal.availabilityMessage || '')}</span><a href="/portal-router.html?portal=${encodeURIComponent(portal.slug)}">View portal details</a>`;
      }
      const select = $('#practiceArea');
      if (select && !select.value && portal.practices?.length && practices.some(p=>p.slug===portal.practices[0])) {
        select.value = portal.practices[0];
        select.dispatchEvent(new Event('change'));
      }
    } catch { /* The general start still works if portal details cannot load. */ }
  }

  async function submitFreeQuestion(form){
    const errors = validateStartForm(form, 'submit');
    if (errors.length) { setErrorSummary(form, errors); return; }
    setErrorSummary(form, []);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Creating your saved work...';
    const fd = new FormData(form); const files = Array.from(form.querySelector('input[type="file"]')?.files || []);
    const attachments = [];
    for (const f of files.slice(0,6)) { if (f.size > 8*1024*1024) { alert('One file was over 8 MB and was skipped: '+f.name); continue; } attachments.push(await fileToBase64(f)); }
    const body = Object.fromEntries(fd.entries());
    body.attachments = attachments; body.consentToContact = Boolean(fd.get('consentToContact'));
    // Copy smart fields into regular names when they match future review fields.
    for (const [k,v] of Object.entries(body)) if (k.startsWith('smart_') && !body[k.slice(6)]) body[k.slice(6)] = v;
    const panel = $('#questionResult') || $('#noticeResult');
    try {
      const res = await fetch('/api/free-question',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
      if (!res.ok) throw new Error(res.error || 'Could not create saved work.');
      saveLocalCase(res.case); panel.hidden = false; panel.innerHTML = `<section class="card success"><h3>Your saved work was created</h3><p>Next, review your likely next step and keep your private continuation link.</p><p><a class="primary" href="/next-path.html?case=${encodeURIComponent((res.case.continuationLink||'').split('case=')[1] || res.case.id)}">Review my next step</a> <a class="secondary" href="${escapeHtml(res.case.continuationLink)}">Open dashboard</a></p></section>` + renderCase(res.case); panel.scrollIntoView({behavior:'smooth',block:'start'});
    } catch(err){ panel.hidden=false; panel.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`; }
    btn.disabled = false; btn.textContent = btn.dataset.defaultText || 'See where to start';
  }
  function initFreeQuestion(){
    $$('[data-free-question-form]').forEach(form => {
      const ref = $('#referralCodeField', form); if (ref) ref.value = qs('ref') || qs('code') || localStorage.getItem('smarterJusticeReferralCode') || '';
      const requestedPortal = form.querySelector('[name="requestedPortal"]'); if (requestedPortal) requestedPortal.value = qs('portal') || requestedPortal.value || '';
      const btn = form.querySelector('button[type="submit"]'); if (btn) btn.dataset.defaultText = btn.textContent;
      form.addEventListener('submit', e => { e.preventDefault(); submitFreeQuestion(form); });
    });
  }
  function initPracticeFilter(){
    const input = $('#practiceFilter'); if (!input) return;
    input.addEventListener('input', () => { const q = input.value.toLowerCase(); $$('.practice-card').forEach(card => { card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none'; }); });
    $$('[data-practice-link]').forEach(a => a.addEventListener('click', () => localStorage.setItem('smarterJusticePreferredPractice', a.dataset.practiceLink)));
  }
  async function initSensitivePublicForms(){
    const forms=$$('[data-sensitive-public-form]');
    if(!forms.length)return;
    let config={};
    try{const response=await fetch('/api/public-config');config=response.ok?await response.json():{};}catch{}
    for(const form of forms){
      let key=form.dataset.sensitivePublicForm;
      if(form.id==='contactForm'&&new URLSearchParams(location.search).get('topic')==='profile-correction')key='profileCorrectionRequestsAvailable';
      const available=config[key]===true;
      const status=form.querySelector('[data-sensitive-public-status]');
      if(status)status.innerHTML=available?'<strong>Protected request form available.</strong><p>Submit only the information needed for this request.</p>':'<strong>Protected request form temporarily unavailable.</strong><p>No information will be collected until protected storage and operating approval are active. Free device-only tools and the non-saved starting-point tool remain available.</p><p><a href="/free-tools.html">Use free device-only tools</a></p>';
      if(!available){
        form.setAttribute('data-sensitive-public-unavailable','true');
        form.querySelectorAll('input,select,textarea,button').forEach(control=>{control.disabled=true;});
      }
    }
  }
  function initPartnerForms(){
    const storageKey = code => `smarterJusticePartnerAccess:${code}`;
    const form = $('#partnerForm');
    if (form) form.addEventListener('submit', async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const res = await fetch('/api/community-partners/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json());
      const panel=$('#partnerResult'); panel.hidden=false;
      if(res.ok){
        localStorage.setItem('smarterJusticeReferralCode', res.partner.code);
        try { const link = new URL(res.partner.dashboardUrl, location.origin); const access = new URLSearchParams(link.hash.replace(/^#/, '')).get('access'); if(access) localStorage.setItem(storageKey(res.partner.code), access); } catch {}
        panel.innerHTML=`<h3>Community Partner tools created</h3><p><strong>Code:</strong> ${escapeHtml(res.partner.code)}</p><p class="notice"><strong>Save the private dashboard link.</strong> The partner code alone cannot open referral activity.</p><p><a class="primary link-btn" href="${escapeHtml(res.partner.dashboardUrl)}">Open private partner dashboard</a></p><p><a class="secondary link-btn" href="${escapeHtml(res.partner.flyerUrl)}">Open tracked flyer</a></p>`;
      } else panel.textContent=res.error||'Could not create Community Partner tools.';
    });
    const lookup = $('#partnerLookupForm');
    async function loadPartnerDashboard(code, access){
      const panel=$('#partnerDashboard');
      if (!panel) return;
      panel.hidden=false; panel.innerHTML='<p>Opening private partner dashboard...</p>';
      const res = await fetch('/api/community-partners/'+encodeURIComponent(code), { headers:{'X-Partner-Access':access} }).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!res.ok){ panel.textContent=res.error||'Could not open dashboard.'; return; }
      localStorage.setItem(storageKey(code), access);
      const url = location.origin + '/?ref=' + encodeURIComponent(code);
      const starts=res.referredStarts||[];
      if ($('#qrPreview')) $('#qrPreview').src = '/api/qr?data=' + encodeURIComponent(url);
      panel.innerHTML=`<h3>${escapeHtml(res.partner.name)}</h3><p><strong>Code:</strong> ${escapeHtml(code)}</p><div class="dashboard-grid"><div class="mini-card"><strong>${escapeHtml(String(res.summary?.starts || 0))}</strong><br>Started files</div><div class="mini-card"><strong>${escapeHtml(String(res.summary?.credits || 0))}</strong><br>Credits recorded</div><div class="mini-card"><strong>Private</strong><br>No user names, emails, documents, or legal topics shown</div></div><p><a href="/partner-flyer.html?code=${encodeURIComponent(code)}">Open printable flyer</a></p><h4>Recent referral activity</h4>${starts.length?starts.map(item=>`<p><strong>${escapeHtml(item.startStatus || 'Started')}</strong> · ${escapeHtml(item.creditStatus || '')}<br><small>${escapeHtml(item.createdAt || '')}</small></p>`).join(''):'<p>No starts yet.</p>'}`;
    }
    if (lookup) lookup.addEventListener('submit', async e => {
      e.preventDefault();
      const code = $('#partnerCodeInput').value.trim();
      const access = ($('#partnerAccessInput')?.value || localStorage.getItem(storageKey(code)) || '').trim();
      if (!code || !access) { const panel=$('#partnerDashboard'); panel.hidden=false; panel.textContent='Enter both the Community Partner code and private dashboard access key.'; return; }
      await loadPartnerDashboard(code, access);
    });
    if ($('#flyerQr')) { const code = qs('code') || 'SmarterJustice'; const url = location.origin + '/?ref=' + encodeURIComponent(code); $('#flyerQr').src = '/api/qr?data=' + encodeURIComponent(url); }
    const queryCode = qs('code');
    const fragmentAccess = new URLSearchParams(location.hash.replace(/^#/, '')).get('access') || '';
    const queryAccess = fragmentAccess || (queryCode ? localStorage.getItem(storageKey(queryCode)) : '');
    if (queryCode && $('#partnerCodeInput')) $('#partnerCodeInput').value = queryCode;
    if (queryAccess && $('#partnerAccessInput')) $('#partnerAccessInput').value = queryAccess;
    if (queryCode && queryAccess && lookup) loadPartnerDashboard(queryCode, queryAccess);
  }
  function initContact(){
    const form = $('#contactForm'); if (!form) return;
    const params=new URLSearchParams(location.search);
    const profileMode=params.get('topic')==='profile-correction';
    if(profileMode){
      const type=params.get('type')==='firm'?'firm':'professional';
      const name=String(params.get('name')||'').slice(0,180);
      const profile=String(params.get('profile')||'').slice(0,180);
      form.dataset.profileRequest='true';
      form.elements.profileId.value=profile;
      form.elements.profileKind.value=type;
      $('[data-profile-request-fields]')?.removeAttribute('hidden');
      $('[data-profile-request-summary]')?.removeAttribute('hidden');
      $('[data-profile-privacy]')?.removeAttribute('hidden');
      if($('[data-profile-request-name]')) $('[data-profile-request-name]').textContent=`Profile: ${name||profile||'Selected public profile'}`;
      if($('#contactHeading')) $('#contactHeading').textContent='Request review of public profile information.';
      if($('#contactIntro')) $('#contactIntro').textContent='Describe the requested change and provide public sources when available. Smarter Justice may need identity or authority verification before changing a profile.';
      if($('[data-message-label]')) $('[data-message-label]').textContent='Details of the requested change';
      if($('[data-contact-submit]')) $('[data-contact-submit]').textContent='Submit profile request';
      form.elements.name.required=true;
      form.elements.email.required=true;
      form.elements.privacyAcknowledged.required=true;
      if(form.elements.message&&!form.elements.message.value) form.elements.message.value=`Please review this public ${type} profile.${name?`
Profile name: ${name}`:''}${profile?`
Profile reference: ${profile}`:''}

Requested change and reason:
Public source supporting the request:`;
    }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const data=Object.fromEntries(new FormData(form).entries());
      const panel=$('#contactResult');
      let endpoint='/api/contact';
      if(profileMode){
        endpoint='/api/public/profile-requests';
        data.requesterName=data.name;
        data.requesterEmail=data.email;
        data.details=data.message;
        data.evidenceUrls=String(data.evidenceUrls||'').split(/\r?\n/).map(value=>value.trim()).filter(Boolean);
        data.privacyAcknowledged=form.elements.privacyAcknowledged.checked;
        data.sourcePage=location.href;
      }else data.page=location.pathname;
      const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()).catch(()=>({ok:false,error:'The request could not be sent. Please try again.'}));
      panel.hidden=false;
      if(res.ok&&profileMode){
        panel.innerHTML=`<h3>Profile request recorded</h3><p>${escapeHtml(res.message||'Your request was recorded.')}</p><p><strong>Reference:</strong> ${escapeHtml(res.receipt?.reference||'Recorded')}</p><p class="fine-print">Submission does not guarantee a particular decision or response time.</p>`;
        form.reset();
      }else if(res.ok){
        panel.innerHTML='<h3>Message saved</h3><p>Smarter Justice support has your request.</p>';
        form.reset();
      }else panel.innerHTML=`<p>${escapeHtml(res.error||'Could not send.')}</p>`;
      panel.scrollIntoView({behavior:'smooth',block:'center'});
    });
  }

  async function loadCase(id){ const res = await fetch('/api/cases/'+encodeURIComponent(id)).then(r=>r.json()); const panel = $('#caseResult'); panel.hidden=false; panel.innerHTML = res.ok ? renderCase(res.case) : `<p>${escapeHtml(res.error||'File not found.')}</p>`; if(res.ok) saveLocalCase(res.case); }
  function initDashboard(){
    const local = $('#localCases'); if (local) { const arr = JSON.parse(localStorage.getItem('smarterJusticeCases') || '[]'); local.innerHTML = arr.length ? arr.map(c=>`<article class="mini-card"><a href="/dashboard.html?case=${encodeURIComponent(c.token||c.id)}"><strong>${escapeHtml(c.title||'Smarter Justice saved work')}</strong></a><br><small>${escapeHtml(c.status||'Started')} · ${escapeHtml(c.createdAt||'')}</small></article>`).join('') : '<div class="empty-state"><strong>No saved work on this browser yet.</strong><p>Start free or describe a notice to begin.</p><p><a class="primary" href="/#start">Start Free</a> <a class="secondary" href="/upload-notice.html">Describe Notice</a></p></div>'; }
    const form = $('#caseLookupForm'); if (form) form.addEventListener('submit', e => { e.preventDefault(); const id = $('#caseIdInput').value.trim(); if(id) loadCase(id); });
    const id = qs('case'); if (id && $('#caseIdInput')) { $('#caseIdInput').value=id; loadCase(id); }
    document.addEventListener('submit', async e => { const f = e.target.closest('[data-upload-more]'); if (!f) return; e.preventDefault(); const id=f.dataset.uploadMore; const files = Array.from(f.querySelector('input[type="file"]').files || []); const attachments=[]; for (const file of files.slice(0,6)) { if(file.size > 8*1024*1024){ alert('One file was over 8 MB and was skipped: '+file.name); continue; } attachments.push(await fileToBase64(file)); } const res = await fetch(`/api/cases/${encodeURIComponent(id)}/upload`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({attachments})}).then(r=>r.json()); if(res.ok) $('#caseResult').innerHTML = renderCase(res.case); });
    document.addEventListener('submit', async e => { const f = e.target.closest('[data-email-link]'); if(!f) return; e.preventDefault(); const token=f.dataset.emailLink; const out=f.querySelector('[data-email-link-result]'); out.textContent='Saving request...'; const body=Object.fromEntries(new FormData(f).entries()); const res=await fetch(`/api/cases/${encodeURIComponent(token)}/email-link`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()); out.textContent=res.ok ? (res.message || 'Request saved.') : (res.error || 'Could not save.'); });
  }
  function renderAdminCase(c){
    const choices = {
      status:['Started — organized file created','Human review in progress','More information needed','Waiting for user','Professional review recommended','Payment link sent','Payment received — review/delivery step in progress','Ready for delivery after review','Delivered','Closed'],
      humanReviewLane:['recommended','priority human review recommended','in progress','more information needed','organized starter file approved','completed-form draft not available yet','ready for professional review'],
      professionalReviewLane:['not_required_yet','attorney review may be recommended or required','tax attorney or CPA/enrolled-agent/accountant review recommended','CPA/enrolled-agent/accountant review may be helpful','attorney, CPA, accountant, or filing professional review may be recommended','attorney or qualified professional review may be recommended'],
      paymentStatus:['not requested yet','payment step requested','payment link created','paid via Stripe Checkout','paid via Stripe webhook','paid','waived','refunded/not applicable','payment failed or incomplete','payment session expired'],
      deliveryStatus:['not ready for delivery','starter file ready','worksheet ready','review package ready','form-draft starter package ready','review-ready draft candidate ready','completed forms not available yet','ready for delivery after review','delivered'],
      reviewReadyDraftStatus:['not reviewed yet','starter mapped — missing information','ready for Human Review Specialist review','approved for user review after human review','not safe for draft delivery','delivered to user for review'],
      formDraftStatus:['not generated yet','starter facts incomplete','starter draft package generated','ready for Human Review Specialist check','ready for professional review','not safe to prepare completed forms yet','completed-form draft not available yet'],
      userActionNeeded:['','Need one more document','Need clearer deadline/date','Need state/county/court details','Need payment step','Need signature/review confirmation','No action needed right now']
    };
    const select = (name,val) => `<select name="${name}">${choices[name].map(x=>`<option ${x===val?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select>`;
    const loc = [c.jurisdiction?.city,c.jurisdiction?.county,c.jurisdiction?.state].filter(Boolean).join(', ') || 'Not provided';
    const missing = (c.formPathEvaluation?.missingFieldLabels || c.missingInformation || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('') || '<li>No missing starter details listed yet.</li>';
    const matter = c.matterPath || c.analysis?.matterPath || null;
    const whyPath = matter ? `<details open><summary>Why this path was chosen</summary><p><strong>${escapeHtml(matter.stageName || matter.userNextPathTitle || '')}</strong></p><p>${escapeHtml(matter.userNextPathSummary || '')}</p><ul>${(matter.whyThisPath||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p><strong>Form readiness score:</strong> ${escapeHtml(String(matter.formReadinessScore || 0))}%</p></details>` : '';
    const aiAdmin = c.aiReview || c.analysis?.aiReview ? `<details><summary>AI-assisted notes</summary><p>${escapeHtml((c.aiReview || c.analysis.aiReview).plainLanguageSummary || '')}</p><p><strong>Mode:</strong> ${escapeHtml((c.aiReview || c.analysis.aiReview).mode || '')} ${((c.aiReview || c.analysis.aiReview).provider) ? '· '+escapeHtml((c.aiReview || c.analysis.aiReview).provider) : ''}</p></details>` : '';
    return `<article class="card admin-case" data-practice="${escapeHtml(c.practiceSlug||'')}" data-status="${escapeHtml(c.status||'')}" data-review="${escapeHtml((c.humanReviewLane||'')+' '+(c.professionalReviewLane||''))}"><h4>${escapeHtml(c.practiceName)} — ${escapeHtml(c.subcategory||'')}</h4><p><strong>Created:</strong> ${escapeHtml(c.createdAt)}</p><p><strong>State/local:</strong> ${escapeHtml(loc)}</p><p><strong>Uploads:</strong> ${(c.attachments||[]).length} · <strong>Deadline:</strong> ${escapeHtml(c.deadlineDate || c.futureLeadFieldsCaptured?.deadlineDate || 'Not provided')}</p><p><strong>Payment:</strong> ${escapeHtml(c.paymentStatus)} ${c.paymentConfirmedAt ? ' · confirmed '+escapeHtml(c.paymentConfirmedAt) : ''}</p>${whyPath}${aiAdmin}<details><summary>Starting point and form readiness</summary><p>${escapeHtml(c.analysis?.plainLanguageStartingPoint || '')}</p><p><strong>${escapeHtml(c.analysis?.formReadiness?.label || 'Worksheet first')}</strong> — ${escapeHtml(c.analysis?.formReadiness?.userMeaning || '')}</p><p><strong>Starter details completeness:</strong> ${escapeHtml(String(c.formPathEvaluation?.completionPercent || 0))}%</p><ul>${missing}</ul><ul>${(c.analysis?.concerns||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></details><form data-admin-update="${escapeHtml(c.id)}"><label>Customer-visible status${select('status',c.status)}</label><label>Human Review Specialist lane${select('humanReviewLane',c.humanReviewLane)}</label><label>Attorney/professional review lane${select('professionalReviewLane',c.professionalReviewLane)}</label><div class="form-grid two"><label>Payment status${select('paymentStatus',c.paymentStatus)}</label><label>Delivery status${select('deliveryStatus',c.deliveryStatus || 'not ready for delivery')}</label></div><label>Form-draft package status${select('formDraftStatus',c.formDraftStatus || 'not generated yet')}</label><label>Review-ready draft status${select('reviewReadyDraftStatus',c.reviewReadyDraftStatus || 'not reviewed yet')}</label><details><summary>Review-ready draft field map</summary><p><strong>${escapeHtml(c.reviewReadyDraft?.title || 'No review-ready path selected yet')}</strong></p><p>${escapeHtml(c.reviewReadyDraft?.label || 'Organizer only')} · ${escapeHtml(String(c.reviewReadyDraft?.completionPercent || 0))}% complete</p><ul>${(c.reviewReadyDraft?.missingRequiredFields||[]).map(x=>`<li>${escapeHtml(x.label||x)}</li>`).join('') || '<li>No required starter fields missing.</li>'}</ul><p><strong>Delivery blockers:</strong></p><ul>${(c.reviewReadyDraft?.deliveryBlockers||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('') || '<li>No engine blockers listed.</li>'}</ul><label>Staff field corrections JSON<textarea name="reviewReadyDraftOverrides" rows="4" placeholder='{"taxYears":"2024","proposedMonthlyPayment":"250"}'>${escapeHtml(JSON.stringify(c.reviewReadyDraftOverrides || {}, null, 2))}</textarea></label><label>Reviewer field notes<textarea name="reviewReadyDraftFieldNotes" maxlength="2500" data-maxlength="2500" rows="3">${escapeHtml(c.reviewReadyDraftFieldNotes || '')}</textarea><span class="counter">2500 characters left</span></label></details><label>User action needed${select('userActionNeeded',c.userActionNeeded || '')}</label><label>Message the user can see<textarea name="userFacingNote" maxlength="2500" data-maxlength="2500" rows="3" placeholder="Example: Please upload the full notice, including all pages and the envelope if available.">${escapeHtml(c.userFacingNote || '')}</textarea><span class="counter">2500 characters left</span></label><label>Private staff note<textarea name="staffNote" maxlength="2500" data-maxlength="2500" rows="3" placeholder="Add a private internal note"></textarea><span class="counter">2500 characters left</span></label><button class="secondary">Save status update</button><span class="fine-print" data-update-result></span></form></article>`;
  }
  
  function filterAdminCases(){
    const practice = $('#adminPracticeFilter')?.value || '';
    const q = ($('#adminTextFilter')?.value || '').toLowerCase();
    const needs = $('#adminNeedsFilter')?.value || '';
    $$('.admin-case').forEach(card => {
      const text = card.textContent.toLowerCase();
      const matchPractice = !practice || card.dataset.practice === practice;
      const matchText = !q || text.includes(q);
      const matchNeeds = !needs || /more information|deadline|payment|ready for delivery|need /.test(text);
      card.classList.toggle('needs-attention', /more information|deadline within|need /.test(text));
      card.style.display = matchPractice && matchText && matchNeeds ? '' : 'none';
    });
  }
  function initAdmin(){
    const form = $('#adminTokenForm'); if(!form) return;
    let activeToken = '';
    async function loadQueue(token){
      activeToken = token;
      const res = await fetch('/api/admin/cases',{headers:{'X-Admin-Token':token}}).then(r=>r.json());
      const panel=$('#adminQueue'); panel.hidden=false;
      if(!res.ok){ panel.textContent = res.error || 'Could not load.'; return; }
      const practiceOptions = practices.map(p=>`<option value="${escapeHtml(p.slug)}">${escapeHtml(p.name)}</option>`).join('');
      panel.innerHTML = `<div class="section-heading"><div><p class="eyebrow">Operations</p><h3>Human Review Specialist workbench</h3></div></div><div class="admin-tools"><label>Filter by practice<select id="adminPracticeFilter"><option value="">All practices</option>${practiceOptions}</select></label><label>Search status, deadline, name, or note<input id="adminTextFilter" placeholder="Search queue"></label><label>Needs attention<select id="adminNeedsFilter"><option value="">All files</option><option value="attention">More information, deadline, payment, or delivery step</option></select></label></div><div class="dashboard-grid"><div class="mini-card"><strong>${res.cases.length}</strong><br>Total files</div><div class="mini-card"><strong>${res.cases.filter(c=>/priority|deadline/i.test((c.humanReviewLane||'')+(c.analysis?.concerns||[]).join(' '))).length}</strong><br>Priority/review signals</div><div class="mini-card"><strong>${(res.partners||[]).length}</strong><br>Community Partners</div></div>${res.cases.map(c=>renderAdminCase(c)).join('') || '<p>No cases yet.</p>'}<h3>Notifications</h3>${res.notifications.map(n=>`<p><strong>${escapeHtml(n.kind)}</strong> ${escapeHtml(n.createdAt)}</p>`).join('') || '<p>No notifications yet.</p>'}<h3>Recent admin activity</h3>${(res.auditLog||[]).slice(0,30).map(a=>`<p><strong>${escapeHtml(a.action)}</strong> ${escapeHtml(a.createdAt)} ${a.caseId ? ' · '+escapeHtml(a.caseId) : ''}</p>`).join('') || '<p>No activity yet.</p>'}<h3>Community Partners</h3>${(res.partners||[]).map(p=>`<p><strong>${escapeHtml(p.code)}</strong> — ${escapeHtml(p.name)} · ${escapeHtml(p.email||'')}</p>`).join('') || '<p>No partners yet.</p>'}`;
      initCounters(); $('#adminPracticeFilter')?.addEventListener('change', filterAdminCases); $('#adminTextFilter')?.addEventListener('input', filterAdminCases); $('#adminNeedsFilter')?.addEventListener('change', filterAdminCases);
    }
    form.addEventListener('submit', async e => { e.preventDefault(); const token = new FormData(form).get('token'); await loadQueue(token); });
    fetch('/api/staff/auth/status').then(r=>r.json()).then(status=>{ if(status.authenticated){ form.hidden=true; loadQueue('').catch(()=>{}); } }).catch(()=>{});
    document.addEventListener('submit', async e => {
      const f = e.target.closest('[data-admin-update]'); if(!f) return;
      e.preventDefault(); const token = activeToken; const id = f.dataset.adminUpdate; const body = Object.fromEntries(new FormData(f).entries());
      const out = f.querySelector('[data-update-result]'); out.textContent = 'Saving...';
      const res = await fetch('/api/admin/cases/'+encodeURIComponent(id), { method:'POST', headers:{'Content-Type':'application/json','X-Admin-Token':token}, body:JSON.stringify(body) }).then(r=>r.json());
      out.textContent = res.ok ? 'Saved.' : (res.error || 'Could not save.');
    });
  }

  function initDraftDetails(){
    document.addEventListener('submit', async e => {
      const f = e.target.closest('[data-draft-details]'); if(!f) return;
      e.preventDefault();
      const token = f.dataset.draftDetails;
      const out = f.querySelector('[data-draft-details-result]');
      const details = {};
      for (const [k,v] of new FormData(f).entries()) if (String(v||'').trim()) details[k]=v;
      if(out) out.textContent = 'Saving details...';
      const res = await fetch('/api/cases/'+encodeURIComponent(token)+'/draft-details', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ details }) }).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(out) out.textContent = res.ok ? 'Saved. The draft-readiness view has been refreshed.' : (res.error || 'Could not save details.');
      if(res.ok && res.case) { const result = document.querySelector('#caseResult'); if(result) result.innerHTML = renderCase(res.case); }
    });
  }

  function initAssistancePreferences(){
    document.addEventListener('submit',async event=>{
      const form=event.target.closest('[data-assistance-preference]');
      if(!form)return;
      event.preventDefault();
      const token=form.dataset.assistancePreference;
      const out=form.querySelector('[data-assistance-result]');
      const button=form.querySelector('button');
      if(out)out.textContent='Saving your choice...';
      if(button)button.disabled=true;
      const body=Object.fromEntries(new FormData(form).entries());
      const res=await fetch('/api/cases/'+encodeURIComponent(token)+'/assistance-preference',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()).catch(error=>({ok:false,error:error.message}));
      if(out)out.textContent=res.message||res.error||(res.ok?'Saved.':'Could not save your choice.');
      if(res.ok&&res.case){const panel=$('#caseResult')||$('#questionResult')||$('#noticeResult');if(panel)panel.innerHTML=renderCase(res.case);}
      if(button)button.disabled=false;
    });
  }

  function initCheckout(){
    document.addEventListener('submit', async e => {
      const f = e.target.closest('[data-checkout-form]'); if(!f) return;
      e.preventDefault();
      const out = f.querySelector('[data-checkout-result]');
      const btn = f.querySelector('button');
      const caseId = f.dataset.checkoutForm;
      const formData=new FormData(f);
      const body={caseId,email:String(formData.get('email')||''),serviceType:String(formData.get('serviceType')||''),acknowledgments:{scopeUnderstood:formData.get('scopeUnderstood')==='on',notProfessionalAdvice:formData.get('notProfessionalAdvice')==='on',feesSeparate:formData.get('feesSeparate')==='on',refundPolicyAccepted:formData.get('refundPolicyAccepted')==='on',electronicCommunicationsAccepted:formData.get('electronicCommunicationsAccepted')==='on'}};
      if(out) out.textContent = 'Checking service availability...';
      if(btn) btn.disabled = true;
      try {
        const res = await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
        if(!res.ok) throw new Error(res.error || res.message || 'This service is not open for checkout.');
        if(res.checkoutUrl){ location.href = res.checkoutUrl; return; }
        if(out) out.textContent = res.message || 'Payment request saved for staff follow-up.';
        if(res.case){ const panel = $('#caseResult') || $('#questionResult') || $('#noticeResult'); if(panel) panel.innerHTML = renderCase(res.case); }
      } catch(err){ if(out) out.textContent = err.message; }
      if(btn) btn.disabled = false;
    });
  }
  async function initCheckoutStatus(){
    const panel = $('#checkoutStatus'); if(!panel) return;
    const token = qs('case'); const sessionId = qs('session_id');
    if(!token){ panel.innerHTML = '<p>Open your dashboard with your private continuation link to confirm your file status.</p>'; return; }
    panel.innerHTML = '<p>Checking payment status...</p>';
    try {
      const res = await fetch('/api/checkout/confirm?case='+encodeURIComponent(token)+'&session_id='+encodeURIComponent(sessionId)).then(r=>r.json());
      if(!res.ok) throw new Error(res.error || 'Could not confirm status.');
      panel.innerHTML = `<h2>Payment status saved</h2><p>${escapeHtml(res.message || res.paymentStatus || 'Your payment step was received or is being checked.')}</p>${res.case ? renderCase(res.case) : ''}`;
    } catch(err){ panel.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`; }
  }
  function initLaunchReadiness(){
    const form = $('#launchReadinessForm'); if(!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const token = new FormData(form).get('token');
      const panel = $('#launchReadinessResult'); panel.hidden = false; panel.innerHTML = '<p>Checking configuration...</p>';
      try {
        const res = await fetch('/api/launch-readiness',{headers:{'X-Admin-Token':token}}).then(r=>r.json());
        if(!res.ok) throw new Error(res.error || 'Could not load checklist.');
        const items = res.checklist.items.map(item => `<li><strong>${item.ok ? 'Ready' : 'Needs work'}:</strong> ${escapeHtml(item.message)}</li>`).join('');
        const command=res.launchCommandCenter||{};
        const lanes=(command.lanes||[]).map(lane=>`<article class="launch-lane-card ${lane.ready?'ready':'blocked'}"><h3>${escapeHtml(lane.name)}</h3><p><strong>${escapeHtml(lane.status)}</strong> — ${lane.passedChecks}/${lane.requiredChecks} required checks passed.</p>${lane.blockedKeys?.length?`<p class="fine-print">Blocked: ${lane.blockedKeys.map(escapeHtml).join(', ')}</p>`:'<p class="fine-print">No required blockers remain in this lane.</p>'}</article>`).join('');
        panel.innerHTML = `<h3>${escapeHtml(command.overallStatus||'NO_GO')}</h3><p><strong>Storage mode:</strong> ${escapeHtml(res.checklist.storageMode)}</p><div class="launch-lane-grid">${lanes}</div><details><summary>Configuration checklist</summary><ul>${items}</ul></details>`;
      } catch(err){ panel.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`; }
    });
  }

  async function initPublicLaunchStatus(){
    const targets=$$('[data-launch-status]');
    const serviceTargets=$$('[data-service-readiness]');
    if(!targets.length&&!serviceTargets.length)return;
    try{
      const [launchResponse,serviceResponse]=await Promise.all([fetch('/api/public/launch-status'),fetch('/api/public/service-status')]);
      const data=await launchResponse.json(); const service=await serviceResponse.json();
      if(!launchResponse.ok||!data.ok)throw new Error(data.error||'Launch status is unavailable.');
      const rows=[data.publicStartingHelp,data.professionalAccounts,data.professionalApplications,data.professionalGrowth,data.paidMembership];
      targets.forEach(target=>{
        target.innerHTML=`<div class="launch-status-grid">${rows.map(item=>`<article class="launch-status-item"><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.detail)}</p></article>`).join('')}</div><p class="fine-print"><a href="/launch-status.html">See current availability and boundaries</a></p>`;
      });
      serviceTargets.forEach(target=>{
        if(!serviceResponse.ok||!service.ok){target.innerHTML='<strong>Service status could not be confirmed.</strong><p>Do not submit professional account information until the service reports availability.</p>';return;}
        const overall=service.overall||{}; const lane=service.selectedReadinessLane||{};
        target.classList.toggle('service-status-operational',overall.status==='operational');
        target.classList.toggle('service-status-limited',overall.status!=='operational');
        target.innerHTML=`<div class="service-status-heading"><span class="service-status-dot" aria-hidden="true"></span><div><strong>${escapeHtml(overall.label||'Current service status')}</strong><p>${escapeHtml(overall.detail||'')}</p></div></div><p class="fine-print">Core readiness lane: ${escapeHtml(lane.name||lane.id||'not selected')} — ${escapeHtml(lane.status||'not ready')}. Release ${escapeHtml(service.version||'')}. Checked ${escapeHtml(service.updatedAt||'')}.</p>`;
      });
    }catch(error){
      targets.forEach(target=>{target.innerHTML='<p>Current availability could not be loaded. No payment is collected through account preparation.</p>';});
      serviceTargets.forEach(target=>{target.innerHTML='<strong>Service status unavailable.</strong><p>Use the contact page before sharing professional account information.</p>';});
    }
  }

  function initStepForms(){
    $$('[data-step-form]').forEach(form => {
      setStep(form, Number(form.dataset.currentStep || 1));
      form.addEventListener('click', e => {
        const next = e.target.closest('[data-next-step]');
        const prev = e.target.closest('[data-prev-step]');
        const pick = e.target.closest('[data-pick]');
        if (pick) {
          const desired = form.querySelector('[name="desiredHelp"]');
          const doc = form.querySelector('[name="documentType"]');
          if (pick.dataset.pick === 'notice') { if (desired) desired.value = 'I have an urgent deadline or notice'; if (doc) doc.value = doc.value || 'Notice or letter'; }
          if (pick.dataset.pick === 'forms') { if (desired) desired.value = 'I want completed forms after review if available'; }
          if (pick.dataset.pick === 'unsure') { if (desired) desired.value = 'I only want to see where to start'; }
        }
        if (next) {
          const errors = validateStartForm(form, 'step');
          if (errors.length) { setErrorSummary(form, errors); return; }
          setErrorSummary(form, []); setStep(form, currentStep(form) + 1);
        }
        if (prev) { setErrorSummary(form, []); setStep(form, currentStep(form) - 1); }
      });
    });
  }

  async function initPortalDirectory(){
    const panel = $('#portalDirectory'); if(!panel) return;
    panel.innerHTML = '<p>Loading focused portals...</p>';
    try {
      const res = await fetch('/api/portals').then(r=>r.json());
      if(!res.ok) throw new Error(res.error || 'Could not load portals.');
      panel.innerHTML = res.portals.map(portal => { const canOpen=portalCanOpen(portal); const href=portal.slug==='general-smarter-justice-start' ? '/#start' : portal.publicUrl; return `<article class="portal-card"><p class="portal-status">${escapeHtml(portal.status)}</p><h3>${escapeHtml(portal.name)}</h3><p>${escapeHtml(portal.summary)}</p><p class="availability-note">${escapeHtml(portal.availabilityMessage || '')}</p><ul>${(portal.helpsWith||[]).slice(0,5).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p class="fine-print">${escapeHtml(portal.disclosure || '')}</p><div class="card-actions">${canOpen ? `<a class="primary link-btn" href="${escapeHtml(href)}">${portal.slug==='general-smarter-justice-start'?'Start here':'Open focused portal'}</a>` : `<a class="primary link-btn" href="/?portal=${encodeURIComponent(portal.slug)}#start">Start privately here</a>`}<a class="secondary link-btn" href="/portal-router.html?portal=${encodeURIComponent(portal.slug)}">Details</a></div></article>`; }).join('');
    } catch(err){ panel.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`; }
  }
  async function initPortalDetail(){
    const panel = $('#portalDetail'); if(!panel) return;
    const slug = qs('portal') || 'general-smarter-justice-start';
    panel.innerHTML = '<p>Loading portal details...</p>';
    try {
      const res = await fetch('/api/portals/'+encodeURIComponent(slug)).then(r=>r.json());
      if(!res.ok) throw new Error(res.error || 'Portal not found.');
      const p = res.portal;
      const canOpen=portalCanOpen(p); const href=p.slug==='general-smarter-justice-start' ? '/#start' : p.publicUrl;
      panel.innerHTML = `<article class="card wide"><p class="portal-status">${escapeHtml(p.status)}</p><p class="fine-print">${escapeHtml(p.brandFamily || '')}</p><h2>${escapeHtml(p.name)}</h2><p class="lead">${escapeHtml(p.summary)}</p><div class="availability-banner"><strong>Availability</strong><span>${escapeHtml(p.availabilityMessage || '')}</span></div><h3>Best for</h3><p>${escapeHtml(p.audience || '')}</p><h3>Helps with</h3><ul>${(p.helpsWith||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><h3>Ways to start</h3><ul>${(p.entryActions||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p class="fine-print">${escapeHtml(p.disclosure || '')}</p><div class="card-actions">${canOpen ? `<a class="primary link-btn" href="${escapeHtml(href)}">${p.slug==='general-smarter-justice-start'?'Start here':'Open focused portal'}</a>` : `<a class="primary link-btn" href="/?portal=${encodeURIComponent(p.slug)}#start">Start privately through Smarter Justice</a>`}<a class="secondary link-btn" href="/portals.html">View all portals</a></div></article>`;
    } catch(err){ panel.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`; }
  }


  function controlOptions(values, selected){
    return (values || []).map(value => `<option value="${escapeHtml(value)}" ${value===selected?'selected':''}>${escapeHtml(friendlyStatus(value))}</option>`).join('');
  }
  function controlListValue(items){ return (items || []).join('\n'); }
  function renderControlSummary(summary){
    const stats=[
      [summary.totalPortals || 0,'Portals tracked'],[summary.liveOrPilot || 0,'Live or pilot'],[summary.activeBuilds || 0,'Active builds'],[summary.blockedPortals || 0,'With blockers'],
      [summary.highPriority || 0,'Critical or high'],[summary.continuationPromptsRecorded || 0,'Prompts recorded'],[summary.documentedAdaptations || 0,'Documented adaptations'],[`${summary.averageProgress || 0}%`,'Average progress']
    ];
    return stats.map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('')+`<div class="control-stat control-standard-stat"><strong>${escapeHtml(summary.sharedStandardVersion || '')}</strong><span>Shared standard</span></div>`;
  }


  function renderLegalPortfolioOperatingSystem(view={}){
    const summary=view.summary||{};
    const box=$('#legalPortfolioOperatingSummary');
    if(box)box.innerHTML=[[summary.launchState||'NO_GO','Launch state'],[summary.pilotCount||0,'Controlled pilots'],[summary.openGates||0,'Open gates'],[summary.criticalDependenciesBlocked||0,'Critical dependencies not accepted'],[summary.ownerDecisions||0,'Owner decisions'],[summary.openIncidents||0,'Open incidents']].map(([v,l])=>`<div class="control-stat"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join('');
    const pilots=$('#legalPortfolioPilotList');
    if(pilots)pilots.innerHTML=`<div class="section-heading"><div><h3>Initial pilot order</h3><p>One central account and read-only v1.4.0 portal projections. Live imports remain closed.</p></div></div><div class="mini-card-grid">${(view.pilots||[]).map(p=>`<article class="mini-card"><p class="eyebrow">Pilot ${escapeHtml(String(p.order))}</p><h3>${escapeHtml(p.name||p.portalId)}</h3><p>${escapeHtml((p.simpleLaunchScope||[]).join(' · '))}</p>${p.workersCompensationBoundary?`<p class="fine-print"><strong>Boundary:</strong> ${escapeHtml(p.workersCompensationBoundary)}</p>`:''}</article>`).join('')}</div>`;
    const select=$('#launchGateRegisterSelect'); if(select)select.innerHTML=(view.gates||[]).map(g=>`<option value="${escapeHtml(g.id)}">${escapeHtml(g.label)} — ${escapeHtml(g.state)}</option>`).join('');
    const detail=$('#legalPortfolioOperatingDetail');
    if(detail)detail.innerHTML=`<h3>Authority</h3><p><strong>Final owner:</strong> ${escapeHtml(view.authority?.finalOwner||'Roger')} · <strong>Neutral Boardroom:</strong> ${escapeHtml(view.authority?.neutralBoardroom?.status||'DORMANT')}</p><h3>Dependencies</h3><div class="build-program-list">${(view.dependencies||[]).map(d=>`<article class="build-item-card"><div><strong>${escapeHtml(d.name)}</strong><span class="status-pill">${escapeHtml(d.status)}</span></div><p>${escapeHtml(d.purpose||'')}</p><p class="fine-print">${escapeHtml(d.launchCriticality||'')} · ${escapeHtml(d.failureBehavior||'')}</p></article>`).join('')}</div><h3>Roles</h3><div class="build-program-list">${(view.roles||[]).map(r=>`<article class="build-item-card"><strong>${escapeHtml(r.role)}</strong><p>${escapeHtml((r.may||[]).join(' · '))}</p></article>`).join('')}</div><h3>Latest decisions</h3><ul>${(view.decisions||[]).slice(0,12).map(d=>`<li><strong>${escapeHtml(d.status)}</strong> — ${escapeHtml(d.decision)}</li>`).join('')}</ul>`;
  }

  function renderAttorneyOutreachReadiness(view={}){
    const summary=view.summary||{};
    const summaryNode=$('#attorneyOutreachReadinessSummary');
    if(summaryNode)summaryNode.innerHTML=[
      [summary.launchState||'NO_GO','Launch state'],
      [summary.readyForReview||0,'Ready for review'],
      [summary.accepted||0,'Accepted'],
      [summary.blocked||0,'Blocked'],
      [summary.ownerDecisionRequired||0,'Owner decisions']
    ].map(([value,label])=>`<div><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    const list=$('#attorneyOutreachReadinessList');
    const items=view.readiness?.readinessItems||[];
    if(list)list.innerHTML=items.map(item=>`<article class="attorney-outreach-readiness-item" data-status="${escapeHtml(item.status||'UNKNOWN')}"><h3>${escapeHtml(item.label||item.id)}</h3><p><code>${escapeHtml(item.status||'UNKNOWN')}</code></p><p>${escapeHtml((item.evidence||[]).join(' '))}</p><p><strong>Next:</strong> ${escapeHtml(item.nextAction||'')}</p></article>`).join('')||'<p class="fine-print">No attorney-outreach readiness records are available.</p>';
    const detail=$('#attorneyOutreachReadinessDetail');
    if(detail)detail.innerHTML=`<p><strong>Canonical tour:</strong> ${escapeHtml(view.readiness?.canonicalTour?.route||'')}</p><p><strong>Stable short path:</strong> ${escapeHtml(view.readiness?.canonicalTour?.shortPath||'')}</p><p><strong>Justice Booth public claims allowed:</strong> ${summary.justiceBoothPublicClaimsAllowed?'Yes':'No'}</p><p><strong>Document Help coordination:</strong> ${escapeHtml(summary.documentHelpAdoptionStatus||'UNKNOWN')}</p><p><strong>Closed gates:</strong> ${escapeHtml((view.readiness?.closedGates||[]).join(' · '))}</p>`;
  }

  function renderLegalNetworkActionCenter(view={}){
    const summary=view.summary||{};
    const summaryNode=$('#legalNetworkActionSummary');
    if(summaryNode)summaryNode.innerHTML=[
      [summary.now||0,'Now'],
      [summary.next||0,'Next'],
      [summary.watch||0,'Watch'],
      [summary.preserve||0,'Preserve'],
      [summary.deferred||0,'Deferred'],
      [summary.resurfaced||0,'Resurfaced']
    ].map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    const primary=view.primaryAction;
    const primaryNode=$('#legalNetworkPrimaryAction');
    if(primaryNode)primaryNode.innerHTML=primary?`<article class="legal-network-primary-card"><div><p class="eyebrow">Primary legal-network action</p><h3>${escapeHtml(primary.title||'Review the legal network')}</h3><p><strong>${escapeHtml(primary.portalName||'Smarter Justice')}</strong></p><p>${escapeHtml(primary.reason||'')}</p><p><strong>Next:</strong> ${escapeHtml(primary.nextAction||'')}</p></div><div class="legal-network-primary-meta"><span class="status-pill action-tier-${escapeHtml(String(primary.tier||'next').toLowerCase())}">${escapeHtml(primary.tier||'NEXT')}</span><span class="status-pill evidence-pill">${escapeHtml(friendlyStatus(primary.evidenceState||''))}</span><span class="fine-print">Rule ${escapeHtml(primary.ruleId||'')}</span><span class="fine-print">Owner disposition: ${escapeHtml(friendlyStatus(primary.disposition?.status||'ACTIVE'))}</span></div></article>`:'<p class="fine-print">No current legal-network action requires attention.</p>';
    const laneNode=$('#legalNetworkActionLanes');
    if(!laneNode)return;
    const statuses=Array.isArray(view.dispositionStates)?view.dispositionStates:['ACTIVE','ACCEPTED','DEFERRED','DISMISSED','COMPLETED'];
    const renderAction=(action)=>`<form class="legal-network-action-item" data-legal-network-action="${escapeHtml(action.actionId||'')}"><div class="legal-network-action-heading"><div><span class="status-pill action-tier-${escapeHtml(String(action.tier||'next').toLowerCase())}">${escapeHtml(action.tier||'NEXT')}</span><span class="status-pill evidence-pill">${escapeHtml(friendlyStatus(action.evidenceState||''))}</span><h4>${escapeHtml(action.title||'Legal-network action')}</h4><p class="fine-print">${escapeHtml(action.portalName||'Smarter Justice legal network')} · ${escapeHtml(action.ruleId||'')}</p></div>${action.disposition?.resurfaced?'<span class="status-pill warning-pill">Resurfaced after evidence changed</span>':''}</div><p>${escapeHtml(action.reason||'')}</p><p><strong>Next:</strong> ${escapeHtml(action.nextAction||'')}</p><div class="legal-network-action-controls"><label>Owner disposition<select name="status">${controlOptions(statuses,action.disposition?.status||'ACTIVE')}</select></label><label>Review date<input type="date" name="reviewAt" value="${escapeHtml(action.disposition?.reviewAt||'')}"></label></div><label>Owner note<textarea name="note" rows="2" maxlength="1200" placeholder="Non-confidential execution note only">${escapeHtml(action.disposition?.note||'')}</textarea></label><div class="control-form-actions"><button class="secondary" type="submit">Save disposition</button><span class="fine-print legal-network-action-result" aria-live="polite"></span></div></form>`;
    laneNode.innerHTML=['NOW','NEXT','WATCH','PRESERVE'].map(tier=>{const rows=view.lanes?.[tier]||[];return `<details class="legal-network-action-lane" ${tier==='NOW'||tier==='NEXT'?'open':''}><summary><strong>${escapeHtml(tier)}</strong><span>${rows.length} current action${rows.length===1?'':'s'}</span></summary><div class="legal-network-action-list">${rows.map(renderAction).join('')||'<p class="fine-print">No current actions in this lane.</p>'}</div></details>`;}).join('');
  }


  function renderCurrentReleaseTruth(view={}){
    const node=$('#currentReleaseTruthText');
    if(!node)return;
    const source=view.selectedBase||{};
    const finalArchive=view.finalArchive||{};
    const portal=view.portalAuthority||{};
    const pair=view.activeMasterPair||{};
    node.textContent=`This owner view is running Smarter Justice v${view.releaseVersion||'unknown'}. Exact source and immediate rollback: ${source.filename||'not recorded'} (${source.sha256||'hash not recorded'}). The ${finalArchive.filename||'next archive'} final identity is ${friendlyStatus(finalArchive.receiptState||finalArchive.identityState||'detached after immutable packaging')}${finalArchive.sha256?` (${finalArchive.sha256})`:''}. Deployment remains ${view.deploymentAuthorized?'authorized':'not authorized'} and launch remains ${friendlyStatus(view.launchState||'NO_GO')}. Portal identities are ${friendlyStatus(portal.evidenceBoundary||'evidence scoped')}; the active prompt pair is epoch ${pair.pairEpoch??'?'}, revision ${pair.pairRevision??'?'}.`;
  }

  function renderPortfolioTruth(view={}){
    const summary=view.summary||{};
    const stats=[[summary.exactVerified||0,'Exact verified'],[summary.ownerRecorded||0,'Owner recorded'],[summary.completeIdentities||0,'Complete identities'],[summary.attentionNeeded||0,'Attention needed'],[summary.blocked||0,'Blocked'],[summary.highestDashboardClaim||'D0','Dashboard claim']];
    const summaryNode=$('#portfolioTruthSummary');
    if(summaryNode)summaryNode.innerHTML=stats.map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    const attention=(view.attentionItems||[]).slice(0,12);
    const attentionNode=$('#portfolioAttentionList');
    if(attentionNode)attentionNode.innerHTML=attention.map(item=>`<article class="portfolio-attention-item"><div><span class="status-pill">${escapeHtml(friendlyStatus(item.status||''))}</span><span class="status-pill evidence-pill">${escapeHtml(friendlyStatus(item.evidenceState||''))}</span></div><h4>${escapeHtml(item.name||item.portalId||'Portal')}</h4><p>${escapeHtml(item.reason||'Review current evidence.')}</p><p class="fine-print"><strong>Next:</strong> ${escapeHtml(item.nextAction||'Verify the dedicated portal artifact.')}</p></article>`).join('')||'<p class="fine-print">No attention items are recorded.</p>';
    const decisionNode=$('#portfolioDecisionList');
    if(decisionNode)decisionNode.innerHTML=(view.ownerDecisions||[]).map(item=>`<article class="portfolio-decision-item"><span class="status-pill">${escapeHtml(friendlyStatus(item.status||''))}</span><h4>${escapeHtml(item.decision||'Owner decision')}</h4><p class="fine-print">${escapeHtml(item.nextAction||'')}</p></article>`).join('')||'<p class="fine-print">No owner decisions are recorded.</p>';
    const exact=(view.portals||[]).filter(x=>x.evidenceState==='EXACT_VERIFIED');
    const blocked=(view.portals||[]).filter(x=>x.health==='BLOCKED');
    const runs=view.dashboardConformance?.runs||[];
    const detail=$('#portfolioTruthDetail');
    if(detail)detail.innerHTML=`<div class="portfolio-truth-columns"><div><h4>Exact verified</h4>${exact.map(x=>`<p><strong>${escapeHtml(x.name)}</strong><br><code class="wrap-code">${escapeHtml(x.artifact||'')}</code><br><span class="fine-print">${escapeHtml(x.sha256||'')}</span></p>`).join('')||'<p>None.</p>'}</div><div><h4>Blocked</h4>${blocked.map(x=>`<p><strong>${escapeHtml(x.name)}</strong><br>${escapeHtml(x.nextAction||'')}</p>`).join('')||'<p>None.</p>'}</div><div><h4>Conformance</h4>${runs.map(x=>`<p><strong>${escapeHtml(x.surfaceId||'Surface')}</strong><br><span class="status-pill">${escapeHtml(friendlyStatus(x.state||''))}</span></p>`).join('')||'<p>No conformance runs.</p>'}</div></div><p class="fine-print">Validation: ${view.validation?.ok?'passed':'failed'}${view.validation?.errors?.length?` — ${escapeHtml(view.validation.errors.join('; '))}`:''}. Public-user matter contents are forbidden from this registry.</p>`;
  }


  function renderNeutralBoardroomHandoff(handoff={}){
    const summary=handoff.summary||{};
    const summaryNode=$('#neutralBoardroomHandoffSummary');
    if(summaryNode)summaryNode.innerHTML=[[summary.legalPortalsTracked||0,'Legal portals tracked'],[summary.exactVerified||0,'Exact verified'],[summary.attentionNeeded||0,'Attention needed'],[handoff.liveConnection?'On':'Off','Live connection'],[handoff.automaticWrites?'On':'Off','Automatic writes']].map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    const detail=$('#neutralBoardroomHandoffDetail');
    if(detail){ const primary=handoff.primaryLegalNetworkAction; detail.innerHTML=`<article class="card"><p class="eyebrow">Authority boundary</p><h3>Smarter Justice is self-contained; Roger decides</h3><p>${escapeHtml(handoff.relationship?.neutralBoardroom||'')}</p><p>${escapeHtml(handoff.relationship?.smarterJustice||'')}</p></article><article class="card"><p class="eyebrow">Data boundary</p><h3>Non-confidential metadata only</h3><p>${escapeHtml(handoff.evidenceBoundary||'')}</p><p class="fine-print">No live connection, automatic action, automatic write, user-matter data, credentials, payment data, or confidential data.</p></article><article class="card"><p class="eyebrow">Primary legal-network action</p><h3>${escapeHtml(primary?.title||'No current primary action')}</h3><p>${escapeHtml(primary?.portalName||'')}</p><p>${escapeHtml(primary?.reason||'')}</p><p class="fine-print"><strong>Next:</strong> ${escapeHtml(primary?.nextAction||'')}</p></article>`; }
  }

  function renderPortalReleaseSnapshot(snapshot={}){
    const records=Array.isArray(snapshot.records)?snapshot.records:[];
    const independent=records.filter(row=>String(row.relationship||'').includes('independent')||String(row.relationship||'').includes('separate')).length;
    const exact=records.filter(row=>String(row.evidenceLevel||'').toLowerCase().includes('exact')).length;
    const summary=$('#portalReleaseSnapshotSummary');
    if(summary)summary.innerHTML=[[records.length,'Records'],[exact,'Exact-artifact summaries'],[independent,'Independent or separate'],[snapshot.version||'','Snapshot version']].map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    const list=$('#portalReleaseSnapshotList');
    if(list)list.innerHTML=records.map(row=>`<article class="portal-release-snapshot-row"><div><p class="eyebrow">${escapeHtml(row.relationship||'Portal')}</p><h3>${escapeHtml(row.name||row.slug||'Portal')}</h3><p class="fine-print">${escapeHtml(row.domain||'Domain not recorded')}</p></div><div><strong>${escapeHtml(row.latestDevelopmentVersion||'Not recorded')}</strong><span>${escapeHtml(row.latestZipName||'Package not recorded')}</span></div><div><span class="status-pill">${escapeHtml(row.deploymentStatus||'Deployment not confirmed')}</span><p>${escapeHtml(row.nextAction||'Continue in the dedicated portal chat.')}</p><p class="fine-print">${escapeHtml(row.evidenceLevel||'Dedicated artifact governs.')}</p></div></article>`).join('')||'<p class="fine-print">No portal release snapshot is recorded.</p>';
  }
  function renderLegalNetworkCommandCenter(spec={}){
    const modules=Array.isArray(spec.modules)?spec.modules:[];
    const excluded=Array.isArray(spec.expresslyOutOfScope)?spec.expresslyOutOfScope:[];
    const summary=$('#legalNetworkCommandSummary');
    if(summary)summary.innerHTML=[[modules.length,'Coordination modules'],[excluded.length,'Expressly out of scope'],[spec.version||'','Specification version'],[spec.automaticCrossRepositorySynchronization?'On':'Off','Automatic synchronization']].map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    const details=$('#legalNetworkCommandDetails');
    if(!details)return;
    const list=(items)=>`<ul class="check-list">${(items||[]).map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    details.innerHTML=`<article class="card"><p class="eyebrow">Legal-only architecture</p><h3>${escapeHtml(spec.workingName||'Smarter Justice Legal-Portal Control Center')}</h3><p>${escapeHtml(spec.purpose||'')}</p><p class="fine-print">${escapeHtml(spec.status||'')}</p></article><article class="card"><p class="eyebrow">Scope boundary</p><h3>Smarter Justice legal portals only</h3>${list((spec.expresslyOutOfScope||[]).map(row=>`${row} is outside this builder’s scope.`))}</article><article class="card"><p class="eyebrow">Data boundary</p><h3>Coordination without centralizing matters</h3>${list(spec.dataBoundaries?.prohibitedByDefault||[])}</article><article class="card"><p class="eyebrow">Compatibility</p><h3>Legacy aliases are temporary</h3><p>${escapeHtml(spec.compatibility?.status||'')}</p></article>`;
  }
  function renderLegalNetworkWorkspace(workspace={}){
    const portals=Array.isArray(workspace.portals)?workspace.portals:(Array.isArray(workspace.sectors)?workspace.sectors:[]);
    const summary=workspace.summary||{};
    const summaryNode=$('#legalNetworkWorkspaceSummary');
    if(summaryNode)summaryNode.innerHTML=[[summary.portalCount||summary.sectorCount||0,'Legal portals'],[summary.exactIdentityRecords||0,'Exact identity records'],[summary.assignedLeads||0,'Assigned leads'],[summary.openActivationGates||0,'Open activation gates']].map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    const list=$('#legalNetworkWorkspaceList'); if(!list)return;
    const statuses=['planned','active development','testing','exact artifact tested','deployment candidate','deployed','paused','released','archived'];
    const priorities=['critical','high','medium','low','backlog'];
    list.innerHTML=portals.map(row=>`<form class="legal-portal-card" data-legal-portal="${escapeHtml(row.id||'')}"><div class="legal-portal-heading"><div><p class="eyebrow">${escapeHtml(row.publicIdentity||'Legal portal')}</p><h3>${escapeHtml(row.name||row.id||'Legal portal')}</h3></div><span class="status-pill">${escapeHtml(row.latestVersion||'Version pending')}</span></div><p class="fine-print"><strong>Artifact:</strong> ${escapeHtml(row.artifactName||'Not recorded')}<br><strong>SHA-256:</strong> <span class="hash-wrap">${escapeHtml(row.sha256||'Not recorded')}</span><br><strong>Authority:</strong> ${escapeHtml(row.authority||'Dedicated artifact governs.')}<br><strong>Evidence:</strong> ${escapeHtml(friendlyStatus(row.evidenceState||'UNKNOWN'))} · <strong>Freshness:</strong> ${escapeHtml(friendlyStatus(row.freshnessState||'UNKNOWN'))} · <strong>Identity:</strong> ${escapeHtml(friendlyStatus(row.identityCompleteness||'INCOMPLETE'))}</p><div class="legal-portal-fields"><label>Status<select name="status">${controlOptions(statuses,row.status)}</select></label><label>Priority<select name="priority">${controlOptions(priorities,row.priority)}</select></label><label>Staff lead<input name="staffLead" value="${escapeHtml(row.staffLead||'Unassigned')}" maxlength="160"></label></div><label>Next action<textarea name="nextAction" rows="3">${escapeHtml(row.nextAction||'')}</textarea></label><label>Operational notes<textarea name="operationalNotes" rows="3" placeholder="Non-confidential legal-portal coordination notes only">${escapeHtml(row.operationalNotes||'')}</textarea></label><div class="control-form-actions"><button class="secondary" type="submit">Save legal-portal record</button><span class="fine-print legal-portal-result" aria-live="polite"></span></div></form>`).join('')||'<p class="fine-print">No legal-portal records are available.</p>';
  }
  function renderControlSystemReadiness(readiness){
    const items=readiness?.items || []; const passing=items.filter(x=>x.ok).length;
    return `<div class="section-heading"><div><p class="eyebrow">Smarter Justice deployment foundation</p><h2>System launch-readiness snapshot</h2></div><span class="status-pill">${passing} of ${items.length} checks currently satisfied</span></div><p>${readiness?.readyForPaidTraffic ? 'The configured checklist currently reports ready for paid traffic. A final legal, security, deployment, and user-acceptance review is still required.' : 'This development package is not yet configured for broad paid traffic. The Control Center tracks the missing production foundations without exposing secret values.'}</p><div class="control-readiness-list">${items.map(item=>`<div class="control-readiness-item ${item.ok?'ready':'needs-work'}"><strong>${item.ok?'Ready':'Needs work'}</strong><span>${escapeHtml(item.message || item.key)}</span></div>`).join('')}</div>`;
  }
  function renderControlGovernance(governance){
    return `<div class="section-heading"><div><p class="eyebrow">Shared coordination standard</p><h2>${escapeHtml(governance.title || 'Smarter Justice Shared Platform Standard')}</h2></div><span class="status-pill">Defaults with documented flexibility</span></div><p>${escapeHtml(governance.purpose || '')}</p><div class="control-governance-grid"><div><h3>Master coordination covers</h3><ul>${(governance.masterCoordinationScope || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div><div><h3>A specialty portal may adapt when</h3><ul>${(governance.deviationPolicy?.reasons || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div></div><div class="notice"><strong>${escapeHtml(governance.deviationPolicy?.principle || 'Shared standards are strong defaults, not inflexible rules.')}</strong><p>A portal may deliberately adapt them when that produces a safer, clearer, more accurate, more compliant, or more useful specialty experience. The shared default, reason, scope, risk, and expected benefit should be recorded. Privacy, security, truthful language, source verification, professional boundaries, and legal/compliance safeguards cannot be weakened.</p></div><details class="details-card"><summary>Future shared-system roadmap to preserve</summary><ul>${(governance.futureControlCenterRoadmap || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></details>`;
  }
  function renderReleaseGovernance(g={}){
    const summary=g.summary||{};
    const stats=[[summary.improvementItems||0,'Improvement items'],[summary.completedItems||0,'Completed in v1.7.9'],[summary.partiallyCompletedItems||0,'Partially completed'],[summary.p0Open||0,'Open P0 gates'],[summary.readinessDimensions||0,'Readiness dimensions'],[summary.portalsTracked||0,'Portals tracked'],[summary.formPaths||0,'Guided form paths'],[summary.automaticFilingPaths||0,'Automatic filing paths']];
    $('#releaseGovernanceSummary').innerHTML=stats.map(([v,l])=>`<div class="control-stat"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join('');
    const dimensions=g.readinessDimensions?.dimensions||[];
    $('#releaseReadinessDimensions').innerHTML=dimensions.length?`<div class="release-evidence-list">${dimensions.map(x=>`<article class="release-evidence-row"><div><strong>${escapeHtml(friendlyStatus(x.id||''))}</strong><span class="build-chip">${escapeHtml(friendlyStatus(x.status||''))}</span></div><p>${escapeHtml(x.evidence||'')}</p>${x.remaining?`<p class="fine-print"><strong>Remaining:</strong> ${escapeHtml(x.remaining)}</p>`:''}</article>`).join('')}</div>`:'<p>No readiness dimensions are recorded.</p>';
    const items=g.improvementList?.items||[];
    const active=items.filter(x=>x.releaseDisposition!=='completed in v1.7.9');
    $('#releaseImprovementQueue').innerHTML=active.length?`<div class="release-evidence-list">${active.map(x=>`<article class="release-evidence-row"><div><strong>${escapeHtml(x.id||'')}</strong><span class="build-chip ${x.priority==='P0'?'critical':''}">${escapeHtml(x.priority||'')}</span><span class="build-chip">${escapeHtml(x.classification||'')}</span></div><h4>${escapeHtml(x.title||'')}</h4><p>${escapeHtml(x.userBenefit||'')}</p><p class="fine-print"><strong>Status:</strong> ${escapeHtml(x.currentStatus||'')}</p></article>`).join('')}</div>`:'<p>No open improvement items.</p>';
    const matrix=g.portalCapabilityMatrix||{}; const portals=matrix.portals||[];
    $('#releasePortalCapabilityMatrix').innerHTML=`<p class="fine-print">${escapeHtml(matrix.summary?.portalsTracked||0)} portals tracked · ${escapeHtml(matrix.summary?.portalsWithDocumentedDeviations||0)} with documented adaptations · ${escapeHtml(matrix.summary?.portalsMissingBaselineRequirements||0)} with open baseline requirements.</p>${portals.length?`<div class="release-table-wrap"><table class="release-evidence-table"><thead><tr><th>Portal</th><th>Exact build</th><th>Build truth</th><th>Deployment truth</th><th>Open baseline requirements</th></tr></thead><tbody>${portals.map(x=>`<tr><td><strong>${escapeHtml(x.portalName||'')}</strong><br><span class="fine-print">${escapeHtml(x.officialDomain||'')}</span></td><td>${escapeHtml(x.exactBuildVersion||'Not recorded')}</td><td>${escapeHtml(x.buildState||x.packageTruth||'')}</td><td>${escapeHtml(x.deploymentTruth||'')}</td><td>${escapeHtml(String((x.missingBaselineRequirements||[]).length))}</td></tr>`).join('')}</tbody></table></div>`:'<p>No portal matrix is recorded.</p>'}`;
    const inv=g.formWorkflowInventory||{}; const invSummary=inv.summary||{};
    $('#releaseFormWorkflowInventory').innerHTML=`<div class="control-summary-grid"><div class="control-stat"><strong>${escapeHtml(String(invSummary.officialSourceForms||0))}</strong><span>Official source forms</span></div><div class="control-stat"><strong>${escapeHtml(String(invSummary.guidedFormPaths||0))}</strong><span>Guided paths</span></div><div class="control-stat"><strong>${escapeHtml(String(invSummary.reviewReadyDraftFoundations||0))}</strong><span>Review-ready foundations</span></div><div class="control-stat"><strong>${escapeHtml(String(invSummary.automaticFilingPaths||0))}</strong><span>Automatic filing paths</span></div></div><p>${escapeHtml(inv.globalBoundary||'')}</p>${(inv.guidedPaths||[]).length?`<div class="release-table-wrap"><table class="release-evidence-table"><thead><tr><th>Workflow</th><th>Practice</th><th>Readiness</th><th>Filing boundary</th></tr></thead><tbody>${inv.guidedPaths.map(x=>`<tr><td>${escapeHtml(x.title||x.workflowId||'')}</td><td>${escapeHtml(x.practiceSlug||'')}</td><td>${escapeHtml(x.readinessLabel||'')}</td><td>${escapeHtml(x.filingReadiness||x.releaseStatus||'')}</td></tr>`).join('')}</tbody></table></div>`:''}`;
  }
  function controlTextarea(name,label,value,rows=5,placeholder=''){
    return `<label>${escapeHtml(label)}<textarea name="${escapeHtml(name)}" rows="${rows}" ${placeholder?`placeholder="${escapeHtml(placeholder)}"`:''}>${escapeHtml(controlListValue(value))}</textarea></label>`;
  }
  function renderControlPortal(portal,enums){
    const readiness=['paymentReadiness','emailReadiness','storageReadiness','securityReadiness','legalComplianceReadiness','mobileReadiness','accessibilityReadiness','publicLanguageReadiness','conversionReadiness','promptHandoffReadiness','aiReadiness','referralReadiness','staffWorkflowReadiness','formWorkflowReadiness'];
    const readinessLabels={paymentReadiness:'Payments',emailReadiness:'Email',storageReadiness:'Storage',securityReadiness:'Security',legalComplianceReadiness:'Legal/compliance review',mobileReadiness:'Mobile devices',accessibilityReadiness:'Accessibility',publicLanguageReadiness:'Public language',conversionReadiness:'Signup and conversion',promptHandoffReadiness:'Prompt and build handoff',aiReadiness:'AI',referralReadiness:'Referral system',staffWorkflowReadiness:'Staff/reviewer workflow',formWorkflowReadiness:'Forms workflow'};
    const blockers=(portal.blockers || []).length, deviations=(portal.documentedDeviations || []).length;
    const searchText=[portal.name,portal.brandFamily,portal.portfolioStatus,portal.priority,portal.activeBuildState,portal.currentProductionVersion,portal.latestDevelopmentVersion,portal.latestZipName,portal.currentBuildTarget,portal.lastReleaseSummary,...(portal.ownerDecisions||[]),...(portal.completedMilestones||[]),...(portal.nextMilestones||[]),...(portal.futureFeatures||[]),...(portal.knownLimitations||[]),...(portal.blockers||[]),...(portal.risks||[]),...(portal.documentedDeviations||[]),portal.notes].join(' ').toLowerCase();
    return `<article class="control-portal-card" data-control-portal data-search="${escapeHtml(searchText)}" data-status="${escapeHtml(portal.portfolioStatus)}" data-priority="${escapeHtml(portal.priority)}"><details><summary><div><span class="portal-status">${escapeHtml(friendlyStatus(portal.portfolioStatus))}</span><h2>${escapeHtml(portal.name)}</h2><p>${escapeHtml(portal.currentBuildTarget || 'No current build target recorded.')}</p><p class="fine-print">${escapeHtml(portal.latestDevelopmentVersion ? `Development ${portal.latestDevelopmentVersion}` : 'Development version not recorded')}${portal.currentProductionVersion ? ` · Production ${escapeHtml(portal.currentProductionVersion)}` : ''}</p></div><div class="control-progress-wrap"><strong>${escapeHtml(String(portal.progressPercent || 0))}%</strong><span class="control-progress"><span style="width:${Math.max(0,Math.min(100,Number(portal.progressPercent || 0)))}%"></span></span><small>${escapeHtml(friendlyStatus(portal.activeBuildState))}${blockers?` · ${blockers} blocker${blockers===1?'':'s'}`:''}${deviations?` · ${deviations} adaptation${deviations===1?'':'s'}`:''}</small></div></summary><form class="control-portal-form" data-control-portal-form="${escapeHtml(portal.slug)}">
      <div class="control-form-section"><h3>Build position</h3><div class="form-grid three"><label>Portfolio status<select name="portfolioStatus">${controlOptions(enums.portfolioStatuses,portal.portfolioStatus)}</select></label><label>Priority<select name="priority">${controlOptions(enums.priorities,portal.priority)}</select></label><label>Active build state<select name="activeBuildState">${controlOptions(enums.activeBuildStates,portal.activeBuildState)}</select></label></div><label>Current build target<textarea name="currentBuildTarget" rows="3">${escapeHtml(portal.currentBuildTarget || '')}</textarea></label><label>Last release summary<textarea name="lastReleaseSummary" rows="3">${escapeHtml(portal.lastReleaseSummary || '')}</textarea></label><div class="form-grid three"><label>Production version<input name="currentProductionVersion" value="${escapeHtml(portal.currentProductionVersion || '')}"></label><label>Latest development version<input name="latestDevelopmentVersion" value="${escapeHtml(portal.latestDevelopmentVersion || '')}"></label><label>Latest ZIP/package<input name="latestZipName" value="${escapeHtml(portal.latestZipName || '')}" placeholder="portal-name-v1.0.0.zip"></label><label>Progress percent<input name="progressPercent" type="number" min="0" max="100" value="${escapeHtml(String(portal.progressPercent || 0))}"></label><label>Last build date/time<input name="lastBuildAt" value="${escapeHtml(portal.lastBuildAt || '')}" placeholder="ISO date or clear date"></label><label>Last deployment date/time<input name="lastDeploymentAt" value="${escapeHtml(portal.lastDeploymentAt || '')}"></label></div></div>
      <div class="control-form-section"><h3>Code, deployment, and health</h3><div class="form-grid two"><label>Repository URL<input name="repository" value="${escapeHtml(portal.repository || '')}" placeholder="https://..."></label><label>Deployment service<input name="deploymentService" value="${escapeHtml(portal.deploymentService || '')}" placeholder="Render, another host, or not configured"></label><label>Production URL<input name="productionUrl" value="${escapeHtml(portal.productionUrl || '')}" placeholder="https://..."></label><label>Staging URL<input name="stagingUrl" value="${escapeHtml(portal.stagingUrl || '')}" placeholder="https://..."></label><label>Health endpoint<input name="healthEndpoint" value="${escapeHtml(portal.healthEndpoint || '/health')}"></label><label>Health status<select name="healthStatus">${controlOptions(enums.healthStatuses,portal.healthStatus)}</select></label><label>Last health check<input name="lastHealthCheckAt" value="${escapeHtml(portal.lastHealthCheckAt || '')}"></label><label>Active portal development chat<input name="activeDevelopmentChat" value="${escapeHtml(portal.activeDevelopmentChat || '')}" placeholder="Chat/project label only; no secrets"></label><label>Continuation prompt version<input name="continuationPromptVersion" value="${escapeHtml(portal.continuationPromptVersion || '')}"></label><label>Continuation prompt location<input name="continuationPromptLocation" value="${escapeHtml(portal.continuationPromptLocation || '')}" placeholder="Filename or approved reference"></label></div></div>
      <div class="control-form-section"><h3>Readiness</h3><div class="form-grid three">${readiness.map(field=>`<label>${escapeHtml(readinessLabels[field])}<select name="${field}">${controlOptions(enums.readinessStatuses,portal[field])}</select></label>`).join('')}</div></div>
      <div class="control-form-section"><h3>Shared system and specialty source of truth</h3><div class="form-grid two">${controlTextarea('professionalReviewTypes','Professional review types — one per line',portal.professionalReviewTypes)}${controlTextarea('sharedCapabilities','Shared capabilities used or planned — one per line',portal.sharedCapabilities)}${controlTextarea('portalSpecificRequirements','Portal-specific requirements — one per line',portal.portalSpecificRequirements,6,'Legal specialty, jurisdictions, terminology, forms, review, pricing, or workflow requirements')}${controlTextarea('ownerDecisions','Owner decisions to preserve — one per line',portal.ownerDecisions,6)}${controlTextarea('completedMilestones','Completed milestones — one per line',portal.completedMilestones)}${controlTextarea('releaseHistory','Release history — one line per release',portal.releaseHistory,6,'Version | date | status | summary')}${controlTextarea('nextMilestones','Next milestones — one per line',portal.nextMilestones)}${controlTextarea('futureFeatures','Future features to preserve — one per line',portal.futureFeatures)}${controlTextarea('knownLimitations','Known limitations — one per line',portal.knownLimitations)}${controlTextarea('nextBuildInstructions','Next-build instructions — one per line',portal.nextBuildInstructions,6)}${controlTextarea('blockers','Current blockers — one per line',portal.blockers)}${controlTextarea('risks','Risks — one per line',portal.risks)}${controlTextarea('documentedDeviations','Documented specialty adaptations — one per line',portal.documentedDeviations,6,'Shared default | reason | scope | risk | expected benefit')}</div></div>
      <label>Owner coordination notes<textarea name="notes" rows="5" placeholder="Do not enter passwords, API keys, or other secrets.">${escapeHtml(portal.notes || '')}</textarea></label>
      <div class="control-form-actions"><button class="primary">Save portal record</button><button class="secondary" type="button" data-generate-portal-prompt="${escapeHtml(portal.slug)}" data-portal-name="${escapeHtml(portal.name)}">Generate next-chat prompt</button><button class="secondary" type="button" data-generate-portal-manifest="${escapeHtml(portal.slug)}" data-portal-name="${escapeHtml(portal.name)}">Generate manifest</button><span class="fine-print" data-control-save-result aria-live="polite">${portal.updatedAt?`Last updated ${escapeHtml(portal.updatedAt)}`:'No owner update recorded yet.'}</span></div>
    </form></details></article>`;
  }
  function controlFormPayload(form){
    const raw=Object.fromEntries(new FormData(form).entries());
    const listFields=['professionalReviewTypes','sharedCapabilities','portalSpecificRequirements','completedMilestones','nextMilestones','ownerDecisions','releaseHistory','futureFeatures','knownLimitations','nextBuildInstructions','blockers','risks','documentedDeviations'];
    for(const field of listFields) raw[field]=String(raw[field] || '').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    raw.progressPercent=Number(raw.progressPercent || 0);
    return raw;
  }
  function filterControlPortals(){
    const search=($('#controlCenterSearch')?.value || '').trim().toLowerCase();
    const status=$('#controlCenterStatusFilter')?.value || '';
    const priority=$('#controlCenterPriorityFilter')?.value || '';
    $$('[data-control-portal]').forEach(card=>{ card.hidden=!((!search || card.dataset.search.includes(search)) && (!status || card.dataset.status===status) && (!priority || card.dataset.priority===priority)); });
  }
  function downloadControlArtifact(filename,text,mime='text/plain'){
    const blob=new Blob([text],{type:mime}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }
  function initControlCenter(){
    const login=$('#controlCenterTokenForm'); if(!login) return;
    let ownerToken=sessionStorage.getItem('smarterJusticeOwnerControlToken') || '';
    let currentData=null;
    let artifact={ filename:'smarter-justice-artifact.txt', text:'', mime:'text/plain' };
    const headers=()=>({'X-Owner-Control-Token':ownerToken});
    function showArtifact({title,kind,text,filename,mime='text/plain',help}){
      artifact={filename,text,mime}; $('#controlCenterArtifactTitle').textContent=title; $('#controlCenterArtifactKind').textContent=kind; $('#controlCenterArtifactText').value=text; $('#controlCenterArtifactHelp').textContent=help || 'Review this artifact before use.'; $('#controlCenterArtifactResult').textContent=''; $('#controlCenterArtifactPanel').hidden=false; $('#controlCenterArtifactPanel').scrollIntoView({behavior:'smooth',block:'start'});
    }
    let marketplaceData=null;
    let nysPreviewRows=[];
    function splitLines(value){ return String(value || '').split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean); }
    function selectedValues(select){ return select ? Array.from(select.selectedOptions).map(o=>o.value).filter(Boolean) : []; }
    function money(value){ return value==null ? 'Not configured' : new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value)/100); }
    function renderRulesPackSummary(record){
      if(!record) return '<p>The rules pack could not be loaded.</p>';
      return `<div class="marketplace-two-column"><div><h3>${escapeHtml(record.status || 'Approved')}</h3><p><strong>Version:</strong> ${escapeHtml(record.version || '')}</p><p><strong>Effective:</strong> ${escapeHtml(record.effectiveDate || '')}</p></div><div><h3>Build reproducibility</h3><p><strong>SHA-256:</strong><br><code class="wrap-code">${escapeHtml(record.checksum || '')}</code></p><p><strong>Protected API:</strong> ${escapeHtml(record.protectedApi || '/api/system/master-rules-pack')}</p></div></div><p class="fine-print">Every generated portal prompt and manifest records this version and checksum. Approved portals can retrieve the pack through the protected API.</p>`;
    }
    function renderOwnerSecurity(status={}){
      const account=status.account || {};
      const configured=Boolean(status.accountAuthenticationReady);
      const authenticated=Boolean(status.authenticated);
      if(!configured) return `<div class="section-heading"><div><p class="eyebrow">Privileged access</p><h2>Owner account setup required</h2></div><span class="status-pill">Not configured</span></div><p>Set the owner account environment variables, restart the service, and then enroll authenticator MFA before opening a controlled professional pilot.</p><p class="fine-print">The legacy owner token is a temporary development migration path and is disabled by default in production.</p>`;
      return `<div class="section-heading"><div><p class="eyebrow">Privileged access</p><h2>Owner account security</h2></div><span class="status-pill">${account.mfaEnabled?'MFA enabled':'MFA required before launch'}</span></div><p><strong>${escapeHtml(account.displayName || account.email || 'Owner account')}</strong>${account.email?` · ${escapeHtml(account.email)}`:''}</p><p class="fine-print">Short-lived owner sessions are active. Legacy production token access: ${status.legacyTokenAllowed?'temporarily allowed':'disabled'}.</p>${account.mfaEnabled?`<div class="card-actions"><button class="secondary" id="ownerRotateRecoveryCodes" type="button">Replace recovery codes</button><button class="secondary" id="ownerRevokeSessions" type="button">Sign out other sessions</button></div><form class="compact-form" hidden id="ownerRecoveryRotateForm"><div class="form-grid two"><label>Current password<input name="password" type="password" autocomplete="current-password" required></label><label>Authenticator code<input name="code" autocomplete="one-time-code" inputmode="numeric" required></label></div><button class="secondary">Generate replacement codes</button></form>`:`<button class="primary" id="ownerBeginMfa" type="button">Set Up Authenticator MFA</button><div hidden id="ownerMfaEnrollment"></div>`}<div aria-live="polite" id="ownerSecurityResult"></div>`;
    }
    function renderCapabilityRegistry(registry={}){
      const capabilities=registry.capabilities || [];
      const learning=registry.learningSystem || {};
      const groups=(registry.categories||[]).map(category=>({category,items:capabilities.filter(item=>item.category===category)}));
      const artifacts=learning.sourceArtifacts || [];
      const decisions=learning.adoptionDecisions || [];
      const learningRecords=learning.learningRecords || [];
      const contract=learning.continuationPromptContract || {};
      const statusCounts=learning.summary?.statusCounts || {};
      const statusCards=Object.entries(statusCounts).map(([status,count])=>`<div class="control-stat"><strong>${escapeHtml(String(count))}</strong><span>${escapeHtml(friendlyStatus(status))}</span></div>`).join('');
      const artifactRows=artifacts.map(item=>`<tr><td>${escapeHtml(item.portalName||item.portalId)}</td><td>${escapeHtml(item.version||'')}</td><td><code class="wrap-code">${escapeHtml(item.artifactName||'')}</code></td><td>${escapeHtml(item.evidenceLevel||'')}</td><td>${escapeHtml(item.deploymentStatus||'')}</td></tr>`).join('');
      const decisionRows=decisions.map(item=>`<tr><td>${escapeHtml(item.portalId)}</td><td>${escapeHtml(item.capabilityId)}</td><td>${escapeHtml(friendlyStatus(item.status))}</td><td>${escapeHtml(item.reason||'')}</td><td>${item.ownerApprovalRequired?'Yes':'No'}</td></tr>`).join('');
      const learningCards=learningRecords.map(item=>`<article class="marketplace-item"><h3>${escapeHtml(item.name)}</h3><p><strong>${escapeHtml(item.sourcePortal)} ${escapeHtml(item.sourceVersion)}</strong> · ${escapeHtml(friendlyStatus(item.evidenceStatus))}</p><p>${escapeHtml(item.reusableValue||item.problemSolved||'')}</p><p class="fine-print">Safeguards: ${escapeHtml((item.safeguards||[]).join('; '))}</p></article>`).join('');
      return `<div class="section-heading"><div><p class="eyebrow">Cross-portal learning</p><h2>Capability Registry and Adaptation Ledger</h2></div><span class="status-pill">Registry ${escapeHtml(registry.version||'')} · Learning ${escapeHtml(learning.version||'')} · ${capabilities.length} capabilities</span></div><p>Verified lessons may move between portals only after artifact inspection, specialty adaptation, and target-portal testing. A discussion, roadmap, or source-portal feature never proves that the target portal implemented it.</p><div class="card-actions"><button class="secondary" id="downloadCapabilityRegistry" type="button">Download full registry JSON</button><button class="secondary" id="downloadCrossPortalLearning" type="button">Download learning handoff JSON</button></div><div class="control-summary-grid">${statusCards}</div><details class="details-card" open><summary>Verified source artifacts — ${artifacts.length}</summary><div class="table-scroll"><table><thead><tr><th>Portal</th><th>Version</th><th>Artifact</th><th>Evidence</th><th>Deployment truth</th></tr></thead><tbody>${artifactRows}</tbody></table></div></details><details class="details-card" open><summary>Portal adoption decisions — ${decisions.length}</summary><div class="table-scroll"><table><thead><tr><th>Target</th><th>Capability</th><th>Decision</th><th>Reason</th><th>Owner approval</th></tr></thead><tbody>${decisionRows}</tbody></table></div></details><details class="details-card"><summary>Reusable learning records — ${learningRecords.length}</summary><div class="innovation-lab-grid">${learningCards}</div></details><details class="details-card"><summary>Continuation-prompt contract</summary><p><strong>${escapeHtml(contract.sectionTitle||'Cross-Portal Learning and Adaptation')}</strong> is required in every future portal continuation prompt.</p><ul>${(contract.requirements||[]).map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul><p class="fine-print">${escapeHtml(contract.artifactTruthWarning||'')}</p></details><details class="details-card"><summary>Complete capability catalog</summary><div class="capability-registry-groups">${groups.map(group=>`<details class="details-card"><summary>${escapeHtml(friendlyStatus(group.category))} — ${group.items.length}</summary><div class="table-scroll"><table><thead><tr><th>Capability</th><th>Best reference</th><th>Version</th><th>Evidence</th><th>Shared core</th></tr></thead><tbody>${group.items.map(item=>`<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.bestReferencePortal)}</td><td>${escapeHtml(item.bestReferenceVersion)}</td><td>${escapeHtml(friendlyStatus(item.evidenceStatus))}</td><td>${item.sharedCoreCandidate?'Candidate':'Specialty-specific'}</td></tr>`).join('')}</tbody></table></div></details>`).join('')}</div></details><details class="details-card"><summary>Proven and emerging success patterns</summary>${(registry.successPatterns||[]).map(item=>`<article class="marketplace-item"><h3>${escapeHtml(item.name)}</h3><p><strong>${escapeHtml(item.originPortal)} ${escapeHtml(item.originVersion)}</strong> · ${escapeHtml(friendlyStatus(item.status))}</p><p>${escapeHtml(item.value)}</p><p class="fine-print">Reuse guidance: ${escapeHtml(item.reuse)}</p></article>`).join('')}</details>`;
    }
    function renderMarketplaceSummary(summary={}){
      const items=[[summary.professionals||0,'Professionals'],[summary.firms||0,'Firms'],[summary.sourceSeededProfiles||0,'Source-seeded'],[summary.activePaidMembers||0,'Paid members'],[summary.consultationEligible||0,'Consultation eligible'],[summary.outreachCampaigns||0,'Outreach campaigns'],[summary.outreachProspects||0,'Sales prospects'],[summary.potentialFirmSeats||0,'Potential seats'],[money(summary.projectedMonthlyRevenueCents||0),'Projected monthly revenue']];
      return items.map(([v,l])=>`<div class="control-stat"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join('');
    }
    function renderProfessionalAccountSummary(summary={}){
      const items=[[(summary.accounts||[]).length,'Central accounts'],[summary.activeSessions||0,'Active sessions'],[summary.pendingProfileClaims||0,'Pending profile claims']];
      return items.map(([v,l])=>`<div class="control-stat"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join('');
    }
    function renderProfessionalAccount(account={},data={}){
      const professionals=(account.professionalIds||[]).map(id=>(data.professionals||[]).find(p=>p.id===id)).filter(Boolean);
      const firms=(account.firmIds||[]).map(id=>(data.firms||[]).find(f=>f.id===id)).filter(Boolean);
      const pending=(account.pendingClaimProfessionalIds||[]).map(id=>(data.professionals||[]).find(p=>p.id===id)).filter(Boolean);
      const pendingFirms=(account.pendingClaimFirmIds||[]).map(id=>(data.firms||[]).find(f=>f.id===id)).filter(Boolean);
      const pendingForms=pending.map(profile=>{
        const request=(data.profileRequests||[]).find(r=>r.profileId===profile.id && r.requesterEmail===account.email && r.requestType==='claim' && !['approved','denied','closed'].includes(r.status));
        return `<form class="marketplace-item" data-account-claim-approve data-account-id="${escapeHtml(account.id)}" data-professional-id="${escapeHtml(profile.id)}" data-profile-request-id="${escapeHtml(request?.id||'')}"><p><strong>Pending professional claim:</strong> ${escapeHtml(profile.displayName||profile.id)}</p><p class="fine-print">${escapeHtml(request?.status||'Claim record pending')} · No edit control until approved.</p><div class="control-form-actions"><button class="secondary">Approve professional control</button><span data-marketplace-result class="fine-print"></span></div></form>`;
      }).join('')+pendingFirms.map(firm=>{
        const request=(data.profileRequests||[]).find(r=>r.profileId===firm.id && r.requesterEmail===account.email && r.requestType==='claim' && !['approved','denied','closed'].includes(r.status));
        return `<form class="marketplace-item" data-account-firm-claim-approve data-account-id="${escapeHtml(account.id)}" data-firm-id="${escapeHtml(firm.id)}" data-profile-request-id="${escapeHtml(request?.id||'')}"><p><strong>Pending firm claim:</strong> ${escapeHtml(firm.name||firm.id)}</p><p class="fine-print">${escapeHtml(request?.status||'Claim record pending')} · No edit control until approved.</p><div class="control-form-actions"><button class="secondary">Approve firm control</button><span data-marketplace-result class="fine-print"></span></div></form>`;
      }).join('');
      return `<article class="marketplace-record"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(account.accountType||'professional')} account</p><h3>${escapeHtml(account.displayName||account.email)}</h3></div>${statusPill(account.status||'active')}</div><p>${escapeHtml(account.email||'')}</p><p><strong>Profiles:</strong> ${escapeHtml(professionals.map(x=>x.displayName).join(', ')||'None')}</p><p><strong>Firms:</strong> ${escapeHtml(firms.map(x=>x.name).join(', ')||'None')}</p><p class="fine-print">Membership target: ${escapeHtml(account.membershipTarget?.kind||'not selected')} ${escapeHtml(account.membershipTarget?.id||'')}</p>${pendingForms||'<p class="fine-print">No pending profile-control claims.</p>'}<details class="details-card"><summary>Create and link a private profile manually</summary><form data-owner-manual-profile data-account-id="${escapeHtml(account.id)}"><div class="form-grid two"><label>Record type<select name="kind"><option value="professional">Professional</option><option value="firm">Firm</option></select></label><label>Professional or firm name<input name="displayName" required></label><label>Professional type<input name="professionalType" value="attorney"></label><label>Firm seats<input name="seatCount" type="number" min="1" max="500" value="1"></label></div><label>Jurisdictions — one per line<textarea name="jurisdictions" rows="2">New York</textarea></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="2"></textarea></label><label>Portal IDs — one per line<textarea name="portalEligibility" rows="2">general-smarter-justice-start</textarea></label><label>Office locations — one per line<textarea name="locations" rows="2"></textarea></label><div class="control-form-actions"><button class="secondary">Create private record</button><span data-marketplace-result class="fine-print"></span></div><p class="fine-print">This creates account-linked private data only. Verification, portal distribution, publication, and payment remain separate.</p></form></details></article>`;
    }
    function renderProfileGrowthBatch(batch={}){
      const markets=batch.actual?.markets||{};
      const marketRows=Object.entries(markets).map(([market,count])=>`<li><strong>${escapeHtml(market)}:</strong> ${escapeHtml(String(count))} new individual professionals</li>`).join('');
      return `<section class="notice"><div class="section-heading"><div><p class="eyebrow">Current three-market profile batch</p><h3>Version ${escapeHtml(batch.version||'not recorded')}</h3></div><span class="status-pill">Lead: ${escapeHtml(batch.leadMarket||'not recorded')}</span></div><p><strong>${escapeHtml(String(batch.actual?.individualProfessionals||0))}</strong> new individual professionals, <strong>${escapeHtml(String(batch.actual?.firms||0))}</strong> new firms, and <strong>${escapeHtml(String(batch.actual?.professionalFirmLinks||0))}</strong> professional–firm links.</p><ul>${marketRows}</ul><p class="fine-print">Next lead market: ${escapeHtml(batch.nextLeadMarket||'not recorded')}. Credential verification and participation remain separate from public-source profile publication.</p></section>`;
    }
    function renderMarketplaceGovernance(governance={}){
      return `<div class="notice"><strong>${escapeHtml(governance.coreIdentity || governance.title || 'Professional marketplace foundation')}</strong><p>${escapeHtml(governance.membershipRule || '')}</p><p><strong>Eligibility:</strong> ${escapeHtml(governance.eligibilityRule || '')}</p><p><strong>Independence:</strong> ${escapeHtml(governance.independenceRule || '')}</p></div><div class="marketplace-two-column"><div class="notice"><strong>NYC founding pilot</strong><p>${escapeHtml(governance.foundingPilotRule||'')}</p></div><div class="notice"><strong>Firm discounts</strong><p>${escapeHtml(governance.firmDiscountRule||'')}</p></div></div><p class="fine-print">${escapeHtml(governance.outreachRule||'')}</p><details class="details-card"><summary>Revenue and professional-independence boundaries</summary><ul>${(governance.revenueBoundaries||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></details><details class="details-card"><summary>Phased marketplace roadmap</summary><ol>${(governance.phasedRoadmap||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol></details>`;
    }
    function renderMembershipPlan(plan={}){
      return `<form class="marketplace-item" data-membership-plan="${escapeHtml(plan.id)}"><div class="section-heading"><div><h4>${escapeHtml(plan.name)}</h4><p>${escapeHtml(plan.billingModel || '')} · ${escapeHtml(plan.status || '')}</p></div>${plan.foundingPlan?'<span class="status-pill">Founding pilot</span>':''}</div><div class="form-grid two"><label>Monthly price in cents<input name="monthlyPriceCents" type="number" min="0" value="${plan.monthlyPriceCents==null?'':escapeHtml(String(plan.monthlyPriceCents))}"></label><label>Annual price in cents<input name="annualPriceCents" type="number" min="0" value="${plan.annualPriceCents==null?'':escapeHtml(String(plan.annualPriceCents))}"></label><label>Status<input name="status" value="${escapeHtml(plan.status || '')}"></label><label>Included staff seats<input name="includedStaffSeats" type="number" min="0" value="${plan.includedStaffSeats==null?'':escapeHtml(String(plan.includedStaffSeats))}"></label><label>Pricing mode<input name="pricingMode" value="${escapeHtml(plan.pricingMode||'')}"></label><label><input name="foundingPlan" type="checkbox" ${plan.foundingPlan?'checked':''}> Founding plan</label></div><label>Features — one per line<textarea name="features" rows="5">${escapeHtml((plan.features||[]).join('\n'))}</textarea></label><p class="fine-print">Consultation eligibility: ${plan.consultationEligibility?'Potentially available after all other gates':'Not available'} · Premium profile eligibility: ${plan.premiumListingEligibility?'yes':'no'} · ${money(plan.monthlyPriceCents)} monthly · ${money(plan.annualPriceCents)} annually</p><div class="control-form-actions"><button class="secondary">Save plan</button><span data-marketplace-result class="fine-print"></span></div></form>`;
    }
    function renderRevenueProgram(program={}){
      return `<form class="marketplace-item" data-revenue-program="${escapeHtml(program.id)}"><h4>${escapeHtml(program.name)}</h4><p><strong>${escapeHtml(program.category || '')}</strong> · ${escapeHtml(program.model || '')}</p><div class="form-grid two"><label>Status<input name="status" value="${escapeHtml(program.status || '')}"></label><label>Priority<input name="priority" value="${escapeHtml(program.priority || '')}"></label></div><label>Description<textarea name="description" rows="3">${escapeHtml(program.description || '')}</textarea></label><label>Compliance gate<textarea name="complianceGate" rows="3">${escapeHtml(program.complianceGate || '')}</textarea></label><label>Owner notes<textarea name="ownerNotes" rows="2">${escapeHtml(program.ownerNotes || '')}</textarea></label><div class="control-form-actions"><button class="secondary">Save revenue item</button><span data-marketplace-result class="fine-print"></span></div></form>`;
    }
    function renderFirmRecord(firm={}){
      const quote=firm.quote||{};
      return `<article class="marketplace-record"><div class="section-heading"><div><p class="eyebrow">Firm record</p><h3>${escapeHtml(firm.name)}</h3></div>${statusPill(firm.profileStatus)}</div><p>${escapeHtml((firm.jurisdictions||[]).join(', ') || 'No jurisdiction recorded')}</p><p><strong>Seats:</strong> ${escapeHtml(String(firm.seatCount||1))} · <strong>Discount:</strong> ${escapeHtml(String(quote.discountPercent||0))}% · <strong>Illustrative monthly total:</strong> ${money(quote.monthlyTotalCents)}</p><p class="fine-print">Membership: ${escapeHtml(firm.membership?.status || 'none')} · Approval: ${escapeHtml(firm.ownerApprovalStatus || 'draft')} · Profile revision: ${escapeHtml(String(firm.profileRevision||1))} · Submitted revision: ${escapeHtml(String(firm.submittedRevision||0))} · Review: ${escapeHtml(firm.reviewStatus||'draft')} · Public profile enabled: ${firm.publicProfileEnabled?'yes':'no'}</p><details><summary>Firm membership and seat controls</summary><form data-firm-update="${escapeHtml(firm.id)}"><div class="form-grid three"><label>Firm plan<select name="membershipPlanId">${(marketplaceData?.membershipPlans||[]).filter(p=>['firm','enterprise'].includes(p.audience)).map(p=>`<option value="${escapeHtml(p.id)}" ${p.id===firm.membership?.planId?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></label><label>Membership status<select name="membershipStatus">${controlOptions(marketplaceData?.enums?.membershipStatuses,firm.membership?.status)}</select></label><label>Owner approval<select name="ownerApprovalStatus">${controlOptions(marketplaceData?.enums?.ownerApprovalStatuses,firm.ownerApprovalStatus)}</select></label><label>Exact firm review<select name="reviewStatus">${controlOptions(['draft','submitted','changes-requested','approved','rejected'],firm.reviewStatus||'draft')}</select></label><label>Covered seats<input name="seatCount" type="number" min="1" value="${escapeHtml(String(firm.seatCount||1))}"></label><label>Active seats<input name="activeSeatCount" type="number" min="0" value="${escapeHtml(String(firm.activeSeatCount||0))}"></label><label>Billing administrator<input name="billingAdministratorName" value="${escapeHtml(firm.billingAdministratorName||'')}"></label><label>Billing administrator email<input name="billingAdministratorEmail" type="email" value="${escapeHtml(firm.billingAdministratorEmail||'')}"></label></div><div class="control-form-actions"><button class="secondary">Save firm controls</button><span data-marketplace-result class="fine-print"></span></div></form></details></article>`;
    }
    function renderProfessionalRecord(pro={}){
      const eligibility=pro.eligibility||{};
      const facts=Object.entries(pro.publicFacts||{}).filter(([,v])=>v).map(([k,v])=>`<li><strong>${escapeHtml(friendlyStatus(k))}:</strong> ${escapeHtml(v)}</li>`).join('');
      return `<article class="marketplace-record"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(pro.professionalType || 'Professional')}</p><h3>${escapeHtml(pro.displayName)}</h3></div>${statusPill(pro.profileStatus)}</div><p>${escapeHtml(pro.publicSourceDisclaimer || '')}</p>${facts?`<details><summary>Source-backed public facts</summary><ul>${facts}</ul></details>`:''}<p><strong>Portals:</strong> ${escapeHtml((pro.portalEligibility||[]).join(', ') || 'None')}</p><p><strong>Jurisdictions:</strong> ${escapeHtml((pro.jurisdictions||[]).join(', ') || 'None')}</p><p><strong>Practice areas:</strong> ${escapeHtml((pro.practiceAreas||[]).join(', ') || 'Not source-supported yet')}</p><p class="fine-print">Claim: ${escapeHtml(pro.claimStatus || '')} · Verification: ${escapeHtml(pro.verificationStatus || '')} · Membership: ${escapeHtml(pro.membership?.status || 'none')} · Owner approval: ${escapeHtml(pro.ownerApprovalStatus || '')} · Profile revision: ${escapeHtml(String(pro.profileRevision||1))} · Submitted revision: ${escapeHtml(String(pro.submittedRevision||0))} · Review: ${escapeHtml(pro.reviewStatus||'draft')}</p><div class="${eligibility.consultationEligible?'notice success':'notice'}"><strong>${eligibility.consultationEligible?'Eligible for configured consultations':'Not consultation eligible'}</strong><ul>${(eligibility.reasons||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div><details><summary>Owner eligibility controls</summary><form data-professional-update="${escapeHtml(pro.id)}"><div class="form-grid three"><label>Profile status<select name="profileStatus">${controlOptions(marketplaceData?.enums?.profileStatuses,pro.profileStatus)}</select></label><label>Claim status<select name="claimStatus">${controlOptions(marketplaceData?.enums?.claimStatuses,pro.claimStatus)}</select></label><label>Verification status<select name="verificationStatus">${controlOptions(marketplaceData?.enums?.verificationStatuses,pro.verificationStatus)}</select></label><label>Owner approval<select name="ownerApprovalStatus">${controlOptions(marketplaceData?.enums?.ownerApprovalStatuses,pro.ownerApprovalStatus)}</select></label><label>Exact profile review<select name="reviewStatus">${controlOptions(['draft','submitted','changes-requested','approved','rejected'],pro.reviewStatus||'draft')}</select></label><label>Membership plan<select name="membershipPlanId">${(marketplaceData?.membershipPlans||[]).map(p=>`<option value="${escapeHtml(p.id)}" ${p.id===pro.membership?.planId?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></label><label>Membership status<select name="membershipStatus">${controlOptions(marketplaceData?.enums?.membershipStatuses,pro.membership?.status)}</select></label></div><label>Membership period ends<input name="membershipPeriodEnd" type="datetime-local"></label><div class="form-grid three"><label><input name="marketplaceTerms" type="checkbox" ${pro.marketplaceTermsAcceptedAt?'checked':''}> Marketplace terms accepted</label><label><input name="independenceTerms" type="checkbox" ${pro.independentProfessionalAcknowledgmentAt?'checked':''}> Independence acknowledged</label><label><input name="conflictTerms" type="checkbox" ${pro.conflictsPolicyAcceptedAt?'checked':''}> Conflict policy accepted</label></div><label>Portal eligibility<select name="portalEligibility" multiple size="5">${(marketplaceData?.enums?.portalSlugs||[]).map(x=>`<option value="${escapeHtml(x)}" ${(pro.portalEligibility||[]).includes(x)?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select></label><label>Jurisdictions — one per line<textarea name="jurisdictions" rows="3">${escapeHtml((pro.jurisdictions||[]).join('\n'))}</textarea></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="3">${escapeHtml((pro.practiceAreas||[]).join('\n'))}</textarea></label><label>Credentials JSON<textarea name="credentials" rows="5">${escapeHtml(JSON.stringify(pro.credentials||[],null,2))}</textarea></label><label>Consultation services JSON<textarea name="consultationServices" rows="7">${escapeHtml(JSON.stringify(pro.consultationServices||[],null,2))}</textarea></label><div class="control-form-actions"><button class="secondary">Save professional controls</button><span data-marketplace-result class="fine-print"></span></div></form></details></article>`;
    }
    function renderDiscountTier(tier={}){
      const range=tier.maxSeats==null?`${tier.minSeats}+ seats`:(tier.minSeats===tier.maxSeats?`${tier.minSeats} seat`:`${tier.minSeats}–${tier.maxSeats} seats`);
      return `<div class="marketplace-item"><strong>${escapeHtml(range)}</strong><span>${escapeHtml(String(tier.discountPercent||0))}% discount</span><small>${escapeHtml(tier.notes||'')}</small></div>`;
    }
    function renderOutreachCampaign(campaign={}){
      const enrollment=`${location.origin}/professional-membership.html?campaign=${encodeURIComponent(campaign.campaignCode||'')}`;
      return `<article class="marketplace-record"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(campaign.market||'Professional campaign')}</p><h3>${escapeHtml(campaign.name)}</h3></div>${statusPill(campaign.status)}</div><p><strong>Code:</strong> <code>${escapeHtml(campaign.campaignCode)}</code> · ${escapeHtml(campaign.channel||'')}</p><p class="fine-print">${escapeHtml([campaign.building,campaign.address,campaign.borough].filter(Boolean).join(' · '))}</p><div class="marketplace-campaign-link"><img src="/api/qr?data=${encodeURIComponent(enrollment)}" alt="Professional enrollment QR code"><div><a href="${escapeHtml(enrollment)}" target="_blank" rel="noopener">Open mobile enrollment page</a><br><code class="wrap-code">${escapeHtml(enrollment)}</code></div></div><details><summary>Campaign controls</summary><form data-outreach-campaign-update="${escapeHtml(campaign.id)}"><div class="form-grid two"><label>Status<select name="status">${controlOptions(marketplaceData?.enums?.outreachCampaignStatuses,campaign.status)}</select></label><label>Building<input name="building" value="${escapeHtml(campaign.building||'')}"></label><label>Address<input name="address" value="${escapeHtml(campaign.address||'')}"></label><label>Borough<input name="borough" value="${escapeHtml(campaign.borough||'')}"></label></div><label>Notes<textarea name="notes" rows="3">${escapeHtml(campaign.notes||'')}</textarea></label><div class="control-form-actions"><button class="secondary">Save campaign</button><span data-marketplace-result class="fine-print"></span></div></form></details></article>`;
    }
    function renderOutreachProspect(prospect={}){
      return `<form class="marketplace-record" data-outreach-prospect-update="${escapeHtml(prospect.id)}"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(prospect.professionalType||'Professional')}</p><h3>${escapeHtml(prospect.contactName||prospect.professionalName||prospect.firmName||'Prospect')}</h3></div>${statusPill(prospect.status)}</div><p>${escapeHtml([prospect.firmName,prospect.building,prospect.floor].filter(Boolean).join(' · '))}</p><p><strong>Potential seats:</strong> ${escapeHtml(String(prospect.potentialSeats||1))} · <strong>Discount:</strong> ${escapeHtml(String(prospect.discountPercent||0))}% · <strong>Estimated monthly:</strong> ${money(prospect.estimatedMonthlyRevenueCents)}</p><div class="form-grid three"><label>Status<select name="status">${controlOptions(marketplaceData?.enums?.outreachProspectStatuses,prospect.status)}</select></label><label>Potential seats<input name="potentialSeats" type="number" min="1" value="${escapeHtml(String(prospect.potentialSeats||1))}"></label><label>Proposed plan<select name="proposalPlanId">${(marketplaceData?.membershipPlans||[]).filter(p=>p.id!=='basic-directory').map(p=>`<option value="${escapeHtml(p.id)}" ${p.id===prospect.proposalPlanId?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></label><label>Next follow-up<input name="nextFollowUpAt" type="datetime-local"></label></div><label>Objections — one per line<textarea name="objections" rows="2">${escapeHtml((prospect.objections||[]).join('\n'))}</textarea></label><label>Notes<textarea name="notes" rows="2">${escapeHtml(prospect.notes||'')}</textarea></label><div class="control-form-actions"><button class="secondary">Save pipeline record</button><span data-marketplace-result class="fine-print"></span></div></form>`;
    }
    function renderProfileRequest(req={}){
      const evidence=(req.evidenceUrls||[]).map(url=>`<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`).join('');
      return `<form class="marketplace-record" data-profile-request-update="${escapeHtml(req.id)}"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(req.publicReference||req.id||'Profile request')}</p><h4>${escapeHtml(friendlyStatus(req.requestType))} — ${escapeHtml(req.requesterName)}</h4></div>${statusPill(req.status||'new')}</div><p><strong>Profile:</strong> ${escapeHtml(req.profileKind||'profile')} ${escapeHtml(req.profileId||'')}</p><p><strong>Requester:</strong> ${escapeHtml(req.requesterEmail||'')} ${req.requesterRelationship?`· ${escapeHtml(req.requesterRelationship)}`:''}</p><p><strong>Received:</strong> ${escapeHtml(req.createdAt||'')}</p><p>${escapeHtml(req.details || '')}</p>${evidence?`<details><summary>Supporting public sources</summary><ul>${evidence}</ul></details>`:''}<div class="form-grid two"><label>Status<select name="status">${controlOptions(marketplaceData?.enums?.profileRequestStatuses,req.status)}</select></label><label>Identity-verification notes<textarea name="identityVerificationNotes" rows="2">${escapeHtml(req.identityVerificationNotes||'')}</textarea></label></div><label>Resolution notes<textarea name="resolutionNotes" rows="2">${escapeHtml(req.resolutionNotes||'')}</textarea></label><div class="control-form-actions"><button class="secondary">Save request</button><span data-marketplace-result class="fine-print"></span></div></form>`;
    }
    function populateMarketplaceSelects(data){
      const types=data.enums?.professionalTypes||[];
      const portals=data.enums?.portalSlugs||[];
      const sourceAuthorities=data.enums?.sourceAuthorityLevels||[];
      const sourceReviews=data.enums?.sourceReviewStatuses||[];
      const requests=data.enums?.profileRequestTypes||[];
      const campaigns=data.outreachCampaigns||[];
      const plans=data.membershipPlans||[];
      const individualPlans=plans.filter(p=>p.audience==='individual' && p.id!=='basic-directory');
      const firmPlans=plans.filter(p=>['firm','enterprise'].includes(p.audience));
      if($('#seedProfessionalType')) $('#seedProfessionalType').innerHTML=controlOptions(types,'attorney');
      for(const id of ['seedProfessionalPortal','createFirmPortals','nysAttorneyImportPortals']){ const el=$('#'+id); if(el) el.innerHTML=portals.map(x=>`<option value="${escapeHtml(x)}" ${id==='nysAttorneyImportPortals'&&x==='general-smarter-justice-start'?'selected':''}>${escapeHtml(x)}</option>`).join(''); }
      if($('#seedSourceAuthority')) $('#seedSourceAuthority').innerHTML=controlOptions(sourceAuthorities,'primary');
      if($('#seedSourceReviewStatus')) $('#seedSourceReviewStatus').innerHTML=controlOptions(sourceReviews,'pending review');
      if($('#profileRequestType')) $('#profileRequestType').innerHTML=controlOptions(requests,'claim');
      if($('#outreachCampaignStatus')) $('#outreachCampaignStatus').innerHTML=controlOptions(data.enums?.outreachCampaignStatuses||[],'draft');
      if($('#outreachCampaignChannel')) $('#outreachCampaignChannel').innerHTML=controlOptions(data.enums?.outreachChannels||[],'in-person building outreach');
      if($('#outreachProspectType')) $('#outreachProspectType').innerHTML=controlOptions(types,'attorney');
      if($('#outreachProspectStatus')) $('#outreachProspectStatus').innerHTML=controlOptions(data.enums?.outreachProspectStatuses||[],'new');
      const planOptions=rows=>rows.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.monthlyPriceCents==null?'':` — ${money(p.monthlyPriceCents)}/mo`}</option>`).join('');
      if($('#outreachIndividualPlan')) $('#outreachIndividualPlan').innerHTML=planOptions(individualPlans);
      if($('#outreachFirmPlan')) $('#outreachFirmPlan').innerHTML=planOptions(firmPlans);
      if($('#firmQuotePlan')) $('#firmQuotePlan').innerHTML=planOptions(firmPlans);
      if($('#outreachProspectPlan')) $('#outreachProspectPlan').innerHTML=planOptions(plans.filter(p=>p.id!=='basic-directory'));
      if($('#outreachProspectCampaign')) $('#outreachProspectCampaign').innerHTML='<option value="">No campaign</option>'+campaigns.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} — ${escapeHtml(c.status)}</option>`).join('');
      const profiles=[...(data.professionals||[]).map(p=>({id:p.id,label:p.displayName})),...(data.firms||[]).map(f=>({id:f.id,label:f.name+' (firm)'}))];
      if($('#profileRequestProfileId')) $('#profileRequestProfileId').innerHTML='<option value="">Choose a profile</option>'+profiles.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.label)}</option>`).join('');
    }
    function renderMarketplace(data){
      marketplaceData=data;
      $('#professionalMarketplaceSummary').innerHTML=renderMarketplaceSummary(data.summary||{});
      $('#professionalMarketplaceGovernance').innerHTML=renderProfileGrowthBatch(data.profileGrowthBatch||{})+renderMarketplaceGovernance(data.governance||{});
      if($('#professionalAccountSummary')) $('#professionalAccountSummary').innerHTML=renderProfessionalAccountSummary(data.professionalAccounts||{});
      if($('#professionalAccountList')) $('#professionalAccountList').innerHTML=((data.professionalAccounts||{}).accounts||[]).map(x=>renderProfessionalAccount(x,data)).join('') || '<p class="fine-print">No professional or firm accounts yet.</p>';
      $('#professionalMembershipPlans').innerHTML=(data.membershipPlans||[]).map(renderMembershipPlan).join('') || '<p>No plans loaded.</p>';
      $('#professionalRevenuePrograms').innerHTML=(data.revenuePrograms||[]).map(renderRevenueProgram).join('') || '<p>No programs loaded.</p>';
      $('#professionalFirmList').innerHTML=(data.firms||[]).map(renderFirmRecord).join('') || '<p class="fine-print">No firm records yet.</p>';
      $('#professionalRecordList').innerHTML=(data.professionals||[]).map(renderProfessionalRecord).join('') || '<p class="fine-print">No professional records yet.</p>';
      $('#professionalProfileRequests').innerHTML=(data.profileRequests||[]).map(renderProfileRequest).join('') || '<p class="fine-print">No profile requests yet.</p>';
      if($('#firmVolumeDiscountTiers')) $('#firmVolumeDiscountTiers').innerHTML=(data.firmVolumeDiscountTiers||[]).map(renderDiscountTier).join('') || '<p class="fine-print">No discount tiers configured.</p>';
      if($('#professionalOutreachCampaigns')) $('#professionalOutreachCampaigns').innerHTML=(data.outreachCampaigns||[]).map(renderOutreachCampaign).join('') || '<p class="fine-print">No outreach campaigns yet.</p>';
      if($('#professionalOutreachProspects')) $('#professionalOutreachProspects').innerHTML=(data.outreachProspects||[]).map(renderOutreachProspect).join('') || '<p class="fine-print">No professional outreach prospects yet.</p>';
      const controls=data.pilotControls||{}; const capacity=data.pilotCapacity||{}; const pilotForm=$('#professionalPilotControlsForm');
      if(pilotForm){ for(const field of ['status','maxActiveProfessionalMemberships','maxActiveFirmMemberships','maxTotalFirmSeats','notes']) if(pilotForm.elements[field]) pilotForm.elements[field].value=controls[field]??''; if(pilotForm.elements.ownerApprovalRequired) pilotForm.elements.ownerApprovalRequired.checked=Boolean(controls.ownerApprovalRequired); }
      if($('#professionalPilotCapacity')) $('#professionalPilotCapacity').innerHTML=`<p><strong>${escapeHtml(friendlyStatus(controls.status||'paused'))}</strong></p><ul><li>${escapeHtml(String(capacity.activeProfessionalMemberships||0))} of ${escapeHtml(String(controls.maxActiveProfessionalMemberships||0))} individual memberships</li><li>${escapeHtml(String(capacity.activeFirmMemberships||0))} of ${escapeHtml(String(controls.maxActiveFirmMemberships||0))} firm memberships</li><li>${escapeHtml(String(capacity.totalFirmSeats||0))} of ${escapeHtml(String(controls.maxTotalFirmSeats||0))} firm seats</li></ul>`;
      const professionalOptions='<option value="">Choose a professional</option>'+(data.professionals||[]).map(pro=>`<option value="${escapeHtml(pro.id)}">${escapeHtml(pro.displayName)}</option>`).join('');
      if($('#credentialProfessionalId')) $('#credentialProfessionalId').innerHTML=professionalOptions; if($('#complaintProfessionalId')) $('#complaintProfessionalId').innerHTML=professionalOptions;
      const plans=data.sourcePlans?.portals||{};
      $('#professionalSourcePlans').innerHTML=Object.entries(plans).map(([slug,plan])=>`<article class="marketplace-record"><h3>${escapeHtml(slug)}</h3><p><strong>Professional categories:</strong> ${escapeHtml((plan.professionalTypes||[]).join(', '))}</p><ul>${(plan.preferredSources||[]).map(x=>`<li><strong>${escapeHtml(x.sourceName)}</strong> — ${escapeHtml(x.authorityLevel)}<br><small>${escapeHtml(x.notes||'')}</small></li>`).join('')}</ul><p class="fine-print">${escapeHtml((plan.specialtyNotes||[]).join(' '))}</p></article>`).join('');
      populateMarketplaceSelects(data);
    }
    async function loadMarketplace(){
      const response=await fetch('/api/owner/professional-marketplace',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ $('#professionalMarketplaceSection').insertAdjacentHTML('afterbegin',`<p class="error">${escapeHtml(response.error||'Could not load marketplace.')}</p>`); return; }
      renderMarketplace(response);
    }
    let buildProgramData=null, buildProgramTab='items';
    function buildSelect(values,selected=''){ return '<option value="">All</option>'+(values||[]).map(x=>`<option value="${escapeHtml(x)}" ${x===selected?'selected':''}>${escapeHtml(friendlyStatus(x))}</option>`).join(''); }
    function renderBuildProgramSummary(summary={}){ const stats=[[summary.totalItems||0,'Build items'],[summary.inProgress||0,'In progress'],[summary.blocked||0,'Blocked'],[summary.exactArtifactTested||0,'Exact-artifact tested'],[summary.deployed||0,'Deployed'],[summary.liveVerified||0,'Live verified'],[summary.openRisks||0,'Open risks'],[summary.releases||0,'Releases']]; return stats.map(([v,l])=>`<div class="control-stat"><strong class="build-program-count">${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join(''); }
    function itemSearchText(x){ return [x.id,x.title,x.description,x.portalSlug,x.status,x.priority,x.targetRelease,x.category,...(x.blockers||[]),...(x.evidence||[]),...(x.dependencies||[])].join(' ').toLowerCase(); }
    function renderBuildItem(x){ const detail=[['Acceptance criteria',x.acceptanceCriteria],['Required tests',x.requiredTests],['Test results',x.testResults],['Dependencies',x.dependencies],['Evidence',x.evidence],['Blockers',x.blockers]].filter(([,v])=>v?.length); return `<article class="build-item" data-build-item data-search="${escapeHtml(itemSearchText(x))}" data-status="${escapeHtml(x.status||'')}" data-release="${escapeHtml(x.targetRelease||'')}" data-portal="${escapeHtml(x.portalSlug||'')}"><div class="build-item-head"><div><p class="eyebrow">${escapeHtml(x.id||'')}</p><h3>${escapeHtml(x.title||'Untitled item')}</h3><div class="build-item-meta"><span class="build-chip ${x.priority==='critical'?'critical':''}">${escapeHtml(x.priority||'')}</span><span class="build-chip ${x.status==='blocked'?'blocked':x.status==='live verified'?'live':''}">${escapeHtml(friendlyStatus(x.status||''))}</span><span class="build-chip">${escapeHtml(x.targetRelease||'Unassigned')}</span><span class="build-chip">${escapeHtml(x.portalSlug||'')}</span></div></div><button class="text-button" type="button" data-edit-build-item="${escapeHtml(x.id)}">Edit</button></div>${x.description&&x.description!==x.title?`<p>${escapeHtml(x.description)}</p>`:''}${detail.length?`<details><summary>Acceptance, tests, evidence, and blockers</summary>${detail.map(([label,vals])=>`<h4>${escapeHtml(label)}</h4><ul>${vals.map(v=>`<li>${escapeHtml(v)}</li>`).join('')}</ul>`).join('')}</details>`:''}</article>`; }
    function renderBuildRecords(records,kind){ if(!records?.length)return '<p class="build-empty">No records have been saved in this view yet.</p>'; return `<div class="build-record-grid">${records.map(x=>`<article class="build-item"><p class="eyebrow">${escapeHtml(x.id||kind)}</p><h3>${escapeHtml(x.title||x.version||'Record')}</h3><div class="build-item-meta"><span class="build-chip">${escapeHtml(x.status||'')}</span><span class="build-chip">${escapeHtml(x.portalSlug||'')}</span>${x.version?`<span class="build-chip">${escapeHtml(x.version)}</span>`:''}</div><p>${escapeHtml(x.description||x.notes||'')}</p>${x.zipName?`<p class="fine-print">ZIP: ${escapeHtml(x.zipName)}</p>`:''}</article>`).join('')}</div>`; }
    function renderBuildProgram(){ if(!buildProgramData)return; const view=$('#buildProgramView'); if(buildProgramTab==='items')view.innerHTML=`<p class="fine-print">Showing <strong id="buildProgramVisibleCount">${buildProgramData.items.length}</strong> of ${buildProgramData.items.length} items. Stable IDs and separate statuses preserve what was proposed, started, tested, deployed, live, blocked, deferred, or superseded.</p><div class="build-program-list">${buildProgramData.items.map(renderBuildItem).join('')}</div>`; else view.innerHTML=renderBuildRecords(buildProgramData[buildProgramTab]||[],buildProgramTab); filterBuildProgram(); }
    function filterBuildProgram(){ if(buildProgramTab!=='items')return; const q=String($('#buildProgramSearch')?.value||'').toLowerCase().trim(),status=$('#buildProgramStatus')?.value||'',release=$('#buildProgramRelease')?.value||'',portal=$('#buildProgramPortal')?.value||''; let visible=0; $$('[data-build-item]').forEach(el=>{const show=(!q||el.dataset.search.includes(q))&&(!status||el.dataset.status===status)&&(!release||el.dataset.release===release)&&(!portal||el.dataset.portal===portal);el.hidden=!show;if(show)visible++;}); if($('#buildProgramVisibleCount'))$('#buildProgramVisibleCount').textContent=visible; }
    function fillBuildItemForm(x={}){ const f=$('#buildProgramItemForm'); if(!f)return; for(const [k,v] of Object.entries(x)){ if(!f.elements[k])continue; f.elements[k].value=Array.isArray(v)?v.join('\n'):(v??''); } f.scrollIntoView({behavior:'smooth',block:'center'}); }
    async function loadBuildProgram(){ const response=await fetch('/api/owner/build-program',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){ $('#buildProgramView').innerHTML=`<p class="error">${escapeHtml(response.error||'Could not load build program.')}</p>`;return;} buildProgramData=response; $('#buildProgramSummary').innerHTML=renderBuildProgramSummary(response.summary); $('#buildProgramStatus').innerHTML=buildSelect(response.enums.statuses); const releases=[...new Set(response.items.map(x=>x.targetRelease).filter(Boolean))]; $('#buildProgramRelease').innerHTML=buildSelect(releases); const portals=[...new Set(response.items.map(x=>x.portalSlug).filter(Boolean))]; $('#buildProgramPortal').innerHTML=buildSelect(portals); const f=$('#buildProgramItemForm'); if(f){ f.elements.type.innerHTML=controlOptions(response.enums.types,'portal specific'); f.elements.priority.innerHTML=controlOptions(response.enums.priorities,'medium'); f.elements.status.innerHTML=controlOptions(response.enums.statuses,'proposed'); f.elements.category.innerHTML=controlOptions(response.enums.categories,'other'); } renderBuildProgram(); }
    async function ownerAuthStatus(){ return fetch('/api/owner/auth/status').then(r=>r.json()).catch(()=>({ok:false,authenticated:false})); }
    let pilotProgramData=null;
    function pilotSummary(data){return `<div><strong>${data.controls?.applicationsOpen?'Open':'Closed'}</strong><span>Applications</span></div><div><strong>${data.capacity?.submitted||0}/${data.controls?.maxSubmittedApplications||0}</strong><span>Submitted queue</span></div><div><strong>${data.capacity?.approved||0}/${data.controls?.maxApprovedApplications||0}</strong><span>Approved cohort</span></div><div><strong>${data.evidenceSummary?.completeCount||0}/${data.evidenceSummary?.requiredCount||0}</strong><span>Evidence complete</span></div><div><strong>${data.paymentGate?.available?'Available':'Closed'}</strong><span>Payment gate</span></div><div><strong>${data.queue?.totalOpen||0}</strong><span>Open work items</span></div>`;}
    function pilotControls(data){return `<form id="pilotProgramControlsForm"><div class="form-grid three"><label>Cohort name<input name="cohortName" value="${escapeHtml(data.controls?.cohortName||'')}"></label><label>Submitted capacity<input type="number" min="0" max="10000" name="maxSubmittedApplications" value="${escapeHtml(data.controls?.maxSubmittedApplications||0)}"></label><label>Approved capacity<input type="number" min="0" max="10000" name="maxApprovedApplications" value="${escapeHtml(data.controls?.maxApprovedApplications||0)}"></label></div><label class="check"><input type="checkbox" name="applicationsOpen" ${data.controls?.applicationsOpen?'checked':''}> Open controlled applications</label><label class="check"><input type="checkbox" name="paymentGateEnabled" ${data.controls?.paymentGateEnabled?'checked':''}> Open payment gate only after all evidence is complete</label><label>Owner notes<textarea name="notes" rows="3">${escapeHtml(data.controls?.notes||'')}</textarea></label><button class="primary">Save Pilot Controls</button><span id="pilotProgramControlsResult" class="fine-print"></span></form>`;}
    function pilotApplications(data){return (data.applications||[]).map(x=>`<article class="details-card"><h4>${escapeHtml(x.applicantName||x.applicantEmail)}</h4><p><strong>${escapeHtml(friendlyStatus(x.status))}</strong> · payment ${escapeHtml(friendlyStatus(x.paymentStatus))} · ${escapeHtml(x.targetKind)} · ${escapeHtml(x.billingCadence)} · ${escapeHtml(x.seatCount)} seat(s)</p><p>${escapeHtml(x.whyJoin||x.goals||'No applicant narrative yet.')}</p><form data-pilot-review="${escapeHtml(x.id)}"><div class="form-grid two"><label>Decision<select name="status"><option value="owner-review">Owner review</option><option value="changes-requested">Changes requested</option><option value="approved-for-payment">Approved for payment</option><option value="paused">Paused</option><option value="declined">Declined</option></select></label><label>Applicant message<input name="applicantMessage" value="${escapeHtml(x.applicantMessage||'')}"></label></div><label>Required actions — one per line<textarea name="requiredActions" rows="3">${escapeHtml((x.requiredActions||[]).join('\n'))}</textarea></label><label>Private owner notes<textarea name="ownerNotes" rows="3">${escapeHtml(x.ownerNotes||'')}</textarea></label><button class="secondary">Save Review</button><span data-pilot-result class="fine-print"></span></form></article>`).join('')||'<p class="fine-print">No pilot applications yet.</p>';}
    function pilotSupport(data){return (data.supportTickets||[]).filter(x=>!['resolved','closed'].includes(x.status)).map(x=>`<article class="details-card"><h4>${escapeHtml(x.subject)}</h4><p>${escapeHtml(x.applicantName)} · ${escapeHtml(friendlyStatus(x.priority))} · ${escapeHtml(friendlyStatus(x.status))}</p><p>${escapeHtml(x.message)}</p><form data-pilot-support="${escapeHtml(x.id)}"><div class="form-grid two"><label>Status<select name="status"><option>open</option><option>in-review</option><option>waiting-on-professional</option><option>resolved</option><option>closed</option></select></label><label>Priority<select name="priority"><option>normal</option><option>high</option><option>urgent</option></select></label></div><label>Resolution message<textarea name="resolutionMessage" rows="3">${escapeHtml(x.resolutionMessage||'')}</textarea></label><label>Private notes<textarea name="ownerNotes" rows="3">${escapeHtml(x.ownerNotes||'')}</textarea></label><button class="secondary">Update Support</button><span data-pilot-result class="fine-print"></span></form></article>`).join('')||'<p class="fine-print">No open professional support requests.</p>';}
    function pilotEvidence(data){return `<div class="build-program-list">${(data.evidence||[]).map(x=>`<article class="build-item-card"><div><strong>${escapeHtml(x.title)}</strong><span class="status-pill">${escapeHtml(friendlyStatus(x.status))}</span></div><form data-pilot-evidence="${escapeHtml(x.key)}"><div class="form-grid three"><label>Status<select name="status"><option>not-started</option><option>in-progress</option><option>evidence-complete</option><option>blocked</option><option>not-applicable</option></select></label><label>Verified by<input name="verifiedBy" value="${escapeHtml(x.verifiedBy||'')}"></label><label>Evidence URL<input name="evidenceUrl" type="url" value="${escapeHtml(x.evidenceUrl||'')}"></label></div><label>Evidence summary<textarea name="summary" rows="3">${escapeHtml(x.summary||'')}</textarea></label><button class="secondary">Save Evidence</button><span data-pilot-result class="fine-print"></span></form></article>`).join('')}</div>`;}
    function renderPilotProgram(){if(!pilotProgramData)return;$('#pilotProgramSummary').innerHTML=pilotSummary(pilotProgramData);$('#pilotProgramControls').innerHTML=pilotControls(pilotProgramData);$('#pilotProgramApplications').innerHTML=pilotApplications(pilotProgramData);$('#pilotProgramSupport').innerHTML=pilotSupport(pilotProgramData);$('#pilotProgramEvidence').innerHTML=pilotEvidence(pilotProgramData);}
    async function loadPilotProgram(){const r=await fetch('/api/owner/pilot-program',{headers:headers()}).then(x=>x.json()).catch(err=>({ok:false,error:err.message}));if(!r.ok){$('#pilotProgramSummary').innerHTML=`<p class="error">${escapeHtml(r.error||'Could not load pilot program.')}</p>`;return;}pilotProgramData=r;renderPilotProgram();}
    let domainRegistryData=null;
    function domainSelect(values,current=''){ return `<option value="">All</option>${(values||[]).map(value=>`<option value="${escapeHtml(value)}" ${value===current?'selected':''}>${escapeHtml(friendlyStatus(value))}</option>`).join('')}`; }
    function renderDomainSummary(summary={}){
      const rows=[[summary.owned||0,'Owned official domains'],[summary.liveVerified||0,'Live verified'],[summary.inDevelopment||0,'In development'],[summary.purchasePlanned||0,'Purchase planned'],[summary.professionalOpen||0,'Professional access open'],[summary.publicVisible||0,'Publicly displayed']];
      return rows.map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    }
    function domainChip(value,type=''){
      const css=String(value||'').includes('owned')?'owned':(String(value||'').includes('planned')?'planned':'');
      return `<span class="domain-owner-chip ${css}">${type?`${escapeHtml(type)}: `:''}${escapeHtml(friendlyStatus(value||'not set'))}</span>`;
    }
    function renderDomainOwnerRecord(item){
      const search=[item.id,item.brandName,item.domain,item.portalSlug,item.canonicalPortfolioSlug,item.ownershipStatus,item.portalStatus,item.dnsStatus,item.sslStatus,item.deploymentStatus,item.canonicalStatus,item.professionalParticipationStatus,item.publicUserStatus,item.sourceNote,item.ownerNotes].join(' ').toLowerCase();
      return `<article class="domain-owner-record" data-domain-record="${escapeHtml(item.id)}" data-search="${escapeHtml(search)}" data-ownership="${escapeHtml(item.ownershipStatus||'')}" data-portal-status="${escapeHtml(item.portalStatus||'')}">
        <div class="domain-owner-head"><div><p class="eyebrow">${escapeHtml(item.id)}</p><h3>${escapeHtml(item.brandName||'Unnamed portal')}</h3><p class="domain-owner-domain">${escapeHtml(item.domain||'Domain pending')}</p></div><button class="secondary" type="button" data-edit-domain="${escapeHtml(item.id)}">Edit record</button></div>
        <div class="domain-owner-chips">${domainChip(item.ownershipStatus,'Ownership')}${domainChip(item.portalStatus,'Portal')}${domainChip(item.professionalParticipationStatus,'Professional')}</div>
        <div class="domain-owner-facts"><div><small>DNS</small><strong>${escapeHtml(friendlyStatus(item.dnsStatus))}</strong></div><div><small>SSL</small><strong>${escapeHtml(friendlyStatus(item.sslStatus))}</strong></div><div><small>Deployment</small><strong>${escapeHtml(friendlyStatus(item.deploymentStatus))}</strong></div><div><small>Canonical</small><strong>${escapeHtml(friendlyStatus(item.canonicalStatus))}</strong></div></div>
        <p>${escapeHtml(item.publicSummary||'No public summary recorded.')}</p>
        <p class="fine-print"><strong>Public display:</strong> ${item.publicVisible&&item.ownershipStatus==='owned'?'Yes':'No'} · <strong>Public-user status:</strong> ${escapeHtml(item.publicUserStatus||'Not recorded')}</p>
        ${item.sourceNote?`<details><summary>Source and verification note</summary><p>${escapeHtml(item.sourceNote)}</p>${item.ownerNotes?`<p class="fine-print"><strong>Private owner notes:</strong> ${escapeHtml(item.ownerNotes)}</p>`:''}</details>`:''}
      </article>`;
    }
    function renderDomainHistory(rows=[]){
      const node=$('#domainRegistryHistory'); if(!node)return;
      node.innerHTML=rows.length?rows.slice(0,100).map(row=>`<article class="domain-history-record"><p><strong>${escapeHtml(row.brandName||row.domainId)}</strong> · ${escapeHtml((row.changedFields||[]).map(friendlyStatus).join(', '))}</p><p class="fine-print">${escapeHtml(row.actor||'owner')} · ${escapeHtml(row.createdAt||'')}</p></article>`).join(''):'<p class="fine-print">No domain-status changes have been recorded yet.</p>';
    }
    function filterDomainRegistry(){
      const q=String($('#domainRegistrySearch')?.value||'').toLowerCase().trim();
      const ownership=$('#domainRegistryOwnership')?.value||'';
      const portalStatus=$('#domainRegistryPortalStatus')?.value||'';
      $$('[data-domain-record]').forEach(card=>{const show=(!q||card.dataset.search.includes(q))&&(!ownership||card.dataset.ownership===ownership)&&(!portalStatus||card.dataset.portalStatus===portalStatus);card.hidden=!show;});
    }
    function fillDomainRegistryForm(item={}){
      const form=$('#domainRegistryForm'); if(!form)return;
      form.reset();
      for(const [key,value] of Object.entries(item)){
        const control=form.elements[key]; if(!control)continue;
        if(control.type==='checkbox')control.checked=Boolean(value); else control.value=value??'';
      }
      form.scrollIntoView({behavior:'smooth',block:'center'});
    }
    function renderDomainRegistry(){
      if(!domainRegistryData)return;
      $('#domainRegistrySummary').innerHTML=renderDomainSummary(domainRegistryData.summary||{});
      $('#domainRegistryList').innerHTML=(domainRegistryData.domains||[]).map(renderDomainOwnerRecord).join('')||'<p class="fine-print">No domain records are available.</p>';
      $('#domainRegistryOwnership').innerHTML=domainSelect(domainRegistryData.enums?.ownership||[]);
      $('#domainRegistryPortalStatus').innerHTML=domainSelect(domainRegistryData.enums?.portal||[]);
      const form=$('#domainRegistryForm');
      if(form){
        const enumMap={ownershipStatus:'ownership',portalStatus:'portal',dnsStatus:'dns',sslStatus:'ssl',deploymentStatus:'deployment',canonicalStatus:'canonical',professionalParticipationStatus:'participation'};
        for(const [field,key] of Object.entries(enumMap))form.elements[field].innerHTML=controlOptions(domainRegistryData.enums?.[key]||[],domainRegistryData.enums?.[key]?.[0]||'');
      }
      renderDomainHistory(domainRegistryData.history||[]);
      filterDomainRegistry();
    }
    async function loadDomainRegistry(){
      const response=await fetch('/api/owner/domain-registry',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ if($('#domainRegistryList'))$('#domainRegistryList').innerHTML=`<p class="error">${escapeHtml(response.error||'Could not load the domain registry.')}</p>`; return; }
      domainRegistryData=response; renderDomainRegistry();
    }
    let revenueAccessData=null, publicPaidServicesData=null, fieldLaunchData=null;
    function renderRevenueSummary(summary={}){const rows=[[summary.publicPlans||0,'Public plans'],[summary.activePublicPlans||0,'Billable public plans'],[summary.humanReviewServices||0,'Review services'],[summary.activeHumanReviewServices||0,'Active review services'],[summary.portalAdoptions||0,'Portal records'],[summary.adoptedPortals||0,'Adopted or adapted']];return rows.map(([v,l])=>`<div class="control-stat"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join('');}
    function renderRevenuePublicPlan(x){return `<article class="marketplace-record"><div class="build-item-head"><div><p class="eyebrow">${escapeHtml(x.id)}</p><h4>${escapeHtml(x.name)}</h4></div><span class="build-chip">${escapeHtml(x.status)}</span></div><p><strong>${x.monthlyPriceCents===0?'Free':money(x.monthlyPriceCents)+'/month'}</strong> · Billing active: ${x.activeForBilling?'yes':'no'}</p><p class="fine-print">${escapeHtml(x.fairUse||'')}</p><details><summary>Owner settings</summary><form data-revenue-public-plan="${escapeHtml(x.id)}"><div class="form-grid two"><label>Status<select name="status">${controlOptions(revenueAccessData?.enums?.planStatuses||[],x.status)}</select></label><label>Monthly cents<input name="monthlyPriceCents" type="number" min="0" value="${escapeHtml(String(x.monthlyPriceCents||0))}"></label></div><label class="checkbox-label"><input name="activeForBilling" type="checkbox" ${x.activeForBilling?'checked':''}> Billing active</label><label>Fair-use statement<textarea name="fairUse" rows="3">${escapeHtml(x.fairUse||'')}</textarea></label><button class="secondary">Save plan</button><span class="fine-print" data-result></span></form></details></article>`;}
    function renderRevenueReview(x){return `<article class="marketplace-record"><div class="build-item-head"><div><p class="eyebrow">${escapeHtml(x.id)}</p><h4>${escapeHtml(x.name)}</h4></div><span class="build-chip">${escapeHtml(x.status)}</span></div><p>${escapeHtml(x.scope||'')}</p><p><strong>Price:</strong> ${x.priceCents==null?'Not approved':money(x.priceCents)} · <strong>Billing active:</strong> ${x.activeForBilling?'yes':'no'}</p><details><summary>Owner settings</summary><form data-revenue-human-review="${escapeHtml(x.id)}"><div class="form-grid two"><label>Status<select name="status">${controlOptions(revenueAccessData?.enums?.planStatuses||[],x.status)}</select></label><label>Price cents<input name="priceCents" type="number" min="0" value="${x.priceCents==null?'':escapeHtml(String(x.priceCents))}"></label><label>Terms version<input name="termsVersion" value="${escapeHtml(x.termsVersion||'public-paid-services-1.0.0')}"></label><label class="checkbox-label"><input name="activeForBilling" type="checkbox" ${x.activeForBilling?'checked':''}> Billing active for this service</label></div><label>Scope<textarea name="scope" rows="4">${escapeHtml(x.scope||'')}</textarea></label><label>Expected turnaround<textarea name="turnaround" rows="2">${escapeHtml(x.turnaround||'')}</textarea></label><label>Included revision or follow-up policy<textarea name="revisionPolicy" rows="2">${escapeHtml(x.revisionPolicy||'')}</textarea></label><button class="secondary">Save service</button><span class="fine-print" data-result></span></form></details></article>`;}
    function renderRevenueAdoption(x){return `<article class="marketplace-record"><div class="build-item-head"><div><p class="eyebrow">${escapeHtml(x.portalSlug)}</p><h4>${escapeHtml(x.portalName)}</h4></div><span class="build-chip">${escapeHtml(x.adoptionStatus)}</span></div><p><strong>Free AI:</strong> ${x.freeAiStartingHelp?'yes':'no'} · <strong>Public plan:</strong> ${escapeHtml(x.publicMembershipStatus||'')} · <strong>Human review:</strong> ${escapeHtml(x.humanReviewStatus||'')}</p><details><summary>Portal adoption settings</summary><form data-revenue-portal="${escapeHtml(x.portalSlug)}"><div class="form-grid two"><label>Adoption status<select name="adoptionStatus">${controlOptions(revenueAccessData?.enums?.adoptionStatuses||[],x.adoptionStatus)}</select></label><label class="checkbox-label"><input name="freeAiStartingHelp" type="checkbox" ${x.freeAiStartingHelp?'checked':''}> Free AI starting help</label><label>Public membership status<input name="publicMembershipStatus" value="${escapeHtml(x.publicMembershipStatus||'')}"></label><label>Human review status<input name="humanReviewStatus" value="${escapeHtml(x.humanReviewStatus||'')}"></label><label>Professional membership status<input name="professionalMembershipStatus" value="${escapeHtml(x.professionalMembershipStatus||'')}"></label><label>Professional service boundary<input name="professionalServiceBoundary" value="${escapeHtml(x.professionalServiceBoundary||'')}"></label></div><label>Notes<textarea name="notes" rows="3">${escapeHtml(x.notes||'')}</textarea></label><button class="secondary">Save portal adoption</button><span class="fine-print" data-result></span></form></details></article>`;}
    async function loadRevenueAccessModel(){const r=await fetch('/api/owner/revenue-access-model',{headers:headers()}).then(x=>x.json()).catch(err=>({ok:false,error:err.message}));if(!r.ok){$('#revenueAccessSummary').innerHTML=`<p class="error">${escapeHtml(r.error||'Could not load revenue model.')}</p>`;return;}revenueAccessData=r;$('#revenueAccessSummary').innerHTML=renderRevenueSummary(r.summary||{});$('#revenuePublicPlans').innerHTML=(r.publicPlans||[]).map(renderRevenuePublicPlan).join('');$('#revenueHumanReviewServices').innerHTML=(r.humanReviewServices||[]).map(renderRevenueReview).join('');$('#revenuePortalAdoptions').innerHTML=(r.portalAdoptions||[]).map(renderRevenueAdoption).join('');}
    function renderPublicPaidSummary(summary={}){const rows=[[summary.orders||0,'Orders'],[summary.paidQueued||0,'Paid and queued'],[summary.inReview||0,'In review'],[summary.completed||0,'Completed or delivered'],[summary.refunded||0,'Refunded'],[money(summary.openValueCents||0),'Open paid value']];return rows.map(([v,l])=>`<div class="control-stat"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join('');}
    function renderPublicPaidReadiness(row={}){const service=row.service||{};return `<article class="marketplace-record"><div class="build-item-head"><div><p class="eyebrow">${escapeHtml(service.id||row.serviceId||'service')}</p><h4>${escapeHtml(service.name||'Human Review Specialist service')}</h4></div><span class="build-chip ${row.available?'live':'blocked'}">${row.available?'Checkout available':'Checkout closed'}</span></div><p><strong>Catalog:</strong> ${escapeHtml(service.status||'not recorded')} · <strong>Price:</strong> ${service.priceCents==null?'not approved':money(service.priceCents)} · <strong>Billing active:</strong> ${service.activeForBilling?'yes':'no'}</p><p>${escapeHtml(service.scope||'')}</p><ul>${(row.reasons||[]).map(reason=>`<li>${escapeHtml(reason)}</li>`).join('')||'<li>All recorded gates are satisfied.</li>'}</ul></article>`;}
    function renderPublicPaidOrder(order={}){return `<form class="marketplace-record" data-public-paid-order="${escapeHtml(order.id)}"><div class="build-item-head"><div><p class="eyebrow">${escapeHtml(order.id||'order')}</p><h4>${escapeHtml(order.serviceName||order.serviceId||'Human Review Specialist service')}</h4></div><span class="build-chip">${escapeHtml(friendlyStatus(order.status||''))}</span></div><p><strong>${money(order.priceCents||0)}</strong> · payment ${escapeHtml(friendlyStatus(order.paymentStatus||''))} · ${escapeHtml(order.email||'')}</p><div class="form-grid two"><label>Status<select name="status">${controlOptions(publicPaidServicesData?.enums?.orderStatuses||[],order.status)}</select></label><label>Assigned to<input name="assignedTo" value="${escapeHtml(order.assignedTo||'')}"></label><label>Due date or service window<input name="dueAt" value="${escapeHtml(order.dueAt||'')}"></label><label>Delivery reference<input name="deliveryReference" value="${escapeHtml(order.deliveryReference||'')}"></label><label>Refund reference<input name="refundReference" value="${escapeHtml(order.refundReference||'')}"></label><label>User-facing status<input name="userFacingStatus" value="${escapeHtml(order.userFacingStatus||'')}"></label></div><label>Staff notes<textarea name="staffNotes" rows="3">${escapeHtml(order.staffNotes||'')}</textarea></label><label>Private owner notes<textarea name="ownerNotes" rows="3">${escapeHtml(order.ownerNotes||'')}</textarea></label><label>History note for this change<input name="historyNote"></label><button class="secondary">Save Order</button><span data-public-paid-result class="fine-print"></span></form>`;}
    async function loadPublicPaidServices(){const r=await fetch('/api/owner/public-paid-services',{headers:headers()}).then(x=>x.json()).catch(err=>({ok:false,error:err.message}));if(!r.ok){$('#publicPaidServicesSummary').innerHTML=`<p class="error">${escapeHtml(r.error||'Could not load public paid-service operations.')}</p>`;return;}publicPaidServicesData=r;$('#publicPaidServicesSummary').innerHTML=renderPublicPaidSummary(r.summary||{});$('#publicPaidServicesReadiness').innerHTML=(r.catalogReadiness||[]).map(renderPublicPaidReadiness).join('')||'<p class="fine-print">No Human Review Specialist catalog entries are available.</p>';$('#publicPaidServicesOrders').innerHTML=(r.orders||[]).map(renderPublicPaidOrder).join('')||'<p class="fine-print">No public paid-service orders yet.</p>';const f=$('#publicPaidServicesControlsForm');if(f){f.elements.status.innerHTML=controlOptions(r.enums?.controlStatuses||[],r.controls?.status);f.elements.refundPolicyStatus.innerHTML=controlOptions(r.enums?.policyStatuses||[],r.controls?.refundPolicyStatus);f.elements.supportOperationsStatus.innerHTML=controlOptions(r.enums?.policyStatuses||[],r.controls?.supportOperationsStatus);for(const key of ['ownerApproved','liveChargesAllowed','requireSensitiveTrafficApproval','requireAuthenticatedEmail'])f.elements[key].checked=Boolean(r.controls?.[key]);f.elements.termsVersion.value=r.controls?.termsVersion||'';f.elements.notes.value=r.controls?.notes||'';}}
    function renderFieldSummary(summary={}){const rows=[[summary.locations||0,'Locations'],[summary.approvedLocations||0,'Approved locations'],[summary.activeCampaigns||0,'Active campaigns'],[summary.assets||0,'Field assets'],[summary.printReadyAssets||0,'Print-ready assets'],[summary.events||0,'Attribution events'],[summary.publicEvents||0,'Public events'],[summary.professionalEvents||0,'Professional events']];return rows.map(([v,l])=>`<div class="control-stat"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join('');}
    function renderFieldLocation(x){return `<article class="marketplace-record"><p class="eyebrow">${escapeHtml(x.id)}</p><h4>${escapeHtml(x.name)}</h4><p><strong>${escapeHtml(x.status)}</strong> · ${escapeHtml(x.area||'')}, ${escapeHtml(x.borough||'')}</p><ul><li>Property permission: ${escapeHtml(x.propertyPermissionStatus||'')}</li><li>Permit: ${escapeHtml(x.permitStatus||'')}</li><li>Courthouse restrictions: ${escapeHtml(x.courthouseRestrictionStatus||'')}</li><li>Insurance: ${escapeHtml(x.insuranceStatus||'')}</li></ul></article>`;}
    function renderFieldCampaign(x){const link=`/kiosk.html?campaign=${encodeURIComponent(x.campaignCode||'')}`;return `<article class="marketplace-record"><p class="eyebrow">${escapeHtml(x.campaignCode)}</p><h4>${escapeHtml(x.name)}</h4><p>${escapeHtml(x.status)} · ${escapeHtml(x.lane)} · ${escapeHtml(x.channel)}</p><p><a href="${escapeHtml(link)}" target="_blank" rel="noopener">Open kiosk preview</a></p></article>`;}
    function renderFieldAsset(x){return `<article class="marketplace-record"><div class="build-item-head"><div><p class="eyebrow">${escapeHtml(x.assetCode||x.id)}</p><h4>${escapeHtml(x.name||'Field asset')}</h4></div><span class="build-chip">${escapeHtml(x.status||'idea')}</span></div><p>${escapeHtml(x.assetType||'other')} · ${escapeHtml(x.language||'language not set')}</p><p><strong>Dimensions:</strong> ${escapeHtml(x.dimensions||'Pending')}</p><p class="fine-print"><strong>Brand:</strong> ${escapeHtml(x.primaryBrand||'Smarter Justice')} · ${escapeHtml(x.legacyLine||'')}</p><p class="fine-print">${escapeHtml(x.complianceStatus||'Approval status not recorded.')}</p></article>`;}
    function renderFieldStaff(x){return `<article class="marketplace-record"><p class="eyebrow">${escapeHtml(x.staffCode)}</p><h4>${escapeHtml(x.displayName||'Unnamed field navigator')}</h4><p>${escapeHtml(x.role||'')} · ${escapeHtml(x.status||'')}</p><p class="fine-print">Lanes: ${escapeHtml((x.allowedLanes||[]).join(', ')||'not set')}</p></article>`;}
    function renderFieldReport(x){return `<article class="marketplace-record"><p class="eyebrow">${escapeHtml(x.date||'')}</p><h4>${escapeHtml(x.locationId||'Field report')}</h4><p>${escapeHtml(String(x.publicConversations||0))} public conversations · ${escapeHtml(String(x.professionalConversations||0))} professional conversations · ${escapeHtml(String(x.officeVisits||0))} office visits · ${escapeHtml(String(x.followUpsDue||0))} follow-ups</p></article>`;}
    async function loadFieldLaunchProgram(){const r=await fetch('/api/owner/field-launch-program',{headers:headers()}).then(x=>x.json()).catch(err=>({ok:false,error:err.message}));if(!r.ok){$('#fieldLaunchSummary').innerHTML=`<p class="error">${escapeHtml(r.error||'Could not load field program.')}</p>`;return;}fieldLaunchData=r;$('#fieldLaunchSummary').innerHTML=renderFieldSummary(r.summary||{});$('#fieldLaunchLocations').innerHTML=(r.locations||[]).map(renderFieldLocation).join('');$('#fieldLaunchCampaigns').innerHTML=(r.campaigns||[]).map(renderFieldCampaign).join('');$('#fieldLaunchAssets').innerHTML=(r.assets||[]).map(renderFieldAsset).join('')||'<p class="fine-print">No field assets recorded yet.</p>';$('#fieldLaunchStaff').innerHTML=(r.staff||[]).map(renderFieldStaff).join('')||'<p class="fine-print">No staff records yet.</p>';$('#fieldLaunchReports').innerHTML=(r.dailyReports||[]).slice(0,25).map(renderFieldReport).join('')||'<p class="fine-print">No daily reports yet.</p>';const f=$('#fieldLaunchControlsForm');if(f){f.elements.status.innerHTML=controlOptions(r.enums?.controlStatuses||[],r.controls?.status);for(const k of ['publicLaneEnabled','professionalLaneEnabled','requireLocationPermissionEvidence','requireOwnerActivation'])f.elements[k].checked=Boolean(r.controls?.[k]);f.elements.notes.value=r.controls?.notes||'';}const locOptions=(r.locations||[]).map(x=>`<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('');for(const selector of ['#fieldLaunchCampaignForm [name="locationId"]','#fieldLaunchDailyReportForm [name="locationId"]']){const el=$(selector);if(el)el.innerHTML=locOptions;}const cf=$('#fieldLaunchCampaignForm');if(cf){cf.elements.lane.innerHTML=controlOptions(r.enums?.lanes||[],'mixed');cf.elements.channel.innerHTML=controlOptions(r.enums?.channels||[],'kiosk');cf.elements.status.innerHTML=controlOptions(r.enums?.campaignStatuses||[],'draft');}const af=$('#fieldLaunchAssetForm');if(af){af.elements.assetType.innerHTML=controlOptions(r.enums?.assetTypes||[],'other');af.elements.status.innerHTML=controlOptions(r.enums?.assetStatuses||[],'idea');}}
    function renderOperationalReadiness(readiness={},manifest={}){
      const checks=readiness.checks||[];
      const readyCount=checks.filter(item=>item.ready).length;
      const blockedCount=checks.length-readyCount;
      const summary=$('#operationalReadinessSummary');
      if(summary)summary.innerHTML=`<div><strong>${readiness.ready?'Closed-loop ready':'Fail closed'}</strong><span>Machine gate</span></div><div><strong>${readyCount}/${checks.length}</strong><span>Machine checks ready</span></div><div><strong>${blockedCount}</strong><span>Blocked checks</span></div><div><strong>${escapeHtml(readiness.environment||'unknown')}</strong><span>Environment</span></div>`;
      const list=$('#operationalReadinessChecks');
      if(list)list.innerHTML=checks.map(item=>`<article class="build-item-card"><div><strong>${escapeHtml(item.label)}</strong><span class="status-pill">${item.ready?'Ready':'Blocked'}</span></div><p>${escapeHtml(item.detail||'')}</p>${item.evidenceKey?`<p class="fine-print">Evidence group: ${escapeHtml(item.evidenceKey)}</p>`:''}</article>`).join('')||'<p class="fine-print">No readiness checks were returned.</p>';
      const migrations=$('#operationalMigrationManifest');
      if(migrations)migrations.innerHTML=`<p><strong>Standard:</strong> ${escapeHtml(manifest.standardVersion||readiness.storage?.migrationStandardVersion||'')}</p><div class="build-program-list">${(manifest.migrations||[]).map(item=>`<article class="build-item-card"><div><strong>${escapeHtml(item.version)}</strong><span class="status-pill">${escapeHtml(String(item.statementCount||0))} statements</span></div><p>${escapeHtml(item.description||'')}</p><p class="fine-print">SHA-256: ${escapeHtml(item.checksum||'')}</p></article>`).join('')||'<p class="fine-print">No migration manifest was returned.</p>'}</div>`;
    }
    async function refreshOperationalReadiness(){
      const response=await fetch('/api/owner/operational-readiness',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){const node=$('#operationalReadinessResult');if(node)node.textContent=response.error||'Could not load operational readiness.';return response;}
      renderOperationalReadiness(response,currentData?.migrationManifest||{});return response;
    }
    async function operationalDatabaseAction(path,label){
      const resultNode=$('#operationalReadinessResult'); if(resultNode)resultNode.textContent=`${label}…`;
      const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:'{}'}).then(async r=>({status:r.status,data:await r.json()})).catch(err=>({status:0,data:{ok:false,error:err.message}}));
      if(resultNode)resultNode.textContent=response.data.ok?`${label} completed. Readiness was refreshed.`:(response.data.error||`${label} did not pass.`);
      await refreshOperationalReadiness(); return response.data;
    }

  function renderCompetitiveLandscape(data={}){
    const competitors=Array.isArray(data.competitors)?data.competitors:[];
    const summary=$('#competitiveLandscapeSummary'); const list=$('#competitiveLandscapeList');
    if(summary) summary.innerHTML=`<div class="metric-card"><strong>${escapeHtml(data.version||'')}</strong><span>Research version</span></div><div class="metric-card"><strong>${escapeHtml(data.researchedAt||'')}</strong><span>Research date</span></div><div class="metric-card"><strong>${competitors.length}</strong><span>Competitor groups reviewed</span></div><div class="metric-card"><strong>${(data.rejectedPatterns||[]).length}</strong><span>Patterns explicitly rejected</span></div>`;
    if(list) list.innerHTML=competitors.map(item=>`<article class="mini-card"><h3>${escapeHtml(item.name||'')}</h3><p><strong>${escapeHtml(item.category||'')}</strong></p><p>${escapeHtml(item.adaptation||'')}</p><p class="fine-print">Observed: ${escapeHtml((item.observedPatterns||[]).join(' · '))}</p></article>`).join('')||'<p class="fine-print">No competitor research loaded.</p>';
  }


  function renderTrustVerificationResearch(data={}){
    const evidence=Array.isArray(data.evidence)?data.evidence:[];const summary=$('#trustVerificationResearchSummary');const list=$('#trustVerificationResearchList');
    if(summary)summary.innerHTML=[[data.version||'','Research version'],[data.researchedAt||'','Research date'],[evidence.length,'Official-source groups'],[(data.rejected||[]).length,'Rejected shortcuts']].map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    if(list)list.innerHTML=evidence.map(item=>`<article class="trust-research-card"><p class="eyebrow">${escapeHtml(item.publisher||'')}</p><h3>${escapeHtml(item.id||'Evidence')}</h3><ul>${(item.observations||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p><strong>Adaptation:</strong> ${escapeHtml(item.adaptation||'')}</p></article>`).join('')||'<p class="fine-print">No trust research loaded.</p>';
  }

  function renderInnovationLab(data={}){
    const experiments=Array.isArray(data.experiments)?data.experiments:[];
    const implemented=experiments.filter(x=>String(x.status||'').includes('implemented')).length;
    const closed=experiments.filter(x=>String(x.status||'').includes('closed')).length;
    const summary=$('#innovationLabSummary'); const list=$('#innovationLabList');
    if(summary)summary.innerHTML=[[data.version||'','Ledger version'],[experiments.length,'Experiments tracked'],[implemented,'Implemented'],[closed,'Research-only or closed']].map(([value,label])=>`<div class="control-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join('');
    if(list)list.innerHTML=experiments.map(item=>`<article class="innovation-experiment-card"><div class="legal-portal-heading"><div><p class="eyebrow">${escapeHtml(item.status||'candidate')}</p><h3>${escapeHtml(item.title||item.id||'Experiment')}</h3></div></div><p><strong>User problem:</strong> ${escapeHtml(item.userProblem||'')}</p><p><strong>Hypothesis:</strong> ${escapeHtml(item.hypothesis||'')}</p><details><summary>Measures, safeguards, and next decision</summary><h4>Success measures</h4><ul>${(item.successMeasures||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><h4>Failure signals</h4><ul>${(item.failureSignals||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><h4>Safeguards</h4><ul>${(item.safeguards||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p><strong>Next:</strong> ${escapeHtml(item.nextDecision||'')}</p></details></article>`).join('')||'<p class="fine-print">No innovation experiments are recorded.</p>';
  }

    function renderProfessionalGrowth(data={}){
      const summary=data.summary||{}; const controls=data.controls||{}; const policy=data.publicPolicy||{};
      if($('#professionalGrowthStatus'))$('#professionalGrowthStatus').textContent=summary.launchReady?'Open under approved controls':'Closed';
      if($('#professionalGrowthSummary'))$('#professionalGrowthSummary').innerHTML=[[summary.approvedPromotions||0,'Approved growth records'],[summary.promotions||0,'Total growth records'],[controls.sponsoredPlacementsOpen?'Open':'Closed','Sponsored placement'],[controls.caseOpportunityAccessOpen?'Open':'Closed','Case opportunities']].map(([v,l])=>`<div class="control-stat"><strong>${escapeHtml(String(v))}</strong><span>${escapeHtml(l)}</span></div>`).join('');
      const form=$('#professionalGrowthControlsForm');if(form){for(const key of ['sponsoredPlacementsOpen','caseOpportunityAccessOpen','legalComplianceApproved','jurisdictionCounselReviewRecorded'])form.elements[key].checked=Boolean(controls[key]);form.elements.sponsoredLabel.value=controls.sponsoredLabel||'Sponsored';form.elements.termsVersion.value=controls.termsVersion||'';form.elements.complianceReference.value=controls.complianceReference||'';form.elements.notes.value=controls.notes||'';}
      const records=(data.promotions||[]).map(x=>`<article class="marketplace-record"><h4>${escapeHtml(x.professionalId)}</h4><p>${escapeHtml(friendlyStatus(x.status))} · ${escapeHtml((x.portalIds||[]).join(', ')||'No portal approved')}</p><p>${x.opportunityAccess?'Case-opportunity access requested or approved':'Sponsored visibility only'}</p><p class="fine-print">${escapeHtml(x.placementType||'Sponsored profile placement')} · updated ${escapeHtml(x.updatedAt||'')}</p></article>`).join('');
      if($('#professionalGrowthRecords'))$('#professionalGrowthRecords').innerHTML=records||'<p class="fine-print">No paid-growth records exist. Basic profile claiming and editing remain free.</p>';
    }
    async function loadProfessionalGrowth(){const r=await fetch('/api/owner/professional-growth',{headers:headers()}).then(x=>x.json()).catch(err=>({ok:false,error:err.message}));if(!r.ok){if($('#professionalGrowthRecords'))$('#professionalGrowthRecords').innerHTML=`<p class="error">${escapeHtml(r.error||'Could not load professional growth controls.')}</p>`;return;}renderProfessionalGrowth(r);}

    async function loadControlCenter(token=''){
      ownerToken=String(token || ownerToken || '').trim();
      const result=await fetch('/api/owner/control-center',{headers:headers()}).then(async r=>({status:r.status,data:await r.json()})).catch(err=>({status:0,data:{ok:false,error:err.message}}));
      if(!result.data.ok){ $('#controlCenterWorkspace').hidden=true; throw new Error(result.data.error || 'Could not open the Control Center.'); }
      if(ownerToken) sessionStorage.setItem('smarterJusticeOwnerControlToken',ownerToken); currentData=result.data;
      $('#controlCenterLoginSection').hidden=true; $('#controlCenterWorkspace').hidden=false;
      $('#controlCenterSummary').innerHTML=renderControlSummary(result.data.summary || {});
      renderCurrentReleaseTruth(result.data.currentReleaseTruth || {});
      renderPortfolioTruth(result.data.portfolioTruth || {});
      renderLegalPortfolioOperatingSystem(result.data.legalPortfolioOperatingSystem || {});
      renderAttorneyOutreachReadiness(result.data.attorneyOutreachReadiness || {});
      renderProfessionalGrowth(result.data.professionalGrowth || {});
      renderLegalNetworkActionCenter(result.data.legalNetworkActionCenter || {});
      renderPortalReleaseSnapshot(result.data.portalReleaseSnapshot || {});
      renderLegalNetworkCommandCenter(result.data.legalPortalCommandCenter || {});
      renderLegalNetworkWorkspace(result.data.legalPortalWorkspace || {});
      renderNeutralBoardroomHandoff(result.data.neutralBoardroomHandoff || {});
      renderCompetitiveLandscape(result.data.competitiveLandscape || {});
      renderInnovationLab(result.data.innovationLab || {});
      renderTrustVerificationResearch(result.data.trustVerificationResearch || {});
      $('#controlCenterSystemReadiness').innerHTML=renderControlSystemReadiness(result.data.systemLaunchReadiness || {});
      renderReleaseGovernance(result.data.releaseGovernance || {});
      renderOperationalReadiness(result.data.operationalReadiness || {},result.data.migrationManifest || {});
      $('#controlCenterGovernance').innerHTML=renderControlGovernance(result.data.governance || {});
      $('#controlCenterCapabilityRegistry').innerHTML=renderCapabilityRegistry(result.data.capabilityRegistry || {});
      const auth=await ownerAuthStatus(); $('#controlCenterSecurity').innerHTML=renderOwnerSecurity(auth);
      $('#controlCenterStatusFilter').innerHTML='<option value="">All statuses</option>'+controlOptions(result.data.enums.portfolioStatuses,'');
      $('#controlCenterPriorityFilter').innerHTML='<option value="">All priorities</option>'+controlOptions(result.data.enums.priorities,'');
      $('#controlCenterPortalList').innerHTML=(result.data.portals || []).map(p=>renderControlPortal(p,result.data.enums || {})).join('');
      $('#controlCenterRulesPackSummary').innerHTML=renderRulesPackSummary(result.data.masterRulesPack || {});
      await Promise.all([loadMarketplace(),loadBuildProgram(),loadDomainRegistry(),loadRevenueAccessModel(),loadPublicPaidServices(),loadFieldLaunchProgram(),loadProfessionalGrowth()]); filterControlPortals();
    }

    $('#downloadCompetitiveLandscape')?.addEventListener('click',()=>{const data=currentData?.competitiveLandscape;if(!data)return;const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='smarter-justice-competitive-landscape-v1.7.23.json';document.body.appendChild(a);a.click();URL.revokeObjectURL(a.href);a.remove();});
    $('#downloadTrustVerificationResearch')?.addEventListener('click',()=>downloadControlArtifact('SMARTER_JUSTICE_TRUST_VERIFICATION_RESEARCH_V1.7.25.json',JSON.stringify(currentData?.trustVerificationResearch||{},null,2),'application/json')); 
    $('#downloadInnovationLab')?.addEventListener('click',()=>downloadControlArtifact('SMARTER_JUSTICE_INNOVATION_LAB_V1.7.25.json',JSON.stringify(currentData?.innovationLab||{},null,2),'application/json')); 

    login.addEventListener('submit',async e=>{
      e.preventDefault(); const formData=new FormData(login); const token=String(formData.get('token') || '').trim(); const resultNode=$('#controlCenterLoginResult'); const submit=login.querySelector('button[type="submit"]'); submit.disabled=true; submit.textContent='Signing in…'; resultNode.textContent='';
      try{
        if(token){ ownerToken=token; await loadControlCenter(token); }
        else {
          const response=await fetch('/api/owner/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:formData.get('email'),password:formData.get('password'),mfaCode:formData.get('mfaCode')})}).then(r=>r.json());
          if(!response.ok) throw new Error(response.error || 'Owner sign-in failed.'); ownerToken=''; sessionStorage.removeItem('smarterJusticeOwnerControlToken'); await loadControlCenter();
        }
      }catch(err){ resultNode.textContent=err.message; resultNode.className='result-panel error'; }
      finally{ submit.disabled=false; submit.textContent='Sign in securely'; }
    });
    (async()=>{ if(ownerToken){ const input=login.querySelector('[name="token"]'); if(input) input.value=ownerToken; return loadControlCenter(ownerToken).catch(()=>sessionStorage.removeItem('smarterJusticeOwnerControlToken')); } const status=await ownerAuthStatus(); if(status.authenticated) loadControlCenter().catch(()=>{}); })();
    $('#controlCenterAddPortalForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#controlCenterAddPortalResult'); resultNode.textContent='Adding private record...';
      const raw=Object.fromEntries(new FormData(form).entries()); raw.portalSpecificRequirements=String(raw.portalSpecificRequirements || '').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
      const response=await fetch('/api/owner/control-center/portals',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=response.error || 'Could not add portal record.'; return; }
      $('#controlCenterPortalList').insertAdjacentHTML('beforeend',renderControlPortal(response.portal,currentData.enums || {}));
      $('#controlCenterSummary').innerHTML=renderControlSummary(response.summary || {}); resultNode.textContent=(response.warnings || []).join(' ') || 'Private portal record added.'; form.reset(); filterControlPortals();
    });
    $('#controlCenterSearch')?.addEventListener('input',filterControlPortals);
    $('#controlCenterStatusFilter')?.addEventListener('change',filterControlPortals);
    $('#controlCenterPriorityFilter')?.addEventListener('change',filterControlPortals);
    $('#runOperationalDatabaseCheck')?.addEventListener('click',()=>operationalDatabaseAction('/api/owner/operational-readiness/database-check','Database check'));
    $('#reconnectOperationalDatabase')?.addEventListener('click',()=>operationalDatabaseAction('/api/owner/operational-readiness/database-reconnect','Database reconnect'));
    $('#refreshBuildProgram')?.addEventListener('click',loadBuildProgram);
    $('#refreshRevenueAccessModel')?.addEventListener('click',loadRevenueAccessModel);
    $('#refreshPublicPaidServices')?.addEventListener('click',loadPublicPaidServices);
    $('#refreshFieldLaunchProgram')?.addEventListener('click',loadFieldLaunchProgram);
    $('#exportRevenueAccessModel')?.addEventListener('click',async()=>{const r=await fetch('/api/owner/revenue-access-model/export',{headers:headers()}).then(x=>x.json());if(r.ok)downloadControlArtifact('smarter-justice-shared-revenue-access-model.md',r.markdown,'text/markdown');else alert(r.error||'Could not export.');});
    $('#exportPublicPaidServices')?.addEventListener('click',async()=>{const r=await fetch('/api/owner/public-paid-services/export',{headers:headers()}).then(x=>x.json());if(r.ok)downloadControlArtifact('smarter-justice-public-paid-services.md',r.markdown,'text/markdown');else alert(r.error||'Could not export.');});
    $('#exportFieldLaunchProgram')?.addEventListener('click',async()=>{const r=await fetch('/api/owner/field-launch-program/export',{headers:headers()}).then(x=>x.json());if(r.ok)downloadControlArtifact('smarter-justice-nyc-field-launch-program.md',r.markdown,'text/markdown');else alert(r.error||'Could not export.');});
    document.addEventListener('submit',async event=>{
      const revenuePlan=event.target.closest('[data-revenue-public-plan]');if(revenuePlan){event.preventDefault();const body=Object.fromEntries(new FormData(revenuePlan));body.monthlyPriceCents=Number(body.monthlyPriceCents||0);body.activeForBilling=revenuePlan.elements.activeForBilling.checked;const r=await fetch('/api/owner/revenue-access-model/public-plans/'+encodeURIComponent(revenuePlan.dataset.revenuePublicPlan),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());revenuePlan.querySelector('[data-result]').textContent=r.ok?'Plan saved.':(r.error||'Could not save.');if(r.ok)await loadRevenueAccessModel();return;}
      const reviewService=event.target.closest('[data-revenue-human-review]');if(reviewService){event.preventDefault();const body=Object.fromEntries(new FormData(reviewService));body.priceCents=body.priceCents===''?null:Number(body.priceCents);body.activeForBilling=reviewService.elements.activeForBilling.checked;const r=await fetch('/api/owner/revenue-access-model/human-review/'+encodeURIComponent(reviewService.dataset.revenueHumanReview),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());reviewService.querySelector('[data-result]').textContent=r.ok?'Service saved.':(r.error||'Could not save.');if(r.ok){await loadRevenueAccessModel();await loadPublicPaidServices();}return;}
      const portalAdoption=event.target.closest('[data-revenue-portal]');if(portalAdoption){event.preventDefault();const body=Object.fromEntries(new FormData(portalAdoption));body.freeAiStartingHelp=portalAdoption.elements.freeAiStartingHelp.checked;const r=await fetch('/api/owner/revenue-access-model/portals/'+encodeURIComponent(portalAdoption.dataset.revenuePortal),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());portalAdoption.querySelector('[data-result]').textContent=r.ok?'Portal adoption saved.':(r.error||'Could not save.');if(r.ok)await loadRevenueAccessModel();return;}
      const publicPaidControls=event.target.closest('#publicPaidServicesControlsForm');if(publicPaidControls){event.preventDefault();const body=Object.fromEntries(new FormData(publicPaidControls));for(const key of ['ownerApproved','liveChargesAllowed','requireSensitiveTrafficApproval','requireAuthenticatedEmail'])body[key]=publicPaidControls.elements[key].checked;const r=await fetch('/api/owner/public-paid-services/controls',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#publicPaidServicesControlsResult').textContent=r.ok?'Public paid-service controls saved.':(r.error||'Could not save.');if(r.ok)await loadPublicPaidServices();return;}
      const publicPaidOrder=event.target.closest('[data-public-paid-order]');if(publicPaidOrder){event.preventDefault();const body=Object.fromEntries(new FormData(publicPaidOrder));const r=await fetch('/api/owner/public-paid-services/orders/'+encodeURIComponent(publicPaidOrder.dataset.publicPaidOrder),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());publicPaidOrder.querySelector('[data-public-paid-result]').textContent=r.ok?'Order saved.':(r.error||'Could not save.');if(r.ok)await loadPublicPaidServices();return;}
      const fieldControls=event.target.closest('#fieldLaunchControlsForm');if(fieldControls){event.preventDefault();const body=Object.fromEntries(new FormData(fieldControls));for(const k of ['publicLaneEnabled','professionalLaneEnabled','requireLocationPermissionEvidence','requireOwnerActivation'])body[k]=fieldControls.elements[k].checked;const r=await fetch('/api/owner/field-launch-program/controls',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#fieldLaunchControlsResult').textContent=r.ok?'Field controls saved.':(r.error||'Could not save.');if(r.ok)await loadFieldLaunchProgram();return;}
      const fieldCampaign=event.target.closest('#fieldLaunchCampaignForm');if(fieldCampaign){event.preventDefault();const body=Object.fromEntries(new FormData(fieldCampaign));body.portalSlugs=splitLines(body.portalSlugs);const r=await fetch('/api/owner/field-launch-program/campaigns',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#fieldLaunchCampaignResult').textContent=r.ok?'Campaign saved.':(r.error||'Could not save.');if(r.ok){fieldCampaign.reset();await loadFieldLaunchProgram();}return;}
      const fieldAsset=event.target.closest('#fieldLaunchAssetForm');if(fieldAsset){event.preventDefault();const body=Object.fromEntries(new FormData(fieldAsset));const r=await fetch('/api/owner/field-launch-program/assets',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#fieldLaunchAssetResult').textContent=r.ok?'Field asset saved.':(r.error||'Could not save.');if(r.ok){fieldAsset.reset();fieldAsset.elements.primaryBrand.value='Smarter Justice';fieldAsset.elements.legacyLine.value='From the team behind Justice Truck';await loadFieldLaunchProgram();}return;}
      const fieldStaff=event.target.closest('#fieldLaunchStaffForm');if(fieldStaff){event.preventDefault();const body=Object.fromEntries(new FormData(fieldStaff));body.allowedLanes=String(body.allowedLanes||'').split(',').map(x=>x.trim()).filter(Boolean);body.acknowledgments=splitLines(body.acknowledgments);const r=await fetch('/api/owner/field-launch-program/staff',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#fieldLaunchStaffResult').textContent=r.ok?'Staff record saved.':(r.error||'Could not save.');if(r.ok){fieldStaff.reset();await loadFieldLaunchProgram();}return;}
      const fieldReport=event.target.closest('#fieldLaunchDailyReportForm');if(fieldReport){event.preventDefault();const body=Object.fromEntries(new FormData(fieldReport));for(const k of ['flyersDistributed','publicConversations','professionalConversations','officeVisits','followUpsDue'])body[k]=Number(body[k]||0);body.campaignCodes=String(body.campaignCodes||'').split(',').map(x=>x.trim()).filter(Boolean);body.staffCodes=String(body.staffCodes||'').split(',').map(x=>x.trim()).filter(Boolean);const r=await fetch('/api/owner/field-launch-program/daily-reports',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#fieldLaunchDailyReportResult').textContent=r.ok?'Daily report saved.':(r.error||'Could not save.');if(r.ok){fieldReport.reset();await loadFieldLaunchProgram();}return;}
      const growthControls=event.target.closest('#professionalGrowthControlsForm');if(growthControls){event.preventDefault();const body=Object.fromEntries(new FormData(growthControls));for(const key of ['sponsoredPlacementsOpen','caseOpportunityAccessOpen','legalComplianceApproved','jurisdictionCounselReviewRecorded'])body[key]=growthControls.elements[key].checked;body.evidence=splitLines(body.evidence);const r=await fetch('/api/owner/professional-growth/controls',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#professionalGrowthControlsResult').textContent=r.ok?'Paid professional growth controls saved.':(r.error||'Could not save.');if(r.ok){growthControls.elements.confirmation.value='';growthControls.elements.reason.value='';growthControls.elements.evidence.value='';await loadProfessionalGrowth();}return;}
      const growthPromotion=event.target.closest('#professionalGrowthPromotionForm');if(growthPromotion){event.preventDefault();const fd=new FormData(growthPromotion),body=Object.fromEntries(fd);body.portalIds=fd.getAll('portalIds');body.opportunityAccess=growthPromotion.elements.opportunityAccess.checked;const professionalId=String(body.professionalId||'').trim();delete body.professionalId;const r=await fetch('/api/owner/professional-growth/professionals/'+encodeURIComponent(professionalId),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#professionalGrowthPromotionResult').textContent=r.ok?'Professional growth record saved.':(r.error||'Could not save.');if(r.ok){growthPromotion.reset();growthPromotion.elements.placementType.value='Sponsored profile placement';await loadProfessionalGrowth();}return;}
      const controls=event.target.closest('#pilotProgramControlsForm');if(controls){event.preventDefault();const body=Object.fromEntries(new FormData(controls));body.applicationsOpen=controls.elements.applicationsOpen.checked;body.paymentGateEnabled=controls.elements.paymentGateEnabled.checked;body.maxSubmittedApplications=Number(body.maxSubmittedApplications||0);body.maxApprovedApplications=Number(body.maxApprovedApplications||0);const r=await fetch('/api/owner/pilot-program/controls',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());$('#pilotProgramControlsResult').textContent=r.ok?'Pilot controls saved.':(r.error||'Could not save.');if(r.ok)await loadPilotProgram();return;}
      const review=event.target.closest('[data-pilot-review]');if(review){event.preventDefault();const body=Object.fromEntries(new FormData(review));body.requiredActions=splitLines(body.requiredActions);body.idempotencyKey=crypto.randomUUID?.()||String(Date.now());const r=await fetch('/api/owner/pilot-program/applications/'+encodeURIComponent(review.dataset.pilotReview)+'/review',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());review.querySelector('[data-pilot-result]').textContent=r.ok?'Review saved.':(r.error||'Could not save.');if(r.ok)await loadPilotProgram();return;}
      const support=event.target.closest('[data-pilot-support]');if(support){event.preventDefault();const body=Object.fromEntries(new FormData(support));body.idempotencyKey=crypto.randomUUID?.()||String(Date.now());const r=await fetch('/api/owner/pilot-program/support/'+encodeURIComponent(support.dataset.pilotSupport),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());support.querySelector('[data-pilot-result]').textContent=r.ok?'Support updated.':(r.error||'Could not save.');if(r.ok)await loadPilotProgram();return;}
      const evidence=event.target.closest('[data-pilot-evidence]');if(evidence){event.preventDefault();const body=Object.fromEntries(new FormData(evidence));const r=await fetch('/api/owner/pilot-program/evidence/'+encodeURIComponent(evidence.dataset.pilotEvidence),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(x=>x.json());evidence.querySelector('[data-pilot-result]').textContent=r.ok?'Evidence saved.':(r.error||'Could not save.');if(r.ok)await loadPilotProgram();return;}
    });
    $('#pilotProgramExport')?.addEventListener('click',async()=>{const r=await fetch('/api/owner/pilot-program/export',{headers:headers()}).then(x=>x.json());if(r.ok)downloadControlArtifact('smarter-justice-pilot-program.md',r.markdown,'text/markdown');else alert(r.error||'Could not export.');});
    $('#domainRegistrySearch')?.addEventListener('input',filterDomainRegistry);
    $('#domainRegistryOwnership')?.addEventListener('change',filterDomainRegistry);
    $('#domainRegistryPortalStatus')?.addEventListener('change',filterDomainRegistry);
    $('#refreshDomainRegistry')?.addEventListener('click',loadDomainRegistry);
    $('#clearDomainRegistryForm')?.addEventListener('click',()=>fillDomainRegistryForm({sortOrder:999,publicVisible:false}));
    $('#domainRegistryForm')?.addEventListener('submit',async event=>{
      event.preventDefault();
      const form=event.currentTarget,result=$('#domainRegistryFormResult');
      const body=Object.fromEntries(new FormData(form).entries());
      body.publicVisible=form.elements.publicVisible.checked;
      body.sortOrder=Number(body.sortOrder||999);
      result.textContent='Saving domain record…';
      const response=await fetch('/api/owner/domain-registry',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      result.textContent=response.ok?'Domain record saved with status history.':(response.error||'Could not save the domain record.');
      if(response.ok){form.reset();await loadDomainRegistry();}
    });
    $('#exportDomainRegistry')?.addEventListener('click',async()=>{
      const response=await fetch('/api/owner/domain-registry/export',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok)return alert(response.error||'Could not export the domain registry.');
      downloadControlArtifact('smarter-justice-portal-domain-registry.md',response.markdown,'text/markdown');
    });
    ['buildProgramSearch','buildProgramStatus','buildProgramRelease','buildProgramPortal'].forEach(id=>$('#'+id)?.addEventListener(id==='buildProgramSearch'?'input':'change',filterBuildProgram));
    $$('.build-program-tabs [data-build-tab]').forEach(btn=>btn.addEventListener('click',()=>{ buildProgramTab=btn.dataset.buildTab; $$('.build-program-tabs [data-build-tab]').forEach(x=>x.classList.toggle('active',x===btn)); renderBuildProgram(); }));
    $('#buildProgramItemForm')?.addEventListener('submit',async e=>{ e.preventDefault(); const f=e.currentTarget,result=$('#buildProgramItemResult'); const raw=Object.fromEntries(new FormData(f).entries()); for(const k of ['acceptanceCriteria','requiredTests','dependencies','blockers'])raw[k]=String(raw[k]||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean); result.textContent='Saving…'; const r=await fetch('/api/owner/build-program/items',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(x=>x.json()).catch(err=>({ok:false,error:err.message})); result.textContent=r.ok?'Build item saved.':(r.error||'Could not save item.'); if(r.ok){f.reset();await loadBuildProgram();} });
    $('#buildProgramRecordForm')?.addEventListener('submit',async e=>{ e.preventDefault(); const f=e.currentTarget,result=$('#buildProgramRecordResult'),raw=Object.fromEntries(new FormData(f).entries()),kind=raw.kind; delete raw.kind; raw.itemIds=String(raw.itemIds||'').split(/[;\n]/).map(x=>x.trim()).filter(Boolean); result.textContent='Saving…'; const r=await fetch('/api/owner/build-program/records/'+encodeURIComponent(kind),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(x=>x.json()).catch(err=>({ok:false,error:err.message})); result.textContent=r.ok?'Record saved.':(r.error||'Could not save record.'); if(r.ok){f.reset();await loadBuildProgram();} });
    $('#exportBuildProgram')?.addEventListener('click',async()=>{ const r=await fetch('/api/owner/build-program/export',{headers:headers()}).then(x=>x.json()); if(!r.ok)return alert(r.error||'Could not export build program.'); downloadControlArtifact('smarter-justice-build-program.md',r.markdown,'text/markdown'); });
    $('#closeControlCenter')?.addEventListener('click',async()=>{ await fetch('/api/owner/auth/logout',{method:'POST'}).catch(()=>{}); sessionStorage.removeItem('smarterJusticeOwnerControlToken'); ownerToken=''; location.reload(); });
    document.addEventListener('submit',async e=>{
      if(e.target.matches('#ownerMfaConfirmForm')){ e.preventDefault(); const result=await fetch('/api/owner/auth/mfa/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target))) }).then(r=>r.json()); if(!result.ok){ $('#ownerSecurityResult').textContent=result.error||'Could not enable MFA.'; return; } $('#ownerSecurityResult').innerHTML=`<div class="result-panel success"><strong>MFA enabled. Save these one-time recovery codes now.</strong><pre>${escapeHtml((result.recoveryCodes||[]).join('\n'))}</pre></div>`; const recoveryHtml=$('#ownerSecurityResult').innerHTML; const status=await ownerAuthStatus(); $('#controlCenterSecurity').innerHTML=renderOwnerSecurity(status); $('#ownerSecurityResult').innerHTML=recoveryHtml; return; }
      if(e.target.matches('#ownerRecoveryRotateForm')){ e.preventDefault(); const result=await fetch('/api/owner/auth/recovery-codes/rotate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target))) }).then(r=>r.json()); $('#ownerSecurityResult').innerHTML=result.ok?`<div class="result-panel success"><strong>Replacement recovery codes</strong><pre>${escapeHtml((result.recoveryCodes||[]).join('\n'))}</pre></div>`:`<div class="result-panel error">${escapeHtml(result.error||'Could not replace recovery codes.')}</div>`; return; }
      const form=e.target.closest('[data-control-portal-form]'); if(!form) return; e.preventDefault();
      const resultNode=form.querySelector('[data-control-save-result]'); resultNode.textContent='Saving...'; const slug=form.dataset.controlPortalForm;
      const response=await fetch('/api/owner/control-center/portals/'+encodeURIComponent(slug),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(controlFormPayload(form))}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=response.error || 'Could not save.'; return; }
      resultNode.textContent=(response.warnings || []).length ? `Saved with warning: ${response.warnings.join(' ')}` : `Saved ${response.portal.updatedAt || ''}`;
      $('#controlCenterSummary').innerHTML=renderControlSummary(response.summary || currentData?.summary || {});
      const card=form.closest('[data-control-portal]'); if(card){ card.dataset.status=response.portal.portfolioStatus; card.dataset.priority=response.portal.priority; card.dataset.search=[response.portal.name,response.portal.portfolioStatus,response.portal.priority,response.portal.activeBuildState,response.portal.currentBuildTarget,response.portal.latestDevelopmentVersion,...(response.portal.ownerDecisions||[]),...(response.portal.blockers||[]),...(response.portal.risks||[]),...(response.portal.documentedDeviations||[]),response.portal.notes].join(' ').toLowerCase(); }
      filterControlPortals();
    });
    document.addEventListener('click',async e=>{
      const editBuild=e.target.closest('[data-edit-build-item]'); if(editBuild){ const item=buildProgramData?.items?.find(x=>x.id===editBuild.dataset.editBuildItem); if(item)fillBuildItemForm(item); return; }
      const editDomain=e.target.closest('[data-edit-domain]'); if(editDomain){ const item=domainRegistryData?.domains?.find(x=>x.id===editDomain.dataset.editDomain); if(item)fillDomainRegistryForm(item); return; }
      if(e.target.closest('#downloadCapabilityRegistry')){ downloadControlArtifact('smarter-justice-cross-portal-capability-registry.json',JSON.stringify(currentData?.capabilityRegistry||{},null,2),'application/json'); return; }
      if(e.target.closest('#downloadCrossPortalLearning')){ downloadControlArtifact('SMARTER_ECOSYSTEM_CROSS_PORTAL_LEARNING_V1.7.28.json',JSON.stringify(currentData?.crossPortalLearning||currentData?.capabilityRegistry?.learningSystem||{},null,2),'application/json'); return; }
      if(e.target.closest('#ownerBeginMfa')){ const result=await fetch('/api/owner/auth/mfa/begin',{method:'POST'}).then(r=>r.json()); const panel=$('#ownerMfaEnrollment'); if(!result.ok){ $('#ownerSecurityResult').textContent=result.error||'Could not begin MFA setup.'; return; } panel.hidden=false; panel.innerHTML=`<div class="notice"><strong>Add this account to your authenticator app</strong><p>Manual secret: <code class="wrap-code">${escapeHtml(result.secret)}</code></p><p class="fine-print">Authenticator URI: <code class="wrap-code">${escapeHtml(result.otpAuthUri)}</code></p></div><form id="ownerMfaConfirmForm"><label>Six-digit authenticator code<input name="code" autocomplete="one-time-code" inputmode="numeric" required></label><button class="primary">Confirm MFA</button></form>`; return; }
      if(e.target.closest('#ownerRotateRecoveryCodes')){ const form=$('#ownerRecoveryRotateForm'); if(form) form.hidden=!form.hidden; return; }
      if(e.target.closest('#ownerRevokeSessions')){ const result=await fetch('/api/owner/auth/sessions/revoke-others',{method:'POST'}).then(r=>r.json()); $('#ownerSecurityResult').textContent=result.ok?'Other owner sessions were signed out.':(result.error||'Could not revoke sessions.'); return; }
      const promptButton=e.target.closest('[data-generate-portal-prompt]');
      if(promptButton){ const slug=promptButton.dataset.generatePortalPrompt; promptButton.disabled=true; const prior=promptButton.textContent; promptButton.textContent='Generating...'; const response=await fetch('/api/owner/control-center/prompts/'+encodeURIComponent(slug),{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); promptButton.disabled=false; promptButton.textContent=prior; if(!response.ok){ alert(response.error || 'Could not generate prompt.'); return; } showArtifact({title:(promptButton.dataset.portalName || 'Portal')+' continuation prompt',kind:'Portal-specific next-chat handoff',text:response.prompt || '',filename:`${slug}-next-chat-continuation-prompt.md`,mime:'text/markdown',help:'This contains the shared Smarter Justice guidelines and the portal-specific information recorded here. Merge it with any newer, more complete portal-specific source of truth before final use.'}); return; }
      const manifestButton=e.target.closest('[data-generate-portal-manifest]');
      if(manifestButton){ const slug=manifestButton.dataset.generatePortalManifest; const response=await fetch('/api/owner/control-center/manifests/'+encodeURIComponent(slug),{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){ alert(response.error || 'Could not generate manifest.'); return; } const text=JSON.stringify(response.manifest,null,2); showArtifact({title:(manifestButton.dataset.portalName || 'Portal')+' manifest',kind:'Machine-readable portal record',text,filename:`${slug}-portal-manifest.json`,mime:'application/json',help:'This owner-generated manifest records build and portfolio status. The active portal release should still maintain and validate its own source-controlled manifest.'}); }
    });
    $('#generateMasterCoordinationPrompt')?.addEventListener('click',async()=>{ const response=await fetch('/api/owner/control-center/prompts/master',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){ alert(response.error || 'Could not generate the master prompt.'); return; } showArtifact({title:'Smarter Justice legal-network coordination prompt',kind:'Legal-network coordination handoff',text:response.prompt || '',filename:'smarter-justice-master-coordination-prompt.md',mime:'text/markdown',help:'Use this for legal-sector strategy, priorities, standards, cross-portal coordination, deployment, operations, and Control Center development—not as a substitute for a portal-specific build prompt.'}); });
    $('#exportControlCenterPortfolio')?.addEventListener('click',async()=>{ const response=await fetch('/api/owner/control-center/export',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){ alert(response.error || 'Could not export portfolio.'); return; } downloadControlArtifact('smarter-justice-control-center-portfolio.json',JSON.stringify(response,null,2),'application/json'); });
    $('#downloadLegalPortfolioOperatingSystem')?.addEventListener('click',async()=>{ const response=await fetch('/api/owner/legal-portfolio-operating-system/export',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){alert(response.error||'Could not export the operating record.');return;} downloadControlArtifact('SMARTER_JUSTICE_LEGAL_PORTFOLIO_OPERATING_SYSTEM_V1.7.53.json',JSON.stringify(response.bundle||{},null,2),'application/json'); });
    $('#ownerDecisionRegisterForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const result=$('#ownerDecisionRegisterResult');if(result)result.textContent='Saving…';const response=await fetch('/api/owner/legal-portfolio-operating-system/decisions',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(Object.fromEntries(new FormData(form)))}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));if(result)result.textContent=response.ok?'Decision recorded.':(response.error||'Could not record decision.');if(response.ok){const fresh=await fetch('/api/owner/legal-portfolio-operating-system',{headers:headers()}).then(r=>r.json());if(fresh.ok){currentData.legalPortfolioOperatingSystem=fresh.operatingSystem;renderLegalPortfolioOperatingSystem(fresh.operatingSystem);form.reset();}}});
    $('#launchGateRegisterForm')?.addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const body=Object.fromEntries(new FormData(form));const id=body.gateId;delete body.gateId;const result=$('#launchGateRegisterResult');if(result)result.textContent='Saving…';const response=await fetch('/api/owner/legal-portfolio-operating-system/gates/'+encodeURIComponent(id),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));if(result)result.textContent=response.ok?'Gate updated.':(response.error||'Could not update gate.');if(response.ok){const fresh=await fetch('/api/owner/legal-portfolio-operating-system',{headers:headers()}).then(r=>r.json());if(fresh.ok){currentData.legalPortfolioOperatingSystem=fresh.operatingSystem;renderLegalPortfolioOperatingSystem(fresh.operatingSystem);}}});
    $('#downloadLegalNetworkActionCenter')?.addEventListener('click',async()=>{ const response=await fetch('/api/owner/legal-network-action-center/export',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){alert(response.error||'Could not export the legal-network action plan.');return;} downloadControlArtifact('LEGAL_NETWORK_ACTION_CENTER_V1.7.53.json',JSON.stringify(response.bundle||{},null,2),'application/json'); });
    $('#downloadPortfolioTruth')?.addEventListener('click',()=>downloadControlArtifact('PORTFOLIO_TRUTH_V1.7.60.json',JSON.stringify(currentData?.portfolioTruth||{},null,2),'application/json'));
    $('#downloadDashboardContracts')?.addEventListener('click',()=>downloadControlArtifact('DASHBOARD_CONTRACTS_V1.7.53.json',JSON.stringify(currentData?.portfolioTruth?.dashboardContracts||{},null,2),'application/json'));
    $('#downloadPortalReleaseSnapshot')?.addEventListener('click',()=>downloadControlArtifact('PORTAL_RELEASE_SNAPSHOT_V1.7.75.json',JSON.stringify(currentData?.portalReleaseSnapshot||{},null,2),'application/json'));
    $('#downloadLegalNetworkCommandCenter')?.addEventListener('click',()=>downloadControlArtifact('SMARTER_JUSTICE_LEGAL_NETWORK_CONTROL_CENTER_V1.7.53.json',JSON.stringify(currentData?.legalPortalCommandCenter||{},null,2),'application/json'));
    $('#downloadNeutralBoardroomHandoff')?.addEventListener('click',async()=>{ const response=await fetch('/api/owner/neutral-boardroom-handoff',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){alert(response.error||'Could not export the Neutral Boardroom handoff.');return;} downloadControlArtifact('NEUTRAL_BOARDROOM_HANDOFF_V1.7.66.json',JSON.stringify(response.handoff||{},null,2),'application/json'); });
    $('#downloadLegalNetworkWorkspace')?.addEventListener('click',async()=>{ const response=await fetch('/api/owner/legal-portal-workspace/export',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){alert(response.error||'Could not export the legal-portal workspace.');return;} downloadControlArtifact('SMARTER_JUSTICE_LEGAL_NETWORK_WORKSPACE_V1.7.53.json',JSON.stringify(response.bundle||{},null,2),'application/json'); });
    $('#legalNetworkActionLanes')?.addEventListener('submit',async e=>{
      const form=e.target.closest('form[data-legal-network-action]'); if(!form)return; e.preventDefault();
      const result=form.querySelector('.legal-network-action-result'); if(result)result.textContent='Saving…';
      const id=form.dataset.legalNetworkAction;
      const response=await fetch('/api/owner/legal-network-action-center/actions/'+encodeURIComponent(id),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(Object.fromEntries(new FormData(form)))}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(result)result.textContent=response.ok?'Saved.':(response.error||'Could not save.');
      if(response.ok&&response.actionCenter){
        currentData.legalNetworkActionCenter=response.actionCenter; renderLegalNetworkActionCenter(response.actionCenter);
        const handoffResponse=await fetch('/api/owner/neutral-boardroom-handoff',{headers:headers()}).then(r=>r.json()).catch(()=>({ok:false}));
        if(handoffResponse.ok){currentData.neutralBoardroomHandoff=handoffResponse.handoff;renderNeutralBoardroomHandoff(handoffResponse.handoff);}
      }
    });
    $('#legalNetworkWorkspaceList')?.addEventListener('submit',async e=>{ const form=e.target.closest('form[data-legal-portal]'); if(!form)return; e.preventDefault(); const result=form.querySelector('.legal-portal-result'); if(result)result.textContent='Saving…'; const id=form.dataset.legalPortal; const response=await fetch('/api/owner/legal-portal-workspace/portals/'+encodeURIComponent(id),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(Object.fromEntries(new FormData(form)))}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(result)result.textContent=response.ok?'Saved.':(response.error||'Could not save.'); if(response.ok){const fresh=await fetch('/api/owner/legal-portal-workspace',{headers:headers()}).then(r=>r.json()); if(fresh.ok){currentData.legalPortalWorkspace=fresh.workspace;renderLegalNetworkWorkspace(fresh.workspace);}} });
    $('#copyControlCenterArtifact')?.addEventListener('click',async()=>{ const result=$('#controlCenterArtifactResult'); try{ await navigator.clipboard.writeText(artifact.text); result.textContent='Copied.'; }catch{ $('#controlCenterArtifactText')?.select(); result.textContent='Select and copy manually.'; } });
    $('#downloadControlCenterArtifact')?.addEventListener('click',()=>downloadControlArtifact(artifact.filename,artifact.text,artifact.mime));
    $('#viewMasterRulesMarkdown')?.addEventListener('click',async()=>{
      const response=await fetch('/api/system/master-rules-pack?format=markdown',{headers:headers()});
      const text=await response.text();
      if(!response.ok){ alert('Could not load the Master Rules Pack.'); return; }
      showArtifact({title:'Smarter Justice Master Rules and Suggestions Pack',kind:'Current versioned governance pack',text,filename:'SMARTER_JUSTICE_MASTER_RULES_AND_SUGGESTIONS_PACK.md',mime:'text/markdown',help:'This exact version is embedded into generated continuation prompts and recorded by checksum for reproducibility.'});
    });
    $('#downloadMasterRulesJson')?.addEventListener('click',async()=>{
      const response=await fetch('/api/system/master-rules-pack?format=json',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ alert(response.error||'Could not load the Master Rules Pack.'); return; }
      downloadControlArtifact('SMARTER_JUSTICE_MASTER_RULES_AND_SUGGESTIONS_PACK.json',JSON.stringify(response,null,2),'application/json');
    });
    $('#professionalPilotControlsForm')?.addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget; const raw=Object.fromEntries(new FormData(form)); raw.ownerApprovalRequired=form.elements.ownerApprovalRequired.checked; for(const key of ['maxActiveProfessionalMemberships','maxActiveFirmMemberships','maxTotalFirmSeats'])raw[key]=Number(raw[key]||0); const response=await fetch('/api/owner/professional-marketplace/pilot-controls',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()); $('#professionalPilotControlsResult').textContent=response.ok?'Pilot controls saved.':(response.error||'Could not save pilot controls.'); if(response.ok)await loadMarketplace(); });
    $('#professionalCredentialVerificationForm')?.addEventListener('submit',async e=>{ e.preventDefault(); const response=await fetch('/api/owner/professional-marketplace/credential-verification',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))}).then(r=>r.json()); $('#professionalCredentialVerificationResult').textContent=response.ok?'Credential review recorded.':(response.error||'Could not record the review.'); if(response.ok)await loadMarketplace(); });
    $('#professionalComplaintForm')?.addEventListener('submit',async e=>{ e.preventDefault(); const form=e.currentTarget; const raw=Object.fromEntries(new FormData(form)); raw.suspendImmediately=form.elements.suspendImmediately.checked; const response=await fetch('/api/owner/professional-marketplace/complaints',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()); $('#professionalComplaintResult').textContent=response.ok?'Compliance concern recorded.':(response.error||'Could not record the concern.'); if(response.ok){form.reset();await loadMarketplace();} });
    $('#refreshProfessionalMarketplace')?.addEventListener('click',loadMarketplace);
    $('#exportProfessionalMarketplace')?.addEventListener('click',async()=>{
      const response=await fetch('/api/owner/professional-marketplace/export',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ alert(response.error||'Could not export the marketplace.'); return; }
      downloadControlArtifact('smarter-justice-professional-marketplace.json',JSON.stringify(response,null,2),'application/json');
    });
    $('#createOutreachCampaignForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#createOutreachCampaignResult'); resultNode.textContent='Creating private campaign...';
      const body=Object.fromEntries(new FormData(form).entries());
      const response=await fetch('/api/owner/professional-marketplace/outreach-campaigns',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=response.error||'Could not create the campaign.'; return; }
      resultNode.textContent=`Campaign ${response.campaign?.campaignCode||''} created. It remains private until its status permits the invitation link.`; form.reset(); await loadMarketplace();
    });
    $('#firmDiscountQuoteForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#firmDiscountQuoteResult'); resultNode.hidden=false; resultNode.innerHTML='<p>Calculating…</p>';
      const raw=Object.fromEntries(new FormData(form).entries()); const body={planId:raw.planId,seatCount:Number(raw.seatCount||1)};
      const response=await fetch('/api/owner/professional-marketplace/firm-quote',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.innerHTML=`<p class="error">${escapeHtml(response.error||'Could not calculate the quote.')}</p>`; return; }
      const q=response.quote||{}; resultNode.innerHTML=`<h4>${escapeHtml(q.planName||'Firm plan')}</h4><p><strong>${escapeHtml(String(q.seatCount||1))} seats</strong> · ${escapeHtml(String(q.discountPercent||0))}% volume discount</p><p>${money(q.monthlyDiscountedPerSeatCents)} per seat monthly · <strong>${money(q.monthlyTotalCents)} total monthly</strong></p><p>${money(q.annualDiscountedPerSeatCents)} per seat annually · <strong>${money(q.annualTotalCents)} total annually</strong></p><p class="fine-print">Illustrative savings: ${money(q.monthlySavingsCents)} monthly. ${escapeHtml(q.disclosure||'')}</p>`;
    });
    $('#createOutreachProspectForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#createOutreachProspectResult'); resultNode.textContent='Adding private pipeline record...'; const raw=Object.fromEntries(new FormData(form).entries());
      const body={...raw,potentialSeats:Number(raw.potentialSeats||1),practiceAreas:splitLines(raw.practiceAreas),objections:splitLines(raw.objections),consentToContact:true};
      const response=await fetch('/api/owner/professional-marketplace/outreach-prospects',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=response.error||'Could not add the pipeline record.'; return; }
      resultNode.textContent=`Pipeline record added. Estimated monthly revenue: ${money(response.prospect?.estimatedMonthlyRevenueCents||0)}.`; form.reset(); await loadMarketplace();
    });
    $('#seedProfessionalProfileForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#seedProfessionalProfileResult'); resultNode.textContent='Creating unclaimed record...';
      const raw=Object.fromEntries(new FormData(form).entries());
      const body={displayName:raw.displayName,professionalType:raw.professionalType,website:raw.website,portalEligibility:selectedValues(form.elements.portalEligibility),jurisdictions:splitLines(raw.jurisdictions),practiceAreas:splitLines(raw.practiceAreas),ownerNotes:raw.ownerNotes,sourceRecords:[{sourceName:raw.sourceName,sourceType:raw.sourceType,sourceUrl:raw.sourceUrl,authorityLevel:raw.authorityLevel,reviewStatus:raw.reviewStatus,factsSupported:splitLines(raw.factsSupported),termsOrUseNotes:raw.termsOrUseNotes,retrievedAt:new Date().toISOString()}]};
      const response=await fetch('/api/owner/professional-marketplace/professionals/seed',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=response.error||'Could not create the profile.'; return; }
      resultNode.textContent='Unclaimed source-tracked record created. It is not public or appointment eligible.'; form.reset(); await loadMarketplace();
    });
    $('#createProfessionalFirmForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#createProfessionalFirmResult'); resultNode.textContent='Creating firm record...'; const raw=Object.fromEntries(new FormData(form).entries());
      const body={name:raw.name,website:raw.website,seatCount:Number(raw.seatCount||1),billingAdministratorName:raw.billingAdministratorName,billingAdministratorEmail:raw.billingAdministratorEmail,membership:{planId:'nyc-founding-firm',status:'none',seatCount:Number(raw.seatCount||1)},portalEligibility:selectedValues(form.elements.portalEligibility),jurisdictions:splitLines(raw.jurisdictions),notes:raw.notes};
      const response=await fetch('/api/owner/professional-marketplace/firms',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=response.error||'Could not create the firm.'; return; }
      resultNode.textContent='Private firm record created.'; form.reset(); await loadMarketplace();
    });
    $('#createProfileRequestForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#createProfileRequestResult'); resultNode.textContent='Recording request...'; const raw=Object.fromEntries(new FormData(form).entries()); raw.evidenceUrls=splitLines(raw.evidenceUrls);
      const response=await fetch('/api/owner/professional-marketplace/profile-requests',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=response.error||'Could not record the request.'; return; }
      resultNode.textContent='Request recorded for verification and review.'; form.reset(); await loadMarketplace();
    });
    $('#nysAttorneySourceSearchForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#nysAttorneySourceSearchResult'); resultNode.textContent='Searching the official source...'; const body=Object.fromEntries(new FormData(form).entries()); body.limit=Number(body.limit||25);
      const response=await fetch('/api/owner/professional-marketplace/public-sources/nys-attorneys/preview',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=(response.error||'Could not reach the official source.')+' You may retry later; nothing was imported.'; return; }
      nysPreviewRows=response.rows||[]; resultNode.textContent=`Previewed ${nysPreviewRows.length} official record${nysPreviewRows.length===1?'':'s'}. Nothing has been saved.`;
      $('#nysAttorneySourcePreview').innerHTML=nysPreviewRows.map((row,i)=>`<label class="marketplace-record source-preview-row"><input type="checkbox" data-nys-preview-index="${i}"> <strong>${escapeHtml(row.displayName)}</strong><br><small>Registration ${escapeHtml(row.publicFacts?.registrationNumber||'')} · ${escapeHtml(row.publicFacts?.registrationStatus||'Status not shown')} · ${escapeHtml(row.publicFacts?.companyName||'No company shown')} · ${escapeHtml(row.publicFacts?.publicBusinessAddress||'No public address shown')}</small></label>`).join('') || '<p>No matching records were returned.</p>';
      $('#nysAttorneySourceImportForm').hidden=!nysPreviewRows.length;
    });
    $('#nysAttorneySourceImportForm')?.addEventListener('submit',async e=>{
      e.preventDefault(); const form=e.currentTarget; const resultNode=$('#nysAttorneySourceImportResult');
      const selected=$$('[data-nys-preview-index]:checked',$('#nysAttorneySourcePreview')).map(x=>nysPreviewRows[Number(x.dataset.nysPreviewIndex)]?.publicFacts?.registrationNumber).filter(Boolean);
      if(!selected.length){ resultNode.textContent='Select at least one official record to import.'; return; }
      resultNode.textContent='Rechecking selected records with the official source and importing...';
      const body={registrationNumbers:selected,portalEligibility:selectedValues(form.elements.portalEligibility),practiceAreas:splitLines(form.elements.practiceAreas.value)};
      const response=await fetch('/api/owner/professional-marketplace/public-sources/nys-attorneys/import',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message}));
      if(!response.ok){ resultNode.textContent=response.error||'Could not import selected records.'; return; }
      resultNode.textContent=`Created ${response.created?.length||0}; skipped duplicates ${response.duplicates?.length||0}; errors ${response.errors?.length||0}. All created records remain unclaimed and not appointment eligible.`; await loadMarketplace();
    });
    document.addEventListener('submit',async e=>{
      const manualProfile=e.target.closest('[data-owner-manual-profile]');
      if(manualProfile){ e.preventDefault(); const resultNode=manualProfile.querySelector('[data-marketplace-result]'); resultNode.textContent='Creating private profile workspace...'; const raw=Object.fromEntries(new FormData(manualProfile).entries()); const body={accountId:manualProfile.dataset.accountId,kind:raw.kind,displayName:raw.displayName,name:raw.displayName,firmName:raw.displayName,professionalType:raw.professionalType,seatCount:Number(raw.seatCount||1),jurisdictions:splitLines(raw.jurisdictions),practiceAreas:splitLines(raw.practiceAreas),portalEligibility:splitLines(raw.portalEligibility),locations:splitLines(raw.locations),officeLocations:splitLines(raw.locations)}; const response=await fetch('/api/owner/professional-accounts/manual-profile',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Private profile workspace created and linked. Verification, portal distribution, publication, and payment remain separate.':(response.error||'Could not create the profile workspace.'); if(response.ok) await loadMarketplace(); return; }
      const claimApproval=e.target.closest('[data-account-claim-approve]');
      if(claimApproval){ e.preventDefault(); const resultNode=claimApproval.querySelector('[data-marketplace-result]'); resultNode.textContent='Approving account control...'; const response=await fetch('/api/owner/professional-accounts/approve-profile-claim',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify({accountId:claimApproval.dataset.accountId,professionalId:claimApproval.dataset.professionalId,profileRequestId:claimApproval.dataset.profileRequestId})}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Account control approved. Credential verification, membership, and consultation eligibility remain separate.':(response.error||'Could not approve the claim.'); if(response.ok) await loadMarketplace(); return; }
      const firmClaimApproval=e.target.closest('[data-account-firm-claim-approve]');
      if(firmClaimApproval){ e.preventDefault(); const resultNode=firmClaimApproval.querySelector('[data-marketplace-result]'); resultNode.textContent='Approving firm account control...'; const response=await fetch('/api/owner/professional-accounts/approve-firm-claim',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify({accountId:firmClaimApproval.dataset.accountId,firmId:firmClaimApproval.dataset.firmId,profileRequestId:firmClaimApproval.dataset.profileRequestId})}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Firm account control approved. Membership, credentials, services, and consultation eligibility remain separate.':(response.error||'Could not approve the firm claim.'); if(response.ok) await loadMarketplace(); return; }
      const membership=e.target.closest('[data-membership-plan]');
      if(membership){ e.preventDefault(); const resultNode=membership.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving...'; const raw=Object.fromEntries(new FormData(membership).entries()); raw.monthlyPriceCents=raw.monthlyPriceCents===''?null:Number(raw.monthlyPriceCents); raw.annualPriceCents=raw.annualPriceCents===''?null:Number(raw.annualPriceCents); raw.includedStaffSeats=raw.includedStaffSeats===''?null:Number(raw.includedStaffSeats); raw.features=splitLines(raw.features); raw.foundingPlan=membership.elements.foundingPlan.checked; const response=await fetch('/api/owner/professional-marketplace/membership-plans/'+encodeURIComponent(membership.dataset.membershipPlan),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Membership plan saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const revenue=e.target.closest('[data-revenue-program]');
      if(revenue){ e.preventDefault(); const resultNode=revenue.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving...'; const raw=Object.fromEntries(new FormData(revenue).entries()); const response=await fetch('/api/owner/professional-marketplace/revenue-programs/'+encodeURIComponent(revenue.dataset.revenueProgram),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Revenue program saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const professional=e.target.closest('[data-professional-update]');
      if(professional){ e.preventDefault(); const resultNode=professional.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving...'; const raw=Object.fromEntries(new FormData(professional).entries()); let credentials,services; try{ credentials=JSON.parse(raw.credentials||'[]'); services=JSON.parse(raw.consultationServices||'[]'); }catch{ resultNode.textContent='Credentials and consultation services must be valid JSON.'; return; } const now=new Date().toISOString(); const body={profileStatus:raw.profileStatus,claimStatus:raw.claimStatus,verificationStatus:raw.verificationStatus,ownerApprovalStatus:raw.ownerApprovalStatus,reviewStatus:raw.reviewStatus,portalEligibility:selectedValues(professional.elements.portalEligibility),jurisdictions:splitLines(raw.jurisdictions),practiceAreas:splitLines(raw.practiceAreas),credentials,consultationServices:services,membership:{planId:raw.membershipPlanId,status:raw.membershipStatus,currentPeriodEnd:raw.membershipPeriodEnd||''},marketplaceTermsAcceptedAt:professional.elements.marketplaceTerms.checked?now:'',independentProfessionalAcknowledgmentAt:professional.elements.independenceTerms.checked?now:'',conflictsPolicyAcceptedAt:professional.elements.conflictTerms.checked?now:''}; const response=await fetch('/api/owner/professional-marketplace/professionals/'+encodeURIComponent(professional.dataset.professionalUpdate),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Professional controls saved and eligibility recalculated.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const firm=e.target.closest('[data-firm-update]');
      if(firm){ e.preventDefault(); const resultNode=firm.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving firm membership controls...'; const raw=Object.fromEntries(new FormData(firm).entries()); const now=new Date().toISOString(); const body={seatCount:Number(raw.seatCount||1),activeSeatCount:Number(raw.activeSeatCount||0),billingAdministratorName:raw.billingAdministratorName,billingAdministratorEmail:raw.billingAdministratorEmail,ownerApprovalStatus:raw.ownerApprovalStatus,reviewStatus:raw.reviewStatus,membership:{planId:raw.membershipPlanId,status:raw.membershipStatus,currentPeriodEnd:raw.membershipPeriodEnd||'',seatCount:Number(raw.seatCount||1)},marketplaceTermsAcceptedAt:firm.elements.marketplaceTerms?.checked?now:'',independentProfessionalAcknowledgmentAt:firm.elements.independenceTerms?.checked?now:'',conflictsPolicyAcceptedAt:firm.elements.conflictTerms?.checked?now:''}; const response=await fetch('/api/owner/professional-marketplace/firms/'+encodeURIComponent(firm.dataset.firmUpdate),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Firm membership and seat controls saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const campaign=e.target.closest('[data-outreach-campaign-update]');
      if(campaign){ e.preventDefault(); const resultNode=campaign.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving campaign...'; const raw=Object.fromEntries(new FormData(campaign).entries()); const response=await fetch('/api/owner/professional-marketplace/outreach-campaigns/'+encodeURIComponent(campaign.dataset.outreachCampaignUpdate),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Campaign saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const prospect=e.target.closest('[data-outreach-prospect-update]');
      if(prospect){ e.preventDefault(); const resultNode=prospect.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving pipeline record...'; const raw=Object.fromEntries(new FormData(prospect).entries()); const body={...raw,potentialSeats:Number(raw.potentialSeats||1),objections:splitLines(raw.objections)}; const response=await fetch('/api/owner/professional-marketplace/outreach-prospects/'+encodeURIComponent(prospect.dataset.outreachProspectUpdate),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Pipeline record saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const request=e.target.closest('[data-profile-request-update]');
      if(request){ e.preventDefault(); const resultNode=request.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving...'; const raw=Object.fromEntries(new FormData(request).entries()); const response=await fetch('/api/owner/professional-marketplace/profile-requests/'+encodeURIComponent(request.dataset.profileRequestUpdate),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Request saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); }
    });
  }

  async function initProfessionalMembershipPage(){
    const form = $('#professionalMembershipInterestForm');
    const formatMoney=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(value||0)/100);
    if(!form) return;
    const campaignCode = qs('campaign').trim();
    $('#professionalCampaignCode').value = campaignCode;
    const professionalTypes = ['attorney','tax attorney','CPA','enrolled agent','accountant','registered patent attorney','registered patent agent','accredited representative','other approved professional'];
    $('#professionalInterestType').innerHTML = professionalTypes.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(friendlyStatus(x))}</option>`).join('');
    const offerBox = $('#professionalMembershipOffer');
    if(!campaignCode){ offerBox.innerHTML='<h2>Private campaign link required</h2><p>Please use the professional membership link or QR code provided by Smarter Justice.</p>'; form.querySelector('button').disabled=true; return; }
    const response = await fetch('/api/professional-membership-offer?campaign='+encodeURIComponent(campaignCode)).then(async r=>({ok:r.ok,data:await r.json()})).catch(err=>({ok:false,data:{error:err.message}}));
    if(!response.ok){ offerBox.innerHTML=`<h2>Campaign unavailable</h2><p>${escapeHtml(response.data.error||'This founding-member campaign is not accepting interest.')}</p>`; form.querySelector('button').disabled=true; return; }
    const offer=response.data.offer||{};
    const price = offer.monthlyPriceCents==null ? 'Price confirmed during follow-up' : `${formatMoney(offer.monthlyPriceCents)} per month`;
    const annual = offer.annualPriceCents==null ? '' : ` or ${formatMoney(offer.annualPriceCents)} per year`;
    offerBox.innerHTML=`<p class="eyebrow">${escapeHtml(offer.market||'New York City')} pilot</p><h2>${escapeHtml(offer.name||offer.offerPlanName||'Founding professional membership')}</h2><p class="price">${escapeHtml(price+annual)}</p><ul>${(offer.benefits||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p class="fine-print">${escapeHtml(offer.disclosure||'Submitting interest does not activate membership.')}</p>`;
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const result=$('#professionalMembershipInterestResult'); result.hidden=false; result.innerHTML='<p>Saving your private membership interest…</p>';
      const fd=new FormData(form); const body=Object.fromEntries(fd.entries());
      body.consultationInterests=$$('input[name="consultationInterests"]:checked',form).map(x=>x.value);
      body.practiceAreas=String(body.practiceAreas||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
      body.firmSeatEstimate=Number(body.firmSeatEstimate||1); body.consentToContact=form.elements.consentToContact.checked;
      const saved=await fetch('/api/professional-membership-interest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(async r=>({ok:r.ok,data:await r.json()})).catch(err=>({ok:false,data:{error:err.message}}));
      if(!saved.ok){ result.innerHTML=`<p class="error">${escapeHtml(saved.data.error||'Could not save your interest.')}</p>`; return; }
      result.innerHTML=`<h3>Interest recorded</h3><p>${escapeHtml(saved.data.message||'Smarter Justice will follow up privately.')}</p><p class="fine-print">Confirmation: ${escapeHtml(saved.data.confirmationId||'recorded')}</p>`;
      form.reset(); $('#professionalCampaignCode').value=campaignCode; form.querySelector('button').disabled=true;
    });
  }

  function safeInternalNext(defaultPath){
    const value=qs('next');
    const allowed=new Set(['/control-center.html','/control-center','/launch-activation.html','/launch-activation','/admin.html','/admin','/staff.html','/staff','/launch-readiness.html','/launch-readiness','/production-readiness.html','/production-readiness','/ai-summary.html','/ai-summary']);
    return allowed.has(value)?value:defaultPath;
  }
  function initOwnerLogin(){
    const form=$('#ownerLoginForm'); if(!form)return;
    fetch('/api/owner/auth/status').then(r=>r.json()).then(status=>{if(status.authenticated)location.replace(safeInternalNext('/control-center.html'));}).catch(()=>{});
    form.addEventListener('submit',async event=>{
      event.preventDefault(); const result=$('#ownerLoginResult'); result.textContent='Signing in securely…';
      const data=Object.fromEntries(new FormData(form).entries());
      const response=await fetch('/api/owner/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()).catch(error=>({ok:false,error:error.message}));
      if(!response.ok){result.textContent=response.error||'Owner sign-in was not accepted.';result.className='result-panel error';return;}
      location.replace(safeInternalNext('/control-center.html'));
    });
  }
  function initInternalAccess(){
    const form=$('#staffAccessForm'); if(!form)return;
    fetch('/api/staff/auth/status').then(r=>r.json()).then(status=>{if(status.authenticated)location.replace(safeInternalNext('/staff.html'));}).catch(()=>{});
    form.addEventListener('submit',async event=>{
      event.preventDefault(); const result=$('#staffAccessResult'); result.textContent='Confirming authorized access…';
      const data=Object.fromEntries(new FormData(form).entries());
      const response=await fetch('/api/staff/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()).catch(error=>({ok:false,error:error.message}));
      if(!response.ok){result.textContent=response.error||'Authorized access was not accepted.';result.className='result-panel error';return;}
      location.replace(safeInternalNext('/staff.html'));
    });
  }
  async function activateVerifiedStopSignLinks(){
    const links=$$('[data-stop-sign-project-link]'); if(!links.length)return;
    try{const response=await fetch('/api/public-config');const data=await response.json();const initiative=data?.publicServiceInitiatives?.stopDomesticViolence;if(!response.ok||!initiative?.configured)return;links.forEach(link=>{link.href=initiative.siteUrl;link.hidden=false;});}catch{}
  }
  function initNav(){ const b = $('[data-nav-toggle]'), nav = $('[data-nav]'); if (b && nav) b.addEventListener('click', () => { nav.classList.toggle('open'); b.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false'); }); }
  const originalText = new WeakMap();
  const esMap = new Map(Object.entries({
    'Home':'Inicio','How It Works':'Cómo funciona','Practice Areas':'Áreas de ayuda','Portals':'Portales','Upload Notice':'Subir aviso','Pricing':'Precios','Referral Program':'Programa de referidos','Community Partner Tools':'Herramientas para Community Partners','Review Options':'Opciones de revisión','FAQ':'Preguntas frecuentes','Contact':'Contacto','Dashboard':'Panel',
    'Start with a free question':'Empiece con una pregunta gratis','Start Free':'Empiece gratis','Choose a Portal':'Elegir un portal','Choose Portal':'Elegir portal','Ask Where to Start':'Preguntar por dónde empezar','Available here now':'Disponible aquí ahora','Separate website available':'Sitio separado disponible','Separate website not open yet':'El sitio separado aún no está abierto','Planned':'Planificado','Upload a Notice':'Subir un aviso','Save my starting point':'Guardar mi punto de partida','What happens next?':'¿Qué pasa después?','Pricing':'Precios','Use plain language. You do not need to know the correct legal category.':'Use lenguaje sencillo. No necesita saber la categoría legal correcta.','What happened or what do you need help with?':'¿Qué pasó o con qué necesita ayuda?','Your name':'Su nombre','Email':'Correo electrónico','Phone':'Teléfono','ZIP code':'Código postal','Urgency':'Urgencia','See where to start':'Vea por dónde empezar','Create code':'Crear código','Open dashboard':'Abrir panel','Load queue':'Cargar fila','Notice/deadline details':'Detalles del aviso o fecha límite','Agency, court, company, or office':'Agencia, tribunal, compañía u oficina','Privacy':'Privacidad','Terms':'Términos','Disclaimer':'Aviso legal','Security':'Seguridad',
    'Smarter Justice':'Smarter Justice','Private support service. Not a law firm. Not the government. No guaranteed outcomes.':'Servicio privado de apoyo. No es un bufete de abogados. No es el gobierno. No garantiza resultados.'
  }));
  function translatePage(es){
    const h = $('[data-i18n="home_h1"]');
    if(h) {
      h.textContent = es ? 'Un punto de partida más claro para problemas legales, de impuestos, beneficios, negocios y formularios del gobierno.' : 'One clearer starting point for legal, tax, benefits, business, and government-form problems.';
      const lead = $('.hero .lead');
      if(lead) lead.textContent = es ? 'Elija un portal especializado o haga una pregunta inicial gratis. Smarter Justice le ayuda a identificar por dónde empezar y mantiene separadas la revisión de un Especialista de Revisión Humana y la revisión de un abogado u otro profesional.' : 'Choose a focused portal or ask a free starting question. Smarter Justice helps identify where to begin while keeping Human Review Specialist review separate from attorney or other professional review.';
    }
    document.body.querySelectorAll('a,button,h1,h2,h3,label,summary,p,strong').forEach(el => {
      if(el.children.length) return; const current = el.textContent.trim(); if(!originalText.has(el)) originalText.set(el, current);
      const en = originalText.get(el); if(es && esMap.has(en)) el.textContent = esMap.get(en); if(!es) el.textContent = en;
    });
    $$('textarea[data-maxlength]').forEach(t => { t.placeholder = es ? 'Cuéntenos en sus propias palabras. Puede mencionar cualquier carta, fecha límite, tribunal, aviso de impuestos, agencia, accidente, denegación, formulario o documento.' : 'Tell us in your own words. You can mention any notice, deadline, court date, tax letter, agency letter, accident, denial, form, business filing, or document you received.'; });
    const q = $('textarea[name="question"]'); if(q && es) q.closest('label').childNodes[0].textContent = '¿Qué pasó o con qué necesita ayuda? ';
  }
  function initLanguage(){
    const btn = $('[data-lang-toggle]'); if(!btn) return;
    btn.addEventListener('click', () => { const es = document.documentElement.lang !== 'es'; document.documentElement.lang = es ? 'es' : 'en'; btn.textContent = es ? 'English' : 'Español'; translatePage(es); initCounters(); });
  }
  document.addEventListener('DOMContentLoaded', async () => { initNav(); initCounters(); initStepForms(); await loadPractices(); await initPortalStartContext(); initFreeQuestion(); initPracticeFilter(); await initSensitivePublicForms(); initPartnerForms(); initContact(); initDashboard(); initAdmin(); initCheckout(); initDraftDetails(); initAssistancePreferences(); initCheckoutStatus(); initLaunchReadiness(); await initPublicLaunchStatus(); initPortalDirectory(); initPortalDetail(); initControlCenter(); initOwnerLogin(); initInternalAccess(); activateVerifiedStopSignLinks(); initProfessionalMembershipPage(); });
})();
// v1.7.27 preserves the CSP-compatible printable partner flyer control.
document.querySelector('#printPartnerFlyer')?.addEventListener('click',()=>window.print());

/* v1.7.52 public-tool return path for the Attorney Partner Tour */
(()=>{
  'use strict';
  const params=new URLSearchParams(location.search);
  if(params.get('tour')!=='1')return;
  const allowed=new Set(['/document-tools.html','/document-tools','/date-deadline-organizer.html','/date-deadline-organizer','/communication-evidence-log.html','/communication-evidence-log']);
  if(!allowed.has(location.pathname))return;
  const practice=String(params.get('practice')||'divorce').toLowerCase();
  const accepted=new Set(['divorce','estate','personal-injury','domestic-violence']);
  const selected=accepted.has(practice)?practice:'divorce';
  const banner=document.createElement('div');
  banner.className='tour-return-banner';
  banner.setAttribute('role','region');
  banner.setAttribute('aria-label','Attorney Partner Tour return path');
  const label=document.createElement('span');
  label.textContent='Public-tool demonstration using synthetic information only.';
  const link=document.createElement('a');
  link.href=`/attorney-partner-tour.html?practice=${encodeURIComponent(selected)}#tour-tool`;
  link.textContent='Return to the Attorney Partner Tour';
  banner.append(label,link);
  document.body.insertBefore(banner,document.body.firstChild);
})();
