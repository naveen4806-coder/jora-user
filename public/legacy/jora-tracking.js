(function () {
  'use strict';
  var S = window.JoraShell;
  var id = new URLSearchParams(location.search).get('id') || '';
  var app = document.getElementById('app');
  var map, shopMarker, riderMarker, destinationMarker, routeLine, channel, refreshTimer;

  function number(value) { value = Number(value); return Number.isFinite(value) ? value : null; }
  function point(lat, lng) { lat = number(lat); lng = number(lng); return lat === null || lng === null ? null : [lat, lng]; }
  function statusLabel(value) { return String(value || 'placed').replace(/_/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }); }
  function shell(message) { app.innerHTML = S.nav('account') + '<main class="jora-page"><a class="jora-back" href="orders.html">← Back to my orders</a><div class="jora-empty">' + S.esc(message) + '</div></main>'; }
  function age(value) {
    var when = new Date(value || 0).getTime();
    if (!when) return '';
    var seconds = Math.max(0, Math.round((Date.now() - when) / 1000));
    if (seconds < 60) return 'updated just now';
    if (seconds < 3600) return 'updated ' + Math.floor(seconds / 60) + ' min ago';
    return 'updated ' + Math.floor(seconds / 3600) + ' hr ago';
  }
  function marker(current, position, label, icon) {
    if (!map || !position) return current;
    if (current) current.setLatLng(position); else current = L.marker(position).addTo(map).bindPopup(label);
    if (icon) current.setIcon(L.divIcon({ className: 'jora-live-rider-marker', html: '<span>' + icon + '</span>', iconSize: [34, 34], iconAnchor: [17, 17] }));
    return current;
  }
  function mapFor(order) {
    var shop = point(order.shop_lat == null ? order.shopLat : order.shop_lat, order.shop_lng == null ? order.shopLng : order.shop_lng);
    var rider = point(order.rider_lat == null ? order.riderLat : order.rider_lat, order.rider_lng == null ? order.riderLng : order.rider_lng);
    var destination = point(order.delivery_lat == null ? order.deliveryLat : order.delivery_lat, order.delivery_lng == null ? order.deliveryLng : order.delivery_lng);
    var message = document.getElementById('map-message');
    if (!window.L) { message.textContent = 'The map library could not load. Check your internet connection and reload.'; return; }
    var first = shop || rider || destination;
    if (!first) { message.textContent = 'Your delivery address is being prepared. Live tracking starts after the shop assigns a rider.'; return; }
    if (!map) {
      map = L.map('tracking-map', { scrollWheelZoom: false }).setView(first, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
    }
    shopMarker = marker(shopMarker, shop, 'Shop');
    destinationMarker = marker(destinationMarker, destination, 'Delivery address');
    riderMarker = marker(riderMarker, rider, 'Live delivery partner', '●');
    if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
    var route = [shop, rider, destination].filter(Boolean);
    if (route.length > 1) {
      routeLine = L.polyline(route, { color: S.primary || '#2ECC71', weight: 4, opacity: 0.82 }).addTo(map);
      map.fitBounds(routeLine.getBounds(), { padding: [30, 30], maxZoom: 15 });
    } else map.setView(first, 15);
    if (rider) {
      var updated = age(order.rider_location_updated_at || order.riderLocationUpdatedAt);
      message.textContent = 'Live rider location is active' + (updated ? ' · ' + updated : '') + '.';
    } else if (order.rider_id || order.riderId) message.textContent = 'A delivery partner is assigned. Their live location will appear when they go online.';
    else message.textContent = 'The shop is preparing your order. Live tracking starts after a delivery partner is assigned.';
  }
  function render(order) {
    var title = order.productName || (order.items && order.items[0] && order.items[0].name) || 'Your order';
    if (map) { map.remove(); map = null; shopMarker = null; riderMarker = null; destinationMarker = null; routeLine = null; }
    app.innerHTML = S.nav('account') + '<main class="jora-page"><a class="jora-back" href="orders.html">← Back to my orders</a><section class="jora-hero"><div><h1>Track your order</h1><p>Order #' + S.esc(order.id || id) + ' · ' + S.esc(statusLabel(order.status)) + '</p></div></section><article class="jora-card jora-order"><div class="jora-order-head"><div><h2>' + S.esc(title) + '</h2><p>' + S.esc(order.shop_name || order.shopName || 'Jora shop') + '</p></div><strong>' + S.money(order.total || order.totalAmount) + '</strong></div><div id="tracking-map" style="height:300px;border-radius:14px;overflow:hidden;background:#eaf8ee;margin-top:16px"></div><p id="map-message" style="margin-top:12px;color:var(--j-muted)" aria-live="polite">Connecting to delivery location…</p></article></main>';
    mapFor(order);
  }
  async function load(api, user) {
    var result = await api.from('orders').select('*').eq('id', id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) { shell('Order not found.'); return; }
    if (result.data.customer_id !== user.id) { shell('This order belongs to another account.'); return; }
    render(result.data);
  }
  async function start() {
    if (!id) { shell('Choose an order to begin tracking.'); return; }
    try {
      var api = await JoraSupabase.ready();
      var session = await api.auth.getUser();
      var user = session.data && session.data.user;
      if (!user) { shell('Please sign in to track your order.'); return; }
      await load(api, user);
      channel = api.channel('jora-order-tracking-' + id).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'id=eq.' + id }, function () { load(api, user).catch(function () { shell('Unable to refresh tracking right now. Please reload and try again.'); }); }).subscribe();
      // Realtime reconnects automatically. This quiet fallback keeps the map
      // current if a mobile network blocks a WebSocket connection.
      refreshTimer = window.setInterval(function () { load(api, user).catch(function () {}); }, 20000);
      window.addEventListener('pagehide', function () { if (channel) api.removeChannel(channel); if (refreshTimer) clearInterval(refreshTimer); if (map) map.remove(); }, { once: true });
    } catch (error) {
      console.error('Jora tracking failed:', error);
      shell('Tracking is unavailable right now. Please check your connection and try again.');
    }
  }
  var style = document.createElement('style');
  style.textContent = '.jora-live-rider-marker{background:transparent;border:0}.jora-live-rider-marker span{display:grid;place-items:center;width:30px;height:30px;border:3px solid #fff;border-radius:50%;background:#168b47;color:#fff;box-shadow:0 3px 12px rgba(9,67,35,.35);font-size:1.35rem;line-height:1}';
  document.head.appendChild(style);
  start();
}());
