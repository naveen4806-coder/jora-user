# Jora audit and verification report — 2026-10-13

## Commits by phase

| Phase | Commit | Result |
| --- | --- | --- |
| Baseline audit | `5677fd8` | Added `BASELINE.md` with the repository map and pre-change evidence. |
| Performance/mobile | `7803303` | Bounded catalogue and order reads to 100 records, cleaned up listeners, added async image decoding, and narrowed the mobile overflow rule. |
| Checkout | `4445084` | Hardened checkout completion and persisted-cart clearing. |
| Tracking restoration | `f683473` | Restored the dedicated tracker from original commit `231421d5ce7adb18ddc1264bbcbf773170e1a5db` and made it work with authenticated/current order data. |
| Remove addresses/account details | `9af5099` | Removed the Account Details page/module and saved-address feature code. |
| Wishlist lifecycle | `f3ac041` | Added listener cleanup and explicit loading/retry UI. |
| Logout regression | `30bd132` | Removed the dangling call to the deleted profile modal. |
| Static QA | `0de7231` | Removed references to the missing `jora-transition.js` file. |

## Root causes found and fixed

1. **Checkout cart persistence:** after an order write succeeded, only the
   in-memory cart was cleared. The guest, shared, and user cart keys could
   repopulate it after a reload. Checkout now clears all three relevant keys.
2. **Checkout state race:** the legacy page can receive a click before Firebase
   Auth has restored the session. The existing auth-readiness wrapper remains
   in place and checkout now keeps the button locked while the write is active.
3. **Tracking was not a page:** `tracking.html` had been reduced to a redirect
   to the home modal. It is restored as a real page, loads Firebase Auth before
   reading an order, checks the owner in the UI, and understands current
   `shopLat/shopLng`, `deliveryLat/deliveryLng`, and optional rider fields.
4. **Unbounded/listener lifecycle reads:** browse and order views listened to
   entire collections without page-lifecycle cleanup. Current browse/orders
   views use a 100-record upper bound and unsubscribe on `pagehide`.
5. **Removed-feature regression:** after Account Details was removed, logout
   still called its deleted close function. That call is removed.
6. **Broken script URLs:** home, shop, and product referenced a non-existent
   `jora-transition.js`; the references are removed.

## Checkout coverage

The checkout module was executed in an isolated Node browser-style harness.

- Empty cart: **passed** — no write is attempted and a clear message is shown.
- Missing delivery address: **passed** — no write is attempted and a clear
  message is shown.
- Double click: **passed** — only one mocked `orders.add` call is made.
- Successful write: **passed** in the harness — both guest/shared cart keys
  are emptied and the redirect is `tracking.html?id=<new-order-id>`.
- Failed Firestore write: **handled in code** — cart remains intact, the button
  is re-enabled, and a retry-safe message is displayed. This path was not
  exercised against a real Firestore project.

## Performance measurements

| Metric | Before | After | Status |
| --- | ---: | ---: | --- |
| Vite production build | 525 ms | 347 ms | Measured locally; this is a build time, not page load time. |
| Lighthouse / Fast 4G load time | Not measured | Not measured | No controlled browser-accessible local server was available. |

The requested under-two-second Fast 4G target is **not claimed**. It requires a
real browser run against a controlled build with production-sized Firebase
data and network throttling.

## QA checklist

| Check | Result | Evidence |
| --- | --- | --- |
| All standalone legacy JS parses | Pass | `node --check` ran across every `public/legacy/*.js` file and the API route. |
| Production build | Pass | `npm run build` completed successfully. |
| Local HTML asset links | Pass | Static scan found no missing relative `src`/`href` file. |
| Checkout validation and duplicate-submit guard | Pass (harness) | See Checkout coverage above. |
| Tracking page routing/source | Pass (static) | Order cards and checkout now use `tracking.html?id=...`; dedicated tracker source is present. |
| Saved addresses and Account Details removal | Pass (static) | Searches found no saved-address storage/route or account-details module/UI. |
| Wishlist buttons/page | Pass (static) | Per-user `users/{uid}.wishlist`, loading/empty/retry state, add-to-cart and removal paths present. |
| Desktop/mobile 375, 412, 768, 1024, 1280 visual QA | Not tested | Browser could not reach `http://127.0.0.1:4173/legacy/home.html` (`ERR_CONNECTION_TIMED_OUT`). |
| Browser console/network warnings | Not tested | Same unavailable local browser preview. |
| Login, real order write, tracking with live order, wishlist write, logout | Not tested end to end | Requires a supplied test account and Firebase/Firestore rules. No production data was changed. |
| Firestore rules/security | Not verifiable | No Firestore rules source or deployed Firebase console access is present in this repository. |

## Required manual checks before release

1. Start this repository's `npm run serve:legacy` on a known free local port,
   then test at 375, 412, 768, 1024, and 1280px with DevTools console open.
2. Use a disposable Firebase user to test cart → checkout → tracking, including
   an intentionally denied Firestore write and a double click.
3. Confirm Firestore rules allow each user to read/write only their own
   `users/{uid}` document and orders with matching `customerUid`; do not rely
   on client-side ownership checks.
4. Test a shop/rider update with `shopLat`, `shopLng`, `deliveryLat`,
   `deliveryLng`, `riderLat`, and `riderLng` to verify live map rendering.
5. Run Lighthouse with Fast 4G throttling on Home, Products, Cart, Checkout,
   My Orders, Tracking, Wishlist, and Account. Record the actual results
   before claiming the performance target.
