(function () {
  'use strict';
  var app = document.getElementById('app'), api, user, channel, watchId, activeOrderId = null, orders = [];
  function esc(value) { return JoraShell.esc(value == null ? '' : value); }
  function money(value) { return JoraShell.money(value || 0); }
  function label(status) { return String(status || 'placed').replace(/_/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); }); }
  function note(text, type) { var target = document.getElementById('delivery-note'); if (target) { target.textContent = text || ''; target.className = 'jora-checkout-note' + (type ? ' is-' + type : ''); } }
  function shell(message) { app.innerHTML = '<main class="jora-page"><section class="jora-hero"><div><p class="jora-eyebrow">Jora delivery</p><h1>Delivery partner</h1><p>' + esc(message) + '</p></div></section></main>'; }
  function currentOrder() { return orders.find(function (order) { return order.id === activeOrderId; }) || null; }
  function positionUpdate(position) {
    var order = currentOrder();
    var now = new Date().toISOString(), latitude = position.coords.latitude, longitude = position.coords.longitude, accuracy = Math.round(position.coords.accuracy || 0);
    var writes = [api.from('delivery_partner_presence').upsert({ id: user.id, latitude: latitude, longitude: longitude, location_accuracy: accuracy, location_updated_at: now, is_online: true, active_order_id: order ? order.id : null, updated_at: now }, { onConflict: 'id' })];
    if (order) writes.push(api.from('orders').update({ rider_lat: latitude, rider_lng: longitude, rider_location_accuracy: accuracy, rider_location_updated_at: now, updated_at: now }).eq('id', order.id));
    Promise.all(writes).then(function (results) { if (results.some(function (result) { return result.error; })) throw results.find(function (result) { return result.error; }).error; note(order ? 'Live location is sharing with the customer.' : 'You are online and available for assignments.', 'success'); }).catch(function (error) { console.error('Location update failed', error); note('Could not share location. Check your connection and try again.', 'error'); });
  }
  function startAvailability() {
    if (!navigator.geolocation) { note('Location is unavailable in this browser.', 'error'); return; }
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    note('Sharing your availability…');
    navigator.geolocation.getCurrentPosition(positionUpdate, function () { note('Location permission is required to go online.', 'error'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    watchId = navigator.geolocation.watchPosition(positionUpdate, function () { note('Location permission is required to stay online.', 'error'); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
  }
  function startLocation(orderId) {
    activeOrderId = orderId;
    startAvailability();
    render();
  }
  async function setOutForDelivery(orderId) {
    var result = await api.from('orders').update({ status: 'out_for_delivery', updated_at: new Date().toISOString() }).eq('id', orderId);
    if (result.error) throw result.error;
    startLocation(orderId);
  }
  async function goOffline() {
    if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null; }
    activeOrderId = null;
    var result = await api.from('delivery_partner_presence').upsert({ id: user.id, is_online: false, active_order_id: null, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (result.error) throw result.error;
    render();
  }
  function card(order) {
    var item = order.items && order.items[0] || {}, active = order.id === activeOrderId, live = order.rider_location_updated_at;
    return '<article class="jora-card jora-order" style="margin-top:14px"><div class="jora-order-head"><div><h2>' + esc(item.name || 'Customer order') + '</h2><p>' + esc(order.shop_name || 'Jora shop') + ' · ' + esc(order.delivery_address || 'Delivery address') + '</p></div><strong>' + money(order.total) + '</strong></div><p style="margin:12px 0;color:var(--j-muted)"><b>' + esc(label(order.status)) + '</b>' + (live ? ' · Location last sent ' + esc(new Date(live).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : '') + '</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="jora-button" type="button" data-live="' + esc(order.id) + '">' + (active ? 'Live tracking active' : 'Start live tracking') + '</button>' + (order.status !== 'out_for_delivery' && order.status !== 'delivered' ? '<button class="jora-button jora-button-secondary" type="button" data-out="' + esc(order.id) + '">Mark out for delivery</button>' : '') + '</div></article>';
  }
  function render() {
    app.innerHTML = '<main class="jora-page"><section class="jora-hero"><div><p class="jora-eyebrow">Jora delivery</p><h1>Delivery partner</h1><p>Share your location only while completing an assigned order.</p></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="jora-button" id="go-online" type="button">Go online</button><button class="jora-button jora-button-secondary" id="go-offline" type="button">Go offline</button></div></section><p id="delivery-note" class="jora-checkout-note" aria-live="polite"></p><section>' + (orders.length ? orders.map(card).join('') : '<div class="jora-empty">Go online to appear to nearby shops. Assigned orders will appear here automatically.</div>') + '</section></main>';
    var offline = document.getElementById('go-offline');
    offline.onclick = function () { goOffline().catch(function () { note('Could not go offline. Please try again.', 'error'); }); };
    document.getElementById('go-online').onclick = startAvailability;
    app.querySelectorAll('[data-live]').forEach(function (button) { button.onclick = function () { startLocation(button.dataset.live); }; });
    app.querySelectorAll('[data-out]').forEach(function (button) { button.onclick = function () { setOutForDelivery(button.dataset.out).catch(function () { note('Could not update this order. Please try again.', 'error'); }); }; });
  }
  async function load() {
    var result = await api.from('orders').select('*').eq('rider_id', user.id).order('created_at', { ascending: false });
    if (result.error) throw result.error;
    orders = (result.data || []).filter(function (order) { return order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'refunded'; });
    if (activeOrderId && !currentOrder()) { if (watchId != null) navigator.geolocation.clearWatch(watchId); watchId = null; activeOrderId = null; }
    render();
  }
  async function start() {
    try {
      api = await JoraSupabase.ready();
      var session = await api.auth.getUser(); user = session.data && session.data.user;
      if (!user) { shell('Please sign in with your delivery-partner account.'); return; }
      await load();
      channel = api.channel('jora-delivery-assignments-' + user.id).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: 'rider_id=eq.' + user.id }, function () { load().catch(function () { note('Could not refresh assignments.', 'error'); }); }).subscribe();
      window.addEventListener('pagehide', function () { if (watchId != null) navigator.geolocation.clearWatch(watchId); if (channel) api.removeChannel(channel); }, { once: true });
    } catch (error) { console.error('Delivery portal failed', error); shell('Delivery assignments are unavailable right now. Please check your connection and sign in again.'); }
  }
  start();
}());
