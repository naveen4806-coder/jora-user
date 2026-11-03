import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LEGACY_PAGES = new Set(['opening.html', 'index.html', 'home.html', 'shop.html', 'product.html', 'information.html', 'shops.html', 'products.html', 'account.html', 'cart.html', 'checkout.html', 'checkout-map.html', 'wishlist.html', 'orders.html', 'wallet.html', 'settings.html', 'tracking.html', 'delivery.html']);

// VITE_JORA_API_URL may be entered as either the Render service URL or the
// complete API URL. Keep the legacy customer pages on the single /api base.
function apiUrl() {
  const value = String(import.meta.env.VITE_JORA_API_URL || `${window.location.origin}/api`).replace(/\/+$/, '');
  return /\/api$/i.test(value) ? value : `${value}/api`;
}

function currentLegacyPage() {
  const page = window.location.pathname.split('/').pop();
  // Authentication is the actual Jora index experience. Home is shown only
  // after the customer has an active Jora API session.
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
    const config = { type: 'jora:mongo-config', url: apiUrl() };
    const sendConfig = (target) => {
      if (config.url && target) target.postMessage(config, window.location.origin);
    };
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'jora:mongo-config-request') return;
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
    if (frameDocument && !frameDocument.getElementById('jora-global-language-loader') && !event.currentTarget.contentWindow?.JoraLanguage) {
      const language = frameDocument.createElement('script');
      language.id = 'jora-global-language-loader';
      language.src = '/legacy/jora-global-language.js';
      frameDocument.head.appendChild(language);
    }
    const url = apiUrl();
    event.currentTarget.contentWindow?.postMessage({ type: 'jora:mongo-config', url }, window.location.origin);
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
