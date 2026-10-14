/*
 * Transitional data adapter for the retained Jora static screens.
 * It uses Supabase only. The Firebase-shaped API is deliberately local to this
 * bridge so existing screen markup can be migrated safely one flow at a time.
 */
(function () {
  'use strict';
  var client = null, initPromise = null, listeners = [], authListeners = [], currentUser = null;
  var configWaiters = [], configured = false, configError = null;
  // Keep authentication emails on the public Jora domain even when signup starts in a Vercel preview.
  var OFFICIAL_APP_URL = 'https://joradelivery.vercel.app/';

  function emitAuth(user) { currentUser = user; authListeners.slice().forEach(function (fn) { try { fn(user); } catch (error) { console.error('Auth listener failed', error); } }); }
  function firebaseError(error) {
    if (!error) return { code: 'auth/unknown', message: 'Something went wrong.' };
    var codes = { 'Invalid login credentials': 'auth/invalid-credential', 'User already registered': 'auth/email-already-in-use', 'Password should be at least 6 characters': 'auth/weak-password', 'Email not confirmed': 'auth/email-not-verified' };
    error.code = codes[error.message] || error.code || 'auth/unknown';
    return error;
  }
  function wrapUser(user) {
    if (!user) return null;
    return { uid: user.id, email: user.email || '', displayName: (user.user_metadata && user.user_metadata.full_name) || '', getIdToken: function () { return client.auth.getSession().then(function (result) { return result.data.session && result.data.session.access_token || ''; }); } };
  }
  function configUnavailable() {
    var error = new Error('Jora could not connect to its secure account service. Please reload and try again.');
    error.code = 'jora/supabase-not-configured';
    return error;
  }
  function waitForConfig() {
    if (configured) return Promise.resolve(client);
    if (configError) return Promise.reject(configError);
    return new Promise(function (resolve, reject) {
      var timeout = setTimeout(function () {
        var index = configWaiters.indexOf(entry);
        if (index >= 0) configWaiters.splice(index, 1);
        reject(configUnavailable());
      }, 10000);
      var entry = { resolve: function (api) { clearTimeout(timeout); resolve(api); }, reject: function (error) { clearTimeout(timeout); reject(error); } };
      configWaiters.push(entry);
    });
  }
  function configure(config) {
    if (configured || !config || !config.url || !config.key) return;
    configured = true;
    initPromise = import('https://esm.sh/@supabase/supabase-js@2?bundle').then(function (module) {
      client = module.createClient(config.url, config.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      return client.auth.getSession();
    }).then(function (result) {
      emitAuth(wrapUser(result.data && result.data.session && result.data.session.user));
      client.auth.onAuthStateChange(function (_event, session) { emitAuth(wrapUser(session && session.user)); });
      configWaiters.splice(0).forEach(function (entry) { entry.resolve(client); });
      return client;
    }).catch(function (error) {
      configured = false;
      configError = error;
      configWaiters.splice(0).forEach(function (entry) { entry.reject(error); });
      console.error('Unable to initialise Jora Supabase', error);
    });
  }
  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin || !event.data || event.data.type !== 'jora:supabase-config') return;
    configure(event.data);
  });
  // In the React shell the parent sends this configuration by postMessage.
  // A direct /legacy/*.html visit has no shell, so load the build-generated
  // public config file as a reliable fallback.
  function configureRuntimeFallback() {
    if (window.__JORA_SUPABASE_CONFIG__) configure(window.__JORA_SUPABASE_CONFIG__);
    if (configured || document.querySelector('script[data-jora-supabase-runtime]')) return;
    var runtime = document.createElement('script');
    runtime.src = 'jora-supabase-runtime-config.js';
    runtime.async = true;
    runtime.dataset.joraSupabaseRuntime = 'true';
    runtime.onload = function () { configure(window.__JORA_SUPABASE_CONFIG__); };
    runtime.onerror = function () { console.error('Jora Supabase runtime config could not be loaded.'); };
    document.head.appendChild(runtime);
  }
  try { window.parent.postMessage({ type: 'jora:supabase-config-request' }, window.location.origin); } catch (_) {}
  configureRuntimeFallback();

  function tableFor(name) { return { users: 'profiles', orders: 'orders', shops: 'shops', products: 'products', notifications: 'notifications', admin_banners: 'admin_banners', admin_offers: 'admin_offers', categories: 'categories' }[name] || name; }
  function fieldFor(table, field) {
    var maps = {
      profiles: { uid: 'id', name: 'full_name', phoneNumber: 'phone', avatarUrl: 'avatar_url', createdAt: 'created_at', lastLogin: 'updated_at' },
      shops: { ownerUid: 'owner_id', vendorUid: 'owner_id', image: 'image_url', imageUrl: 'image_url', banner: 'banner_url', lat: 'latitude', lng: 'longitude', isActive: 'active', createdAt: 'created_at', updatedAt: 'updated_at' },
      products: { shopId: 'shop_id', vendorId: 'shop_id', image: 'image_url', imageUrl: 'image_url', isActive: 'active', createdAt: 'created_at', updatedAt: 'updated_at' },
      orders: { customerUid: 'customer_id', shopId: 'shop_id', shopName: 'shop_name', deliveryAddress: 'delivery_address', deliveryLat: 'delivery_lat', deliveryLng: 'delivery_lng', deliveryFee: 'delivery_fee', paymentMethod: 'payment_method', paymentStatus: 'payment_status', riderId: 'rider_id', riderLat: 'rider_lat', riderLng: 'rider_lng', createdAt: 'created_at', updatedAt: 'updated_at', deliveredAt: 'delivered_at', cancelledAt: 'cancelled_at' },
      notifications: { userUid: 'user_id', createdAt: 'created_at', readAt: 'read_at' },
      product_reviews: { productId: 'product_id', userId: 'user_id', verifiedPurchase: 'verified_purchase', createdAt: 'created_at' }
    };
    return (maps[table] && maps[table][field]) || field;
  }
  function legacyRow(table, row) {
    if (!row) return row;
    var out = Object.assign({}, row);
    var reverse = {
      profiles: { full_name: 'name', phone: 'phoneNumber', avatar_url: 'avatarUrl', created_at: 'createdAt', updated_at: 'updatedAt' },
      shops: { owner_id: 'ownerUid', image_url: 'image', banner_url: 'banner', latitude: 'lat', longitude: 'lng', created_at: 'createdAt', updated_at: 'updatedAt' },
      products: { shop_id: 'shopId', image_url: 'image', created_at: 'createdAt', updated_at: 'updatedAt' },
      orders: { customer_id: 'customerUid', shop_id: 'shopId', shop_name: 'shopName', delivery_address: 'deliveryAddress', delivery_lat: 'deliveryLat', delivery_lng: 'deliveryLng', delivery_fee: 'deliveryFee', payment_method: 'paymentMethod', payment_status: 'paymentStatus', rider_id: 'riderId', rider_lat: 'riderLat', rider_lng: 'riderLng', created_at: 'createdAt', updated_at: 'updatedAt', delivered_at: 'deliveredAt', cancelled_at: 'cancelledAt' },
      notifications: { user_id: 'userUid', created_at: 'createdAt', read_at: 'readAt' },
      product_reviews: { product_id: 'productId', user_id: 'userId', verified_purchase: 'verifiedPurchase', created_at: 'createdAt' }
    };
    Object.keys(reverse[table] || {}).forEach(function (key) { out[reverse[table][key]] = row[key]; });
    return out;
  }
  function orderRow(data) {
    var status = String(data.status || 'placed').toLowerCase().replace(/\s+/g, '_');
    if ({ handedover: 1, handovered: 1, shipped: 1 }[status]) status = 'handed_to_delivery_partner';
    if (status === 'out_for_delivery') status = 'out_for_delivery';
    if (['placed', 'confirmed', 'packed', 'handed_to_delivery_partner', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'].indexOf(status) < 0) status = 'placed';
    return { customer_id: data.customerUid || currentUser && currentUser.uid, shop_id: data.shopId || null, shop_name: data.shopName || '', items: data.items || [], subtotal: Number(data.subtotal) || 0, delivery_fee: Number(data.deliveryFee) || 0, total: Number(data.total) || 0, delivery_address: data.deliveryAddress || '', delivery_lat: data.deliveryLat == null ? null : Number(data.deliveryLat), delivery_lng: data.deliveryLng == null ? null : Number(data.deliveryLng), phone: data.phone || '', payment_method: data.paymentMethod || 'cod', payment_status: String(data.paymentStatus || 'pending').toLowerCase(), status: 'placed' };
  }
  function profileRow(data) { var row = {}; if (data.name !== undefined || data.full_name !== undefined) row.full_name = data.name !== undefined ? data.name : data.full_name; if (data.email !== undefined) row.email = data.email; if (data.phoneNumber !== undefined || data.phone !== undefined) row.phone = data.phoneNumber !== undefined ? data.phoneNumber : data.phone; if (data.address !== undefined) row.address = data.address; if (data.avatarUrl !== undefined || data.avatar_url !== undefined) row.avatar_url = data.avatarUrl !== undefined ? data.avatarUrl : data.avatar_url; return row; }
  function reviewRow(data) { return { product_id: data.productId, user_id: data.userId || currentUser && currentUser.uid, rating: Number(data.rating) || 5, comment: data.comment || '', verified_purchase: !!data.verifiedPurchase }; }
  function snapshot(rows) { return { forEach: function (fn) { rows.forEach(function (row) { fn({ id: row.id, exists: true, data: function () { return row; } }); }); }, docs: rows.map(function (row) { return { id: row.id, exists: true, data: function () { return row; } }; }) }; }
  function queryRows(ref) {
    return waitForConfig().then(function (api) {
      var query = api.from(ref.table).select('*');
      ref.filters.forEach(function (filter) { if (filter.op === '==') query = query.eq(fieldFor(ref.table, filter.field), filter.value); });
      ref.orders.forEach(function (order) { query = query.order(fieldFor(ref.table, order.field), { ascending: !order.desc }); });
      if (ref.max) query = query.limit(ref.max);
      return query.then(function (result) { if (result.error) throw result.error; return (result.data || []).map(function (row) { return legacyRow(ref.table, row); }); });
    });
  }
  function Collection(name, id) { this.name = name; this.table = tableFor(name); this.id = id || null; this.filters = []; this.orders = []; this.max = null; }
  Collection.prototype.where = function (field, op, value) { var next = this.clone(); next.filters.push({ field: field, op: op, value: value }); return next; };
  Collection.prototype.orderBy = function (field, direction) { var next = this.clone(); next.orders.push({ field: field, desc: String(direction).toLowerCase() === 'desc' }); return next; };
  Collection.prototype.limit = function (count) { var next = this.clone(); next.max = count; return next; };
  Collection.prototype.clone = function () { var next = new Collection(this.name, this.id); next.filters = this.filters.slice(); next.orders = this.orders.slice(); next.max = this.max; return next; };
  Collection.prototype.doc = function (id) { return new Collection(this.name, id); };
  Collection.prototype.get = function () {
    var ref = this;
    return waitForConfig().then(function (api) {
      if (ref.id) return api.from(ref.table).select('*').eq('id', ref.id).maybeSingle().then(function (result) { if (result.error) throw result.error; var row = result.data && legacyRow(ref.table, result.data); return { id: ref.id, exists: !!row, data: function () { return row || {}; } }; });
      return queryRows(ref).then(snapshot);
    });
  };
  Collection.prototype.set = function (data, options) {
    var ref = this;
    return waitForConfig().then(function (api) {
      if (!ref.id) throw new Error('A document id is required.');
      var row = ref.table === 'profiles' ? profileRow(data) : data;
      if (ref.table === 'profiles') row.id = ref.id;
      var request = options && options.merge ? api.from(ref.table).upsert(row, { onConflict: 'id' }) : api.from(ref.table).upsert(row, { onConflict: 'id' });
      return request.then(function (result) { if (result.error) throw result.error; });
    });
  };
  Collection.prototype.add = function (data) {
    var ref = this;
    return waitForConfig().then(function (api) {
      var row = ref.table === 'orders' ? orderRow(data) : ref.table === 'product_reviews' ? reviewRow(data) : data;
      return api.from(ref.table).insert(row).select('id').single().then(function (result) { if (result.error) throw result.error; return { id: result.data.id }; });
    });
  };
  Collection.prototype.onSnapshot = function (success, failure) {
    var ref = this, stopped = false, channel;
    function load() { return ref.get().then(function (result) { if (!stopped) success(result); }).catch(function (error) { if (!stopped && failure) failure(error); }); }
    waitForConfig().then(function (api) { load(); if (['orders', 'notifications'].indexOf(ref.table) >= 0) channel = api.channel('jora-' + ref.table + '-' + Math.random().toString(36).slice(2)).on('postgres_changes', { event: '*', schema: 'public', table: ref.table }, load).subscribe(); }).catch(function (error) { if (failure) failure(error); });
    return function () { stopped = true; if (channel && client) client.removeChannel(channel); };
  };
  Collection.prototype.update = function (data) { var ref = this; return waitForConfig().then(function (api) { return api.from(ref.table).update(data).eq('id', ref.id).then(function (result) { if (result.error) throw result.error; }); }); };

  var auth = {
    get currentUser() { return currentUser; },
    onAuthStateChanged: function (callback) { authListeners.push(callback); if (configured) setTimeout(function () { callback(currentUser); }, 0); return function () { authListeners = authListeners.filter(function (item) { return item !== callback; }); }; },
    signInWithEmailAndPassword: function (email, password) { return waitForConfig().then(function (api) { return api.auth.signInWithPassword({ email: email, password: password }); }).then(function (result) { if (result.error) throw firebaseError(result.error); return { user: wrapUser(result.data.user) }; }); },
    createUserWithEmailAndPassword: function (email, password) { return waitForConfig().then(function (api) { var metadata = { full_name: localStorage.getItem('jora_pending_signup_name') || '' }; return api.auth.signUp({ email: email, password: password, options: { data: metadata, emailRedirectTo: OFFICIAL_APP_URL } }); }).then(function (result) { if (result.error) throw firebaseError(result.error); return { user: wrapUser(result.data.user), needsEmailConfirmation: !!(result.data.user && !result.data.session) }; }); },
    resendSignupConfirmation: function (email) { return waitForConfig().then(function (api) { return api.auth.resend({ type: 'signup', email: email, options: { emailRedirectTo: OFFICIAL_APP_URL } }); }).then(function (result) { if (result.error) throw firebaseError(result.error); }); },
    signOut: function () { return waitForConfig().then(function (api) { return api.auth.signOut(); }).then(function (result) { if (result.error) throw firebaseError(result.error); }); }
  };
  function firestore() { return { collection: function (name) { return new Collection(name); } }; }
  firestore.CollectionReference = Collection;
  firestore.FieldValue = { serverTimestamp: function () { return new Date().toISOString(); } };
  window.firebase = { apps: [], initializeApp: function () { if (!this.apps.length) this.apps.push({ name: '[DEFAULT]' }); return this.apps[0]; }, auth: function () { return auth; }, firestore: firestore, analytics: function () { return {}; }, messaging: function () { return {}; } };
  window.JoraSupabase = { ready: waitForConfig, get client() { return client; } };
}());
