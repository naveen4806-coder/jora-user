# Jora baseline audit — 2026-10-13

## Scope and repository map

The application is a Vite/React shell (`src/main.jsx`) that renders the legacy
storefront in an iframe. The functional storefront is under `public/legacy/`.

| Area | Entry points | Data/service used |
| --- | --- | --- |
| Opening and home | `index.html`, `opening.html`, `home.html` | Firebase Auth, Firestore, Messaging, Analytics; local cart/address cache |
| Browsing | `shops.html`, `products.html`, `shop.html`, `product.html` | Firestore `shops` and `products`; local catalogue cache |
| Cart and checkout | `cart.html`, `jora-cart-page.js`, `home.html`, `jora-checkout-fix.js` | `ls_cart`, `ls_cart_guest`, `orders` collection |
| Account actions | `account.html`, `wishlist.html`, `orders.html`, `wallet.html`, `settings.html` | Firebase Auth and Firestore `users`, `orders`; local settings/cache |
| Order tracking | `tracking.html`, `jora-tracking.js`; legacy tracker in `home.html` | Firestore `orders`; Leaflet/OpenStreetMap |
| Payments | `api/payments/create-order.js` | Intentionally disabled until a trusted server-side order flow exists |

## Authentication and data model observed

- Firebase project: `nexcart-db-7a02f`; the application uses Firebase compat
  SDKs in legacy pages.
- Customer profile: `users/{uid}`. Current code reads/writes profile fields,
  wishlist arrays, and legacy `addresses` arrays.
- Catalogue: `shops/{shopId}` and `products/{productId}`.
- Orders: `orders/{orderId}` with `customerUid`, `shopId`, `items`, totals,
  delivery address/coordinates, `status`, and timestamp fields.
- Cart is client-side (`ls_cart`, `ls_cart_guest`) and is written into an order
  by a browser Firestore write. No Firestore rules or server-side checkout code
  are present in this repository, so their live behavior cannot be audited here.

## Baseline verification performed before code changes

- `npm run build`: **passed** (Vite 8.3.4; 15 modules transformed).
- `node --check`: **passed** for all standalone legacy JavaScript modules and
  the payment route.
- `git diff --check`: no whitespace errors were reported; Git did report its
  usual pending LF-to-CRLF normalization notice for one existing edited file.
- Local preview: `node local-server.mjs` could not start because port 4173 was
  already occupied. I did not stop the unknown process. Browser/network and
  Firebase end-to-end checks are therefore not yet evidence-backed.

## Baseline findings

1. The current checkout guard has an auth-readiness wrapper, but checkout,
   address validation, and Firestore order creation must be validated against a
   real authenticated user and deployed rules before a pass can be claimed.
2. `tracking.html` currently redirects into the home-page modal instead of
   loading the dedicated tracker. The earliest dedicated tracker is commit
   `231421d5ce7adb18ddc1264bbcbf773170e1a5db` (2026-10-13). Its data shape is
   compatible with current orders, but it did not include Firebase Auth.
3. Listeners are unbounded in catalogue and order pages, and an orders query
   does not limit results. This is a performance and listener-lifecycle risk.
4. Saved-address code remains in `home.html` and `jora-pages.js`; the existing
   `account.html` loads the Account Details/profile implementation.
5. The existing page architecture loads several blocking remote Firebase SDKs
   on each full-page legacy view. A Firebase regional endpoint cannot be
   determined from this client repository.
6. Images use `loading="lazy"` in newly generated browse cards, but existing
   legacy home content and image dimensions need a mobile visual check before
   asserting no layout shift.
7. The prior duplicate-navigation/mobile overflow repair is present as
   uncommitted local work and has not been included in this baseline commit.

## Baseline metrics

No Lighthouse/PageSpeed or Fast 4G timing can be recorded yet: there is no
known controlled local server on the occupied port, and no authenticated test
account/test data was supplied. This is intentionally reported as **not
measured**, not estimated.
