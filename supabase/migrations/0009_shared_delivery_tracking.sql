-- Shared, privacy-scoped delivery tracking for Jora orders.
-- Run after the fresh schema and 0008 marketplace-order migration.

alter table public.orders add column if not exists vendor_id uuid references public.profiles(id);
alter table public.orders add column if not exists shop_lat numeric;
alter table public.orders add column if not exists shop_lng numeric;
alter table public.orders add column if not exists rider_location_accuracy numeric;
alter table public.orders add column if not exists rider_location_updated_at timestamptz;

create index if not exists orders_vendor_created_idx on public.orders(vendor_id, created_at desc);
create index if not exists orders_rider_created_idx on public.orders(rider_id, created_at desc);

-- Attach the vendor automatically from either catalogue, rather than trusting
-- a browser-provided vendor id when a customer creates an order.
create or replace function public.populate_order_vendor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.vendor_id is null and new.shop_id is not null then
    select owner_id into new.vendor_id from public.shops where id::text = new.shop_id limit 1;
    if new.vendor_id is null then
      select vendor_id::uuid into new.vendor_id
      from public.market_shops
      where vendor_shop_id = new.shop_id
        and vendor_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      limit 1;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_populate_vendor on public.orders;
create trigger orders_populate_vendor before insert on public.orders
for each row execute procedure public.populate_order_vendor();

revoke execute on function public.populate_order_vendor() from public, anon, authenticated;

-- A delivery partner publishes only their own availability and coordinates.
create table if not exists public.delivery_partner_presence (
  id uuid primary key references public.profiles(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  vehicle text not null default 'bike',
  photo_url text,
  latitude numeric,
  longitude numeric,
  location_accuracy numeric,
  location_updated_at timestamptz,
  is_online boolean not null default false,
  active_order_id uuid references public.orders(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.delivery_partner_presence enable row level security;

drop policy if exists "delivery partner manages own presence" on public.delivery_partner_presence;
create policy "delivery partner manages own presence"
on public.delivery_partner_presence for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- Only an authenticated shop owner needs nearby-partner availability. Customer
-- pages never read this table; they see their assigned rider via their order.
drop policy if exists "vendors read delivery partner presence" on public.delivery_partner_presence;
create policy "vendors read delivery partner presence"
on public.delivery_partner_presence for select
using (
  exists (select 1 from public.shops where owner_id = auth.uid())
  or exists (select 1 from public.market_shops where vendor_id = auth.uid()::text)
);

-- Allow participants to receive only the orders they need. Each policy keeps
-- the order attached to the same owner/rider during browser updates.
drop policy if exists "orders vendor read" on public.orders;
create policy "orders vendor read" on public.orders for select using (auth.uid() = vendor_id);
drop policy if exists "orders vendor update" on public.orders;
create policy "orders vendor update" on public.orders for update
using (auth.uid() = vendor_id)
with check (auth.uid() = vendor_id);
drop policy if exists "orders rider read" on public.orders;
create policy "orders rider read" on public.orders for select using (auth.uid() = rider_id);
drop policy if exists "orders rider update" on public.orders;
create policy "orders rider update" on public.orders for update
using (auth.uid() = rider_id)
with check (auth.uid() = rider_id);

do $$ begin
  alter publication supabase_realtime add table public.delivery_partner_presence;
exception when duplicate_object then null;
end $$;
