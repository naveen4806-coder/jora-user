(function () {
  'use strict';

  var app = document.getElementById('app');
  function esc(value) { return JoraShell.esc(value == null ? '' : value); }
  function initials(name, email) {
    var text = String(name || email || 'J').trim();
    return text.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join('') || 'J';
  }
  function notice(message, type) {
    var el = document.getElementById('account-note');
    if (!el) return;
    el.textContent = message;
    el.className = 'jora-checkout-note' + (type ? ' is-' + type : '');
  }
  function links() {
    return '<nav class="jora-menu" aria-label="Account options">' +
      '<a href="wishlist.html"><span>Wishlist<br><small>Saved products</small></span><span>›</span></a>' +
      '<a href="orders.html"><span>My orders<br><small>Track purchases</small></span><span>›</span></a>' +
      '<a href="cart.html"><span>Cart<br><small>Review items before checkout</small></span><span>›</span></a>' +
      '<a href="settings.html"><span>Settings<br><small>Theme, language and sign out</small></span><span>›</span></a>' +
      '</nav>';
  }
  function guest() {
    app.innerHTML = JoraShell.nav('account') +
      '<main class="jora-page"><section class="jora-hero"><div><h1>My Profile</h1><p>Sign in to view your delivery details, orders, and wishlist.</p></div></section>' +
      '<div class="jora-empty"><p>You are browsing as a guest.</p><a class="jora-button" href="home.html?auth=login&return=account.html">Sign in</a></div></main>';
  }
  function profileAvatar(avatar, label, email) {
    return avatar ? '<img src="' + esc(avatar) + '" alt="Profile picture">' : '<span>' + esc(initials(label, email)) + '</span>';
  }
  function form(user, profile) {
    var avatar = profile.avatar_url || '';
    var label = profile.full_name || user.email || 'Jora customer';
    app.innerHTML = JoraShell.nav('account') +
      '<main class="jora-page jora-account-page">' +
        '<section class="jora-hero jora-account-hero"><div><p class="jora-eyebrow">Account</p><h1>My Profile</h1><p>Keep your delivery details and profile photo up to date.</p></div><a class="jora-button jora-profile-anchor" href="#my-profile">My Profile</a></section>' +
        '<section class="jora-card jora-account-card" id="my-profile" tabindex="-1">' +
          '<div class="jora-account-card-heading"><div><p class="jora-eyebrow">Profile details</p><h2>Personal information</h2><p>Used for delivery updates and order support.</p></div></div>' +
          '<div class="jora-account-summary"><div class="jora-account-avatar" id="account-avatar">' + profileAvatar(avatar, label, user.email) + '</div>' +
            '<div class="jora-account-identity"><h3>' + esc(label) + '</h3><p>' + esc(user.email || profile.email) + '</p>' +
              '<label class="jora-upload-label"><span>Upload profile photo</span><small>PNG, JPG or WebP · up to 5 MB</small><input id="profile-image" type="file" accept="image/png,image/jpeg,image/webp" hidden></label>' +
            '</div>' +
          '</div>' +
          '<form id="account-form" class="jora-form jora-account-form">' +
            '<label>Full name<input id="profile-name" required maxlength="120" autocomplete="name" value="' + esc(profile.full_name) + '"></label>' +
            '<label>Email address<input id="profile-email" type="email" value="' + esc(user.email || profile.email) + '" readonly aria-describedby="profile-email-note"><small id="profile-email-note">Email changes are handled through Supabase authentication separately.</small></label>' +
            '<label>Mobile number<input id="profile-phone" inputmode="tel" autocomplete="tel" maxlength="15" value="' + esc(profile.phone) + '" placeholder="9876543210"></label>' +
            '<label>Delivery address<textarea id="profile-address" rows="3" autocomplete="street-address" maxlength="500" placeholder="Flat, street, area, city and PIN code">' + esc(profile.address) + '</textarea></label>' +
            '<p id="account-note" class="jora-checkout-note" aria-live="polite"></p><button class="jora-button" id="save-profile" type="submit">Save Profile</button>' +
          '</form>' +
        '</section>' + links() +
      '</main>';
  }
  async function load() {
    try {
      var api = await JoraSupabase.ready();
      var result = await api.auth.getUser();
      var user = result.data && result.data.user;
      if (!user) { guest(); return; }
      var found = await api.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (found.error) throw found.error;
      var profile = found.data || { id: user.id, full_name: (user.user_metadata && user.user_metadata.full_name) || '', email: user.email || '', phone: '', address: '', avatar_url: null };
      form(user, profile);
      bind(api, user, profile);
    } catch (error) {
      console.error('Account load failed', error);
      app.innerHTML = JoraShell.nav('account') + '<main class="jora-page"><div class="jora-empty">Unable to load your account. <button class="jora-button" onclick="location.reload()">Try again</button></div></main>';
    }
  }
  function bind(api, user, profile) {
    var image = document.getElementById('profile-image');
    var selected = null;
    image.onchange = function () {
      selected = image.files && image.files[0] || null;
      if (!selected) return;
      if (selected.size > 5 * 1024 * 1024) {
        selected = null;
        image.value = '';
        notice('Choose an image smaller than 5 MB.', 'error');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        document.getElementById('account-avatar').innerHTML = '<img src="' + esc(reader.result) + '" alt="Selected profile picture">';
      };
      reader.readAsDataURL(selected);
      notice('Picture selected. Save Profile to upload it.', 'success');
    };
    document.getElementById('account-form').onsubmit = async function (event) {
      event.preventDefault();
      var button = document.getElementById('save-profile');
      var name = document.getElementById('profile-name').value.trim();
      var phone = document.getElementById('profile-phone').value.trim();
      var address = document.getElementById('profile-address').value.trim();
      if (!name) { notice('Enter your name.', 'error'); return; }
      button.disabled = true;
      button.textContent = 'Saving…';
      try {
        var avatarUrl = profile.avatar_url || null;
        if (selected) {
          var extension = (selected.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase();
          var path = user.id + '/' + Date.now() + '.' + extension;
          var upload = await api.storage.from('profile-images').upload(path, selected, { cacheControl: '3600', upsert: false, contentType: selected.type });
          if (upload.error) throw upload.error;
          avatarUrl = api.storage.from('profile-images').getPublicUrl(path).data.publicUrl;
        }
        var saved = await api.from('profiles').upsert({ id: user.id, full_name: name, email: user.email || '', phone: phone, address: address, avatar_url: avatarUrl }, { onConflict: 'id' });
        if (saved.error) throw saved.error;
        profile = Object.assign({}, profile, { full_name: name, phone: phone, address: address, avatar_url: avatarUrl });
        selected = null;
        notice('Your account details were saved.', 'success');
      } catch (error) {
        console.error('Profile save failed', error);
        notice('Could not save your details. Please try again.', 'error');
      } finally {
        button.disabled = false;
        button.textContent = 'Save Profile';
      }
    };
  }
  load();
}());
