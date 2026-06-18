(function(){
  const PRACTICES_URL = '/api/practice-areas';
  let practices = [];
  let defaultDocumentTypes = [];
  let activeSchema = null;
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  function qs(name){ return new URLSearchParams(location.search).get(name) || ''; }
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
  function renderCase(c){
    if (!c) return '<p>File not found.</p>';
    const concerns = (c.analysis?.concerns || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('') || '<li>No immediate concern detected yet.</li>';
    const steps = (c.analysis?.nextSteps || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('');
    const sources = (c.analysis?.catalogSummary || []).map(s=>`<li><strong>${escapeHtml(s.sourceName)}</strong> — ${escapeHtml(s.catalogStatus)} · ${escapeHtml(s.readinessLabel || 'Worksheet first')} <small>${escapeHtml(s.jurisdiction)}</small></li>`).join('');
    const smart = Object.entries(c.smartAnswers || {}).filter(([,v]) => v).map(([k,v]) => `<li><strong>${escapeHtml(k.replace(/([A-Z])/g,' $1'))}:</strong> ${escapeHtml(v)}</li>`).join('');
    const files = (c.attachments || []).map(a => `<li>${escapeHtml(a.originalName || a.name)} <small>${escapeHtml(a.documentType || a.mimeType || '')} · ${Math.round((a.sizeBytes||0)/1024)} KB · ${escapeHtml(a.uploadState || 'saved for review')}</small></li>`).join('') || '<li>No uploads yet.</li>';
    const warnings = (c.uploadWarnings || []).map(x => `<li>${escapeHtml(x)}</li>`).join('');
    const paths = (c.verifiedFormPaths || c.analysis?.verifiedFormPaths || []).map(p => `<li><strong>${escapeHtml(p.title)}</strong> — ${escapeHtml(p.readinessLabel || 'Verified worksheet path')}<br><small>${escapeHtml(p.deliveryType || '')}</small>${(p.missingFieldLabels||p.missingFields||[]).length ? `<br><em>Helpful missing details:</em> ${escapeHtml((p.missingFieldLabels||p.missingFields).join(', '))}` : ''}${p.completionPercent ? `<br><small>Starter details completeness: ${escapeHtml(String(p.completionPercent))}%</small>` : ''}</li>`).join('') || '<li>No verified form path selected yet. A Human Review Specialist can still organize the file.</li>';
    const privateToken = (c.continuationLink||'').split('case=')[1] || c.id;
    const packageUrl = `/api/cases/${encodeURIComponent(privateToken)}/review-package`;
    const draftUrl = `/api/cases/${encodeURIComponent(privateToken)}/draft-package`;
    const actionNeeded = c.userActionNeeded || c.userFacingNote ? `<section class="card alert"><h4>Message from Smarter Justice</h4>${c.userActionNeeded ? `<p><strong>Action needed:</strong> ${escapeHtml(c.userActionNeeded)}</p>` : ''}${c.userFacingNote ? `<p>${escapeHtml(c.userFacingNote)}</p>` : ''}</section>` : '';
    const evalBox = c.formPathEvaluation ? `<div class="mini-card"><strong>Starter details completeness</strong><br>${escapeHtml(String(c.formPathEvaluation.completionPercent || 0))}%<br><small>${escapeHtml(c.formPathEvaluation.userMessage || c.formPathEvaluation.reviewerStatus || '')}</small></div>` : '';
    return `<div class="case-overview"><div><h3>${escapeHtml(c.practiceName)}${c.subcategory?' — '+escapeHtml(c.subcategory):''}</h3><p>${statusPill(c.status)} ${statusPill('Human review: '+c.humanReviewLane)} ${statusPill('Professional review: '+c.professionalReviewLane)}</p></div><div class="mini-card"><strong>Form readiness</strong><br>${escapeHtml(c.analysis?.formReadiness?.label || 'Worksheet first')}<br><small>${escapeHtml(c.analysis?.formReadiness?.userMeaning || '')}</small></div>${evalBox}</div>${actionNeeded}<div class="dashboard-grid"><section><h4>Status</h4><p><strong>Payment:</strong> ${escapeHtml(c.paymentStatus)}</p><p><strong>Delivery:</strong> ${escapeHtml(c.deliveryStatus || 'not ready for delivery')}</p><p><strong>Private continuation link:</strong><br><a href="${escapeHtml(c.continuationLink)}">${escapeHtml(c.continuationLink)}</a></p><form data-email-link="${escapeHtml((c.continuationLink||'').split('case=')[1] || c.id)}"><label>Email my private link<input type="email" name="email" value="${escapeHtml(c.email||'')}" placeholder="you@example.com"></label><button class="secondary">Email link</button><span class="fine-print" data-email-link-result></span></form><p><a class="button secondary" href="${escapeHtml(packageUrl)}" target="_blank" rel="noopener">Open organized review package</a></p><p><a class="button secondary" href="${escapeHtml(draftUrl)}" target="_blank" rel="noopener">Open form-draft starter package</a></p><p><strong>Form-draft status:</strong> ${escapeHtml(c.formDraftStatus || 'not generated yet')}</p></section><section><h4>State/local details</h4><p>${escapeHtml([c.jurisdiction?.city,c.jurisdiction?.county,c.jurisdiction?.state].filter(Boolean).join(', ') || 'Not provided yet')}</p><p><strong>Document type:</strong> ${escapeHtml(c.documentType || 'Not selected')}</p><p><strong>Deadline/date:</strong> ${escapeHtml(c.deadlineDate || c.futureLeadFieldsCaptured?.deadlineDate || 'Not provided')}</p></section></div><section class="card soft"><h4>Request a paid review step</h4><p class="fine-print">Use this after you want Smarter Justice support beyond the free starting file. Stripe Checkout opens only when Stripe credentials and price IDs are configured.</p><form data-checkout-form="${escapeHtml(c.id)}"><label>Review type<select name="serviceType"><option value="starter_review">Human Review Specialist starter review</option><option value="notice_review">Notice/deadline review</option><option value="form_prep">Completed-form preparation after review, where available</option><option value="tax_review">Tax professional review path</option><option value="attorney_review">Attorney/tax attorney review path</option></select></label><button class="primary">Continue to payment step</button><span class="fine-print" data-checkout-result></span></form></section><h4>Suggested verified-form path foundation</h4><ul>${paths}</ul><h4>Possible concerns that may need review</h4><ul>${concerns}</ul><h4>Suggested next steps</h4><ul>${steps}</ul>${smart?`<h4>Extra starting details</h4><ul>${smart}</ul>`:''}<h4>Official source status</h4><ul>${sources}</ul><h4>Uploads saved</h4><ul>${files}</ul>${warnings?`<div class="notice"><strong>Upload notes</strong><ul>${warnings}</ul></div>`:''}<form data-upload-more="${escapeHtml(c.id)}"><label>Add more documents<input type="file" name="attachments" multiple></label><button class="secondary">Upload to this file</button></form>`;
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
  async function submitFreeQuestion(form){
    const errors = validateStartForm(form, 'submit');
    if (errors.length) { setErrorSummary(form, errors); return; }
    setErrorSummary(form, []);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Creating your starting file...';
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
      if (!res.ok) throw new Error(res.error || 'Could not create file.');
      saveLocalCase(res.case); panel.hidden = false; panel.innerHTML = renderCase(res.case); panel.scrollIntoView({behavior:'smooth',block:'start'});
    } catch(err){ panel.hidden=false; panel.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`; }
    btn.disabled = false; btn.textContent = btn.dataset.defaultText || 'See where to start';
  }
  function initFreeQuestion(){
    $$('[data-free-question-form]').forEach(form => {
      const ref = $('#referralCodeField', form); if (ref) ref.value = qs('ref') || qs('code') || localStorage.getItem('smarterJusticeReferralCode') || '';
      const btn = form.querySelector('button[type="submit"]'); if (btn) btn.dataset.defaultText = btn.textContent;
      form.addEventListener('submit', e => { e.preventDefault(); submitFreeQuestion(form); });
    });
  }
  function initPracticeFilter(){
    const input = $('#practiceFilter'); if (!input) return;
    input.addEventListener('input', () => { const q = input.value.toLowerCase(); $$('.practice-card').forEach(card => { card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none'; }); });
    $$('[data-practice-link]').forEach(a => a.addEventListener('click', () => localStorage.setItem('smarterJusticePreferredPractice', a.dataset.practiceLink)));
  }
  function initPartnerForms(){
    const form = $('#partnerForm');
    if (form) form.addEventListener('submit', async e => { e.preventDefault(); const data = Object.fromEntries(new FormData(form).entries()); const res = await fetch('/api/community-partners/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()); const panel=$('#partnerResult'); panel.hidden=false; if(res.ok){ localStorage.setItem('smarterJusticeReferralCode', res.partner.code); panel.innerHTML=`<h3>Community Partner code created</h3><p><strong>${escapeHtml(res.partner.code)}</strong></p><p><a href="${escapeHtml(res.partner.dashboardUrl)}">Open partner dashboard</a></p><p><a href="${escapeHtml(res.partner.flyerUrl)}">Open tracked flyer</a></p>`;} else panel.textContent=res.error||'Could not create code.'; });
    const lookup = $('#partnerLookupForm');
    if (lookup) lookup.addEventListener('submit', async e => { e.preventDefault(); const code = $('#partnerCodeInput').value.trim(); if (!code) return; const res = await fetch('/api/community-partners/'+encodeURIComponent(code)).then(r=>r.json()); const panel=$('#partnerDashboard'); panel.hidden=false; if(res.ok){ const url = location.origin + '/?ref=' + encodeURIComponent(code); const starts=res.referredStarts||[]; $('#qrPreview').src = '/api/qr?data=' + encodeURIComponent(url); panel.innerHTML=`<h3>${escapeHtml(res.partner.name)}</h3><p><strong>Code:</strong> ${escapeHtml(code)}</p><div class="dashboard-grid"><div class="mini-card"><strong>${starts.length}</strong><br>Started files</div><div class="mini-card"><strong>${starts.filter(c=>/paid|payment step|waived/i.test(c.paymentStatus||'')).length}</strong><br>Paid/credited files</div><div class="mini-card"><strong>${starts.filter(c=>/review|priority/i.test(c.humanReviewLane||'')).length}</strong><br>Review recommended</div></div><p><a href="/partner-flyer.html?code=${encodeURIComponent(code)}">Open printable flyer</a></p><h4>Recent referred starts</h4>${starts.length?starts.map(c=>`<p><strong>${escapeHtml(c.practiceName)}</strong> · ${escapeHtml(c.status)}<br><small>${escapeHtml(c.createdAt)}</small></p>`).join(''):'<p>No starts yet.</p>'}`;} else panel.textContent=res.error||'Not found.'; });
    if ($('#flyerQr')) { const code = qs('code') || 'SmarterJustice'; const url = location.origin + '/?ref=' + encodeURIComponent(code); $('#flyerQr').src = '/api/qr?data=' + encodeURIComponent(url); }
    if (qs('code') && $('#partnerCodeInput')) { $('#partnerCodeInput').value = qs('code'); }
  }
  function initContact(){
    const form = $('#contactForm'); if (!form) return;
    form.addEventListener('submit', async e => { e.preventDefault(); const data = Object.fromEntries(new FormData(form).entries()); data.page = location.pathname; const res = await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json()); const panel=$('#contactResult'); panel.hidden=false; panel.innerHTML = res.ok ? '<h3>Message saved</h3><p>Smarter Justice support has your request.</p>' : `<p>${escapeHtml(res.error||'Could not send.')}</p>`; });
  }
  async function loadCase(id){ const res = await fetch('/api/cases/'+encodeURIComponent(id)).then(r=>r.json()); const panel = $('#caseResult'); panel.hidden=false; panel.innerHTML = res.ok ? renderCase(res.case) : `<p>${escapeHtml(res.error||'File not found.')}</p>`; if(res.ok) saveLocalCase(res.case); }
  function initDashboard(){
    const local = $('#localCases'); if (local) { const arr = JSON.parse(localStorage.getItem('smarterJusticeCases') || '[]'); local.innerHTML = arr.length ? arr.map(c=>`<article class="mini-card"><a href="/dashboard.html?case=${encodeURIComponent(c.token||c.id)}"><strong>${escapeHtml(c.title||'Smarter Justice file')}</strong></a><br><small>${escapeHtml(c.status||'Started')} · ${escapeHtml(c.createdAt||'')}</small></article>`).join('') : '<div class="empty-state"><strong>No saved files on this browser yet.</strong><p>Start free or upload a notice to create your first private file.</p><p><a class="primary" href="/#start">Start Free</a> <a class="secondary" href="/upload-notice.html">Upload Notice</a></p></div>'; }
    const form = $('#caseLookupForm'); if (form) form.addEventListener('submit', e => { e.preventDefault(); const id = $('#caseIdInput').value.trim(); if(id) loadCase(id); });
    const id = qs('case'); if (id && $('#caseIdInput')) { $('#caseIdInput').value=id; loadCase(id); }
    document.addEventListener('submit', async e => { const f = e.target.closest('[data-upload-more]'); if (!f) return; e.preventDefault(); const id=f.dataset.uploadMore; const files = Array.from(f.querySelector('input[type="file"]').files || []); const attachments=[]; for (const file of files.slice(0,6)) { if(file.size > 8*1024*1024){ alert('One file was over 8 MB and was skipped: '+file.name); continue; } attachments.push(await fileToBase64(file)); } const res = await fetch(`/api/cases/${encodeURIComponent(id)}/upload`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({attachments})}).then(r=>r.json()); if(res.ok) $('#caseResult').innerHTML = renderCase(res.case); });
    document.addEventListener('submit', async e => { const f = e.target.closest('[data-email-link]'); if(!f) return; e.preventDefault(); const token=f.dataset.emailLink; const out=f.querySelector('[data-email-link-result]'); out.textContent='Saving request...'; const body=Object.fromEntries(new FormData(f).entries()); const res=await fetch(`/api/cases/${encodeURIComponent(token)}/email-link`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json()); out.textContent=res.ok ? (res.message || 'Request saved.') : (res.error || 'Could not save.'); });
  }
  function renderAdminCase(c, token){
    const choices = {
      status:['Started — organized file created','Human review in progress','More information needed','Waiting for user','Professional review recommended','Payment link sent','Payment received — review/delivery step in progress','Ready for delivery after review','Delivered','Closed'],
      humanReviewLane:['recommended','priority human review recommended','in progress','more information needed','organized starter file approved','completed-form draft not available yet','ready for professional review'],
      professionalReviewLane:['not_required_yet','attorney review may be recommended or required','tax attorney or CPA/enrolled-agent/accountant review recommended','CPA/enrolled-agent/accountant review may be helpful','attorney, CPA, accountant, or filing professional review may be recommended','attorney or qualified professional review may be recommended'],
      paymentStatus:['not requested yet','payment step requested','payment link created','paid via Stripe Checkout','paid via Stripe webhook','paid','waived','refunded/not applicable','payment failed or incomplete','payment session expired'],
      deliveryStatus:['not ready for delivery','starter file ready','worksheet ready','review package ready','form-draft starter package ready','completed forms not available yet','ready for delivery after review','delivered'],
      formDraftStatus:['not generated yet','starter facts incomplete','starter draft package generated','ready for Human Review Specialist check','ready for professional review','not safe to prepare completed forms yet','completed-form draft not available yet'],
      userActionNeeded:['','Need one more document','Need clearer deadline/date','Need state/county/court details','Need payment step','Need signature/review confirmation','No action needed right now']
    };
    const select = (name,val) => `<select name="${name}">${choices[name].map(x=>`<option ${x===val?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select>`;
    const loc = [c.jurisdiction?.city,c.jurisdiction?.county,c.jurisdiction?.state].filter(Boolean).join(', ') || 'Not provided';
    const missing = (c.formPathEvaluation?.missingFieldLabels || c.missingInformation || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('') || '<li>No missing starter details listed yet.</li>';
    return `<article class="card admin-case" data-practice="${escapeHtml(c.practiceSlug||'')}" data-status="${escapeHtml(c.status||'')}" data-review="${escapeHtml((c.humanReviewLane||'')+' '+(c.professionalReviewLane||''))}"><h4>${escapeHtml(c.practiceName)} — ${escapeHtml(c.subcategory||'')}</h4><p><strong>Created:</strong> ${escapeHtml(c.createdAt)}</p><p><strong>State/local:</strong> ${escapeHtml(loc)}</p><p><strong>Uploads:</strong> ${(c.attachments||[]).length} · <strong>Deadline:</strong> ${escapeHtml(c.deadlineDate || c.futureLeadFieldsCaptured?.deadlineDate || 'Not provided')}</p><p><strong>Payment:</strong> ${escapeHtml(c.paymentStatus)} ${c.paymentConfirmedAt ? ' · confirmed '+escapeHtml(c.paymentConfirmedAt) : ''}</p><details><summary>Starting point and form readiness</summary><p>${escapeHtml(c.analysis?.plainLanguageStartingPoint || '')}</p><p><strong>${escapeHtml(c.analysis?.formReadiness?.label || 'Worksheet first')}</strong> — ${escapeHtml(c.analysis?.formReadiness?.userMeaning || '')}</p><p><strong>Starter details completeness:</strong> ${escapeHtml(String(c.formPathEvaluation?.completionPercent || 0))}%</p><ul>${missing}</ul><ul>${(c.analysis?.concerns||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></details><form data-admin-update="${escapeHtml(c.id)}" data-admin-token="${escapeHtml(token)}"><label>Customer-visible status${select('status',c.status)}</label><label>Human Review Specialist lane${select('humanReviewLane',c.humanReviewLane)}</label><label>Attorney/professional review lane${select('professionalReviewLane',c.professionalReviewLane)}</label><div class="form-grid two"><label>Payment status${select('paymentStatus',c.paymentStatus)}</label><label>Delivery status${select('deliveryStatus',c.deliveryStatus || 'not ready for delivery')}</label></div><label>Form-draft package status${select('formDraftStatus',c.formDraftStatus || 'not generated yet')}</label><label>User action needed${select('userActionNeeded',c.userActionNeeded || '')}</label><label>Message the user can see<textarea name="userFacingNote" maxlength="2500" data-maxlength="2500" rows="3" placeholder="Example: Please upload the full notice, including all pages and the envelope if available.">${escapeHtml(c.userFacingNote || '')}</textarea><span class="counter">2500 characters left</span></label><label>Private staff note<textarea name="staffNote" maxlength="2500" data-maxlength="2500" rows="3" placeholder="Add a private internal note"></textarea><span class="counter">2500 characters left</span></label><button class="secondary">Save status update</button><span class="fine-print" data-update-result></span></form></article>`;
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
      const res = await fetch('/api/admin/cases?token='+encodeURIComponent(token)).then(r=>r.json());
      const panel=$('#adminQueue'); panel.hidden=false;
      if(!res.ok){ panel.textContent = res.error || 'Could not load.'; return; }
      const practiceOptions = practices.map(p=>`<option value="${escapeHtml(p.slug)}">${escapeHtml(p.name)}</option>`).join('');
      panel.innerHTML = `<h3>Human Review Specialist workbench</h3><div class="admin-tools"><label>Filter by practice<select id="adminPracticeFilter"><option value="">All practices</option>${practiceOptions}</select></label><label>Search status, deadline, name, or note<input id="adminTextFilter" placeholder="Search queue"></label><label>Needs attention<select id="adminNeedsFilter"><option value="">All files</option><option value="attention">More information, deadline, payment, or delivery step</option></select></label></div><div class="dashboard-grid"><div class="mini-card"><strong>${res.cases.length}</strong><br>Total files</div><div class="mini-card"><strong>${res.cases.filter(c=>/priority|deadline/i.test((c.humanReviewLane||'')+(c.analysis?.concerns||[]).join(' '))).length}</strong><br>Priority/review signals</div><div class="mini-card"><strong>${(res.partners||[]).length}</strong><br>Community Partners</div></div>${res.cases.map(c=>renderAdminCase(c, token)).join('') || '<p>No cases yet.</p>'}<h3>Notifications</h3>${res.notifications.map(n=>`<p><strong>${escapeHtml(n.kind)}</strong> ${escapeHtml(n.createdAt)}</p>`).join('') || '<p>No notifications yet.</p>'}<h3>Recent admin activity</h3>${(res.auditLog||[]).slice(0,30).map(a=>`<p><strong>${escapeHtml(a.action)}</strong> ${escapeHtml(a.createdAt)} ${a.caseId ? ' · '+escapeHtml(a.caseId) : ''}</p>`).join('') || '<p>No activity yet.</p>'}<h3>Community Partners</h3>${(res.partners||[]).map(p=>`<p><strong>${escapeHtml(p.code)}</strong> — ${escapeHtml(p.name)} · ${escapeHtml(p.email||'')}</p>`).join('') || '<p>No partners yet.</p>'}`;
      initCounters(); $('#adminPracticeFilter')?.addEventListener('change', filterAdminCases); $('#adminTextFilter')?.addEventListener('input', filterAdminCases); $('#adminNeedsFilter')?.addEventListener('change', filterAdminCases);
    }
    form.addEventListener('submit', async e => { e.preventDefault(); const token = new FormData(form).get('token'); await loadQueue(token); });
    document.addEventListener('submit', async e => {
      const f = e.target.closest('[data-admin-update]'); if(!f) return;
      e.preventDefault(); const token = f.dataset.adminToken || activeToken; const id = f.dataset.adminUpdate; const body = Object.fromEntries(new FormData(f).entries());
      const out = f.querySelector('[data-update-result]'); out.textContent = 'Saving...';
      const res = await fetch('/api/admin/cases/'+encodeURIComponent(id)+'?token='+encodeURIComponent(token), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }).then(r=>r.json());
      out.textContent = res.ok ? 'Saved.' : (res.error || 'Could not save.');
    });
  }
  function initCheckout(){
    document.addEventListener('submit', async e => {
      const f = e.target.closest('[data-checkout-form]'); if(!f) return;
      e.preventDefault();
      const out = f.querySelector('[data-checkout-result]');
      const btn = f.querySelector('button');
      const caseId = f.dataset.checkoutForm;
      const body = Object.fromEntries(new FormData(f).entries());
      body.caseId = caseId;
      if(out) out.textContent = 'Creating payment step...';
      if(btn) btn.disabled = true;
      try {
        const res = await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());
        if(!res.ok) throw new Error(res.error || 'Payment step could not be created.');
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
        const res = await fetch('/api/launch-readiness?token='+encodeURIComponent(token)).then(r=>r.json());
        if(!res.ok) throw new Error(res.error || 'Could not load checklist.');
        const items = res.checklist.items.map(item => `<li><strong>${item.ok ? 'Ready' : 'Needs work'}:</strong> ${escapeHtml(item.message)}</li>`).join('');
        panel.innerHTML = `<h3>${res.checklist.readyForPaidTraffic ? 'Ready for configured pilot traffic' : 'Not ready for broad paid traffic yet'}</h3><p><strong>Storage mode:</strong> ${escapeHtml(res.checklist.storageMode)}</p><ul>${items}</ul>`;
      } catch(err){ panel.innerHTML = `<p class="error">${escapeHtml(err.message)}</p>`; }
    });
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
  function initNav(){ const b = $('[data-nav-toggle]'), nav = $('[data-nav]'); if (b && nav) b.addEventListener('click', () => { nav.classList.toggle('open'); b.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false'); }); }
  const originalText = new WeakMap();
  const esMap = new Map(Object.entries({
    'Home':'Inicio','How It Works':'Cómo funciona','Practice Areas':'Áreas de ayuda','Upload Notice':'Subir aviso','Pricing':'Precios','Referral Program':'Programa de referidos','Community Partner Tools':'Herramientas para Community Partners','Review Options':'Opciones de revisión','FAQ':'Preguntas frecuentes','Contact':'Contacto','Dashboard':'Panel',
    'Start with a free question':'Empiece con una pregunta gratis','Start Free':'Empiece gratis','Upload a Notice':'Subir un aviso','Create my private starting file':'Crear mi archivo privado inicial','What happens next?':'¿Qué pasa después?','Pricing':'Precios','Use plain language. You do not need to know the correct legal category.':'Use lenguaje sencillo. No necesita saber la categoría legal correcta.','What happened or what do you need help with?':'¿Qué pasó o con qué necesita ayuda?','Your name':'Su nombre','Email':'Correo electrónico','Phone':'Teléfono','ZIP code':'Código postal','Urgency':'Urgencia','See where to start':'Vea por dónde empezar','Create code':'Crear código','Open dashboard':'Abrir panel','Load queue':'Cargar fila','Notice/deadline details':'Detalles del aviso o fecha límite','Agency, court, company, or office':'Agencia, tribunal, compañía u oficina','Privacy':'Privacidad','Terms':'Términos','Disclaimer':'Aviso legal','Security':'Seguridad',
    'Smarter Justice':'Smarter Justice','Private support service. Not a law firm. Not the government. No guaranteed outcomes.':'Servicio privado de apoyo. No es un bufete de abogados. No es el gobierno. No garantiza resultados.'
  }));
  function translatePage(es){
    const h = $('[data-i18n="home_h1"]');
    if(h) h.textContent = es ? 'Un primer paso más sencillo cuando una carta, formulario, fecha límite o problema legal se siente confuso.' : 'A simpler first step when a notice, form, deadline, or legal problem feels confusing.';
    const lead = $('.hero .lead');
    if(lead) lead.textContent = es ? 'Haga una pregunta gratis, suba un documento si tiene uno, y Smarter Justice le ayuda a organizar por dónde empezar. La revisión humana y la revisión de un abogado, CPA, agente inscrito, contador, abogado fiscal u otro profesional pueden recomendarse cuando sea necesario.' : 'Ask a free question, upload a document if you have one, and Smarter Justice helps organize where to start. Human review and attorney, CPA, enrolled-agent, accountant, tax attorney, or other professional review can be recommended when needed.';
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
  document.addEventListener('DOMContentLoaded', async () => { initNav(); initLanguage(); initCounters(); initStepForms(); await loadPractices(); initFreeQuestion(); initPracticeFilter(); initPartnerForms(); initContact(); initDashboard(); initAdmin(); initCheckout(); initCheckoutStatus(); initLaunchReadiness(); });
})();
