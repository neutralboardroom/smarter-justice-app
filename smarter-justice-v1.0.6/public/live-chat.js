
(function(){
  window.SMARTER_JUSTICE_TAWK_READY = false;
  const prop = window.SMARTER_JUSTICE_TAWK_PROPERTY_ID;
  const widget = window.SMARTER_JUSTICE_TAWK_WIDGET_ID;
  if (prop && widget) {
    window.Tawk_API = window.Tawk_API || {}; window.Tawk_LoadStart = new Date();
    const s1=document.createElement('script'), s0=document.getElementsByTagName('script')[0];
    s1.async=true; s1.src='https://embed.tawk.to/'+prop+'/'+widget; s1.charset='UTF-8'; s1.setAttribute('crossorigin','*');
    s0.parentNode.insertBefore(s1,s0); window.SMARTER_JUSTICE_TAWK_READY = true;
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      const btn=document.createElement('button'); btn.className='live-chat-fallback'; btn.textContent='Need help?'; btn.addEventListener('click',()=>{ location.href='/contact.html'; }); document.body.appendChild(btn);
    });
  }
})();
