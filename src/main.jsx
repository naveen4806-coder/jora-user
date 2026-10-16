import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LEGACY_PAGES = new Set(['opening.html', 'index.html', 'home.html', 'shop.html', 'product.html', 'information.html', 'shops.html', 'products.html', 'account.html', 'cart.html', 'checkout.html', 'checkout-map.html', 'wishlist.html', 'orders.html', 'wallet.html', 'settings.html', 'tracking.html']);

function currentLegacyPage() {
  const page = window.location.pathname.split('/').pop();
  // Jora opens on the existing Home sign-in form. The opening video is still
  // available at /opening.html, but it no longer delays a customer who wants
  // to log in or create an account.
  return LEGACY_PAGES.has(page) ? page : 'home.html?auth=login&return=home.html';
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
    <iframe className={`legacy-page${ready ? ' is-ready' : ''}`} title="Jora" src={`/legacy/${page}${window.location.search}${window.location.hash}`} allow="autoplay; clipboard-write" onLoad={onLoad} />
  </div>;
}

createRoot(document.getElementById('root')).render(<StrictMode><LegacyFrame /></StrictMode>);
