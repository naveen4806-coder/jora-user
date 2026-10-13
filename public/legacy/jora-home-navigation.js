(function(){
  function hideLegacyNavigation(){document.querySelectorAll('#jora-bottom-nav,.mobile-nav-shortcuts').forEach(function(legacy){legacy.remove()})}
  function add(){
    if(document.getElementById('jora-shell-nav')){hideLegacyNavigation();return}
    var css=document.createElement('link');css.rel='stylesheet';css.href='jora-shell.css';document.head.appendChild(css);
    var interactions=document.createElement('link');interactions.rel='stylesheet';interactions.href='jora-interactions.css';document.head.appendChild(interactions);
    var legacyFix=document.createElement('link');legacyFix.rel='stylesheet';legacyFix.href='jora-navigation-fix.css';document.head.appendChild(legacyFix);
    var font=document.createElement('link');font.rel='stylesheet';font.href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:wght@600;700&display=swap';document.head.appendChild(font);
    var nav=document.createElement('div');nav.id='jora-shell-nav';nav.innerHTML='<nav class="jora-bottomnav" aria-label="Primary"><a href="home.html" data-icon="⌂" aria-current="page">Home</a><a href="shops.html" data-icon="▦">Shops</a><a href="products.html" data-icon="□">Products</a><a href="account.html" data-icon="◉">Account</a><a href="settings.html" data-icon="⚙">Settings</a></nav><header class="jora-topbar"><a class="jora-brand" href="home.html">Jora</a><nav class="jora-toplinks"><a href="home.html" aria-current="page">Home</a><a href="shops.html">Shops</a><a href="products.html">Products</a><a href="account.html">Account</a><a href="settings.html">Settings</a></nav></header>';
    document.body.appendChild(nav);hideLegacyNavigation();
    new MutationObserver(hideLegacyNavigation).observe(document.body,{childList:true,subtree:true});setInterval(hideLegacyNavigation,250);
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
