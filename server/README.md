# Jora MongoDB API

The shared Jora API is located here and is intended for deployment to Render (Node web service). Deploy it once and set each portal's API URL to the Render HTTPS URL plus `/api`. HTTPS is required for browser geolocation.

## Setup

1. Copy `.env.example` to `.env` and enter Atlas and two long JWT secrets. Never commit `.env`.
2. Run `npm install`.
3. Optionally set `SEED_PASSWORD` and run `npm run seed` for approved demo accounts and products.
4. Run `npm run dev`.

The server accepts the old `JWT_SECRET` only as a development migration fallback. Production must use separate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

Cloudinary credentials are optional until image upload is enabled. They must be set only in server environment variables.
