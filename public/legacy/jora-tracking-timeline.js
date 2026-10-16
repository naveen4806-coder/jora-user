(function () {
  'use strict';
  var steps = [
    ['placed', 'Order placed', 'Your order has been received.'],
    ['confirmed', 'Confirmed', 'The shop has confirmed your order.'],
    ['packed', 'Packed', 'Your items are packed and ready.'],
    ['handed over to delivery partner', 'Handed to delivery partner', 'Your order is with the delivery partner.'],
    ['out for delivery', 'Out for delivery', 'Your rider is on the way.'],
    ['delivered', 'Delivered', 'Your order has been delivered.']
  ];
  function normal(value) { return String(value || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim(); }
  function indexFor(status) {
    status = normal(status);
    if (status === 'cancelled' || status === 'refunded') return -1;
    if (status === 'processing' || status === 'preparing') return 1;
    if (status === 'shipped' || status === 'handovered' || status === 'handed over') return 3;
    return Math.max(0, steps.map(function (item) { return item[0]; }).indexOf(status));
  }
  function mount() {
    var card = document.querySelector('.jora-order');
    var map = document.getElementById('tracking-map');
    var hero = document.querySelector('.jora-hero p');
    if (!card || !map || !hero || card.querySelector('.jora-track-timeline')) return;
    var status = normal(hero.textContent.split('·').pop());
    var current = indexFor(status), cancelled = status === 'cancelled' || status === 'refunded';
    var timeline = document.createElement('section');
    timeline.className = 'jora-track-timeline' + (cancelled ? ' is-cancelled' : '');
    timeline.innerHTML = '<h2>' + (cancelled ? 'Order cancelled' : 'Delivery progress') + '</h2>' + (cancelled ? '<p class="jora-track-cancel">This order was ' + status + '.</p>' : steps.map(function (step, index) { var state = index < current ? 'done' : index === current ? 'current' : 'next'; return '<div class="jora-track-step ' + state + '"><span class="jora-track-dot">' + (index < current ? '✓' : index === current ? '•' : '') + '</span><div><b>' + step[1] + '</b><small>' + step[2] + '</small></div></div>'; }).join(''));
    map.parentNode.insertBefore(timeline, map);
  }
  var style = document.createElement('style');
  style.textContent = '.jora-track-timeline{margin:18px 0;padding:18px;border:1px solid var(--j-line);border-radius:14px;background:var(--j-card)}.jora-track-timeline h2{margin:0 0 16px;font-size:1.1rem}.jora-track-step{position:relative;display:grid;grid-template-columns:28px 1fr;gap:10px;min-height:56px;color:var(--j-muted)}.jora-track-step:not(:last-child)::after{content:"";position:absolute;top:25px;left:11px;width:2px;height:calc(100% - 18px);background:var(--j-line)}.jora-track-dot{position:relative;z-index:1;display:grid;place-items:center;width:24px;height:24px;border:2px solid var(--j-line);border-radius:50%;background:var(--j-card);font-size:.74rem}.jora-track-step b,.jora-track-step small{display:block}.jora-track-step b{font-size:.9rem}.jora-track-step small{margin-top:3px;font-size:.75rem}.jora-track-step.done{color:var(--j-primary-active)}.jora-track-step.done .jora-track-dot{border-color:var(--j-primary);background:var(--j-primary);color:#fff}.jora-track-step.done:not(:last-child)::after{background:var(--j-primary)}.jora-track-step.current{color:var(--j-ink)}.jora-track-step.current .jora-track-dot{border-color:var(--j-primary-active);background:var(--j-primary-active);color:#fff;box-shadow:0 0 0 4px rgba(46,204,113,.15)}.jora-track-cancel{margin:0;color:#c83737;font-weight:700}';
  document.head.appendChild(style);
  new MutationObserver(mount).observe(document.getElementById('app'), { childList: true, subtree: true });
  mount();
}());
