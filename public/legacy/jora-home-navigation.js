(function(){
  function hideLegacyNavigation(){document.querySelectorAll('#jora-bottom-nav,.mobile-nav-shortcuts').forEach(function(legacy){legacy.remove()})}
  function add(){
    if(document.getElementById('jora-shell-nav')){hideLegacyNavigation();return}
    var css=document.createElement('link');css.rel='stylesheet';css.href='jora-shell.css';document.head.appendChild(css);
    var interactions=document.createElement('link');interactions.rel='stylesheet';interactions.href='jora-interactions.css';document.head.appendChild(interactions);
    var legacyFix=document.createElement('link');legacyFix.rel='stylesheet';legacyFix.href='jora-navigation-fix.css';document.head.appendChild(legacyFix);
    var stability=document.createElement('link');stability.rel='stylesheet';stability.href='jora-mobile-stability.css';document.head.appendChild(stability);
    var font=document.createElement('link');font.rel='stylesheet';font.href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@600;700&display=swap';document.head.appendChild(font);
    var nav=document.createElement('div');nav.id='jora-shell-nav';nav.innerHTML='<nav class="jora-bottomnav" aria-label="Primary"><a href="home.html" aria-current="page"><span class="jora-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/></svg></span><span>Home</span></a><a href="shops.html"><span class="jora-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 10h16v10H4zM3 5h18v5H3zM7 15h4v5H7zM17 5v5"/></svg></span><span>Shops</span></a><a href="products.html"><span class="jora-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg></span><span>Products</span></a><a href="account.html"><span class="jora-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span><span>Account</span></a><a href="settings.html"><span class="jora-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V20.3h-3v-.09A1.7 1.7 0 0 0 10.68 18.7a1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.02 15a1.7 1.7 0 0 0-1.55-1.03H5.4v-3h.07A1.7 1.7 0 0 0 7.02 9.94a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.55V4.7h3v.03a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.8 8l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.03h.07v3h-.07A1.7 1.7 0 0 0 19.4 15Z"/></svg></span><span>Settings</span></a></nav><header class="jora-topbar"><a class="jora-brand" href="home.html">Jora</a><nav class="jora-toplinks"><a href="home.html" aria-current="page">Home</a><a href="shops.html">Shops</a><a href="products.html">Products</a><a href="account.html">Account</a><a href="settings.html">Settings</a></nav></header>';
    document.body.appendChild(nav);hideLegacyNavigation();
    new MutationObserver(hideLegacyNavigation).observe(document.body,{childList:true,subtree:true});
    ['new-products-section','shop-products-panel','nearby-products-grid'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.add('jora-home-only-products')});
    var legacyOpenOrders=window.openOrdersModal;
    var params=new URLSearchParams(window.location.search);
    window.openCartModal=function(){location.href='cart.html'};window.openWishModal=function(){location.href='wishlist.html'};
    window.openOrdersModal=function(){
      if(params.get('legacyTracking')==='1'&&typeof legacyOpenOrders==='function')return legacyOpenOrders.apply(this,arguments);
      location.href='orders.html';
    };
    window.openProfileModal=function(){location.href='account.html'};window.toggleSettingsPanel=function(){location.href='settings.html'};
    var trackId=params.get('trackOrder');
    if(params.get('legacyTracking')==='1'&&trackId){
      var attempts=0,openTimer=setInterval(function(){
        attempts++;
        var found=(window._ordersCache||[]).some(function(order){return order.id===trackId});
        if(found&&typeof window.openTrackModal==='function'){clearInterval(openTimer);window.openTrackModal(trackId);}
        else if(attempts>100){clearInterval(openTimer);if(window.toast)window.toast('Order created, but live tracking is still loading. Please open My Orders again.','err');}
      },150);
    }
    setTimeout(function(){var checkout=document.createElement('script');checkout.src='jora-checkout-fix.js';checkout.async=false;document.body.appendChild(checkout);var wishlist=document.createElement('script');wishlist.src='jora-wishlist.js';wishlist.async=false;document.body.appendChild(wishlist);},0);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add);else add();
})();
