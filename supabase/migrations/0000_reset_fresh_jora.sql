-- WARNING: Run only for a genuinely empty/fresh Jora Supabase project.
-- This permanently deletes the listed Jora tables and their contents.
drop table if exists public.notifications cascade;
drop table if exists public.product_reviews cascade;
drop table if exists public.wishlists cascade;
drop table if exists public.orders cascade;
drop table if exists public.products cascade;
drop table if exists public.shops cascade;
drop table if exists public.admin_banners cascade;
drop table if exists public.admin_offers cascade;
drop table if exists public.categories cascade;
drop table if exists public.profiles cascade;
drop type if exists public.order_status cascade;
drop type if exists public.jora_role cascade;
