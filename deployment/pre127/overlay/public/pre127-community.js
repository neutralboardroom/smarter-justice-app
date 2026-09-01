(() => {
  'use strict';
  const es = document.documentElement.lang === 'es';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, { credentials:'same-origin', ...options, headers:{ 'Content-Type':'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    return { ...data, ok:response.ok && data.ok !== false, status:response.status };
  };
  const formatDate = value => {
    if (!value) return '';
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-04:00` : value;
    return new Intl.DateTimeFormat(es ? 'es-US' : 'en-US', { month:'short', day:'numeric', year:'numeric', timeZone:'America/New_York' }).format(new Date(normalized));
  };
  const typeLabels = {
    COURT_CALENDAR:es ? 'Calendario judicial' : 'Court calendar',
    PROFESSIONAL_EVENT:es ? 'Evento profesional' : 'Professional event',
    PROFESSIONAL_RULE_UPDATE:es ? 'Actualización de reglas' : 'Rule update',
    COURT_OPERATION_UPDATE:es ? 'Operación del tribunal' : 'Court operation',
    COURT_PART_RULE_UPDATE:es ? 'Reglas de parte' : 'Part-rule update'
  };
  const signalType = value => typeLabels[value] || (es ? 'Actualización local' : 'Local update');
  const spanishSignals = {
    'court-term-nine-2026': { title:'Calendario judicial de Nueva York: el Período 9 está en curso', summary:'El calendario judicial oficial de 2026 indica que el Período 9 va del 17 de agosto al 13 de septiembre.' },
    'court-term-ten-2026': { title:'Calendario judicial de Nueva York: el Período 10 comienza el 14 de septiembre', summary:'El calendario judicial oficial de 2026 indica que el Período 10 va del 14 de septiembre al 12 de octubre.' },
    'bba-ai-ethics-courtroom-2026': { title:'Programa del Brooklyn Bar: IA y ética en la sala del tribunal', summary:'El calendario del Brooklyn Bar Association incluye este programa para el 16 de septiembre de 2026. Confirme los detalles y la inscripción con la organización.' },
    'ny-attorney-advertising-rules-2026': { title:'Las enmiendas de Nueva York sobre publicidad de abogados están vigentes', summary:'Las Divisiones de Apelación adoptaron enmiendas vigentes desde el 1 de junio de 2026. Revise la orden oficial y sus propias obligaciones antes de publicar.' },
    'kings-civil-status-conferences-2026-09': { title:'Kings Supreme Civil publica un aviso sobre conferencias de estado en persona', summary:'La página oficial indica que, hasta nuevo aviso, las conferencias se celebran los jueves en la Sala 741 con llamado de calendario a las 10:00 a.m. Confirme la página y la instrucción específica del caso.' },
    'kings-civil-part-6-update-2026-08': { title:'La página de la Parte 6 de Kings Civil informa una actualización de agosto', summary:'La página oficial IAS Parte 6 / CVAP4M indica actualización del 13 de agosto de 2026 y un procedimiento vigente desde el 19 de agosto. Revise las reglas completas y la instrucción del caso.' },
    'kings-civil-part-17-update-2026-08': { title:'Se actualizó la página de la Parte 17 y de sentencias por defecto', summary:'La página oficial está marcada como actualizada el 27 de agosto de 2026. Revise las reglas, el calendario y los avisos específicos de su caso.' },
    'kings-civil-part-80-update-2026-08': { title:'Se actualizó la página de la Parte 80 y MMESP-6', summary:'La página oficial está marcada como actualizada el 18 de agosto de 2026. Revise la página completa para requisitos de mociones, comparecencias, conferencias y comunicaciones.' }
  };

  function translatedSignal(signal) {
    return es && spanishSignals[signal.id] ? { ...signal, ...spanishSignals[signal.id] } : signal;
  }

  function signalMarkup(signal, compact = false) {
    const item = translatedSignal(signal);
    const current = signal.timing === 'UPCOMING' ? (es ? 'Próximo' : 'Upcoming') : (es ? 'Actual' : 'Current');
    return `<article class="sjc-signal${compact ? ' sjc-signal--compact' : ''}">
      <div class="sjc-signal__type">${esc(signalType(signal.type))}<br>${esc(current)}</div>
      <div><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p><a class="sjc-source-link" href="${esc(signal.sourceUrl)}">${es ? 'Fuente responsable' : 'Responsible source'}</a><span class="sjc-card__meta">${es ? 'Observado' : 'Observed'} ${esc(formatDate(signal.observedAt))}${signal.reviewBy ? ` · ${es ? 'Revisar antes del' : 'Review by'} ${esc(formatDate(signal.reviewBy))}` : ''}${signal.expiresAt ? ` · ${es ? 'Caduca' : 'Expires'} ${esc(formatDate(signal.expiresAt))}` : ''}</span></div>
    </article>`;
  }

  function renderSignals(target, signals = [], compact = false) {
    if (!target) return;
    target.innerHTML = signals.length ? signals.map(signal => signalMarkup(signal, compact)).join('') : `<p class="sjc-empty">${es ? 'No hay actualizaciones actuales para esta selección. Revise el resumen general.' : 'No current updates match this selection. Review the general community brief.'}</p>`;
  }

  function renderSnapshot(target, snapshot = {}) {
    if (!target || !snapshot) return;
    const professionals = Number(snapshot.professionals || 0);
    const firms = Number(snapshot.firms || 0);
    target.innerHTML = `<div class="sjc-snapshot-grid"><div><strong>${professionals.toLocaleString()}</strong><span>${es ? 'perfiles profesionales que coinciden con 11201' : 'professional profiles matching ZIP 11201'}</span></div><div><strong>${firms.toLocaleString()}</strong><span>${es ? 'perfiles de firmas que coinciden con 11201' : 'firm profiles matching ZIP 11201'}</span></div></div><p class="sjc-fine">${es ? 'Coincidencias del registro actual de solo lectura. Una coincidencia local no es membresía, verificación, disponibilidad, recomendación ni prueba de oficina actual.' : 'Live matches from the current read-only source snapshot. A local match is not membership, verification, availability, recommendation, or proof of current office status.'}</p>`;
  }

  async function hydrateCommunity() {
    if (!document.querySelector('[data-community-signals],[data-community-snapshot],[data-community-updated]')) return;
    const id = document.body.dataset.communityId || 'downtown-brooklyn';
    const data = await fetchJson(`/api/public/legal-communities/${encodeURIComponent(id)}`);
    if (!data.ok || !data.community) return;
    document.querySelectorAll('[data-community-signals]').forEach(node => renderSignals(node, data.community.currentSignals));
    document.querySelectorAll('[data-community-snapshot]').forEach(node => renderSnapshot(node, data.community.directorySnapshot));
    document.querySelectorAll('[data-community-updated]').forEach(node => { node.textContent = formatDate(data.community.currentEdition?.reviewedAt || '2026-09-01'); });
  }

  function checkedPracticeIds(container) {
    return [...container.querySelectorAll('input[name="practiceAreaIds"]:checked')].map(input => input.value);
  }

  function practiceControls(experience, selected = []) {
    return `<fieldset class="sjc-practice-choices"><legend>${es ? 'Enfoque de práctica' : 'Practice focus'}</legend><p>${es ? 'Seleccione áreas para filtrar información profesional. No se usan asuntos privados de usuarios.' : 'Select areas to filter professional information. No private user matters are used.'}</p><div>${experience.practiceAreas.map(area => `<label><input type="checkbox" name="practiceAreaIds" value="${esc(area.id)}" ${selected.includes(area.id) ? 'checked' : ''}> ${esc(area.name)}</label>`).join('')}</div></fieldset>`;
  }

  function firstValueSteps(steps = []) {
    return `<ol class="sjc-first-value">${steps.map(step => `<li><a href="${esc(step.href)}">${esc(step.title)}</a></li>`).join('')}</ol>`;
  }

  function settingsForm(preferences, experience) {
    if (!preferences) return `<div class="sjc-signin-card"><h3>${es ? 'Guarde su vista comunitaria' : 'Save your community view'}</h3><p>${es ? 'Inicie sesión para guardar su comunidad principal, áreas de práctica y preferencias. La vista general permanece disponible sin iniciar sesión.' : 'Sign in to save your home community, practice focus, and preferences. The general view remains available without signing in.'}</p><a class="sjc-button" href="/professional-login.html${es ? '?lang=es' : ''}">${es ? 'Ingresar' : 'Sign in'}</a></div>`;
    return `<form id="community-settings" class="sjc-preferences" data-community-preferences>
      <h3>${es ? 'Configuración comunitaria' : 'Community settings'}</h3>
      <label>${es ? 'Comunidad legal principal' : 'Home legal community'}<select name="homeCommunityId"><option value="">${es ? 'No seleccionada' : 'Not selected'}</option><option value="downtown-brooklyn" ${preferences.homeCommunityId === 'downtown-brooklyn' ? 'selected' : ''}>Downtown Brooklyn / Civic Center</option></select></label>
      <label>${es ? 'Áreas de servicio — una por línea' : 'Service areas — one per line'}<textarea name="serviceAreas" rows="3" placeholder="${es ? 'Ejemplo: Brooklyn\nQueens' : 'Example: Brooklyn\nQueens'}">${esc((preferences.serviceAreas || []).join('\n'))}</textarea></label>
      ${practiceControls(experience, preferences.practiceAreaIds || [])}
      <fieldset><legend>${es ? 'Preferencias' : 'Preferences'}</legend>
        <label class="sjc-check"><input type="checkbox" name="localIntelligenceEnabled" ${preferences.localIntelligenceEnabled !== false ? 'checked' : ''}> ${es ? 'Información legal local con fuentes' : 'Source-linked local legal intelligence'}</label>
        <label class="sjc-check"><input type="checkbox" name="participationUpdatesEnabled" ${preferences.participationUpdatesEnabled !== false ? 'checked' : ''}> ${es ? 'Oportunidades de participación' : 'Community participation opportunities'}</label>
        <label class="sjc-check"><input type="checkbox" name="opportunityUpdatesEnabled" ${preferences.opportunityUpdatesEnabled === true ? 'checked' : ''}> ${es ? 'Oportunidades profesionales opcionales elegidas por usuarios' : 'Optional user-selected professional opportunities'}</label>
      </fieldset>
      <button class="sjc-button" type="submit">${es ? 'Guardar configuración' : 'Save settings'}</button><p class="sjc-form-status" aria-live="polite"></p>
      <p class="sjc-fine">${es ? 'La oficina, jurisdicción, áreas de servicio, membresía, perfil y elegibilidad permanecen separadas.' : 'Office, jurisdiction, service area, membership, profile evidence, and opportunity eligibility remain separate.'}</p>
    </form>`;
  }

  function sharePanel(shareKit) {
    if (!shareKit) return '';
    return `<article id="share" class="sjc-share-panel"><p class="sjc-kicker">${es ? 'Para su red profesional' : 'For your professional network'}</p><h2>${es ? 'Comparta el resumen con sus propias palabras o use el borrador.' : 'Share the brief in your own words—or use the prepared draft.'}</h2><p>${es ? 'El borrador mantiene la fuente y la fecha. Nada se publica automáticamente y no autoriza mensajes directos masivos.' : 'The draft keeps source and date context attached. Nothing posts automatically, and it does not authorize mass direct messaging.'}</p><div class="sjc-actions"><button class="sjc-button" type="button" data-copy-post>${es ? 'Copiar publicación de LinkedIn' : 'Copy LinkedIn post'}</button><a class="sjc-button sjc-button--secondary" data-share-linkedin data-share-url="${esc(shareKit.canonicalUrl)}" href="#">${es ? 'Abrir LinkedIn' : 'Open LinkedIn'}</a></div><textarea class="sjc-share-draft" rows="9" readonly data-share-draft>${esc(shareKit.linkedinText)}</textarea><p class="sjc-fine">${es ? 'Revise el texto y las fuentes antes de publicar. Compartir no es respaldo, consejo legal ni permiso de contacto.' : 'Review the text and sources before posting. Sharing is not endorsement, legal advice, or outreach permission.'}</p></article>`;
  }

  function workspaceMarkup(experience, preferences) {
    const selected = preferences?.practiceAreaIds || [];
    const practiceFeed = selected.length ? experience.forYourPractice : [];
    return `<div class="sjc-wrap">
      <div class="sjc-workspace-head"><div><p class="sjc-kicker">${esc(experience.edition?.editionLabel || '')}</p><h2>${es ? 'Su comunidad legal de Downtown Brooklyn' : 'Your Downtown Brooklyn legal community'}</h2><p>${es ? 'Cada elemento tiene una fuente responsable, fecha de observación y límite de revisión.' : 'Every item keeps a responsible source, observation date, and review boundary.'}</p></div><a class="sjc-text-link" href="/community-briefs/downtown-brooklyn">${es ? 'Abrir el resumen completo' : 'Open the full brief'}</a></div>
      <div class="sjc-member-grid">
        <section class="sjc-member-main" aria-labelledby="near-you-heading"><div class="sjc-workspace-section-heading"><p class="sjc-kicker">${es ? 'Hoy cerca de usted' : 'Today near you'}</p><h2 id="near-you-heading">${es ? 'Actualizaciones profesionales actuales' : 'Current professional updates'}</h2></div><div class="sjc-today" data-member-today>${experience.todayNearYou.map(signal => signalMarkup(signal, true)).join('')}</div></section>
        <aside class="sjc-member-side"><div class="sjc-first-value-card"><h2>${es ? 'Primer valor' : 'First value'}</h2><p>${es ? 'Cinco pasos para convertir la membresía en una práctica útil.' : 'Five steps that turn membership into a useful practice habit.'}</p>${firstValueSteps(experience.firstValueSteps)}</div>${settingsForm(preferences, experience)}</aside>
      </div>
      <section id="practice-focus" class="sjc-practice-panel"><div class="sjc-workspace-section-heading"><p class="sjc-kicker">${es ? 'Para su práctica' : 'For your practice'}</p><h2>${selected.length ? (es ? 'Actualizaciones según sus áreas guardadas' : 'Updates matched to your saved focus') : (es ? 'Elija un enfoque para personalizar esta vista' : 'Choose a focus to personalize this view')}</h2><p>${es ? 'Este filtro usa solamente sus selecciones profesionales, nunca asuntos privados de usuarios.' : 'This filter uses only your professional selections—never private user matters.'}</p></div><div class="sjc-practice-preview" data-practice-preview>${practiceControls(experience, selected)}<button class="sjc-button sjc-button--secondary" type="button" data-apply-practice>${es ? 'Aplicar filtro' : 'Apply filter'}</button></div><div class="sjc-today sjc-practice-results" data-practice-results>${practiceFeed.length ? practiceFeed.map(signal => signalMarkup(signal, true)).join('') : `<p class="sjc-empty">${es ? 'Seleccione una o más áreas y aplique el filtro.' : 'Select one or more practice areas and apply the filter.'}</p>`}</div></section>
      <section class="sjc-resource-panel"><div class="sjc-workspace-section-heading"><p class="sjc-kicker">${es ? 'Fuentes de trabajo' : 'Working sources'}</p><h2>${es ? 'Referencias profesionales locales' : 'Local professional references'}</h2></div><div class="sjc-grid">${experience.professionalResources.map(resource => `<article class="sjc-card"><h3>${esc(resource.name)}</h3><p>${esc(resource.description)}</p><a class="sjc-source-link" href="${esc(resource.url)}">${es ? 'Abrir fuente' : 'Open source'}</a><span class="sjc-card__meta">${es ? 'Observado' : 'Observed'} ${esc(formatDate(resource.observedAt))} · ${es ? 'Revisar antes del' : 'Review by'} ${esc(formatDate(resource.reviewBy))}</span></article>`).join('')}</div></section>
      ${sharePanel(experience.shareKit)}
    </div>`;
  }

  async function loadExperience(practiceAreaIds = []) {
    const params = new URLSearchParams();
    for (const id of practiceAreaIds) params.append('practice', id);
    const suffix = params.toString() ? `?${params}` : '';
    return fetchJson(`/api/public/legal-communities/downtown-brooklyn/member-preview${suffix}`);
  }

  async function hydrateProfessionalWorkspace() {
    const target = document.querySelector('[data-professional-community-workspace]');
    if (!target) return;
    const session = await fetchJson('/api/professional/session');
    const preferencesData = session.ok ? await fetchJson('/api/professional/legal-community-preferences') : null;
    const preferences = preferencesData?.ok ? preferencesData.preferences : null;
    const initial = await loadExperience(preferences?.practiceAreaIds || []);
    if (!initial.ok || !initial.experience) {
      target.innerHTML = `<div class="sjc-wrap"><p class="sjc-disclosure">${es ? 'El inicio comunitario no está disponible temporalmente. Use el resumen público y las fuentes responsables.' : 'The community home is temporarily unavailable. Use the public brief and responsible sources.'}</p></div>`;
      return;
    }
    target.innerHTML = workspaceMarkup(initial.experience, preferences);
    setupSharing(target);
    const apply = target.querySelector('[data-apply-practice]');
    apply?.addEventListener('click', async () => {
      const ids = checkedPracticeIds(target.querySelector('[data-practice-preview]'));
      apply.disabled = true;
      const updated = await loadExperience(ids);
      renderSignals(target.querySelector('[data-practice-results]'), updated.experience?.forYourPractice || [], true);
      apply.disabled = false;
    });
    const form = target.querySelector('[data-community-preferences]');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const status = form.querySelector('.sjc-form-status');
      const values = new FormData(form);
      const body = {
        homeCommunityId:values.get('homeCommunityId') || '',
        serviceAreas:String(values.get('serviceAreas') || '').split(/\r?\n|,/).map(row => row.trim()).filter(Boolean),
        participatingCommunityIds:[],
        practiceAreaIds:values.getAll('practiceAreaIds'),
        localIntelligenceEnabled:values.has('localIntelligenceEnabled'),
        participationUpdatesEnabled:values.has('participationUpdatesEnabled'),
        opportunityUpdatesEnabled:values.has('opportunityUpdatesEnabled')
      };
      submit.disabled = true;
      status.textContent = es ? 'Guardando…' : 'Saving…';
      const result = await fetchJson('/api/professional/legal-community-preferences', { method:'POST', body:JSON.stringify(body) });
      status.textContent = result.message || result.error || (result.ok ? (es ? 'Guardado.' : 'Saved.') : (es ? 'No se pudo guardar.' : 'Could not save these settings.'));
      submit.disabled = false;
      if (result.ok) {
        const updated = await loadExperience(body.practiceAreaIds);
        renderSignals(target.querySelector('[data-practice-results]'), updated.experience?.forYourPractice || [], true);
      }
    });
  }

  async function hydrateDashboardMemberCard() {
    const target = document.querySelector('[data-member-community-home]');
    if (!target || document.querySelector('[data-professional-community-workspace]')) return;
    const data = await loadExperience([]);
    if (!data.ok || !data.experience) return;
    const experience = data.experience;
    target.innerHTML = `<div class="sjc-home-community__panel"><div><p class="sjc-kicker">${es ? 'Su comunidad legal local' : 'Your local legal community'}</p><h2>${esc(experience.community.shortName)}</h2><p>${es ? 'Información local con fuentes, enfoque de práctica, participación y un resumen para compartir. Los asuntos privados de usuarios nunca aparecen.' : 'Source-linked local intelligence, practice focus, participation, and a brief you can share. Private user matters never appear.'}</p><div class="sjc-mini-feed">${experience.todayNearYou.slice(0,3).map(signal => `<article><strong>${esc(translatedSignal(signal).title)}</strong><span>${esc(signalType(signal.type))} · ${esc(signal.timing === 'UPCOMING' ? (es ? 'Próximo' : 'Upcoming') : (es ? 'Actual' : 'Current'))}</span></article>`).join('')}</div></div><div><h3>${es ? 'Abra su inicio comunitario' : 'Open your community home'}</h3><p>${es ? 'Guarde su comunidad, seleccione áreas de práctica y copie la publicación actual de LinkedIn.' : 'Save your community, select practice areas, and copy the current LinkedIn post.'}</p><a class="sjc-button" href="${es ? '/es/comunidad-profesional.html' : '/professional-community.html'}">${es ? 'Abrir inicio comunitario' : 'Open community home'}</a><p class="sjc-fine">${es ? 'La comunidad principal no reclama una oficina ni cambia el orden orgánico.' : 'A home community does not claim an office or change organic search position.'}</p></div></div>`;
  }

  async function copyText(value, button, successText, originalText) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    button.textContent = successText;
    window.setTimeout(() => { button.textContent = originalText; }, 2200);
  }

  function setupSharing(root = document) {
    root.querySelectorAll('[data-share-linkedin]').forEach(link => {
      const url = link.dataset.shareUrl || location.href;
      link.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
    root.querySelectorAll('[data-copy-link]').forEach(button => button.addEventListener('click', () => copyText(button.dataset.copyUrl || location.href, button, es ? 'Enlace copiado' : 'Link copied', es ? 'Copiar enlace' : 'Copy link')));
    root.querySelectorAll('[data-copy-post]').forEach(button => button.addEventListener('click', async () => {
      let draft = root.querySelector('[data-share-draft]')?.value || '';
      if (!draft) {
        const kit = await fetchJson('/api/public/legal-communities/downtown-brooklyn/share-kit');
        draft = kit.shareKit?.linkedinText || '';
      }
      if (draft) copyText(draft, button, es ? 'Publicación copiada' : 'Post copied', es ? 'Copiar publicación de LinkedIn' : 'Copy LinkedIn post');
    }));
  }

  async function hydrateShareDraft() {
    const draft = document.querySelector('[data-share-draft]');
    if (!draft || draft.value.trim()) return;
    const result = await fetchJson('/api/public/legal-communities/downtown-brooklyn/share-kit');
    if (result.ok && result.shareKit) draft.value = result.shareKit.linkedinText;
  }

  document.addEventListener('DOMContentLoaded', () => {
    hydrateCommunity().catch(() => {});
    hydrateProfessionalWorkspace().catch(() => {});
    hydrateDashboardMemberCard().catch(() => {});
    hydrateShareDraft().catch(() => {});
    setupSharing();
  });
})();
