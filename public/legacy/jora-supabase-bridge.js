(function () {
  'use strict';
  var client, currentUser = null, listeners = [], clientReady;
  var tables = { shops: 'vendors', products: 'products', orders: 'orders', users: 'profiles', product_reviews: 'product_reviews', admin_banners: 'banners', notifications: 'notifications', wishlists: 'wishlists' };
  function getClient() {
    if (client) return Promise.resolve(client);
    if (window.parent && window.parent.__JORA_SUPABASE__) { client = window.parent.__JORA_SUPABASE__; return Promise.resolve(client); }
    return new Promise(function (resolve, reject) {
      window.addEventListener('message', function onReady(event) {
        if (event.origin !== window.location.origin || event.data?.type !== 'jora:supabase-ready') return;
        window.removeEventListener('message', onReady);
        if (window.parent.__JORA_SUPABASE__) { client = window.parent.__JORA_SUPABASE__; resolve(client); } else reject(new Error('Supabase client was not available.'));
      });
      window.parent.postMessage({ type: 'jora:supabase-request' }, window.location.origin);
    });
  }
  function userForLegacy(user) { return user ? { uid: user.id, email: user.email || '', displayName: user.user_metadata?.full_name || '', role: user.app_metadata?.role || user.user_metadata?.role || 'user', getIdToken: function () { return getClient().then(function (c) { return c.auth.getSession(); }).then(function (r) { return r.data.session?.access_token || ''; }); } } : null; }
  function emit(user) { currentUser = userForLegacy(user); listeners.slice().forEach(function (fn) { fn(currentUser); }); }
  function boot() { if (clientReady) return clientReady; clientReady = getClient().then(function (c) { return c.auth.getSession().then(function (r) { emit(r.data.session?.user || null); c.auth.onAuthStateChange(function (_, session) { emit(session?.user || null); }); return c; }); }); return clientReady; }
  function id(row) { return String(row?.id || ''); }
  function legacyRow(name, row) {
    if (name === 'shops') return Object.assign({}, row, { shopId: row.id, ownerUid: row.user_id, vendorId: row.user_id, image: row.image_url || '', imageUrl: row.image_url || '', isActive: row.is_active !== false, isOpen: row.is_open !== false });
    if (name === 'products') return Object.assign({}, row, { shopId: row.vendor_id, vendorId: row.vendor_id, image: row.image_url || '', isActive: row.is_active !== false, desc: row.description || '' });
    if (name === 'orders') return Object.assign({}, row, { customerUid: row.user_id, vendorUid: row.vendor_id, shopId: row.vendor_id, deliveryPartnerId: row.partner_id, deliveryFee: Number(row.delivery_charge || 0), subtotal: Number(row.product_amount || 0), productTax: Number(row.product_tax || 0), total: Number(row.total || 0), deliveryLat: row.delivery_lat, deliveryLng: row.delivery_lng, deliveryAddress: row.delivery_address, orderedAt: row.created_at });
    if (name === 'users') return Object.assign({}, row, { phoneNumber: row.phone });
    return row;
  }
  function Snap(row, exists) { this.id = id(row); this.exists = exists !== false; this._row = row || {}; }
  Snap.prototype.data = function () { return Object.assign({}, this._row); };
  function Snapshot(rows) { this.docs = rows.map(function (row) { return new Snap(row); }); }
  Snapshot.prototype.forEach = function (fn) { this.docs.forEach(fn); };
  function Collection(name, documentId) { this.name = name; this.documentId = documentId || ''; this.filters = []; this.max = 0; }
  Collection.prototype.clone = function () { var copy = new Collection(this.name, this.documentId); copy.filters = this.filters.slice(); copy.max = this.max; return copy; };
  Collection.prototype.doc = function (value) { return new Collection(this.name, value); };
  Collection.prototype.where = function (field, op, value) { var copy = this.clone(); copy.filters.push({ field: field, op: op, value: value }); return copy; };
  Collection.prototype.orderBy = function () { return this.clone(); };
  Collection.prototype.limit = function (value) { var copy = this.clone(); copy.max = Number(value) || 0; return copy; };
  Collection.prototype.rows = function () {
    var ref = this, table = tables[ref.name] || ref.name;
    return boot().then(function (c) {
      var q = c.from(table).select('*');
      if (ref.documentId) q = q.eq('id', ref.documentId);
      ref.filters.forEach(function (filter) { if (filter.op === '==') q = q.eq(filter.field === 'customerUid' ? 'user_id' : filter.field, filter.value); });
      if (ref.max) q = q.limit(ref.max);
      return q.then(function (result) { if (result.error) throw result.error; return (result.data || []).map(function (row) { return legacyRow(ref.name, row); }); });
    });
  };
  Collection.prototype.get = function () { var ref = this; return this.rows().then(function (rows) { return ref.documentId ? new Snap(rows[0] || { id: ref.documentId }, Boolean(rows[0])) : new Snapshot(rows); }); };
  Collection.prototype.add = function (data) { var table = tables[this.name] || this.name; return boot().then(function (c) { return c.from(table).insert(data).select().single(); }).then(function (r) { if (r.error) throw r.error; return { id: r.data.id }; }); };
  function profileRow(data, id) { data = data || {}; var row = { id: id }, name = data.name || data.full_name || data.displayName, phone = data.phone || data.phoneNumber, address = data.address || data.deliveryAddress, pincode = data.pincode || data.pin, avatar = data.avatar_url || data.avatarUrl; if (name) { row.name = name; row.full_name = name; } if (data.email) row.email = data.email; if (phone) row.phone = phone; if (address) row.address = address; if (pincode) row.pincode = pincode; if (data.lat !== undefined && data.lat !== null) row.lat = data.lat; if (data.lng !== undefined && data.lng !== null) row.lng = data.lng; if (avatar) row.avatar_url = avatar; return row; }
  Collection.prototype.set = function (data) { var table = tables[this.name] || this.name, ref = this; return boot().then(function (c) { var row = ref.name === 'users' ? profileRow(data, ref.documentId) : Object.assign({}, data, { id: ref.documentId }); return c.from(table).upsert(row); }).then(function (r) { if (r.error) throw r.error; return r; }); };
  Collection.prototype.update = function (data) { var table = tables[this.name] || this.name, ref = this; return boot().then(function (c) { var row = ref.name === 'users' ? profileRow(data, ref.documentId) : Object.assign({}, data); delete row.id; return c.from(table).update(row).eq('id', ref.documentId); }).then(function (r) { if (r.error) throw r.error; return r; }); };
  Collection.prototype.onSnapshot = function (success, failure) {
    var ref = this, alive = true, channel;
    ref.get().then(function (value) { if (alive) success(value); }).catch(function (error) { if (alive && failure) failure(error); });
    boot().then(function (c) { channel = c.channel('legacy-' + ref.name + '-' + Math.random()).on('postgres_changes', { event: '*', schema: 'public', table: tables[ref.name] || ref.name }, function () { ref.get().then(success).catch(failure); }).subscribe(); });
    return function () { alive = false; if (channel) getClient().then(function (c) { c.removeChannel(channel); }); };
  };
  function signupProfile() { try { return JSON.parse(localStorage.getItem('jora_pending_signup_profile') || '{}'); } catch (_) { return {}; } }
  var auth = { get currentUser() { return currentUser; }, onAuthStateChanged: function (fn) { listeners.push(fn); boot().then(function () { fn(currentUser); }); return function () { listeners = listeners.filter(function (x) { return x !== fn; }); }; }, signInWithEmailAndPassword: function (email, password) { return boot().then(function (c) { return c.auth.signInWithPassword({ email: email, password: password }); }).then(function (r) { if (r.error) throw r.error; return { user: userForLegacy(r.data.user) }; }); }, createUserWithEmailAndPassword: function (email, password) { var profile = signupProfile(); return boot().then(function (c) { return c.auth.signUp({ email: email, password: password, options: { data: { full_name: profile.full_name || localStorage.getItem('jora_pending_signup_name') || '', phone: profile.phone || '', address: profile.address || '', pincode: profile.pincode || '', lat: profile.lat || null, lng: profile.lng || null } } }); }).then(function (r) { if (r.error) throw r.error; return { user: userForLegacy(r.data.user), needsEmailConfirmation: !r.data.session }; }); }, signOut: function () { return boot().then(function (c) { return c.auth.signOut(); }); }, resendSignupConfirmation: function () { return Promise.resolve(); } };
  function database() { return { collection: function (name) { return new Collection(name); } }; }
  database.FieldValue = { serverTimestamp: function () { return new Date().toISOString(); } };
  window.jora = { apps: [], initializeApp: function () { boot(); return {}; }, auth: function () { return auth; }, firestore: database, analytics: function () { return {}; }, messaging: function () { return {}; } };
  window.auth = auth; window.db = database(); window.JoraSupabase = { ready: function () { return boot(); }, get client() { return client; } };
  window.JoraPricing = { DELIVERY_RATE_PER_KM: 10, getOrderTotals: function (input) { input = input || {}; var amount = (input.items || []).reduce(function (sum, item) { return sum + Number(item.price || 0) * Number(item.qty || 0); }, 0), distance = Number(input.distanceKm || 0), deliveryCharge = Math.round(distance * 10 * 100) / 100; return { productAmount: amount, distanceKm: distance, deliveryCharge: deliveryCharge, productTax: 0, total: amount + deliveryCharge }; } };
  boot().catch(function (error) { console.error('Jora backend unavailable:', error.message); });
}());
