(function () {
  'use strict';
  var app = document.getElementById('app');
  app.innerHTML = window.JoraShell.nav('more') +
    '<main class="jora-page"><section class="jora-hero"><div><h1>More</h1><p>Your shopping shortcuts in one place.</p></div></section>' +
    '<nav class="jora-shortcuts" aria-label="Shopping shortcuts">' +
      '<a href="cart.html"><span class="jora-shortcut-icon" aria-hidden="true">🛒</span><b>Cart</b></a>' +
      '<a href="orders.html"><span class="jora-shortcut-icon" aria-hidden="true">📦</span><b>My Orders</b></a>' +
      '<a href="wishlist.html"><span class="jora-shortcut-icon" aria-hidden="true">♡</span><b>Wishlist</b></a>' +
    '</nav></main>';
}());
