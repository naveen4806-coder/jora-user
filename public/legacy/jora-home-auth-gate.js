(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  // The login and signup modal itself lives on Home, so it must stay reachable.
  if (params.get('auth') === 'login' || params.get('auth') === 'signup') return;

  var root = document.documentElement;
  root.classList.add('jora-auth-checking');
  var style = document.createElement('style');
  style.id = 'jora-home-auth-gate-style';
  style.textContent = 'html.jora-auth-checking body{opacity:0!important;pointer-events:none!important}';
  document.head.appendChild(style);

  function reveal() {
    root.classList.remove('jora-auth-checking');
  }

  function showEntry() {
    window.location.replace('account.html?entry=1&next=home.html');
  }

  if (!window.JoraSupabase || typeof window.JoraSupabase.ready !== 'function') {
    reveal();
    return;
  }

  window.JoraSupabase.ready().then(function (api) {
    return api.auth.getUser();
  }).then(function (result) {
    if (result && result.data && result.data.user) reveal();
    else showEntry();
  }).catch(function () {
    // Do not trap a customer on a blank page if their network is temporarily unavailable.
    reveal();
  });
}());
