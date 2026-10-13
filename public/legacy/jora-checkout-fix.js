(function () {
  'use strict';

  var placingOrder = false;

  function notify(message, kind) {
    if (typeof window.toast === 'function') window.toast(message, kind || 'err');
    else window.alert(message);
  }

  function value(id) {
    var input = document.getElementById(id);
    return input ? input.value.trim() : '';
  }

  function setButtonBusy(busy) {
    var button = document.getElementById('btn-confirm-order');
    if (!button) return;
    button.disabled = busy;
    button.textContent = busy ? 'Placing Order...' : 'Confirm & Place Order';
  }

  function cartTotal(items) {
    return (items || []).reduce(function (sum, item) {
      return sum + (Number(item.price) || 0) * (Number(item.qty) || 0);
    }, 0);
  }

  function itemCount(items) {
    return (items || []).reduce(function (sum, item) {
      return sum + (Number(item.qty) || 0);
    }, 0);
  }

  function deliveryPricing(shop) {
    var shopLat = Number(shop && shop.lat);
    var shopLng = Number(shop && shop.lng);
    var userLat = Number(window.delLat);
    var userLng = Number(window.delLng);
    if (!isFinite(shopLat) || !isFinite(shopLng) || !isFinite(userLat) || !isFinite(userLng) || typeof window.haversine !== 'function') {
      return { fee: 0, distance: null };
    }
    var distance = window.haversine(userLat, userLng, shopLat, shopLng);
    if (!isFinite(distance)) return { fee: 0, distance: null };
    if (distance > 7) return { error: 'This shop is outside the 7 km delivery area.' };
    return { fee: distance <= 2 ? 15 : distance <= 4 ? 25 : distance <= 5 ? 40 : 60, distance: distance };
  }

  function persistDelivery(address, city, pin, landmark, phone) {
    var save = typeof window.sv === 'function' ? window.sv : function (key, item) { localStorage.setItem(key, item); };
    save('ls_del_addr1', address);
    save('ls_del_city', city);
    save('ls_del_pin', pin);
    save('ls_del_land', landmark);
    save('ls_del_phone', phone);
  }

  var waitingForAuth = false;
  var originalCheckout = window.checkoutCart;
  if (typeof originalCheckout === 'function') {
    window.checkoutCart = function () {
      if (window._joraAuthResolved === false) {
        if (!waitingForAuth) {
          waitingForAuth = true;
          notify('Restoring your signed-in session…', 'info');
          var tries = 0;
          var timer = setInterval(function () {
            tries++;
            if (window._joraAuthResolved || tries >= 40) {
              clearInterval(timer);
              waitingForAuth = false;
              if (window._joraAuthResolved) window.checkoutCart();
              else notify('Could not restore your session. Please refresh and try again.');
            }
          }, 125);
        }
        return;
      }
      return originalCheckout.apply(this, arguments);
    };
  }

  window.confirmOrder = async function () {
    if (placingOrder) return;
    if (!window.auth || !window.auth.currentUser) {
      return typeof window.requireLogin === 'function' ? window.requireLogin('Please sign in again to place your order.') : notify('Please sign in again to place your order.');
    }

    var pending = window._pendingOrder;
    var cart = pending && pending.cart;
    var shop = pending && pending.shop;
    if (!cart || !Array.isArray(cart.items) || !cart.items.length) {
      notify('Your cart is empty. Add an item before placing an order.');
      return;
    }
    if (!shop) {
      notify('This shop is unavailable. Please return to your cart and try again.');
      return;
    }

    var address = value('del-addr1');
    var city = value('del-city');
    var pin = value('del-pin');
    var phone = value('del-phone').replace(/\D/g, '');
    var landmark = value('del-landmark');
    if (!address || !city || !pin || !phone) {
      notify('Enter your delivery address, city, PIN code, and mobile number.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      notify('Enter a valid 6-digit PIN code.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      notify('Enter a valid 10-digit mobile number.');
      return;
    }
    if (shop.isOpen === false) {
      notify('This shop has closed and cannot accept the order.');
      return;
    }

    var pricing = deliveryPricing(shop);
    if (pricing.error) {
      notify(pricing.error);
      return;
    }

    placingOrder = true;
    setButtonBusy(true);
    try {
      var now = new Date().toISOString();
      var items = cart.items.map(function (item) {
        return {
          productId: item.productId,
          name: item.name,
          price: Number(item.price) || 0,
          qty: Number(item.qty) || 0,
          image: item.image || '',
          category: item.category || ''
        };
      });
      var subtotal = cartTotal(items);
      var total = subtotal + pricing.fee;
      var order = {
        deviceId: window.DEVICE_ID || '',
        customerUid: window.auth.currentUser.uid,
        vendorUid: shop.ownerUid || shop.vendorUid || shop.id,
        type: 'cart',
        shopId: cart.shopId || shop.id,
        shopName: shop.name || '',
        shopAddress: shop.address || '',
        shopPhone: shop.phone || '',
        shopHours: shop.hours || '',
        shopLat: shop.lat == null ? null : shop.lat,
        shopLng: shop.lng == null ? null : shop.lng,
        items: items,
        productName: items.length === 1 ? items[0].name : items.length + ' items from ' + (shop.name || 'shop'),
        category: items[0].category || '',
        image: items[0].image || '',
        price: items[0].price,
        qty: itemCount(items),
        subtotal: subtotal,
        deliveryFee: pricing.fee,
        deliveryDistanceKm: pricing.distance == null ? null : Number(pricing.distance.toFixed(2)),
        total: total,
        deliveryAddress: address + (landmark ? ', Near ' + landmark : '') + ', ' + city + ' - ' + pin,
        deliveryLat: isFinite(Number(window.delLat)) ? Number(window.delLat) : null,
        deliveryLng: isFinite(Number(window.delLng)) ? Number(window.delLng) : null,
        phone: phone,
        paymentMethod: 'cod',
        paymentLabel: 'Cash on Delivery',
        paymentStatus: 'Pending',
        status: 'Confirmed',
        customerConfirmed: null,
        orderedAt: now,
        createdAt: now,
        updatedAt: now
      };

      await window.auth.currentUser.getIdToken(true);
      var result = await window.db.collection('orders').add(order);

      persistDelivery(address, city, pin, landmark, phone);
      window._cart = { shopId: null, shopName: '', items: [] };
      if (typeof window.updateCartUI === 'function') window.updateCartUI();
      if (typeof window.updateNavBadges === 'function') window.updateNavBadges();
      if (typeof window.closeDeliveryModal === 'function') window.closeDeliveryModal();
      window._pendingOrder = null;
      notify('Order placed successfully.', 'ok');
      window.location.replace('home.html?openOrders=1&legacyTracking=1&trackOrder=' + encodeURIComponent(result.id));
    } catch (error) {
      console.error('Order create failed', error);
      var message = error && error.code === 'permission-denied'
        ? 'Order could not be saved. Please sign out and sign in again, then retry.'
        : 'Order could not be saved. Your cart is still safe; please retry.';
      notify(message);
    } finally {
      placingOrder = false;
      setButtonBusy(false);
    }
  };
})();
