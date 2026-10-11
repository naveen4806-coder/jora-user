import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LEGACY_PAGES = new Set(['index.html', 'home.html', 'shop.html', 'product.html', 'information.html']);

function currentLegacyPage() {
  const page = window.location.pathname.split('/').pop();
  return LEGACY_PAGES.has(page) ? page : 'index.html';
}

function LegacyFrame() {
  const [page, setPage] = React.useState(currentLegacyPage);
  const frameRef = React.useRef(null);

  React.useEffect(() => {
    const onPopState = () => setPage(currentLegacyPage());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <iframe
      ref={frameRef}
      className="legacy-page"
      title="Jora"
      src={`/legacy/${page}${window.location.search}${window.location.hash}`}
      allow="autoplay; clipboard-write"
    />
  );
}

function App() {
  return <LegacyFrame />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
