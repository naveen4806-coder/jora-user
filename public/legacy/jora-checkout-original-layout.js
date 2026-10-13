(function () {
  'use strict';
  function mount() {
    var form = document.getElementById('checkout-form');
    var map = document.getElementById('checkout-map');
    var summary = document.querySelector('.jora-checkout-layout > aside');
    if (!form || !map || !summary || form.dataset.originalLayout === 'true') return;
    form.dataset.originalLayout = 'true';
    summary.classList.add('jora-delivery-summary');
    var heading = summary.querySelector('h2');
    if (heading) heading.textContent = 'Order details';
    form.insertBefore(summary, map);
    var pin = document.createElement('p');
    pin.className = 'jora-pinned-location';
    pin.id = 'checkout-pinned-location';
    pin.textContent = 'Pinned: select your delivery location on the map';
    map.insertAdjacentElement('afterend', pin);
    var edit = document.createElement('div');
    edit.className = 'jora-map-editor';
    edit.innerHTML = '<div><b>Edit delivery address on map</b><small>Search, move the pin, and save your exact location.</small></div><button type="button" id="checkout-open-map">Open Map</button>';
    pin.insertAdjacentElement('afterend', edit);
    edit.querySelector('button').onclick = function () { map.scrollIntoView({ behavior: 'smooth', block: 'center' }); map.focus && map.focus(); };
    var cod = form.querySelector('input[name="payment"][value="cod"]');
    if (cod && !document.getElementById('pay-online')) {
      var online = document.createElement('label');
      online.className = 'jora-payment-option jora-payment-online';
      online.innerHTML = '<input type="radio" name="payment" id="pay-online" value="online"><span><b>🔒 Pay Online</b><small>UPI, card, net banking & wallets</small></span><em>Setup required</em>';
      cod.closest('label').insertAdjacentElement('afterend', online);
      online.querySelector('input').onchange = function () {
        var note = document.getElementById('checkout-note');
        if (note) { note.textContent = 'Online payment is not configured yet. Please select Cash on Delivery.'; note.className = 'jora-checkout-note is-error'; }
      };
    }
    form.addEventListener('submit', function (event) {
      if (document.getElementById('pay-online') && document.getElementById('pay-online').checked) {
        event.preventDefault(); event.stopImmediatePropagation();
        var note = document.getElementById('checkout-note');
        if (note) { note.textContent = 'Online payment is not configured yet. Please select Cash on Delivery.'; note.className = 'jora-checkout-note is-error'; }
      }
    }, true);
  }
  new MutationObserver(mount).observe(document.getElementById('app'), { childList: true, subtree: true });
  mount();
}());
