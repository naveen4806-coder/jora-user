/*
 * Transitional data adapter for the retained Jora static screens.
 * It uses Supabase only. The Firebase-shaped API is deliberately local to this
 * bridge so existing screen markup can be migrated safely one flow at a time.
 */
(function () {
  'use strict';
  var client = null, initPromise = null, listeners = [], authListeners = [], currentUser = null;
  var configWaiters = [], configured = false, configError = null, lastConfig = null, configRetries = 0;
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
      }, 20000);
      var entry = { resolve: function (api) { clearTimeout(timeout); resolve(api); }, reject: function (error) { clearTimeout(timeout); reject(error); } };
      configWaiters.push(entry);
    });
  }
  function configure(config) {
    if (config && config.url && config.key) lastConfig = config;
    if (configured || initPromise || !config || !config.url || !config.key) return;
    configError = null;
    initPromise = import('https://esm.sh/@supabase/supabase-js@2?bundle').then(function (module) {
      client = module.createClient(config.url, config.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      return client.auth.getSession();
    }).then(function (result) {
      if (result.error) throw result.error;
      emitAuth(wrapUser(result.data && result.data.session && result.data.session.user));
      client.auth.onAuthStateChange(function (_event, session) { emitAuth(wrapUser(session && session.user)); });
      configured = true;
      configWaiters.splice(0).forEach(function (entry) { entry.resolve(client); });
      return client;
    }).catch(function (error) {
      configured = false;
      client = null;
      initPromise = null;
      configError = error;
      configWaiters.splice(0).forEach(function (entry) { entry.reject(error); });
      console.error('Unable to initialise Jora Supabase', error);
      // A cold cache can occasionally fail the first module request. Retry
      // once automatically so a signed-in customer never needs to refresh.
      if (lastConfig && configRetries < 1) {
        configRetries += 1;
        setTimeout(function () { configError = null; configure(lastConfig); }, 800);
      }
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
    if (configured || initPromise || document.querySelector('script[data-jora-supabase-runtime]')) return;
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
      orders: { customerUid: 'customer_id', vendorUid: 'vendor_id', shopId: 'shop_id', shopName: 'shop_name', shopLat: 'shop_lat', shopLng: 'shop_lng', deliveryAddress: 'delivery_address', deliveryLat: 'delivery_lat', deliveryLng: 'delivery_lng', deliveryFee: 'delivery_fee', paymentMethod: 'payment_method', paymentStatus: 'payment_status', riderId: 'rider_id', deliveryPartnerId: 'rider_id', riderLat: 'rider_lat', riderLng: 'rider_lng', riderLocationAccuracy: 'rider_location_accuracy', riderLocationUpdatedAt: 'rider_location_updated_at', createdAt: 'created_at', updatedAt: 'updated_at', deliveredAt: 'delivered_at', cancelledAt: 'cancelled_at' },
      notifications: { userUid: 'user_id', createdAt: 'created_at', readAt: 'read_at' },
      product_reviews: { productId: 'product_id', userId: 'user_id', verifiedPurchase: 'verified_purchase', createdAt: 'created_at' }
    };
    return (maps[table] && maps[table][field]) || field;
  }
  function legacyRow(table, row) {
    if (!row) return row;
    // Order workflow flags are stored in the shared row's data object. Keep
    // authoritative columns last so JSON cannot override the actual owner or status.
    var out = Object.assign({}, table === 'orders' && row.data || {}, row);
    var reverse = {
      profiles: { full_name: 'name', phone: 'phoneNumber', avatar_url: 'avatarUrl', created_at: 'createdAt', updated_at: 'updatedAt' },
      shops: { owner_id: 'ownerUid', image_url: 'image', banner_url: 'banner', latitude: 'lat', longitude: 'lng', created_at: 'createdAt', updated_at: 'updatedAt' },
      products: { shop_id: 'shopId', image_url: 'image', created_at: 'createdAt', updated_at: 'updatedAt' },
      orders: { customer_id: 'customerUid', vendor_id: 'vendorUid', shop_id: 'shopId', shop_name: 'shopName', shop_lat: 'shopLat', shop_lng: 'shopLng', delivery_address: 'deliveryAddress', delivery_lat: 'deliveryLat', delivery_lng: 'deliveryLng', delivery_fee: 'deliveryFee', payment_method: 'paymentMethod', payment_status: 'paymentStatus', rider_id: 'riderId', rider_lat: 'riderLat', rider_lng: 'riderLng', rider_location_accuracy: 'riderLocationAccuracy', rider_location_updated_at: 'riderLocationUpdatedAt', created_at: 'createdAt', updated_at: 'updatedAt', delivered_at: 'deliveredAt', cancelled_at: 'cancelledAt' },
      notifications: { user_id: 'userUid', created_at: 'createdAt', read_at: 'readAt' },
      product_reviews: { product_id: 'productId', user_id: 'userId', verified_purchase: 'verifiedPurchase', created_at: 'createdAt' }
    };
    Object.keys(reverse[table] || {}).forEach(function (key) { out[reverse[table][key]] = row[key]; });
    if (table === 'orders') {
      var statusLabels = { placed: 'Confirmed', confirmed: 'Confirmed', packed: 'Packed', handed_to_delivery_partner: 'Ready for Pickup', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded' };
      var first = Array.isArray(row.items) && row.items[0] || {};
      out.status = statusLabels[row.status] || row.status;
      out.deliveryPartnerId = row.rider_id;
      out.deliveryPartnerUid = row.rider_id;
      out.orderedAt = row.created_at;
      out.productName = out.productName || first.name || 'Customer order';
      out.category = out.category || first.category || '';
      out.qty = out.qty || first.qty || 1;
    }
    return out;
  }
  // The vendor app publishes its approved catalogue as JSON rows in these
  // marketplace tables. Flatten those rows here so every retained customer
  // screen can consume them with the same shops/products API.
  function marketRow(table, row) {
    var data = Object.assign({}, row && row.data || {});
    if (table === 'shops') {
      return Object.assign(data, {
        id: row.vendor_shop_id,
        owner_id: data.ownerUid || data.vendorId || row.vendor_id || '',
        image_url: data.image_url || data.image || data.imageUrl || '',
        banner_url: data.banner_url || data.banner || '',
        latitude: data.latitude == null ? data.lat : data.latitude,
        longitude: data.longitude == null ? data.lng : data.longitude,
        active: data.active !== false && data.isOpen !== false,
        created_at: data.createdAt || row.updated_at,
        updated_at: row.updated_at
      });
    }
    return Object.assign(data, {
      id: row.vendor_product_id,
      shop_id: row.shop_id || data.shopId || '',
      image_url: data.image_url || data.image || data.imageUrl || '',
      active: data.active !== false,
      created_at: data.createdAt || row.updated_at,
      updated_at: row.updated_at
    });
  }
  function marketRows(api, table) {
    if (table !== 'shops' && table !== 'products') return Promise.resolve([]);
    var marketTable = table === 'shops' ? 'market_shops' : 'market_products';
    return api.from(marketTable).select('*').then(function (result) {
      // Older database deployments may not have marketplace tables yet. The
      // original customer catalogue must remain available in that case.
      if (result.error) {
        console.warn('Jora marketplace catalogue unavailable:', result.error.message);
        return [];
      }
      return (result.data || []).map(function (row) { return legacyRow(table, marketRow(table, row)); });
    });
  }
  function filterAndOrder(rows, ref) {
    var values = rows.filter(function (row) {
      return ref.filters.every(function (filter) {
        return filter.op !== '==' || String(row[filter.field] == null ? '' : row[filter.field]) === String(filter.value == null ? '' : filter.value);
      });
    });
    ref.orders.slice().reverse().forEach(function (order) {
      values.sort(function (left, right) {
        var a = left[order.field], b = right[order.field];
        if (a === b) return 0;
        return (a > b ? 1 : -1) * (order.desc ? -1 : 1);
      });
    });
    return ref.max ? values.slice(0, ref.max) : values;
  }
  function orderRow(data) {
    // A medicine proof must not be silently discarded while proof storage is
    // being migrated. Block these orders until secure storage is implemented.
    if (data.medicalIdRequired) throw new Error('Orders requiring medical verification are temporarily unavailable.');
    var status = String(data.status || 'placed').toLowerCase().replace(/\s+/g, '_');
    if ({ handedover: 1, handovered: 1, shipped: 1 }[status]) status = 'handed_to_delivery_partner';
    if (status === 'out_for_delivery') status = 'out_for_delivery';
    if (['placed', 'confirmed', 'packed', 'handed_to_delivery_partner', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'].indexOf(status) < 0) status = 'placed';
    return { customer_id: data.customerUid || currentUser && currentUser.uid, shop_id: data.shopId || null, shop_name: data.shopName || '', shop_lat: data.shopLat == null ? null : Number(data.shopLat), shop_lng: data.shopLng == null ? null : Number(data.shopLng), items: data.items || [], subtotal: Number(data.subtotal) || 0, delivery_fee: Number(data.deliveryFee) || 0, total: Number(data.total) || 0, delivery_address: data.deliveryAddress || '', delivery_lat: data.deliveryLat == null ? null : Number(data.deliveryLat), delivery_lng: data.deliveryLng == null ? null : Number(data.deliveryLng), phone: data.phone || '', payment_method: data.paymentMethod || 'cod', payment_status: String(data.paymentStatus || 'pending').toLowerCase(), status: 'placed' };
  }
  function profileRow(data) { var row = {}; if (data.name !== undefined || data.full_name !== undefined) row.full_name = data.name !== undefined ? data.name : data.full_name; if (data.email !== undefined) row.email = data.email; if (data.phoneNumber !== undefined || data.phone !== undefined) row.phone = data.phoneNumber !== undefined ? data.phoneNumber : data.phone; if (data.address !== undefined) row.address = data.address; if (data.avatarUrl !== undefined || data.avatar_url !== undefined) row.avatar_url = data.avatarUrl !== undefined ? data.avatarUrl : data.avatar_url; return row; }
  function reviewRow(data) { return { product_id: data.productId, user_id: data.userId || currentUser && currentUser.uid, rating: Number(data.rating) || 5, comment: data.comment || '', verified_purchase: !!data.verifiedPurchase }; }
  function snapshot(rows) { return { forEach: function (fn) { rows.forEach(function (row) { fn({ id: row.id, exists: true, data: function () { return row; } }); }); }, docs: rows.map(function (row) { return { id: row.id, exists: true, data: function () { return row; } }; }) }; }
  function queryRows(ref) {
    return waitForConfig().then(function (api) {
      return Promise.all([api.from(ref.table).select('*'), marketRows(api, ref.table)]).then(function (results) {
        var result = results[0];
        if (result.error) throw result.error;
        var primary = (result.data || []).map(function (row) { return legacyRow(ref.table, row); });
        return filterAndOrder(primary.concat(results[1]), ref);
      });
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
      if (ref.id) return api.from(ref.table).select('*').eq('id', ref.id).maybeSingle().then(function (result) {
        if (result.error) throw result.error;
        var row = result.data && legacyRow(ref.table, result.data);
        if (row || (ref.table !== 'shops' && ref.table !== 'products')) return { id: ref.id, exists: !!row, data: function () { return row || {}; } };
        return marketRows(api, ref.table).then(function (rows) {
          var market = rows.find(function (item) { return String(item.id) === String(ref.id); }) || null;
          return { id: ref.id, exists: !!market, data: function () { return market || {}; } };
        });
      });
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
    waitForConfig().then(function (api) {
      load();
      var liveTable = ref.table;
      if (ref.table === 'shops') liveTable = 'market_shops';
      if (ref.table === 'products') liveTable = 'market_products';
      if (['orders', 'notifications', 'market_shops', 'market_products'].indexOf(liveTable) >= 0) {
        channel = api.channel('jora-' + liveTable + '-' + Math.random().toString(36).slice(2))
          .on('postgres_changes', { event: '*', schema: 'public', table: liveTable }, load)
          .subscribe();
      }
    }).catch(function (error) { if (failure) failure(error); });
    return function () { stopped = true; if (channel && client) client.removeChannel(channel); };
  };
  Collection.prototype.update = function (data) {
    var ref = this;
    return waitForConfig().then(function (api) {
      if (ref.table === 'orders') {
        var action = data.customerConfirmed === true ? 'confirm' : data.customerConfirmed === false ? 'dispute' : String(data.status || '').toLowerCase() === 'cancelled' ? 'cancel' : null;
        if (!action) throw new Error('Unsupported order change.');
        return api.rpc('jora_order_action', { p_order_id: ref.id, p_action: action, p_payload: {} }).then(function (result) { if (result.error) throw result.error; });
      }
      return api.from(ref.table).update(data).eq('id', ref.id).then(function (result) { if (result.error) throw result.error; });
    });
  };

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
