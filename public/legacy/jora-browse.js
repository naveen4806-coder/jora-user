(function () {
  'use strict';

  var S = window.JoraShell;
  var mode = document.body.dataset.mode;
  var app = document.getElementById('app');
  var collectionName = mode === 'shops' ? 'shops' : 'products';
  var cacheKey = mode === 'shops' ? 'ls_catalog_shops' : 'ls_catalog_products';

  app.innerHTML = S.nav(mode) + '<main class="jora-page"><section class="jora-hero"><div><h1>' + (mode === 'shops' ? 'Nearby shops' : 'Browse products') + '</h1><p>' + (mode === 'shops' ? 'Find trusted local stores near you.' : 'Discover items by category from local sellers.') + '</p></div></section><div id="content" class="jora-browse-shell"><div class="jora-loading">Loading</div></div></main>';

  function safe(value) { return S.esc(value == null ? '' : value); }
  function text(value) { return String(value == null ? '' : value).toLocaleLowerCase(); }
  function categories(items) {
    return items.reduce(function (result, item) {
      var category = String(item.category || item.type || 'Other').trim() || 'Other';
      if (result.indexOf(category) < 0) result.push(category);
      return result;
    }, []);
  }
  function toolbar(categoriesList, placeholder) {
    return '<section class="jora-browse-toolbar" aria-label="Browse controls">' +
      '<label class="jora-browse-search"><span aria-hidden="true">⌕</span><input id="browse-search" type="search" autocomplete="off" placeholder="' + safe(placeholder) + '" aria-label="' + safe(placeholder) + '"><button id="browse-clear" type="button" aria-label="Clear search" hidden>×</button></label>' +
      '<div class="jora-filter-row" id="browse-filters" role="list">' +
        '<button type="button" class="jora-filter-chip active" data-browse-filter="All">All</button>' +
        categoriesList.map(function (category) { return '<button type="button" class="jora-filter-chip" data-browse-filter="' + safe(category) + '">' + safe(category) + '</button>'; }).join('') +
      '</div>' +
      '<p id="browse-result-count" class="jora-browse-count" aria-live="polite"></p>' +
    '</section>';
  }
  function bindFilters() {
    var content = document.getElementById('content');
    var input = document.getElementById('browse-search');
    var clear = document.getElementById('browse-clear');
    var chips = Array.prototype.slice.call(content.querySelectorAll('[data-browse-filter]'));
    var cards = Array.prototype.slice.call(content.querySelectorAll('[data-browse-card]'));
    var sections = Array.prototype.slice.call(content.querySelectorAll('[data-browse-section]'));
    var empty = document.getElementById('browse-no-results');
    var count = document.getElementById('browse-result-count');
    var active = 'All';
    function apply() {
      var query = text(input.value).trim();
      var shown = 0;
      cards.forEach(function (card) {
        var matches = (!query || card.dataset.search.indexOf(query) >= 0) && (active === 'All' || card.dataset.category === active);
        card.hidden = !matches;
        if (matches) shown += 1;
      });
      sections.forEach(function (section) {
        section.hidden = !section.querySelector('[data-browse-card]:not([hidden])');
      });
      chips.forEach(function (chip) { chip.classList.toggle('active', chip.dataset.browseFilter === active); });
      clear.hidden = !query;
      empty.hidden = shown !== 0;
      count.textContent = shown + ' ' + (mode === 'shops' ? (shown === 1 ? 'shop' : 'shops') : (shown === 1 ? 'product' : 'products')) + ' found';
    }
    input.addEventListener('input', apply);
    clear.addEventListener('click', function () { input.value = ''; input.focus(); apply(); });
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () { active = chip.dataset.browseFilter; apply(); });
    });
    apply();
  }
  function renderShops(items) {
    var box = document.getElementById('content');
    if (!items.length) { box.innerHTML = '<div class="jora-empty">No shops are available yet.</div>'; return; }
    box.innerHTML = toolbar(categories(items), 'Search shops, areas or categories') +
      '<div class="jora-grid jora-browse-grid">' + items.map(function (shop) {
        var category = String(shop.category || shop.type || 'Other');
        var searchable = [shop.name, shop.address, shop.area, shop.city, category].join(' ');
        return '<a class="jora-card" data-browse-card data-category="' + safe(category) + '" data-search="' + safe(text(searchable)) + '" href="shop.html?id=' + encodeURIComponent(shop.id) + '">' +
          S.image(shop.logo || shop.image || shop.banner, shop.name || 'Shop') +
          '<div class="jora-card__body"><h2>' + safe(shop.name || 'Local shop') + '</h2><p>' + safe(shop.address || shop.area || category || 'Local seller') + '</p><div class="jora-meta">★ ' + safe(shop.rating || 'New') + (shop.timings ? ' · ' + safe(shop.timings) : '') + '</div></div></a>';
      }).join('') + '</div><div id="browse-no-results" class="jora-empty" hidden>No matching shops. Try another search or filter.</div>';
    bindFilters();
  }
  function renderProducts(items) {
    window.JoraBrowseProducts = items;
    var box = document.getElementById('content');
    if (!items.length) { box.innerHTML = '<div class="jora-empty">No products are available yet.</div>'; return; }
    var cats = categories(items);
    var sections = cats.map(function (category) {
      var list = items.filter(function (product) { return String(product.category || product.type || 'Other').trim() === category; });
      return '<section class="jora-section" data-browse-section><h2>' + safe(category) + '</h2><div class="jora-product-grid">' + list.map(function (product) {
        var searchable = [product.name, product.brand, product.shopName, category, product.description].join(' ');
        return '<article class="jora-card jora-product" data-browse-card data-category="' + safe(category) + '" data-search="' + safe(text(searchable)) + '">' +
          S.image(product.image || product.imageUrl, product.name || 'Product') +
          '<div class="jora-card__body"><h2>' + safe(product.name || 'Product') + '</h2><p>' + safe(product.shopName || product.brand || category) + '</p><div class="jora-price">' + S.money(product.price) + '</div><div class="jora-card-actions"><a class="jora-product-link" href="product.html?id=' + encodeURIComponent(product.id) + '">View product</a><button type="button" class="jora-wishlist-button" data-wishlist-product="' + safe(product.id) + '" aria-label="Add to wishlist">♡</button></div></div></article>';
      }).join('') + '</div></section>';
    }).join('');
    box.innerHTML = toolbar(cats, 'Search products, shops or categories') + '<div class="jora-browse-products">' + sections + '</div><div id="browse-no-results" class="jora-empty" hidden>No matching products. Try another search or filter.</div>';
    bindFilters();
  }
  function realCatalog(items) {
    return (Array.isArray(items) ? items : []).filter(function (item) {
      return item && String(item.id || '').indexOf('sample-') !== 0 && String(item.shopId || '').indexOf('sample-') !== 0;
    });
  }
  function localCatalog() { return realCatalog(S.read(cacheKey, [])); }
  function start() {
    var cached = localCatalog();
    var render = mode === 'shops' ? renderShops : renderProducts;
    if (cached.length) render(cached);
    try {
      if (!firebase.apps.length) firebase.initializeApp({});
      var db = firebase.firestore();
      db.collection(collectionName).limit(100).onSnapshot(function (snapshot) {
        var list = [];
        snapshot.forEach(function (doc) { list.push(Object.assign({ id: doc.id }, doc.data())); });
        list = realCatalog(list);
        try { localStorage.setItem(cacheKey, JSON.stringify(list)); } catch (_) {}
        render(list);
      }, function () { if (!cached.length) render([]); });
    } catch (_) { if (!cached.length) render([]); }
  }
  start();
}());
