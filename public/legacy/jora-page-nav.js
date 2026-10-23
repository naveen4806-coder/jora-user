(function(){function language(){if(window.JoraLanguage||document.querySelector('script[src="jora-global-language.js"]'))return;var script=document.createElement('script');script.src='jora-global-language.js';script.async=false;document.head.appendChild(script)}function add(){if(document.getElementById('jora-page-nav'))return;var page=location.pathname.split('/').pop()||'home.html',active=page==='shop.html'?'shops':page==='product.html'?'products':'home',wrap=document.createElement('div');wrap.id='jora-page-nav';wrap.innerHTML='<nav class="jora-bottomnav" aria-label="Primary"><a href="home.html" data-icon="⌂" '+(active==='home'?'aria-current="page"':'')+'>Home</a><a href="shops.html" data-icon="▦" '+(active==='shops'?'aria-current="page"':'')+'>Shops</a><a href="products.html" data-icon="□" '+(active==='products'?'aria-current="page"':'')+'>Products</a><a href="account.html" data-icon="◉">Account</a><a href="settings.html" data-icon="⚙">Settings</a></nav>';document.body.appendChild(wrap);language()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add()})();
(function(){
  var icons={
    Home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22v-7h6v7"/></svg>',
    Shops:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18v10H3Z"/><path d="m4 10 2-5h12l2 5M8 20v-6h8v6"/></svg>',
    Products:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
    Account:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6"/></svg>',
    Settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m19 12 2-1.5-2-3.4-2.3.9a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3a7 7 0 0 0-1.7 1L5.1 6.1l-2 3.4L5 11a7 7 0 0 0 0 2l-1.9 1.5 2 3.4 2.3-.9a7 7 0 0 0 1.7 1l.4 3h5l.4-3a7 7 0 0 0 1.7-1l2.3.9 2-3.4L19 13a7 7 0 0 0 0-1Z"/></svg>'
  };
  function decorate(){
    var nav=document.querySelector('#jora-page-nav .jora-bottomnav');if(!nav)return;
    nav.querySelectorAll('a').forEach(function(link){var label=link.textContent.trim(),svg=icons[label];if(!svg||link.querySelector('.jora-nav-icon'))return;var icon=document.createElement('span');icon.className='jora-nav-icon';icon.setAttribute('aria-hidden','true');icon.innerHTML=svg;var text=document.createElement('span');text.textContent=label;link.textContent='';link.appendChild(icon);link.appendChild(text);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(decorate,0);});else setTimeout(decorate,0);
})();
