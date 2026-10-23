/* Enhances the shared shell without replacing its existing navigation or data code. */
(function () {
  var header = document.querySelector('.jora-topbar');
  if (!header || header.dataset.joraPremiumReady) return;
  header.dataset.joraPremiumReady = 'true';
  var links = header.querySelector('.jora-toplinks');
  if (!links) return;
  links.id = 'jora-primary-links';
  var toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'jora-menu-toggle';
  toggle.setAttribute('aria-label', 'Open navigation menu');
  toggle.setAttribute('aria-controls', links.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span></span><span></span><span></span>';
  header.appendChild(toggle);
  function closeMenu() {
    header.classList.remove('jora-menu-open');
    document.body.classList.remove('jora-menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
  }
  toggle.addEventListener('click', function () {
    var open = !header.classList.contains('jora-menu-open');
    header.classList.toggle('jora-menu-open', open);
    document.body.classList.toggle('jora-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  links.addEventListener('click', function (event) { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') { closeMenu(); toggle.focus(); } });
  document.addEventListener('click', function (event) { if (!header.contains(event.target)) closeMenu(); });
  window.addEventListener('scroll', function () { header.classList.toggle('jora-scrolled', window.scrollY > 20); }, { passive: true });
  var reveal = Array.prototype.slice.call(document.querySelectorAll('.jora-card,.jora-section,.jora-menu a'));
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal.forEach(function (element) { element.style.opacity = '0'; element.style.transform = 'translateY(18px)'; element.style.transition = 'opacity .35s ease, transform .35s ease'; });
    var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; observer.unobserve(entry.target); } }); }, { threshold: .08 });
    reveal.forEach(function (element) { observer.observe(element); });
  }
}());
