(function () {
  'use strict';

  function hideLegacyContent(guide) {
    Array.prototype.forEach.call(document.body.children, function (element) {
      if (element !== guide && element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE') {
        element.setAttribute('data-jora-legacy-information', '');
      }
    });
  }

  var guide = document.createElement('main');
  guide.id = 'jora-information-guide';
  document.body.classList.add('jora-information-modern');
  guide.innerHTML =
    '<header class="jora-info-header">' +
      '<a class="jora-info-brand" href="home.html" aria-label="Jora home"><img src="assets/jora-logo.png" alt="Jora logo"><span>JORA</span></a>' +
      '<a class="jora-info-home" href="home.html">Back to Home</a>' +
    '</header>' +
    '<div class="jora-info-wrap">' +
      '<section class="jora-info-hero" aria-labelledby="jora-info-title">' +
        '<p class="jora-info-kicker">ABOUT JORA</p>' +
        '<h1 id="jora-info-title">Your nearby shops, brought together.</h1>' +
        '<p>Jora helps customers discover local shops, save what they love, and keep their orders and delivery details in one clear place.</p>' +
        '<div class="jora-info-pills" aria-label="Jora highlights"><span>Local discovery</span><span>Simple ordering</span><span>Delivery updates</span></div>' +
      '</section>' +
      '<section class="jora-info-grid" aria-label="Jora information">' +
        '<article class="jora-info-card">' +
          '<div class="jora-info-card-head"><span class="jora-info-icon" aria-hidden="true">◎</span><h2>How Jora works</h2></div>' +
          '<ul><li><strong>Browse nearby shops</strong> and explore their available products.</li><li><strong>Save favourites</strong> so you can find products again quickly.</li><li><strong>Place an order</strong> with your delivery details when you are ready.</li></ul>' +
        '</article>' +
        '<article class="jora-info-card">' +
          '<div class="jora-info-card-head"><span class="jora-info-icon" aria-hidden="true">✓</span><h2>Orders and delivery</h2></div>' +
          '<ul><li>Use <strong>My orders</strong> to see your order status in one place.</li><li>Keep your <strong>phone number and delivery address</strong> current in My Profile.</li><li>Order updates appear as the shop prepares and delivers your purchase.</li></ul>' +
        '</article>' +
        '<article class="jora-info-card">' +
          '<div class="jora-info-card-head"><span class="jora-info-icon" aria-hidden="true">◈</span><h2>Your account</h2></div>' +
          '<ul><li>Create an account to save your profile, wishlist, and order history.</li><li>Confirm your email, then log in to continue to Home.</li><li>Use Settings whenever you need to review account preferences or sign out.</li></ul>' +
        '</article>' +
        '<article class="jora-info-card">' +
          '<div class="jora-info-card-head"><span class="jora-info-icon" aria-hidden="true">?</span><h2>Need help?</h2></div>' +
          '<ul><li>Check your order details first for the latest order and delivery information.</li><li>Review your profile before ordering to avoid address or phone-number mistakes.</li><li>Return to Home to browse shops, products, and current Jora updates.</li></ul>' +
        '</article>' +
      '</section>' +
      '<footer class="jora-info-footer">Jora · Local shopping, delivered simply · <a href="home.html">Explore Jora</a></footer>' +
    '</div>';
  document.body.appendChild(guide);
  hideLegacyContent(guide);
}());
