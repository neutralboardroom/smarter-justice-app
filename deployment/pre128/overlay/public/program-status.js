(() => {
  'use strict';
  const spanish = document.documentElement.lang === 'es';
  const setText = (selector, value) => document.querySelectorAll(selector).forEach(node => { node.textContent = value; });
  const updateCtas = () => document.querySelectorAll('[data-professional-program-cta]').forEach(link => {
    link.textContent = spanish ? 'Explorar la vista profesional' : 'Explore the professional preview';
    link.setAttribute('href', spanish ? '/es/comunidad-profesional.html' : '/professional-community.html');
    link.setAttribute('aria-label', spanish ? 'Explorar la vista profesional gratuita' : 'Explore the free professional preview');
  });
  function renderClosedState() {
    document.body.dataset.professionalApplications = 'paused';
    setText('[data-professional-program-headline]', spanish ? 'La vista profesional y los perfiles gratuitos están disponibles; la inscripción de cuentas nuevas está pausada.' : 'The professional preview and free profiles are available; new account registration is paused.');
    setText('[data-professional-program-explanation]', spanish ? 'Explore la información local y encuentre su perfil público gratis. No envíe datos de cuenta mientras el registro esté pausado.' : 'Explore local information and find your free public profile. Do not submit account information while registration is paused.');
    setText('[data-professional-program-payment]', spanish ? 'La membresía pagada y el pago no están abiertos. No se acepta ningún pago ni se emite acceso pagado.' : 'Paid membership and checkout are not open. No payment is accepted and no paid access is issued.');
    updateCtas();
  }
  document.addEventListener('DOMContentLoaded', renderClosedState);
})();
