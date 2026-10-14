(function () {
  function grouped() {
    if (!window._products || !window._products.length || !window._shop) return;
    var grid = document.getElementById('products');
    if (!grid || grid.dataset.joraGrouped) return;
    grid.dataset.joraGrouped = 'true';
    var groups = {};
    _products.forEach(function (product) {
      var category = product.category || product.subcategory || 'Products';
      (groups[category] || (groups[category] = [])).push(product);
    });
    grid.innerHTML = Object.keys(groups).map(function (category) {
      return '<section class="jora-section"><h2>' + eh(category) + '</h2><div class="products">' + groups[category].map(function (product) {
        var image = product.image ? '<img loading="lazy" src="' + eh(product.image) + '" alt="' + eh(product.name || 'Product') + '">' : prodIcon(product.category);
        var filter = product.subcategory || product.category || '';
        var search = ((product.name || '') + ' ' + (product.category || '') + ' ' + (product.subcategory || '')).toLowerCase();
        return '<a class="card" data-search="' + eh(search) + '" data-filter="' + eh(filter) + '" href="' + productUrl(product) + '"><div class="pic">' + image + '</div><div class="body"><div class="name">' + eh(product.name || 'Product') + '</div><div class="price-row"><span class="price">₹' + (Number(product.price) || 0).toLocaleString('en-IN') + '</span></div></div></a>';
      }).join('') + '</div></section>';
    }).join('');
    if (window.filterShopProducts) window.filterShopProducts((document.getElementById('shop-product-search') || {}).value || '');
  }
  var oldRender = window.renderProducts;
  window.renderProducts = function () {
    var result = oldRender.apply(this, arguments);
    setTimeout(grouped, 0);
    return result;
  };
}());
