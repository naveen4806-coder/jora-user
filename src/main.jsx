import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LEGACY_PAGES = new Set(['opening.html', 'index.html', 'home.html', 'shop.html', 'product.html', 'information.html', 'shops.html', 'products.html', 'account.html', 'cart.html', 'wishlist.html', 'orders.html', 'wallet.html', 'addresses.html', 'settings.html']);

function currentLegacyPage() {
  const page = window.location.pathname.split('/').pop();
  return LEGACY_PAGES.has(page) ? page : 'opening.html';
}

function LegacyFrame() {
  const [page, setPage] = React.useState(currentLegacyPage);

  React.useEffect(() => {
    const onPopState = () => setPage(currentLegacyPage());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return <iframe className="legacy-page" title="Jora" src={`/legacy/${page}${window.location.search}${window.location.hash}`} allow="autoplay; clipboard-write" />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode><LegacyFrame /></StrictMode>,
);
