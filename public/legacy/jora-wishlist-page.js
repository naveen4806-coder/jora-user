(function () {
  'use strict';
  var app = document.getElementById('app'), S = window.JoraShell;
  function page(body) { app.innerHTML = S.nav('more') + '<main class="jora-page"><a class="jora-back" href="more.html">← Back to More</a><section class="jora-hero"><div><h1>Wishlist</h1><p>Your saved products.</p></div></section>' + body + '</main>'; }
  function message(text, action) { page('<div class="jora-empty">' + S.esc(text) + (action || '') + '</div>'); }
  async function load() {
    message('Loading your wishlist…');
    try {
      var api = await JoraSupabase.ready(), result = await api.auth.getUser();
      var user = result.data && result.data.user;
      if (result.error && result.error.name !== 'AuthSessionMissingError') throw result.error;
      if (!user) { message('Sign in to see your wishlist. ', '<a href="home.html?auth=login">Sign in</a>'); return; }
      var saved = await api.from('wishlists').select('product_id').eq('user_id', user.id);
      if (saved.error) throw saved.error;
      var ids = (saved.data || []).map(function (item) { return item.product_id; });
      if (!ids.length) { message('No saved products yet. ', '<a href="products.html">Browse products</a>'); return; }
      var response = await api.from('products').select('*').in('id', ids);
      if (response.error) throw response.error;
      var products = response.data || [];
      page('<section class="jora-grid">' + products.map(function (item) { return '<article class="jora-card">' + S.image(item.image_url || item.image, item.name) + '<div class="jora-card__body"><h2>' + S.esc(item.name) + '</h2><div class="jora-price">' + S.money(item.price) + '</div><div class="jora-card-actions"><button class="jora-button" data-add="' + S.esc(item.id) + '">Add to cart</button><button class="jora-wishlist-button" data-remove="' + S.esc(item.id) + '" aria-label="Remove from wishlist">♥</button></div></div></article>'; }).join('') + '</section>');
      app.querySelectorAll('[data-remove]').forEach(function (button) { button.onclick = async function () { button.disabled = true; var removed = await api.from('wishlists').delete().eq('user_id', user.id).eq('product_id', button.dataset.remove); if (removed.error) { alert('Could not remove this item. Please try again.'); button.disabled = false; return; } load(); }; });
      app.querySelectorAll('[data-add]').forEach(function (button) { button.onclick = function () {
        var item = products.find(function (entry) { return entry.id === button.dataset.add; });
        if (!item) return;
        var shopId = item.vendor_id || item.shop_id || item.shopId, key = 'ls_cart_user_' + user.id;
        if (!shopId) { alert('This product has no shop assigned.'); return; }
        var cart = S.read(key, { shopId: null, shopName: '', items: [] });
        if (cart.shopId && cart.shopId !== shopId && !confirm('Your cart has items from another shop. Replace them?')) return;
        if (cart.shopId !== shopId) cart = { shopId: shopId, shopName: '', items: [] };
        var existing = cart.items.find(function (entry) { return entry.productId === item.id; });
        if (existing) existing.qty++; else cart.items.push({ productId: item.id, name: item.name, price: item.price, image: item.image_url || '', category: item.category || '', qty: 1, stock: item.stock });
        localStorage.setItem(key, JSON.stringify(cart)); localStorage.setItem('ls_cart', JSON.stringify(cart)); location.href = 'cart.html';
      }; });
    } catch (error) { console.error('Wishlist failed', error); message('Unable to load your wishlist. ', '<button class="jora-button" type="button" onclick="location.reload()">Try again</button>'); }
  }
  load();
}());
