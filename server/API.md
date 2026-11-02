# Jora API

All protected routes use `Authorization: Bearer <accessToken>`. Refresh using `POST /api/auth/refresh` with the saved refresh token.

| Role | Endpoint groups |
|---|---|
| Public | `GET /api/health`, `/api/catalog/shops`, `/api/catalog/products`, `/api/catalog/banners` |
| All signed in users | `/api/auth/me`, `/api/notifications`, `/api/complaints`, `/api/orders/:id`, `/api/orders/:id/tracking` |
| User | `POST /api/orders`, `GET /api/orders/mine`, update own profile/addresses/password |
| Vendor | `/api/vendor/me`, `/api/vendor/products`, `/api/vendor/partners/nearby`, `/api/vendor/revenue`, `POST /api/orders/:id/assign`, vendor order status updates |
| Partner | `/api/partner/me`, `POST /api/partner/location`, `/api/partner/earnings`, assigned order transitions |
| Admin | `/api/admin/dashboard`, users, vendors, partners, products, tax, fees, orders, banners, notifications, complaints |

Socket authentication uses `io(API_URL, { auth: { token: accessToken } })`. A client may join an order only through `order:join`; the server verifies ownership/role before room membership.
