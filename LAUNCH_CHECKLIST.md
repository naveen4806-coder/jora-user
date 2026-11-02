# Jora launch checklist

## Deployment configuration

1. Create a Render Node web service from this repository using `render.yaml`.
2. In Render, set `MONGODB_URI` and `CLIENT_ORIGINS`. `CLIENT_ORIGINS` must be a comma-separated list of the deployed User, Vendor, Partner and Admin HTTPS origins.
3. Keep the generated access and refresh JWT secrets private. Do not place them in a frontend repository or Vercel environment variables.
4. Seed the database only in a test database: `npm run seed` from `server`.
5. Set each portal's `jora_api_url` localStorage value (or its runtime config) to `https://YOUR-API/api`.

## Required production acceptance test

- User registration, login, refresh, logout and blocked account.
- Vendor shop setup, product creation and product visibility in User app.
- Admin approves the vendor and partner; Vendor sees an approved, online partner within 2 km.
- User checkout creates an order whose stored totals match its item, GST, platform-fee and delivery lines.
- Vendor accepts, prepares, marks ready and assigns a partner.
- Partner accepts, sends location, picks up, is out for delivery and delivers.
- User, Vendor and Admin receive each status and location update.
- Earning is created exactly once after delivery.

Do not launch until this production acceptance test passes with non-production test accounts.
