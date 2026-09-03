(() => {
  'use strict';

  const spanish = document.documentElement.lang === 'es';
  const text = (en, es) => spanish ? es : en;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));
  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
      credentials:'same-origin',
      ...options,
      headers:{ 'Content-Type':'application/json', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    return { ...data, ok:response.ok && data.ok !== false, status:response.status };
  };
  const formatDate = value => {
    if (!value) return '';
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00-04:00` : value;
    return new Intl.DateTimeFormat(spanish ? 'es-US' : 'en-US', { month:'short', day:'numeric', year:'numeric', timeZone:'America/New_York' }).format(new Date(normalized));
  };
  const signalLabels = {
    COURT_CALENDAR:text('Court calendar','Calendario judicial'),
    PROFESSIONAL_EVENT:text('Professional event','Evento profesional'),
    PROFESSIONAL_RULE_UPDATE:text('Rule update','Actualización de reglas'),
    COURT_OPERATION_UPDATE:text('Court operation','Operación del tribunal'),
    COURT_PART_RULE_UPDATE:text('Part-rule update','Reglas de parte')
  };
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
    return spanish && spanishSignals[signal.id] ? { ...signal, ...spanishSignals[signal.id] } : signal;
  }
  function signalMarkup(signal, compact = false) {
    const item = translatedSignal(signal);
    const timing = signal.timing === 'UPCOMING' ? text('Upcoming','Próximo') : text('Current','Actual');
    const checked = signal.observedAt ? `${text('Last checked','Última revisión')} ${formatDate(signal.observedAt)}` : '';
    const nextCheck = signal.reviewBy ? ` · ${text('Check again by','Revisar de nuevo antes del')} ${formatDate(signal.reviewBy)}` : '';
    return `<article class="sjc-signal${compact ? ' sjc-signal--compact' : ''}">
      <div class="sjc-signal__type">${escapeHtml(signalLabels[signal.type] || text('Local update','Actualización local'))}<br>${escapeHtml(timing)}</div>
      <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary)}</p><a class="sjc-source-link" href="${escapeHtml(signal.sourceUrl)}" rel="noopener">${text('Open original source','Abrir fuente original')}</a><span class="sjc-card__meta">${escapeHtml(checked + nextCheck)}</span></div>
    </article>`;
  }
  function renderSignals(target, signals = [], compact = false) {
    if (!target) return;
    target.innerHTML = signals.length ? signals.map(signal => signalMarkup(signal, compact)).join('') : `<p class="sjc-empty">${text('No current updates match this selection. Open the complete community brief.','No hay actualizaciones que coincidan. Abra el resumen completo de la comunidad.')}</p>`;
  }
  function renderSnapshot(target, snapshot = {}) {
    if (!target) return;
    const professionals = Number(snapshot.professionals || 0);
    const firms = Number(snapshot.firms || 0);
    target.innerHTML = `<div class="sjc-snapshot-grid"><div><strong>${professionals.toLocaleString()}</strong><span>${text('professional profiles matching ZIP 11201','perfiles profesionales que coinciden con 11201')}</span></div><div><strong>${firms.toLocaleString()}</strong><span>${text('firm profiles matching ZIP 11201','perfiles de firmas que coinciden con 11201')}</span></div></div><p class="sjc-fine">${text('Current read-only directory matches. A location match is not membership, verification, availability, recommendation, or proof of a current office.','Coincidencias del directorio actual de solo lectura. Una coincidencia local no es membresía, verificación, disponibilidad, recomendación ni prueba de oficina actual.')}</p>`;
  }
  async function hydrateCommunity() {
    if (!document.querySelector('[data-community-signals],[data-community-snapshot],[data-community-updated]')) return;
    const id = document.body.dataset.communityId || 'downtown-brooklyn';
    const data = await fetchJson(`/api/public/legal-communities/${encodeURIComponent(id)}`);
    if (!data.ok || !data.community) return;
    document.querySelectorAll('[data-community-signals]').forEach(node => renderSignals(node, data.community.currentSignals));
    document.querySelectorAll('[data-community-snapshot]').forEach(node => renderSnapshot(node, data.community.directorySnapshot));
    document.querySelectorAll('[data-community-updated]').forEach(node => { node.textContent = formatDate(data.community.currentEdition?.lastCheckedAt || ''); });
  }
  function checkedPracticeIds(container) {
    return [...container.querySelectorAll('input[name="practiceAreaIds"]:checked')].map(input => input.value);
  }
  function practiceControls(experience, selected = []) {
    return `<fieldset class="sjc-practice-choices"><legend>${text('Practice focus','Enfoque de práctica')}</legend><p>${text('Select areas to filter professional information. Private user matters are never used.','Seleccione áreas para filtrar información profesional. Nunca se usan asuntos privados de usuarios.')}</p><div>${experience.practiceAreas.map(area => `<label><input type="checkbox" name="practiceAreaIds" value="${escapeHtml(area.id)}" ${selected.includes(area.id) ? 'checked' : ''}> ${escapeHtml(area.name)}</label>`).join('')}</div></fieldset>`;
  }
  function gettingStarted(steps = []) {
    return `<ol class="sjc-first-value">${steps.map(step => `<li><a href="${escapeHtml(step.href)}">${escapeHtml(step.title)}</a></li>`).join('')}</ol>`;
  }
  function settingsForm(preferences, experience) {
    if (!preferences) return `<div class="sjc-signin-card"><h3>${text('Explore the free preview','Explore la vista gratuita')}</h3><p>${text('The local brief, practice filter, and sharing draft work without payment. New account registration is paused while reliable email verification is prepared.','El resumen local, filtro de práctica y borrador para compartir funcionan sin pago. El registro de cuentas nuevas está pausado mientras se prepara la verificación confiable por correo.')}</p><a class="sjc-button" href="/find-my-profile.html">${text('Find my free profile','Encontrar mi perfil gratis')}</a></div>`;
    return `<form id="community-settings" class="sjc-preferences" data-community-preferences>
      <h3>${text('Community settings','Configuración comunitaria')}</h3>
      <label>${text('Home legal community','Comunidad legal principal')}<select name="homeCommunityId"><option value="">${text('Not selected','No seleccionada')}</option><option value="downtown-brooklyn" ${preferences.homeCommunityId === 'downtown-brooklyn' ? 'selected' : ''}>Downtown Brooklyn / Civic Center</option></select></label>
      <p class="sjc-fine">${text('This selection does not claim an office, license, service area, jurisdiction, or paid membership.','Esta selección no reclama oficina, licencia, área de servicio, jurisdicción ni membresía pagada.')}</p>
      <label>${text('Service areas — one per line','Áreas de servicio — una por línea')}<textarea name="serviceAreas" rows="3" placeholder="${text('Example: Brooklyn\nQueens','Ejemplo: Brooklyn\nQueens')}">${escapeHtml((preferences.serviceAreas || []).join('\n'))}</textarea></label>
      ${practiceControls(experience, preferences.practiceAreaIds || [])}
      <fieldset><legend>${text('Communication choices','Preferencias de comunicación')}</legend>
        <label class="sjc-check"><input type="checkbox" name="localIntelligenceEnabled" ${preferences.localIntelligenceEnabled !== false ? 'checked' : ''}> ${text('Local legal information with original source links','Información legal local con fuentes originales')}</label>
        <label class="sjc-check"><input type="checkbox" name="participationUpdatesEnabled" ${preferences.participationUpdatesEnabled !== false ? 'checked' : ''}> ${text('Community participation updates','Actualizaciones de participación comunitaria')}</label>
        <label class="sjc-check"><input type="checkbox" name="opportunityUpdatesEnabled" ${preferences.opportunityUpdatesEnabled === true ? 'checked' : ''}> ${text('Optional user-selected professional opportunities','Oportunidades profesionales opcionales elegidas por usuarios')}</label>
      </fieldset>
      <button class="sjc-button" type="submit">${text('Save settings','Guardar configuración')}</button><p class="sjc-form-status" aria-live="polite"></p>
    </form>`;
  }
  function sharePanel(shareKit) {
    if (!shareKit) return '';
    return `<article id="share" class="sjc-share-panel"><p class="sjc-kicker">${text('For your professional network','Para su red profesional')}</p><h2>${text('Share the useful local information.','Comparta la información local útil.')}</h2><p>${text('Review the draft and every original source first. Nothing posts automatically and this does not authorize mass messaging.','Revise primero el borrador y cada fuente original. Nada se publica automáticamente y esto no autoriza mensajes masivos.')}</p><div class="sjc-actions"><button class="sjc-button" type="button" data-copy-post>${text('Copy LinkedIn draft','Copiar borrador de LinkedIn')}</button><a class="sjc-button sjc-button--secondary" data-share-linkedin data-share-url="${escapeHtml(shareKit.canonicalUrl)}" href="#">${text('Open LinkedIn','Abrir LinkedIn')}</a></div><textarea class="sjc-share-draft" rows="9" readonly data-share-draft>${escapeHtml(shareKit.linkedinText)}</textarea></article>`;
  }
  function workspaceMarkup(experience, preferences) {
    const selected = preferences?.practiceAreaIds || [];
    const practiceFeed = selected.length ? experience.forYourPractice : [];
    return `<div class="sjc-wrap">
      <div class="sjc-disclosure"><strong>${text('Free preview — paid enrollment is not open.','Vista gratuita — la inscripción pagada no está abierta.')}</strong> ${text('No payment or membership is required to use this page.','No se requiere pago ni membresía para usar esta página.')}</div>
      <div class="sjc-workspace-head"><div><p class="sjc-kicker">${escapeHtml(experience.edition?.editionLabel || '')}</p><h2>${text('Downtown Brooklyn professional community preview','Vista de la comunidad profesional de Downtown Brooklyn')}</h2><p>${text('Each item links to its original source and shows when it was checked.','Cada elemento enlaza a su fuente original y muestra cuándo se revisó.')}</p></div><a class="sjc-text-link" href="/community-briefs/downtown-brooklyn">${text('Open the complete brief','Abrir el resumen completo')}</a></div>
      <div class="sjc-member-grid"><section class="sjc-member-main" aria-labelledby="near-you-heading"><div class="sjc-workspace-section-heading"><p class="sjc-kicker">${text('Today near you','Hoy cerca de usted')}</p><h2 id="near-you-heading">${text('Current professional updates','Actualizaciones profesionales actuales')}</h2></div><div class="sjc-today">${experience.todayNearYou.map(signal => signalMarkup(signal, true)).join('')}</div></section><aside class="sjc-member-side"><div class="sjc-first-value-card"><h2>${text('Start here','Empiece aquí')}</h2><p>${text('Four useful steps available in the free preview.','Cuatro pasos útiles disponibles en la vista gratuita.')}</p>${gettingStarted(experience.gettingStarted)}</div>${settingsForm(preferences, experience)}</aside></div>
      <section id="practice-focus" class="sjc-practice-panel"><div class="sjc-workspace-section-heading"><p class="sjc-kicker">${text('For your practice','Para su práctica')}</p><h2>${selected.length ? text('Updates matched to your saved focus','Actualizaciones según sus áreas guardadas') : text('Choose a focus for this view','Elija un enfoque para esta vista')}</h2><p>${text('This filter uses only your selections—never private user matters.','Este filtro usa solamente sus selecciones, nunca asuntos privados de usuarios.')}</p></div><div class="sjc-practice-preview">${practiceControls(experience, selected)}<button class="sjc-button sjc-button--secondary" type="button" data-apply-practice>${text('Apply filter','Aplicar filtro')}</button></div><div class="sjc-today sjc-practice-results" data-practice-results>${practiceFeed.length ? practiceFeed.map(signal => signalMarkup(signal, true)).join('') : `<p class="sjc-empty">${text('Select one or more areas, then apply the filter.','Seleccione una o más áreas y aplique el filtro.')}</p>`}</div></section>
      ${sharePanel(experience.shareKit)}
    </div>`;
  }
  async function loadExperience(practiceAreaIds = []) {
    const params = new URLSearchParams();
    for (const id of practiceAreaIds) params.append('practice', id);
    return fetchJson(`/api/public/legal-communities/downtown-brooklyn/professional-preview${params.size ? `?${params}` : ''}`);
  }
  async function hydrateProfessionalWorkspace() {
    const target = document.querySelector('[data-professional-community-workspace]');
    if (!target) return;
    const session = await fetchJson('/api/professional/session');
    const settings = session.ok ? await fetchJson('/api/professional/legal-community-preferences') : null;
    const preferences = settings?.ok ? settings.preferences : null;
    const initial = await loadExperience(preferences?.practiceAreaIds || []);
    if (!initial.ok || !initial.experience) {
      target.innerHTML = `<div class="sjc-wrap"><p class="sjc-disclosure">${text('The community preview is temporarily unavailable. Use the public brief and original source links.','La vista comunitaria no está disponible temporalmente. Use el resumen público y las fuentes originales.')}</p></div>`;
      return;
    }
    target.innerHTML = workspaceMarkup(initial.experience, preferences);
    setupSharing(target);
    target.querySelector('[data-apply-practice]')?.addEventListener('click', async event => {
      const ids = checkedPracticeIds(target.querySelector('.sjc-practice-preview'));
      event.currentTarget.disabled = true;
      const updated = await loadExperience(ids);
      renderSignals(target.querySelector('[data-practice-results]'), updated.experience?.forYourPractice || [], true);
      event.currentTarget.disabled = false;
    });
    const form = target.querySelector('[data-community-preferences]');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const values = new FormData(form);
      const body = {
        homeCommunityId:values.get('homeCommunityId') || '',
        serviceAreas:String(values.get('serviceAreas') || '').split(/\r?\n|,/).map(value => value.trim()).filter(Boolean),
        practiceAreaIds:values.getAll('practiceAreaIds'),
        localIntelligenceEnabled:values.has('localIntelligenceEnabled'),
        participationUpdatesEnabled:values.has('participationUpdatesEnabled'),
        opportunityUpdatesEnabled:values.has('opportunityUpdatesEnabled')
      };
      const participatingControls = form.querySelectorAll('[name="participatingCommunityIds"]');
      if (participatingControls.length) body.participatingCommunityIds = values.getAll('participatingCommunityIds');
      const submit = form.querySelector('button[type="submit"]');
      const status = form.querySelector('.sjc-form-status');
      submit.disabled = true;
      status.textContent = text('Saving…','Guardando…');
      const result = await fetchJson('/api/professional/legal-community-preferences', { method:'POST', body:JSON.stringify(body) });
      status.textContent = result.message || result.error || text('Could not save these settings.','No se pudo guardar.');
      submit.disabled = false;
    });
  }
  async function hydrateDashboardMemberCard() {
    const target = document.querySelector('[data-member-community-home]');
    if (!target || document.querySelector('[data-professional-community-workspace]')) return;
    const data = await loadExperience([]);
    if (!data.ok || !data.experience) {
      target.innerHTML = `<div class="sjc-home-community__panel"><p>${text('The local community preview is temporarily unavailable.','La vista de la comunidad local no está disponible temporalmente.')}</p></div>`;
      return;
    }
    const experience = data.experience;
    target.innerHTML = `<div class="sjc-home-community__panel"><div><p class="sjc-kicker">${text('Free local professional preview','Vista profesional local gratuita')}</p><h2>${escapeHtml(experience.community.shortName)}</h2><p>${text('Source-linked local information, a practice filter, and a brief you can review and share. Private user matters never appear.','Información local con fuentes, un filtro de práctica y un resumen que puede revisar y compartir. Nunca aparecen asuntos privados de usuarios.')}</p><div class="sjc-mini-feed">${experience.todayNearYou.slice(0,3).map(signal => `<article><strong>${escapeHtml(translatedSignal(signal).title)}</strong><span>${escapeHtml(signalLabels[signal.type] || text('Local update','Actualización local'))}</span></article>`).join('')}</div></div><div><h3>${text('Open the community preview','Abrir la vista comunitaria')}</h3><p>${text('Paid membership and checkout are not open. This useful preview does not require payment.','La membresía pagada y el pago no están abiertos. Esta vista útil no requiere pago.')}</p><a class="sjc-button" href="${spanish ? '/es/comunidad-profesional.html' : '/professional-community.html'}">${text('Open community preview','Abrir vista comunitaria')}</a><p class="sjc-fine">${text('A home community does not claim an office, change profile evidence, or affect organic order.','Una comunidad principal no reclama una oficina, no cambia la evidencia del perfil ni afecta el orden orgánico.')}</p></div></div>`;
  }
  async function copyText(value, button) {
    try { await navigator.clipboard.writeText(value); }
    catch {
      const textarea = document.createElement('textarea');
      textarea.value = value; textarea.setAttribute('readonly',''); textarea.style.position = 'fixed'; textarea.style.opacity = '0';
      document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
    }
    const original = button.textContent;
    button.textContent = text('Copied','Copiado');
    window.setTimeout(() => { button.textContent = original; }, 2200);
  }
  function setupSharing(root = document) {
    root.querySelectorAll('[data-share-linkedin]').forEach(link => {
      link.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link.dataset.shareUrl || location.href)}`;
      link.target = '_blank'; link.rel = 'noopener noreferrer';
    });
    root.querySelectorAll('[data-copy-post]').forEach(button => button.addEventListener('click', async () => {
      let draft = root.querySelector('[data-share-draft]')?.value || '';
      if (!draft) {
        const kit = await fetchJson('/api/public/legal-communities/downtown-brooklyn/share-kit');
        draft = kit.shareKit?.linkedinText || '';
      }
      if (draft) await copyText(draft, button);
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    hydrateCommunity().catch(() => {});
    hydrateProfessionalWorkspace().catch(() => {});
    hydrateDashboardMemberCard().catch(() => {});
    setupSharing();
  });
})();
