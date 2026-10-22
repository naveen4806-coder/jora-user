(function () {
  'use strict';

  var app = document.getElementById('app');
  function esc(value) { return JoraShell.esc(value == null ? '' : value); }
  function initials(name, email) {
    var text = String(name || email || 'J').trim();
    return text.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join('') || 'J';
  }
  function notice(message, type) {
    ['account-note', 'account-summary-note'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = message;
      el.className = 'jora-checkout-note' + (type ? ' is-' + type : '');
    });
  }
  function entryDestination() {
    var requested = new URLSearchParams(window.location.search).get('next') || 'home.html';
    return requested === 'home.html' ? requested : 'home.html';
  }
  function authLink(tab) {
    return 'home.html?auth=' + tab + '&return=' + encodeURIComponent(entryDestination());
  }
  function links() {
    return '<nav class="jora-menu" aria-label="Account options">' +
      '<a href="wishlist.html"><span>Wishlist<br><small>Saved products</small></span><span>›</span></a>' +
      '<a href="orders.html"><span>My orders<br><small>Track purchases</small></span><span>›</span></a>' +
      '<a href="cart.html"><span>Cart<br><small>Review items before checkout</small></span><span>›</span></a>' +
      '<a href="settings.html"><span>Settings<br><small>Theme, language and sign out</small></span><span>›</span></a>' +
      '</nav>';
  }
  function guest(api) {
    document.body.classList.add('jora-auth-entry');
    app.innerHTML =
      '<main class="jora-auth-entry-page">' +
        '<section class="jora-auth-entry-card" aria-labelledby="jora-auth-title">' +
          '<a class="jora-auth-entry-brand" href="information.html" aria-label="About Jora"><img src="assets/jora-logo.png" alt="Jora logo"><span>JORA</span></a>' +
          '<p class="jora-auth-entry-eyebrow">LOCAL SHOPPING, DELIVERED SIMPLY</p>' +
          '<h1 id="jora-auth-title">Welcome to Jora</h1>' +
          '<p class="jora-auth-entry-copy">Sign in or create an account to order, save your favourites, and manage deliveries.</p>' +
          '<div class="jora-auth-tabs" role="tablist" aria-label="Account access">' +
            '<button class="is-active" id="jora-login-tab" type="button" role="tab" aria-selected="true">Log in</button>' +
            '<button id="jora-signup-tab" type="button" role="tab" aria-selected="false">Sign up</button>' +
          '</div>' +
          '<form class="jora-auth-form" id="jora-login-form" novalidate><label>Email address<input id="jora-login-email" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Password<input id="jora-login-password" type="password" autocomplete="current-password" placeholder="Enter your password" required></label><button class="jora-auth-submit" type="submit">Log in to Jora</button></form>' +
          '<form class="jora-auth-form" id="jora-signup-form" hidden novalidate><label>Full name<input id="jora-signup-name" type="text" autocomplete="name" placeholder="Your name" maxlength="120" required></label><label>Email address<input id="jora-signup-email" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Mobile number<input id="jora-signup-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="9876543210" maxlength="15" required></label><label>Create password<input id="jora-signup-password" type="password" autocomplete="new-password" placeholder="At least 6 characters" minlength="6" required></label><button class="jora-auth-submit" type="submit">Create my account</button></form>' +
          '<p class="jora-auth-message" id="jora-auth-message" aria-live="polite"></p>' +
          '<p class="jora-auth-entry-help">After signing up, confirm your email and return here to log in.</p>' +
          '<a class="jora-auth-entry-about" href="information.html">About Jora and support <span aria-hidden="true">→</span></a>' +
        '</section>' +
      '</main>';
    bindGuest(api);
  }
  function bindGuest(api) {
    var loginTab = document.getElementById('jora-login-tab'), signupTab = document.getElementById('jora-signup-tab'), loginForm = document.getElementById('jora-login-form'), signupForm = document.getElementById('jora-signup-form'), message = document.getElementById('jora-auth-message');
    function setMessage(text, kind) { message.textContent = text || ''; message.className = 'jora-auth-message' + (kind ? ' is-' + kind : ''); }
    function setTab(tab) { var login = tab === 'login'; loginForm.hidden = !login; signupForm.hidden = login; loginTab.classList.toggle('is-active', login); signupTab.classList.toggle('is-active', !login); loginTab.setAttribute('aria-selected', String(login)); signupTab.setAttribute('aria-selected', String(!login)); setMessage(''); (login ? document.getElementById('jora-login-email') : document.getElementById('jora-signup-name')).focus(); }
    function setSubmitting(form, submitting, label) { var button = form.querySelector('button[type="submit"]'); button.disabled = submitting; button.textContent = submitting ? 'Please wait…' : label; }
    function readableError(error) { var text = (error && error.message) || 'Something went wrong. Please try again.'; if (/invalid login credentials/i.test(text)) return 'Incorrect email or password.'; if (/email not confirmed/i.test(text)) return 'Please confirm your email, then log in.'; if (/already registered/i.test(text)) return 'An account already exists for this email. Log in instead.'; return text; }
    loginTab.onclick = function () { setTab('login'); }; signupTab.onclick = function () { setTab('signup'); };
    loginForm.onsubmit = async function (event) { event.preventDefault(); var email = document.getElementById('jora-login-email').value.trim(), password = document.getElementById('jora-login-password').value; if (!email || !password) { setMessage('Enter your email address and password.', 'error'); return; } setSubmitting(loginForm, true, 'Log in to Jora'); setMessage(''); try { var login = await api.auth.signInWithPassword({ email: email, password: password }); if (login.error) throw login.error; window.location.replace(entryDestination()); } catch (error) { setMessage(readableError(error), 'error'); } finally { setSubmitting(loginForm, false, 'Log in to Jora'); } };
    signupForm.onsubmit = async function (event) { event.preventDefault(); var name = document.getElementById('jora-signup-name').value.trim(), email = document.getElementById('jora-signup-email').value.trim(), phone = document.getElementById('jora-signup-phone').value.replace(/\D/g, ''), password = document.getElementById('jora-signup-password').value; if (!name || !email || !phone || !password) { setMessage('Complete every field to create your account.', 'error'); return; } if (!/^\d{10}$/.test(phone)) { setMessage('Enter a valid 10-digit mobile number.', 'error'); return; } if (password.length < 6) { setMessage('Your password must contain at least 6 characters.', 'error'); return; } setSubmitting(signupForm, true, 'Create my account'); setMessage(''); try { var signup = await api.auth.signUp({ email: email, password: password, options: { data: { full_name: name, phone: phone }, emailRedirectTo: window.location.origin + '/' } }); if (signup.error) throw signup.error; if (!signup.data || !signup.data.session) { setTab('login'); setMessage('Account created. Check your email, confirm your account, then log in.', 'success'); return; } window.location.replace(entryDestination()); } catch (error) { setMessage(readableError(error), 'error'); } finally { setSubmitting(signupForm, false, 'Create my account'); } };
  }
  function profileAvatar(avatar, label, email) {
    return '<span class="jora-avatar-fallback">' + esc(initials(label, email)) + '</span>' +
      (avatar ? '<img class="jora-avatar-image" src="' + esc(avatar) + '" alt="Profile picture">' : '');
  }
  function form(user, profile) {
    var avatar = profile.avatar_url || '';
    var label = profile.full_name || user.email || 'Jora customer';
    app.innerHTML = JoraShell.nav('account') +
      '<main class="jora-page jora-account-page">' +
        '<section class="jora-hero jora-account-hero"><div><p class="jora-eyebrow">Account</p><h1>My Profile</h1><p>Keep your delivery details and profile photo up to date.</p></div><button class="jora-button jora-profile-anchor" id="open-profile-form" type="button" aria-controls="account-form" aria-expanded="false">My Profile</button></section>' +
        '<section class="jora-card jora-account-card" id="my-profile" tabindex="-1">' +
          '<div class="jora-account-card-heading"><div><p class="jora-eyebrow">Profile details</p><h2>Personal information</h2><p>Used for delivery updates and order support.</p></div></div>' +
          '<div class="jora-account-summary"><div class="jora-account-avatar" id="account-avatar">' + profileAvatar(avatar, label, user.email) + '</div>' +
            '<div class="jora-account-identity"><h3 id="account-summary-name">' + esc(label) + '</h3><p>' + esc(user.email || profile.email) + '</p><p class="jora-profile-hint">Tap My Profile to update your details.</p><p id="account-summary-note" class="jora-checkout-note" aria-live="polite"></p></div>' +
          '</div>' +
          '<form id="account-form" class="jora-form jora-account-form" hidden aria-hidden="true">' +
            '<div class="jora-form-intro"><h3>Edit your profile</h3><p>Update your details, then save when you are ready.</p></div>' +
            '<label class="jora-upload-label"><span>Upload profile photo</span><small>PNG, JPG or WebP · up to 5 MB</small><input id="profile-image" type="file" accept="image/png,image/jpeg,image/webp" hidden></label>' +
            '<label>Full name<input id="profile-name" required maxlength="120" autocomplete="name" value="' + esc(profile.full_name) + '"></label>' +
            '<label>Email address<input id="profile-email" type="email" value="' + esc(user.email || profile.email) + '" readonly aria-describedby="profile-email-note"><small id="profile-email-note">Email changes are handled through Supabase authentication separately.</small></label>' +
            '<label>Mobile number<input id="profile-phone" inputmode="tel" autocomplete="tel" maxlength="15" value="' + esc(profile.phone) + '" placeholder="9876543210"></label>' +
            '<label>Delivery address<textarea id="profile-address" rows="3" autocomplete="street-address" maxlength="500" placeholder="Flat, street, area, city and PIN code">' + esc(profile.address) + '</textarea></label>' +
            '<p id="account-note" class="jora-checkout-note" aria-live="polite"></p><div class="jora-form-actions"><button class="jora-button" id="save-profile" type="submit">Save Profile</button><button class="jora-text-button" id="cancel-profile" type="button">Cancel</button></div>' +
          '</form>' +
        '</section>' + links() +
      '</main>';
  }
  function loading() {
    app.innerHTML = JoraShell.nav('account') + '<main class="jora-page"><div class="jora-empty" role="status" aria-live="polite">Loading your account…</div></main>';
  }
  function pause(milliseconds) { return new Promise(function (resolve) { setTimeout(resolve, milliseconds); }); }
  async function retry(operation) {
    var lastError;
    for (var attempt = 0; attempt < 3; attempt += 1) {
      try { return await operation(); }
      catch (error) {
        lastError = error;
        if (attempt === 2) break;
        await pause(350 * (attempt + 1));
      }
    }
    throw lastError;
  }
  async function load() {
    try {
      loading();
      var api = await retry(function () { return JoraSupabase.ready(); });
      var result = await retry(function () { return api.auth.getUser(); });
      var user = result.data && result.data.user;
      if (!user) { guest(api); return; }
      if (new URLSearchParams(window.location.search).get('entry') === '1') {
        window.location.replace(entryDestination());
        return;
      }
      document.body.classList.remove('jora-auth-entry');
      var found = await retry(function () { return api.from('profiles').select('*').eq('id', user.id).maybeSingle(); });
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
    var form = document.getElementById('account-form');
    var openButton = document.getElementById('open-profile-form');
    var cancelButton = document.getElementById('cancel-profile');
    var selected = null;
    function renderAvatar(avatarUrl, name) {
      var container = document.getElementById('account-avatar');
      container.innerHTML = profileAvatar(avatarUrl || '', name || user.email, user.email);
      var picture = container.querySelector('.jora-avatar-image');
      if (picture) picture.addEventListener('error', function () { picture.remove(); });
    }
    renderAvatar(profile.avatar_url, profile.full_name || user.email);
    function setEditMode(open) {
      form.hidden = !open;
      form.setAttribute('aria-hidden', String(!open));
      openButton.setAttribute('aria-expanded', String(open));
      if (!open) return;
      window.requestAnimationFrame(function () {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById('profile-name').focus({ preventScroll: true });
      });
    }
    openButton.onclick = function () { setEditMode(true); };
    cancelButton.onclick = function () {
      selected = null;
      image.value = '';
      renderAvatar(profile.avatar_url, profile.full_name || user.email);
      setEditMode(false);
    };
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
        renderAvatar(reader.result, document.getElementById('profile-name').value.trim() || user.email);
      };
      reader.readAsDataURL(selected);
      notice('Picture selected. Save Profile to upload it.', 'success');
    };
    form.onsubmit = async function (event) {
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
        document.getElementById('account-summary-name').textContent = name;
        renderAvatar(avatarUrl, name);
        setEditMode(false);
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
