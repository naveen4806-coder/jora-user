# Jora deployment checklist

1. Run `supabase/schema.sql` in the supplied Supabase project's SQL Editor.
2. In Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env` for Production, Preview, and Development.
3. Redeploy the user site and verify signup, cart, checkout, and order updates with test accounts.