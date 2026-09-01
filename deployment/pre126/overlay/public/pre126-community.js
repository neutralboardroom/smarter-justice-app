(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, { credentials:'same-origin', ...options, headers:{ 'Content-Type':'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    return { ...data, ok: response.ok && data.ok !== false, status: response.status };
  };
  const formatDate = value => {
    if (!value) return '';
    return new Intl.DateTimeFormat(document.documentElement.lang === 'es' ? 'es-US' : 'en-US', { month:'short', day:'numeric', year:'numeric', timeZone:'America/New_York' }).format(new Date(value));
  };
  const signalType = value => ({
    COURT_CALENDAR:document.documentElement.lang === 'es' ? 'Calendario judicial' : 'Court calendar',
    PROFESSIONAL_EVENT:document.documentElement.lang === 'es' ? 'Evento profesional' : 'Professional event',
    PROFESSIONAL_RULE_UPDATE:document.documentElement.lang === 'es' ? 'Actualización de reglas' : 'Rule update'
  }[value] || 'Local update');
  const spanishSignals = {
    'court-term-nine-2026': { title:'Calendario judicial de Nueva York: el Período 9 está en curso', summary:'El calendario judicial oficial de 2026 indica que el Período 9 va del 17 de agosto al 13 de septiembre.' },
    'court-term-ten-2026': { title:'Calendario judicial de Nueva York: el Período 10 comienza el 14 de septiembre', summary:'El calendario judicial oficial de 2026 indica que el Período 10 va del 14 de septiembre al 12 de octubre.' },
    'bba-ai-ethics-courtroom-2026': { title:'Programa del Brooklyn Bar: IA y ética en la sala del tribunal', summary:'El calendario del Brooklyn Bar Association incluye este programa para el 16 de septiembre de 2026. Confirme los detalles y la inscripción con la organización.' },
    'ny-attorney-advertising-rules-2026': { title:'Las enmiendas de Nueva York sobre publicidad de abogados están vigentes', summary:'Las Divisiones de Apelación adoptaron enmiendas vigentes desde el 1 de junio de 2026. Revise la orden oficial y sus propias obligaciones antes de publicar material de mercadeo.' }
  };

  function renderSignals(target, signals = []) {
    if (!target || !signals.length) return;
    const es = document.documentElement.lang === 'es';
    target.innerHTML = signals.map(signal => { const translated = es ? spanishSignals[signal.id] : null; return `<article class="sjc-signal">
      <div class="sjc-signal__type">${esc(signalType(signal.type))}<br>${esc(signal.timing === 'UPCOMING' ? (es ? 'Próximo' : 'Upcoming') : (es ? 'Actual' : 'Current'))}</div>
      <div><h3>${esc(translated?.title || signal.title)}</h3><p>${esc(translated?.summary || signal.summary)}</p><a class="sjc-source-link" href="${esc(signal.sourceUrl)}">${es ? 'Fuente oficial' : 'Official source'}</a><span class="sjc-card__meta">${es ? 'Observado' : 'Observed'} ${esc(formatDate(signal.observedAt))}${signal.expiresAt ? ` · ${es ? 'Actual hasta' : 'Current through'} ${esc(formatDate(signal.expiresAt))}` : ''}</span></div>
    </article>`; }).join('');
  }

  function renderSnapshot(target, snapshot = {}) {
    if (!target || !snapshot) return;
    const professionals = Number(snapshot.professionals || 0);
    const firms = Number(snapshot.firms || 0);
    target.innerHTML = `<div class="sjc-snapshot-grid"><div><strong>${professionals.toLocaleString()}</strong><span>professional profiles matching ZIP 11201</span></div><div><strong>${firms.toLocaleString()}</strong><span>firm profiles matching ZIP 11201</span></div></div><p class="sjc-fine">Live matches from the current read-only Smarter Justice source snapshot. A local match is not membership, verification, availability, recommendation, or proof of office currentness.</p>`;
  }

  async function hydrateCommunity() {
    const targets = [...document.querySelectorAll('[data-community-id]')];
    if (!targets.length && !document.querySelector('[data-community-signals],[data-community-snapshot]')) return;
    const id = targets[0]?.dataset.communityId || document.body.dataset.communityId || 'downtown-brooklyn';
    const data = await fetchJson(`/api/public/legal-communities/${encodeURIComponent(id)}`);
    if (!data.ok || !data.community) return;
    document.querySelectorAll('[data-community-signals]').forEach(node => renderSignals(node, data.community.currentSignals));
    document.querySelectorAll('[data-community-snapshot]').forEach(node => renderSnapshot(node, data.community.directorySnapshot));
    document.querySelectorAll('[data-community-updated]').forEach(node => { node.textContent = formatDate(data.community.currentSignals?.[0]?.observedAt || '2026-09-01'); });
  }

  function memberFeed(signals = []) {
    if (!signals.length) return '<p>No current source-linked items are available. Broader parent-community updates remain available.</p>';
    return `<div class="sjc-mini-feed">${signals.slice(0, 4).map(signal => `<article><strong>${esc(signal.title)}</strong><span>${esc(signalType(signal.type))} · ${esc(signal.timing === 'UPCOMING' ? 'Upcoming' : 'Current')}</span></article>`).join('')}</div>`;
  }

  async function hydrateMemberHome() {
    const target = document.querySelector('[data-member-community-home]');
    if (!target) return;
    const [communityData, preferencesData] = await Promise.all([
      fetchJson('/api/public/legal-communities/downtown-brooklyn?audience=professional'),
      fetchJson('/api/professional/legal-community-preferences')
    ]);
    const community = communityData.community;
    if (!community) return;
    const preferences = preferencesData.preferences || {};
    target.innerHTML = `<div class="sjc-home-community__panel">
      <div><p class="sjc-kicker">Your local legal community</p><h2>${esc(community.shortName)}</h2><p>See source-linked local activity, participation paths, and broader Kings County and New York updates. Private user matters never appear in this feed.</p>${memberFeed(community.currentSignals)}<p class="sjc-fine">A home community does not claim an office, establish jurisdiction, or change organic search position.</p></div>
      <div><h3>Community settings</h3><p>Keep your professional base, participation, and service geography factually separate.</p>
        <form class="sjc-preferences" data-community-preferences>
          <label>Home legal community<select name="homeCommunityId"><option value="">Not selected</option><option value="downtown-brooklyn" ${preferences.homeCommunityId === 'downtown-brooklyn' ? 'selected' : ''}>Downtown Brooklyn / Civic Center</option></select></label>
          <label>Service areas — one per line<textarea name="serviceAreas" rows="3" placeholder="Example: Brooklyn\nQueens">${esc((preferences.serviceAreas || []).join('\n'))}</textarea></label>
          <fieldset><legend>Updates</legend>
            <label class="sjc-check"><input type="checkbox" name="localIntelligenceEnabled" ${preferences.localIntelligenceEnabled !== false ? 'checked' : ''}> Source-linked local legal intelligence</label>
            <label class="sjc-check"><input type="checkbox" name="participationUpdatesEnabled" ${preferences.participationUpdatesEnabled !== false ? 'checked' : ''}> Community participation opportunities</label>
            <label class="sjc-check"><input type="checkbox" name="opportunityUpdatesEnabled" ${preferences.opportunityUpdatesEnabled === true ? 'checked' : ''}> Optional user-selected professional opportunities</label>
          </fieldset>
          <button class="sjc-button" type="submit">Save community settings</button><p class="sjc-form-status" aria-live="polite"></p>
        </form>
      </div>
    </div>`;
    const form = target.querySelector('[data-community-preferences]');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      const status = form.querySelector('.sjc-form-status');
      const values = new FormData(form);
      const body = {
        homeCommunityId: values.get('homeCommunityId') || '',
        serviceAreas: String(values.get('serviceAreas') || '').split(/\r?\n|,/).map(row => row.trim()).filter(Boolean),
        participatingCommunityIds: [],
        localIntelligenceEnabled: values.has('localIntelligenceEnabled'),
        participationUpdatesEnabled: values.has('participationUpdatesEnabled'),
        opportunityUpdatesEnabled: values.has('opportunityUpdatesEnabled')
      };
      submit.disabled = true;
      status.textContent = 'Saving…';
      const result = await fetchJson('/api/professional/legal-community-preferences', { method:'POST', body:JSON.stringify(body) });
      status.textContent = result.message || result.error || (result.ok ? 'Saved.' : 'Could not save these settings.');
      submit.disabled = false;
    });
  }

  function setupSharing() {
    document.querySelectorAll('[data-share-linkedin]').forEach(link => {
      const url = link.dataset.shareUrl || location.href;
      link.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
    document.querySelectorAll('[data-copy-link]').forEach(button => button.addEventListener('click', async () => {
      const value = button.dataset.copyUrl || location.href;
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Link copied';
      } catch {
        const input = document.createElement('input');
        input.value = value;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        button.textContent = 'Link copied';
      }
      window.setTimeout(() => { button.textContent = 'Copy link'; }, 2200);
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    hydrateCommunity().catch(() => {});
    hydrateMemberHome().catch(() => {});
    setupSharing();
  });
})();
