import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LEGACY_PAGES = new Set(['opening.html', 'index.html', 'home.html', 'shop.html', 'product.html', 'information.html', 'shops.html', 'products.html', 'account.html', 'cart.html', 'checkout.html', 'checkout-map.html', 'wishlist.html', 'orders.html', 'wallet.html', 'settings.html', 'tracking.html', 'delivery.html']);

function currentLegacyPage() {
  const page = window.location.pathname.split('/').pop();
  // Authentication is the actual Jora index experience. Home is shown only
  // after the customer has an active Supabase session.
  return LEGACY_PAGES.has(page) ? page : 'account.html?entry=1&next=home.html';
}

function legacySource(page) {
  const [path, query = ''] = page.split('?');
  const parameters = new URLSearchParams(query);
  const outerParameters = new URLSearchParams(window.location.search);
  outerParameters.forEach((value, key) => {
    if (!parameters.has(key)) parameters.append(key, value);
  });
  const search = parameters.toString();
  return `/legacy/${path}${search ? `?${search}` : ''}${window.location.hash}`;
}

function LegacyFrame() {
  const [page, setPage] = React.useState(currentLegacyPage);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const onPopState = () => setPage(currentLegacyPage());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  React.useEffect(() => setReady(false), [page]);
  React.useEffect(() => {
    const config = {
      type: 'jora:supabase-config',
      url: import.meta.env.VITE_SUPABASE_URL || '',
      key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
    };
    const sendConfig = (target) => {
      if (config.url && config.key && target) target.postMessage(config, window.location.origin);
    };
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'jora:supabase-config-request') return;
      sendConfig(event.source);
    };
    window.addEventListener('message', onMessage);
    const frame = document.querySelector('.legacy-page');
    if (frame?.contentWindow) sendConfig(frame.contentWindow);
    return () => window.removeEventListener('message', onMessage);
  }, [page]);
  const onLoad = (event) => {
    setReady(true);
    const frameDocument = event.currentTarget.contentDocument;
    if (frameDocument) {
      const viewport = frameDocument.querySelector('meta[name="viewport"]');
      if (viewport) viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      if (!frameDocument.getElementById('jora-premium-layer-css')) {
        const premiumCss = frameDocument.createElement('link');
        premiumCss.id = 'jora-premium-layer-css';
        premiumCss.rel = 'stylesheet';
        premiumCss.href = '/legacy/jora-premium-layer.css';
        frameDocument.head.appendChild(premiumCss);
      }
      if (!frameDocument.getElementById('jora-premium-layer-js')) {
        const premiumJs = frameDocument.createElement('script');
        premiumJs.id = 'jora-premium-layer-js';
        premiumJs.src = '/legacy/jora-premium-layer.js';
        frameDocument.body.appendChild(premiumJs);
      }
    }
    if (frameDocument && !frameDocument.getElementById('jora-global-language-loader') && !event.currentTarget.contentWindow?.JoraLanguage) {
      const language = frameDocument.createElement('script');
      language.id = 'jora-global-language-loader';
      language.src = '/legacy/jora-global-language.js';
      frameDocument.head.appendChild(language);
    }
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    if (url && key) event.currentTarget.contentWindow?.postMessage({ type: 'jora:supabase-config', url, key }, window.location.origin);
  };
  return <div className="legacy-frame-shell" aria-busy={!ready}>
    {!ready && <div className="legacy-frame-loader" aria-label="Loading Jora"><span className="legacy-loader-mark">J</span><span>Loading Jora</span></div>}
    <iframe className={`legacy-page${ready ? ' is-ready' : ''}`} title="Jora" src={legacySource(page)} allow="autoplay; clipboard-write" onLoad={onLoad} />
  </div>;
}

createRoot(document.getElementById('root')).render(<StrictMode><LegacyFrame /></StrictMode>);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Jora offline shell unavailable:', error));
  });
}
