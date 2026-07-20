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
  function renderCase(c){
    if (!c) return '<p>File not found.</p>';
    const concerns = (c.analysis?.concerns || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('') || '<li>No immediate concern detected yet.</li>';
    const steps = (c.analysis?.nextSteps || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('') || '<li>Continue adding any important dates or documents.</li>';
    const sources = (c.analysis?.catalogSummary || []).map(s=>`<li><strong>${escapeHtml(s.sourceName)}</strong> — ${escapeHtml(s.readinessLabel || 'Source check needed')} <small>${escapeHtml(s.jurisdiction || '')}</small></li>`).join('') || '<li>No official source has been selected yet.</li>';
    const smart = Object.entries(c.smartAnswers || {}).filter(([,v]) => v).map(([k,v]) => `<li><strong>${escapeHtml(k.replace(/([A-Z])/g,' $1'))}:</strong> ${escapeHtml(v)}</li>`).join('');
    const files = (c.attachments || []).map(a => `<li>${escapeHtml(a.originalName || a.name)} <small>${escapeHtml(a.documentType || a.mimeType || '')} · ${Math.round((a.sizeBytes||0)/1024)} KB · ${escapeHtml(visibleUploadState(a.uploadState))}</small></li>`).join('') || '<li>No uploads yet.</li>';
    const warnings = (c.uploadWarnings || []).map(x => `<li>${escapeHtml(x)}</li>`).join('');
    const paths = (c.verifiedFormPaths || c.analysis?.verifiedFormPaths || []).map(p => `<li><strong>${escapeHtml(p.title)}</strong><br><small>${escapeHtml(p.deliveryType || 'A source-checked worksheet may be prepared after review.')}</small>${(p.missingFieldLabels||p.missingFields||[]).length ? `<br><em>Helpful missing details:</em> ${escapeHtml((p.missingFieldLabels||p.missingFields).join(', '))}` : ''}</li>`).join('') || '<li>No specific official-form path has been selected yet. A Human Review Specialist can still organize the starting file.</li>';
    const privateToken = caseAccessToken(c);
    const packageUrl = `/api/cases/${encodeURIComponent(privateToken)}/review-package`;
    const draftUrl = `/api/cases/${encodeURIComponent(privateToken)}/draft-package`;
    const reviewReadyDraftUrl = `/api/cases/${encodeURIComponent(privateToken)}/review-ready-draft`;
    const actionNeeded = c.userActionNeeded || c.userFacingNote ? `<section class="card alert"><h4>Message from Smarter Justice</h4>${c.userActionNeeded ? `<p><strong>Action needed:</strong> ${escapeHtml(c.userActionNeeded)}</p>` : ''}${c.userFacingNote ? `<p>${escapeHtml(c.userFacingNote)}</p>` : ''}</section>` : '';
    const readinessPercent = c.formPathEvaluation?.completionPercent || c.reviewReadyDraft?.completionPercent || 0;
    const evalBox = `<div class="mini-card"><strong>Starting information</strong><br>${escapeHtml(String(readinessPercent))}% complete<br><small>You can add details later.</small></div>`;
    const matter = c.matterPath || c.analysis?.matterPath || null;
    const matterTimeline = matter?.timeline?.length ? `<section class="card soft"><h4>Where this appears to be in the process</h4><ol class="timeline">${matter.timeline.map(item=>`<li class="${item.isCurrent?'current':''}"><strong>${escapeHtml(item.name)}</strong><br><small>${escapeHtml(item.status)}</small></li>`).join('')}</ol></section>` : '';
    const missingPath = (matter?.dynamicMissingInformation || c.dynamicMissingInformation || []).map(x=>`<li>${escapeHtml(x.label || x)}</li>`).join('') || '<li>No additional details are listed right now.</li>';
    const nextPath = matter ? `<section class="card highlighted"><p class="eyebrow">Recommended next step</p><h4>${escapeHtml(matter.userNextPathTitle || matter.stageName || 'Organized starting file')}</h4><p>${escapeHtml(matter.userNextPathSummary || '')}</p><p><strong>Starting information ready:</strong> ${escapeHtml(String(matter.formReadinessScore || 0))}%</p><details><summary>Helpful missing details</summary><ul>${missingPath}</ul></details></section>` : '';
    const aiBox = c.aiReview || c.analysis?.aiReview ? `<section class="card soft"><h4>AI-assisted starting summary</h4><p>${escapeHtml((c.aiReview || c.analysis.aiReview).plainLanguageSummary || '')}</p><p class="fine-print">This summary helps organize the starting point. It is not legal or tax advice.</p></section>` : '';
    const portal = c.recommendedPortal || c.analysis?.recommendedPortal || null;
    const portalOpen = portalCanOpen(portal);
    const portalBox = portal ? `<section class="card highlighted"><p class="eyebrow">Recommended focused portal</p><h4>${escapeHtml(portal.name || 'Smarter Justice General Start')}</h4><p>${escapeHtml(portal.userRouteMessage || portal.summary || '')}</p><p>${statusPill(portal.status || 'Available Now')}</p>${portalOpen ? `<p><a class="secondary link-btn" href="${escapeHtml(portal.publicUrl)}">Open focused portal</a></p>` : '<p class="fine-print">You can continue privately through Smarter Justice while this focused portal is being prepared.</p>'}<p class="fine-print">Focused portals may have separate terms, pricing, and review options.</p></section>` : '';
    const missingDraftFields = (c.reviewReadyDraft?.missingRequiredFields || []).slice(0,8);
    const draftDetailForm = missingDraftFields.length ? `<section class="card highlighted"><h4>Add helpful details</h4><p class="fine-print">These answers can make a future draft or worksheet easier to review. Human Review Specialist review is still required.</p><form data-draft-details="${escapeHtml(privateToken)}"><div class="form-grid two">${missingDraftFields.map(f=>`<label>${escapeHtml(f.label || f.key)}<input name="${escapeHtml(f.key || f.label)}" placeholder="Add if known"></label>`).join('')}</div><button class="secondary">Save details</button><span class="fine-print" data-draft-details-result></span></form></section>` : '';
    const deliveryGate = c.reviewReadyDraft?.deliveryBlockers?.length ? `<section class="card soft"><h4>Before a draft can be provided for your review</h4><ul>${c.reviewReadyDraft.deliveryBlockers.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></section>` : '';
    return `<div class="case-overview"><div><h3>${escapeHtml(c.practiceName)}${c.subcategory?' — '+escapeHtml(c.subcategory):''}</h3><p>${statusPill(friendlyStatus(c.status))} ${statusPill('Human Review Specialist: '+friendlyStatus(c.humanReviewLane))} ${statusPill('Professional review: '+friendlyStatus(c.professionalReviewLane))}</p></div>${evalBox}</div>${portalBox}${nextPath}${matterTimeline}${aiBox}${actionNeeded}${deliveryGate}${draftDetailForm}<div class="dashboard-grid"><section><h4>Your file</h4><p><strong>Payment:</strong> ${escapeHtml(friendlyStatus(c.paymentStatus))}</p><p><strong>Document delivery:</strong> ${escapeHtml(friendlyStatus(c.deliveryStatus || 'not ready yet'))}</p><p><strong>Private continuation link:</strong><br><a href="${escapeHtml(c.continuationLink)}">Open this private file</a></p><form data-email-link="${escapeHtml(privateToken)}"><label>Email my private link<input type="email" name="email" value="${escapeHtml(c.email||'')}" placeholder="you@example.com"></label><button class="secondary">Email link</button><span class="fine-print" data-email-link-result></span></form><p><a class="button secondary" href="${escapeHtml(packageUrl)}" target="_blank" rel="noopener">Open organized starting summary</a></p><p><a class="button secondary" href="${escapeHtml(draftUrl)}" target="_blank" rel="noopener">Open form information worksheet</a></p><p><a class="button secondary" href="${escapeHtml(reviewReadyDraftUrl)}" target="_blank" rel="noopener">Open available draft details</a></p><p><strong>Draft review status:</strong> ${escapeHtml(friendlyStatus(c.reviewReadyDraftStatus || 'not reviewed yet'))}</p></section><section><h4>State and document details</h4><p>${escapeHtml([c.jurisdiction?.city,c.jurisdiction?.county,c.jurisdiction?.state].filter(Boolean).join(', ') || 'Not provided yet')}</p><p><strong>Document type:</strong> ${escapeHtml(c.documentType || 'Not selected')}</p><p><strong>Deadline/date:</strong> ${escapeHtml(c.deadlineDate || c.futureLeadFieldsCaptured?.deadlineDate || 'Not provided')}</p></section></div><section class="card soft"><h4>Ask about a paid review option</h4><p class="fine-print">Choose the type of support you are interested in. Available services and prices must be confirmed before payment.</p><form data-checkout-form="${escapeHtml(privateToken)}"><label>Review type<select name="serviceType"><option value="starter_review">Human Review Specialist review</option><option value="notice_review">Notice or deadline review</option><option value="form_prep">Completed-form preparation after review, where available</option><option value="tax_review">Tax professional review</option><option value="attorney_review">Attorney or tax-attorney review</option></select></label><button class="primary">Continue</button><span class="fine-print" data-checkout-result></span></form></section><h4>Possible official-form path</h4><ul>${paths}</ul><h4>Possible concerns that may need review</h4><ul>${concerns}</ul><h4>Suggested next steps</h4><ul>${steps}</ul>${smart?`<h4>Extra starting details</h4><ul>${smart}</ul>`:''}<h4>Official sources to confirm</h4><ul>${sources}</ul><h4>Documents saved</h4><ul>${files}</ul>${warnings?`<div class="notice"><strong>Upload notes</strong><ul>${warnings}</ul></div>`:''}<form data-upload-more="${escapeHtml(privateToken)}"><label>Add more documents<input type="file" name="attachments" multiple></label><button class="secondary">Upload to this file</button></form>`;
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
      saveLocalCase(res.case); panel.hidden = false; panel.innerHTML = `<section class="card success"><h3>Your starting file was created</h3><p>Next, review your likely next step and save your private continuation link.</p><p><a class="primary" href="/next-path.html?case=${encodeURIComponent((res.case.continuationLink||'').split('case=')[1] || res.case.id)}">Review my next step</a> <a class="secondary" href="${escapeHtml(res.case.continuationLink)}">Open dashboard</a></p></section>` + renderCase(res.case); panel.scrollIntoView({behavior:'smooth',block:'start'});
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
        const res = await fetch('/api/launch-readiness',{headers:{'X-Admin-Token':token}}).then(r=>r.json());
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
  function renderControlSystemReadiness(readiness){
    const items=readiness?.items || []; const passing=items.filter(x=>x.ok).length;
    return `<div class="section-heading"><div><p class="eyebrow">Smarter Justice deployment foundation</p><h2>System launch-readiness snapshot</h2></div><span class="status-pill">${passing} of ${items.length} checks currently satisfied</span></div><p>${readiness?.readyForPaidTraffic ? 'The configured checklist currently reports ready for paid traffic. A final legal, security, deployment, and user-acceptance review is still required.' : 'This development package is not yet configured for broad paid traffic. The Control Center tracks the missing production foundations without exposing secret values.'}</p><div class="control-readiness-list">${items.map(item=>`<div class="control-readiness-item ${item.ok?'ready':'needs-work'}"><strong>${item.ok?'Ready':'Needs work'}</strong><span>${escapeHtml(item.message || item.key)}</span></div>`).join('')}</div>`;
  }
  function renderControlGovernance(governance){
    return `<div class="section-heading"><div><p class="eyebrow">Shared coordination standard</p><h2>${escapeHtml(governance.title || 'Smarter Justice Shared Platform Standard')}</h2></div><span class="status-pill">Defaults with documented flexibility</span></div><p>${escapeHtml(governance.purpose || '')}</p><div class="control-governance-grid"><div><h3>Master coordination covers</h3><ul>${(governance.masterCoordinationScope || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div><div><h3>A specialty portal may adapt when</h3><ul>${(governance.deviationPolicy?.reasons || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div></div><div class="notice"><strong>${escapeHtml(governance.deviationPolicy?.principle || 'Shared standards are strong defaults, not inflexible rules.')}</strong><p>A portal may deliberately adapt them when that produces a safer, clearer, more accurate, more compliant, or more useful specialty experience. The shared default, reason, scope, risk, and expected benefit should be recorded. Privacy, security, truthful language, source verification, professional boundaries, and legal/compliance safeguards cannot be weakened.</p></div><details class="details-card"><summary>Future shared-system roadmap to preserve</summary><ul>${(governance.futureControlCenterRoadmap || []).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></details>`;
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
      const groups=(registry.categories||[]).map(category=>({category,items:capabilities.filter(item=>item.category===category)}));
      return `<div class="section-heading"><div><p class="eyebrow">Cross-portal learning</p><h2>Capability Registry and Success Pattern Library</h2></div><span class="status-pill">Version ${escapeHtml(registry.version||'')} · ${capabilities.length} capabilities</span></div><p>This matrix records the strongest known reference implementation and evidence status without forcing every specialty portal to work the same way.</p><div class="card-actions"><button class="secondary" id="downloadCapabilityRegistry" type="button">Download Full Registry JSON</button></div><div class="capability-registry-groups">${groups.map(group=>`<details class="details-card"><summary>${escapeHtml(friendlyStatus(group.category))} — ${group.items.length}</summary><div class="table-scroll"><table><thead><tr><th>Capability</th><th>Best reference</th><th>Version</th><th>Evidence</th><th>Shared core</th></tr></thead><tbody>${group.items.map(item=>`<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.bestReferencePortal)}</td><td>${escapeHtml(item.bestReferenceVersion)}</td><td>${escapeHtml(friendlyStatus(item.evidenceStatus))}</td><td>${item.sharedCoreCandidate?'Candidate':'Specialty-specific'}</td></tr>`).join('')}</tbody></table></div></details>`).join('')}</div><details class="details-card"><summary>Proven and emerging success patterns</summary>${(registry.successPatterns||[]).map(item=>`<article class="marketplace-item"><h3>${escapeHtml(item.name)}</h3><p><strong>${escapeHtml(item.originPortal)} ${escapeHtml(item.originVersion)}</strong> · ${escapeHtml(friendlyStatus(item.status))}</p><p>${escapeHtml(item.value)}</p><p class="fine-print">Reuse guidance: ${escapeHtml(item.reuse)}</p></article>`).join('')}</details>`;
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
      return `<article class="marketplace-record"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(account.accountType||'professional')} account</p><h3>${escapeHtml(account.displayName||account.email)}</h3></div>${statusPill(account.status||'active')}</div><p>${escapeHtml(account.email||'')}</p><p><strong>Profiles:</strong> ${escapeHtml(professionals.map(x=>x.displayName).join(', ')||'None')}</p><p><strong>Firms:</strong> ${escapeHtml(firms.map(x=>x.name).join(', ')||'None')}</p><p class="fine-print">Membership target: ${escapeHtml(account.membershipTarget?.kind||'not selected')} ${escapeHtml(account.membershipTarget?.id||'')}</p>${pendingForms||'<p class="fine-print">No pending profile-control claims.</p>'}</article>`;
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
      return `<article class="marketplace-record"><div class="section-heading"><div><p class="eyebrow">Firm record</p><h3>${escapeHtml(firm.name)}</h3></div>${statusPill(firm.profileStatus)}</div><p>${escapeHtml((firm.jurisdictions||[]).join(', ') || 'No jurisdiction recorded')}</p><p><strong>Seats:</strong> ${escapeHtml(String(firm.seatCount||1))} · <strong>Discount:</strong> ${escapeHtml(String(quote.discountPercent||0))}% · <strong>Illustrative monthly total:</strong> ${money(quote.monthlyTotalCents)}</p><p class="fine-print">Membership: ${escapeHtml(firm.membership?.status || 'none')} · Approval: ${escapeHtml(firm.ownerApprovalStatus || 'draft')} · Public profile enabled: ${firm.publicProfileEnabled?'yes':'no'}</p><details><summary>Firm membership and seat controls</summary><form data-firm-update="${escapeHtml(firm.id)}"><div class="form-grid three"><label>Firm plan<select name="membershipPlanId">${(marketplaceData?.membershipPlans||[]).filter(p=>['firm','enterprise'].includes(p.audience)).map(p=>`<option value="${escapeHtml(p.id)}" ${p.id===firm.membership?.planId?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></label><label>Membership status<select name="membershipStatus">${controlOptions(marketplaceData?.enums?.membershipStatuses,firm.membership?.status)}</select></label><label>Owner approval<select name="ownerApprovalStatus">${controlOptions(marketplaceData?.enums?.ownerApprovalStatuses,firm.ownerApprovalStatus)}</select></label><label>Covered seats<input name="seatCount" type="number" min="1" value="${escapeHtml(String(firm.seatCount||1))}"></label><label>Active seats<input name="activeSeatCount" type="number" min="0" value="${escapeHtml(String(firm.activeSeatCount||0))}"></label><label>Billing administrator<input name="billingAdministratorName" value="${escapeHtml(firm.billingAdministratorName||'')}"></label><label>Billing administrator email<input name="billingAdministratorEmail" type="email" value="${escapeHtml(firm.billingAdministratorEmail||'')}"></label></div><div class="control-form-actions"><button class="secondary">Save firm controls</button><span data-marketplace-result class="fine-print"></span></div></form></details></article>`;
    }
    function renderProfessionalRecord(pro={}){
      const eligibility=pro.eligibility||{};
      const facts=Object.entries(pro.publicFacts||{}).filter(([,v])=>v).map(([k,v])=>`<li><strong>${escapeHtml(friendlyStatus(k))}:</strong> ${escapeHtml(v)}</li>`).join('');
      return `<article class="marketplace-record"><div class="section-heading"><div><p class="eyebrow">${escapeHtml(pro.professionalType || 'Professional')}</p><h3>${escapeHtml(pro.displayName)}</h3></div>${statusPill(pro.profileStatus)}</div><p>${escapeHtml(pro.publicSourceDisclaimer || '')}</p>${facts?`<details><summary>Source-backed public facts</summary><ul>${facts}</ul></details>`:''}<p><strong>Portals:</strong> ${escapeHtml((pro.portalEligibility||[]).join(', ') || 'None')}</p><p><strong>Jurisdictions:</strong> ${escapeHtml((pro.jurisdictions||[]).join(', ') || 'None')}</p><p><strong>Practice areas:</strong> ${escapeHtml((pro.practiceAreas||[]).join(', ') || 'Not source-supported yet')}</p><p class="fine-print">Claim: ${escapeHtml(pro.claimStatus || '')} · Verification: ${escapeHtml(pro.verificationStatus || '')} · Membership: ${escapeHtml(pro.membership?.status || 'none')} · Owner approval: ${escapeHtml(pro.ownerApprovalStatus || '')}</p><div class="${eligibility.consultationEligible?'notice success':'notice'}"><strong>${eligibility.consultationEligible?'Eligible for configured consultations':'Not consultation eligible'}</strong><ul>${(eligibility.reasons||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div><details><summary>Owner eligibility controls</summary><form data-professional-update="${escapeHtml(pro.id)}"><div class="form-grid three"><label>Profile status<select name="profileStatus">${controlOptions(marketplaceData?.enums?.profileStatuses,pro.profileStatus)}</select></label><label>Claim status<select name="claimStatus">${controlOptions(marketplaceData?.enums?.claimStatuses,pro.claimStatus)}</select></label><label>Verification status<select name="verificationStatus">${controlOptions(marketplaceData?.enums?.verificationStatuses,pro.verificationStatus)}</select></label><label>Owner approval<select name="ownerApprovalStatus">${controlOptions(marketplaceData?.enums?.ownerApprovalStatuses,pro.ownerApprovalStatus)}</select></label><label>Membership plan<select name="membershipPlanId">${(marketplaceData?.membershipPlans||[]).map(p=>`<option value="${escapeHtml(p.id)}" ${p.id===pro.membership?.planId?'selected':''}>${escapeHtml(p.name)}</option>`).join('')}</select></label><label>Membership status<select name="membershipStatus">${controlOptions(marketplaceData?.enums?.membershipStatuses,pro.membership?.status)}</select></label></div><label>Membership period ends<input name="membershipPeriodEnd" type="datetime-local"></label><div class="form-grid three"><label><input name="marketplaceTerms" type="checkbox" ${pro.marketplaceTermsAcceptedAt?'checked':''}> Marketplace terms accepted</label><label><input name="independenceTerms" type="checkbox" ${pro.independentProfessionalAcknowledgmentAt?'checked':''}> Independence acknowledged</label><label><input name="conflictTerms" type="checkbox" ${pro.conflictsPolicyAcceptedAt?'checked':''}> Conflict policy accepted</label></div><label>Portal eligibility<select name="portalEligibility" multiple size="5">${(marketplaceData?.enums?.portalSlugs||[]).map(x=>`<option value="${escapeHtml(x)}" ${(pro.portalEligibility||[]).includes(x)?'selected':''}>${escapeHtml(x)}</option>`).join('')}</select></label><label>Jurisdictions — one per line<textarea name="jurisdictions" rows="3">${escapeHtml((pro.jurisdictions||[]).join('\n'))}</textarea></label><label>Practice areas — one per line<textarea name="practiceAreas" rows="3">${escapeHtml((pro.practiceAreas||[]).join('\n'))}</textarea></label><label>Credentials JSON<textarea name="credentials" rows="5">${escapeHtml(JSON.stringify(pro.credentials||[],null,2))}</textarea></label><label>Consultation services JSON<textarea name="consultationServices" rows="7">${escapeHtml(JSON.stringify(pro.consultationServices||[],null,2))}</textarea></label><div class="control-form-actions"><button class="secondary">Save professional controls</button><span data-marketplace-result class="fine-print"></span></div></form></details></article>`;
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
      return `<form class="marketplace-record" data-profile-request-update="${escapeHtml(req.id)}"><h4>${escapeHtml(req.requestType)} — ${escapeHtml(req.requesterName)}</h4><p>${escapeHtml(req.details || '')}</p><div class="form-grid two"><label>Status<select name="status">${controlOptions(marketplaceData?.enums?.profileRequestStatuses,req.status)}</select></label><label>Identity-verification notes<textarea name="identityVerificationNotes" rows="2">${escapeHtml(req.identityVerificationNotes||'')}</textarea></label></div><label>Resolution notes<textarea name="resolutionNotes" rows="2">${escapeHtml(req.resolutionNotes||'')}</textarea></label><div class="control-form-actions"><button class="secondary">Save request</button><span data-marketplace-result class="fine-print"></span></div></form>`;
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
      $('#professionalMarketplaceGovernance').innerHTML=renderMarketplaceGovernance(data.governance||{});
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
    async function ownerAuthStatus(){ return fetch('/api/owner/auth/status').then(r=>r.json()).catch(()=>({ok:false,authenticated:false})); }
    async function loadControlCenter(token=''){
      ownerToken=String(token || ownerToken || '').trim();
      const result=await fetch('/api/owner/control-center',{headers:headers()}).then(async r=>({status:r.status,data:await r.json()})).catch(err=>({status:0,data:{ok:false,error:err.message}}));
      if(!result.data.ok){ $('#controlCenterWorkspace').hidden=true; throw new Error(result.data.error || 'Could not open the Control Center.'); }
      if(ownerToken) sessionStorage.setItem('smarterJusticeOwnerControlToken',ownerToken); currentData=result.data;
      $('#controlCenterLoginSection').hidden=true; $('#controlCenterWorkspace').hidden=false;
      $('#controlCenterSummary').innerHTML=renderControlSummary(result.data.summary || {});
      $('#controlCenterSystemReadiness').innerHTML=renderControlSystemReadiness(result.data.systemLaunchReadiness || {});
      $('#controlCenterGovernance').innerHTML=renderControlGovernance(result.data.governance || {});
      $('#controlCenterCapabilityRegistry').innerHTML=renderCapabilityRegistry(result.data.capabilityRegistry || {});
      const auth=await ownerAuthStatus(); $('#controlCenterSecurity').innerHTML=renderOwnerSecurity(auth);
      $('#controlCenterStatusFilter').innerHTML='<option value="">All statuses</option>'+controlOptions(result.data.enums.portfolioStatuses,'');
      $('#controlCenterPriorityFilter').innerHTML='<option value="">All priorities</option>'+controlOptions(result.data.enums.priorities,'');
      $('#controlCenterPortalList').innerHTML=(result.data.portals || []).map(p=>renderControlPortal(p,result.data.enums || {})).join('');
      $('#controlCenterRulesPackSummary').innerHTML=renderRulesPackSummary(result.data.masterRulesPack || {});
      await loadMarketplace(); filterControlPortals();
    }
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
      if(e.target.closest('#downloadCapabilityRegistry')){ downloadControlArtifact('smarter-justice-cross-portal-capability-registry.json',JSON.stringify(currentData?.capabilityRegistry||{},null,2),'application/json'); return; }
      if(e.target.closest('#ownerBeginMfa')){ const result=await fetch('/api/owner/auth/mfa/begin',{method:'POST'}).then(r=>r.json()); const panel=$('#ownerMfaEnrollment'); if(!result.ok){ $('#ownerSecurityResult').textContent=result.error||'Could not begin MFA setup.'; return; } panel.hidden=false; panel.innerHTML=`<div class="notice"><strong>Add this account to your authenticator app</strong><p>Manual secret: <code class="wrap-code">${escapeHtml(result.secret)}</code></p><p class="fine-print">Authenticator URI: <code class="wrap-code">${escapeHtml(result.otpAuthUri)}</code></p></div><form id="ownerMfaConfirmForm"><label>Six-digit authenticator code<input name="code" autocomplete="one-time-code" inputmode="numeric" required></label><button class="primary">Confirm MFA</button></form>`; return; }
      if(e.target.closest('#ownerRotateRecoveryCodes')){ const form=$('#ownerRecoveryRotateForm'); if(form) form.hidden=!form.hidden; return; }
      if(e.target.closest('#ownerRevokeSessions')){ const result=await fetch('/api/owner/auth/sessions/revoke-others',{method:'POST'}).then(r=>r.json()); $('#ownerSecurityResult').textContent=result.ok?'Other owner sessions were signed out.':(result.error||'Could not revoke sessions.'); return; }
      const promptButton=e.target.closest('[data-generate-portal-prompt]');
      if(promptButton){ const slug=promptButton.dataset.generatePortalPrompt; promptButton.disabled=true; const prior=promptButton.textContent; promptButton.textContent='Generating...'; const response=await fetch('/api/owner/control-center/prompts/'+encodeURIComponent(slug),{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); promptButton.disabled=false; promptButton.textContent=prior; if(!response.ok){ alert(response.error || 'Could not generate prompt.'); return; } showArtifact({title:(promptButton.dataset.portalName || 'Portal')+' continuation prompt',kind:'Portal-specific next-chat handoff',text:response.prompt || '',filename:`${slug}-next-chat-continuation-prompt.md`,mime:'text/markdown',help:'This contains the shared Smarter Justice guidelines and the portal-specific information recorded here. Merge it with any newer, more complete portal-specific source of truth before final use.'}); return; }
      const manifestButton=e.target.closest('[data-generate-portal-manifest]');
      if(manifestButton){ const slug=manifestButton.dataset.generatePortalManifest; const response=await fetch('/api/owner/control-center/manifests/'+encodeURIComponent(slug),{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){ alert(response.error || 'Could not generate manifest.'); return; } const text=JSON.stringify(response.manifest,null,2); showArtifact({title:(manifestButton.dataset.portalName || 'Portal')+' manifest',kind:'Machine-readable portal record',text,filename:`${slug}-portal-manifest.json`,mime:'application/json',help:'This owner-generated manifest records build and portfolio status. The active portal release should still maintain and validate its own source-controlled manifest.'}); }
    });
    $('#generateMasterCoordinationPrompt')?.addEventListener('click',async()=>{ const response=await fetch('/api/owner/control-center/prompts/master',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){ alert(response.error || 'Could not generate the master prompt.'); return; } showArtifact({title:'Smarter Justice master coordination prompt',kind:'Ecosystem coordination handoff',text:response.prompt || '',filename:'smarter-justice-master-coordination-prompt.md',mime:'text/markdown',help:'Use this for shared strategy, priorities, architecture, standards, cross-portal coordination, and Control Center development—not as a substitute for a portal-specific build prompt.'}); });
    $('#exportControlCenterPortfolio')?.addEventListener('click',async()=>{ const response=await fetch('/api/owner/control-center/export',{headers:headers()}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); if(!response.ok){ alert(response.error || 'Could not export portfolio.'); return; } downloadControlArtifact('smarter-justice-control-center-portfolio.json',JSON.stringify(response,null,2),'application/json'); });
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
      const claimApproval=e.target.closest('[data-account-claim-approve]');
      if(claimApproval){ e.preventDefault(); const resultNode=claimApproval.querySelector('[data-marketplace-result]'); resultNode.textContent='Approving account control...'; const response=await fetch('/api/owner/professional-accounts/approve-profile-claim',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify({accountId:claimApproval.dataset.accountId,professionalId:claimApproval.dataset.professionalId,profileRequestId:claimApproval.dataset.profileRequestId})}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Account control approved. Credential verification, membership, and consultation eligibility remain separate.':(response.error||'Could not approve the claim.'); if(response.ok) await loadMarketplace(); return; }
      const firmClaimApproval=e.target.closest('[data-account-firm-claim-approve]');
      if(firmClaimApproval){ e.preventDefault(); const resultNode=firmClaimApproval.querySelector('[data-marketplace-result]'); resultNode.textContent='Approving firm account control...'; const response=await fetch('/api/owner/professional-accounts/approve-firm-claim',{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify({accountId:firmClaimApproval.dataset.accountId,firmId:firmClaimApproval.dataset.firmId,profileRequestId:firmClaimApproval.dataset.profileRequestId})}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Firm account control approved. Membership, credentials, services, and consultation eligibility remain separate.':(response.error||'Could not approve the firm claim.'); if(response.ok) await loadMarketplace(); return; }
      const membership=e.target.closest('[data-membership-plan]');
      if(membership){ e.preventDefault(); const resultNode=membership.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving...'; const raw=Object.fromEntries(new FormData(membership).entries()); raw.monthlyPriceCents=raw.monthlyPriceCents===''?null:Number(raw.monthlyPriceCents); raw.annualPriceCents=raw.annualPriceCents===''?null:Number(raw.annualPriceCents); raw.includedStaffSeats=raw.includedStaffSeats===''?null:Number(raw.includedStaffSeats); raw.features=splitLines(raw.features); raw.foundingPlan=membership.elements.foundingPlan.checked; const response=await fetch('/api/owner/professional-marketplace/membership-plans/'+encodeURIComponent(membership.dataset.membershipPlan),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Membership plan saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const revenue=e.target.closest('[data-revenue-program]');
      if(revenue){ e.preventDefault(); const resultNode=revenue.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving...'; const raw=Object.fromEntries(new FormData(revenue).entries()); const response=await fetch('/api/owner/professional-marketplace/revenue-programs/'+encodeURIComponent(revenue.dataset.revenueProgram),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(raw)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Revenue program saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const professional=e.target.closest('[data-professional-update]');
      if(professional){ e.preventDefault(); const resultNode=professional.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving...'; const raw=Object.fromEntries(new FormData(professional).entries()); let credentials,services; try{ credentials=JSON.parse(raw.credentials||'[]'); services=JSON.parse(raw.consultationServices||'[]'); }catch{ resultNode.textContent='Credentials and consultation services must be valid JSON.'; return; } const now=new Date().toISOString(); const body={profileStatus:raw.profileStatus,claimStatus:raw.claimStatus,verificationStatus:raw.verificationStatus,ownerApprovalStatus:raw.ownerApprovalStatus,portalEligibility:selectedValues(professional.elements.portalEligibility),jurisdictions:splitLines(raw.jurisdictions),practiceAreas:splitLines(raw.practiceAreas),credentials,consultationServices:services,membership:{planId:raw.membershipPlanId,status:raw.membershipStatus,currentPeriodEnd:raw.membershipPeriodEnd||''},marketplaceTermsAcceptedAt:professional.elements.marketplaceTerms.checked?now:'',independentProfessionalAcknowledgmentAt:professional.elements.independenceTerms.checked?now:'',conflictsPolicyAcceptedAt:professional.elements.conflictTerms.checked?now:''}; const response=await fetch('/api/owner/professional-marketplace/professionals/'+encodeURIComponent(professional.dataset.professionalUpdate),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Professional controls saved and eligibility recalculated.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
      const firm=e.target.closest('[data-firm-update]');
      if(firm){ e.preventDefault(); const resultNode=firm.querySelector('[data-marketplace-result]'); resultNode.textContent='Saving firm membership controls...'; const raw=Object.fromEntries(new FormData(firm).entries()); const now=new Date().toISOString(); const body={seatCount:Number(raw.seatCount||1),activeSeatCount:Number(raw.activeSeatCount||0),billingAdministratorName:raw.billingAdministratorName,billingAdministratorEmail:raw.billingAdministratorEmail,ownerApprovalStatus:raw.ownerApprovalStatus,membership:{planId:raw.membershipPlanId,status:raw.membershipStatus,currentPeriodEnd:raw.membershipPeriodEnd||'',seatCount:Number(raw.seatCount||1)},marketplaceTermsAcceptedAt:firm.elements.marketplaceTerms?.checked?now:'',independentProfessionalAcknowledgmentAt:firm.elements.independenceTerms?.checked?now:'',conflictsPolicyAcceptedAt:firm.elements.conflictTerms?.checked?now:''}; const response=await fetch('/api/owner/professional-marketplace/firms/'+encodeURIComponent(firm.dataset.firmUpdate),{method:'POST',headers:{'Content-Type':'application/json',...headers()},body:JSON.stringify(body)}).then(r=>r.json()).catch(err=>({ok:false,error:err.message})); resultNode.textContent=response.ok?'Firm membership and seat controls saved.':(response.error||'Could not save.'); if(response.ok) await loadMarketplace(); return; }
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

  function initNav(){ const b = $('[data-nav-toggle]'), nav = $('[data-nav]'); if (b && nav) b.addEventListener('click', () => { nav.classList.toggle('open'); b.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false'); }); }
  const originalText = new WeakMap();
  const esMap = new Map(Object.entries({
    'Home':'Inicio','How It Works':'Cómo funciona','Practice Areas':'Áreas de ayuda','Portals':'Portales','Upload Notice':'Subir aviso','Pricing':'Precios','Referral Program':'Programa de referidos','Community Partner Tools':'Herramientas para Community Partners','Review Options':'Opciones de revisión','FAQ':'Preguntas frecuentes','Contact':'Contacto','Dashboard':'Panel',
    'Start with a free question':'Empiece con una pregunta gratis','Start Free':'Empiece gratis','Choose a Portal':'Elegir un portal','Choose Portal':'Elegir portal','Ask Where to Start':'Preguntar por dónde empezar','Live — Separate Platform':'Disponible — Plataforma separada','Pilot — Start Here Now':'Piloto — Empiece aquí ahora','In Development':'En desarrollo','Coming Soon':'Próximamente','Available Now':'Disponible ahora','Upload a Notice':'Subir un aviso','Create my private starting file':'Crear mi archivo privado inicial','What happens next?':'¿Qué pasa después?','Pricing':'Precios','Use plain language. You do not need to know the correct legal category.':'Use lenguaje sencillo. No necesita saber la categoría legal correcta.','What happened or what do you need help with?':'¿Qué pasó o con qué necesita ayuda?','Your name':'Su nombre','Email':'Correo electrónico','Phone':'Teléfono','ZIP code':'Código postal','Urgency':'Urgencia','See where to start':'Vea por dónde empezar','Create code':'Crear código','Open dashboard':'Abrir panel','Load queue':'Cargar fila','Notice/deadline details':'Detalles del aviso o fecha límite','Agency, court, company, or office':'Agencia, tribunal, compañía u oficina','Privacy':'Privacidad','Terms':'Términos','Disclaimer':'Aviso legal','Security':'Seguridad',
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
  document.addEventListener('DOMContentLoaded', async () => { initNav(); initLanguage(); initCounters(); initStepForms(); await loadPractices(); await initPortalStartContext(); initFreeQuestion(); initPracticeFilter(); initPartnerForms(); initContact(); initDashboard(); initAdmin(); initCheckout(); initDraftDetails(); initCheckoutStatus(); initLaunchReadiness(); initPortalDirectory(); initPortalDetail(); initControlCenter(); initProfessionalMembershipPage(); });
})();
