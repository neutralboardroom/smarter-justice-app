(function(){
  window.SMARTER_JUSTICE_TAWK_READY = false;

  function addFallback(){
    if (document.querySelector('.live-chat-fallback')) return;
    const btn=document.createElement('button');
    btn.className='live-chat-fallback';
    btn.textContent='Need help?';
    btn.addEventListener('click',()=>{ location.href='/contact.html'; });
    document.body.appendChild(btn);
  }

  function loadTawk(propertyId, widgetId){
    if (!/^[A-Za-z0-9_-]+$/.test(propertyId) || !/^[A-Za-z0-9_-]+$/.test(widgetId)) return false;
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    const s1=document.createElement('script');
    const s0=document.getElementsByTagName('script')[0];
    s1.async=true;
    s1.src='https://embed.tawk.to/'+encodeURIComponent(propertyId)+'/'+encodeURIComponent(widgetId);
    s1.charset='UTF-8';
    s1.setAttribute('crossorigin','anonymous');
    s1.addEventListener('error', addFallback, { once:true });
    s0.parentNode.insertBefore(s1,s0);
    window.SMARTER_JUSTICE_TAWK_READY = true;
    return true;
  }

  document.addEventListener('DOMContentLoaded', async function(){
    try {
      const res = await fetch('/api/public-config', { credentials:'same-origin' });
      const data = await res.json();
      if (res.ok && data.liveChat?.configured && loadTawk(data.liveChat.propertyId, data.liveChat.widgetId)) return;
    } catch {}
    addFallback();
  });
})();
