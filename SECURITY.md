# Security

Keep the Supabase publishable key only in browser configuration. Never expose a Supabase service-role key in the browser. Row Level Security in `supabase/schema.sql` is required before production use.