(() => {
  'use strict';

  const form = document.getElementById('immigrationRouteForm');
  const story = document.getElementById('immigrationStory');
  const language = document.getElementById('immigrationLanguage');
  const counter = document.getElementById('immigrationCounter');
  const resultWrap = document.getElementById('immigrationResultWrap');
  const result = document.getElementById('immigrationResult');
  const catalogForm = document.getElementById('immigrationCatalogForm');
  const catalogQuery = document.getElementById('immigrationCatalogQuery');
  const catalogResults = document.getElementById('immigrationCatalogResults');
  if (!form || !story || !result || !catalogForm) return;

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const text = {
    en: {
      remaining: 'characters left', loading: 'Finding a careful starting point…', forms: 'Possible forms and workflows',
      noForms: 'No specific form is identified yet. Continue with guided questions or human review.', review: 'Review level', next: 'What to do next',
      attorneyRequired: 'Immigration-attorney review is required before relying on a form or filing instruction.',
      error: 'We could not identify a starting point.', catalogLoading: 'Searching the preserved catalog…', catalogNone: 'No matching preserved form was found.',
      workflow: 'Guided workflow', controlled: 'Controlled official-PDF review copy'
    },
    es: {
      remaining: 'caracteres disponibles', loading: 'Buscando un punto de partida cuidadoso…', forms: 'Posibles formularios y procesos',
      noForms: 'Todavía no se identifica un formulario específico. Continúe con preguntas guiadas o revisión humana.', review: 'Nivel de revisión', next: 'Qué hacer ahora',
      attorneyRequired: 'Se requiere revisión de un abogado de inmigración antes de confiar en un formulario o instrucción de presentación.',
      error: 'No pudimos identificar un punto de partida.', catalogLoading: 'Buscando en el catálogo preservado…', catalogNone: 'No se encontró un formulario preservado que coincida.',
      workflow: 'Proceso guiado', controlled: 'Copia de revisión del PDF oficial controlado'
    }
  };
  const copy = () => text[language.value === 'es' ? 'es' : 'en'];

  function updateCounter() {
    counter.textContent = `${2500 - story.value.length} ${copy().remaining}`;
  }
  story.addEventListener('input', updateCounter);
  language.addEventListener('change', updateCounter);

  async function postJson(url, body) {
    const response = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin'});
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Request failed.');
    return data;
  }

  function renderRoute(data) {
    const c = copy();
    const forms = (data.possibleForms || []).map(item => `<li><strong>${escapeHtml(item.form)} — ${escapeHtml(item.name)}</strong><span>${escapeHtml(item.controlledReviewCopyAvailable ? c.controlled : c.workflow)}</span></li>`).join('');
    const alertClass = data.attorneyReviewRequired ? ' pre120-alert' : '';
    result.innerHTML = `<p class="pre120-kicker">Smarter Justice immigration starting point</p><h2>${escapeHtml(data.primaryIssue)}</h2><p>${escapeHtml(data.privacy)}</p><div class="pre120-result-grid"><section class="pre120-result-panel"><h3>${escapeHtml(c.forms)}</h3><ul class="pre120-form-list">${forms || `<li>${escapeHtml(c.noForms)}</li>`}</ul></section><section class="pre120-result-panel${alertClass}"><h3>${escapeHtml(c.review)}: ${escapeHtml(data.handling.replaceAll('_',' ').toLowerCase())}</h3>${data.attorneyReviewRequired ? `<p><strong>${escapeHtml(c.attorneyRequired)}</strong></p>` : ''}<p><strong>${escapeHtml(c.next)}:</strong> ${escapeHtml(data.nextStep)}</p><p>Nothing is signed, filed, or submitted automatically.</p></section></div>`;
    resultWrap.hidden = false;
    resultWrap.scrollIntoView({behavior:'smooth',block:'start'});
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const question = story.value.trim();
    if (question.length < 8) { story.setCustomValidity('Add a little more detail.'); story.reportValidity(); story.setCustomValidity(''); return; }
    resultWrap.hidden = false;
    result.innerHTML = `<p>${escapeHtml(copy().loading)}</p>`;
    try {
      renderRoute(await postJson('/api/pre120/immigration/route',{question,answers:{language:language.value,story:question}}));
    } catch (error) {
      result.innerHTML = `<p class="pre120-error">${escapeHtml(copy().error)} ${escapeHtml(error.message)}</p>`;
    }
  });

  function renderCatalog(data) {
    const items = (data.forms || []).map(item => `<article class="pre120-catalog-item"><strong>${escapeHtml(item.form)} — ${escapeHtml(item.name)}</strong><span>${escapeHtml(item.agency)} · ${escapeHtml(item.controlledReviewCopyAvailable ? copy().controlled : copy().workflow)} · ${escapeHtml(item.risk || 'review varies')}</span></article>`).join('');
    catalogResults.className = 'pre120-catalog-results';
    catalogResults.innerHTML = items || `<p>${escapeHtml(copy().catalogNone)}</p>`;
  }

  catalogForm.addEventListener('submit', async event => {
    event.preventDefault();
    catalogResults.innerHTML = `<p>${escapeHtml(copy().catalogLoading)}</p>`;
    try {
      const response = await fetch(`/api/pre120/immigration/catalog?q=${encodeURIComponent(catalogQuery.value.trim())}&limit=12`,{credentials:'same-origin'});
      const data = await response.json();
      if (!response.ok || data.ok === false) throw new Error(data.error || 'Search failed.');
      renderCatalog(data);
    } catch (error) {
      catalogResults.innerHTML = `<p class="pre120-error">${escapeHtml(error.message)}</p>`;
    }
  });

  updateCounter();
})();
