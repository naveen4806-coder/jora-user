(function () {
  'use strict';
  var app = document.getElementById('app');
  app.innerHTML = window.JoraShell.nav('more') +
    '<main class="jora-page"><section class="jora-hero"><div><h1>More</h1><p>Your shopping shortcuts in one place.</p></div></section>' +
    '<nav class="jora-menu" aria-label="Shopping shortcuts">' +
      '<a href="cart.html"><span><b>Cart</b><small>Review products before checkout</small></span><span aria-hidden="true">›</span></a>' +
      '<a href="orders.html"><span><b>My Orders</b><small>Track and review your purchases</small></span><span aria-hidden="true">›</span></a>' +
      '<a href="wishlist.html"><span><b>Wishlist</b><small>See products you saved</small></span><span aria-hidden="true">›</span></a>' +
    '</nav></main>';
}());
