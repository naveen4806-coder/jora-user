import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LEGACY_PAGES = new Set(['opening.html', 'index.html', 'home.html', 'shop.html', 'product.html', 'information.html', 'shops.html', 'products.html', 'account.html', 'cart.html', 'checkout.html', 'wishlist.html', 'orders.html', 'wallet.html', 'settings.html', 'tracking.html']);

function currentLegacyPage() {
  const page = window.location.pathname.split('/').pop();
  return LEGACY_PAGES.has(page) ? page : 'opening.html';
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
  return <div className="legacy-frame-shell" aria-busy={!ready}>
    {!ready && <div className="legacy-frame-loader" aria-label="Loading Jora"><span className="legacy-loader-mark">J</span><span>Loading Jora</span></div>}
    <iframe className={`legacy-page${ready ? ' is-ready' : ''}`} title="Jora" src={`/legacy/${page}${window.location.search}${window.location.hash}`} allow="autoplay; clipboard-write" onLoad={() => setReady(true)} />
  </div>;
}

createRoot(document.getElementById('root')).render(<StrictMode><LegacyFrame /></StrictMode>);
