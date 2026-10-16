-- Publish vendor catalogue records to the customer-facing marketplace.
-- This removes the dependency on a browser/Edge Function sync call succeeding.

create table if not exists public.vendor_documents (
  collection text not null,
  id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create table if not exists public.market_shops (
  vendor_shop_id text primary key,
  vendor_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.market_products (
  vendor_product_id text primary key,
  vendor_id text not null,
  shop_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.vendor_documents enable row level security;
alter table public.market_shops enable row level security;
alter table public.market_products enable row level security;

drop policy if exists "vendors manage own documents" on public.vendor_documents;
create policy "vendors manage own documents" on public.vendor_documents
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "public can read active shops" on public.market_shops;
create policy "public can read active shops" on public.market_shops
  for select using (coalesce((data->>'isOpen')::boolean, true));

drop policy if exists "public can read active products" on public.market_products;
create policy "public can read active products" on public.market_products
  for select using (coalesce((data->>'active')::boolean, true));

create or replace function public.sync_vendor_catalog_to_market()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.collection = 'shops' then
    insert into public.market_shops (vendor_shop_id, vendor_id, data, updated_at)
    values (new.id, new.owner_id::text, new.data, new.updated_at)
    on conflict (vendor_shop_id) do update
      set vendor_id = excluded.vendor_id, data = excluded.data, updated_at = excluded.updated_at;
  elsif new.collection = 'products' then
    insert into public.market_products (vendor_product_id, vendor_id, shop_id, data, updated_at)
    values (new.id, new.owner_id::text, coalesce(new.data->>'shopId', new.owner_id::text), new.data, new.updated_at)
    on conflict (vendor_product_id) do update
      set vendor_id = excluded.vendor_id, shop_id = excluded.shop_id, data = excluded.data, updated_at = excluded.updated_at;
  end if;
  return new;
end;
$$;

revoke execute on function public.sync_vendor_catalog_to_market() from public, anon, authenticated;

create or replace function public.remove_vendor_catalog_from_market()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.collection = 'shops' then
    delete from public.market_shops where vendor_shop_id = old.id;
  elsif old.collection = 'products' then
    delete from public.market_products where vendor_product_id = old.id;
  end if;
  return old;
end;
$$;

revoke execute on function public.remove_vendor_catalog_from_market() from public, anon, authenticated;

drop trigger if exists vendor_catalog_to_market on public.vendor_documents;
create trigger vendor_catalog_to_market
after insert or update of data, owner_id, updated_at on public.vendor_documents
for each row execute procedure public.sync_vendor_catalog_to_market();

drop trigger if exists vendor_catalog_remove_from_market on public.vendor_documents;
create trigger vendor_catalog_remove_from_market
after delete on public.vendor_documents
for each row execute procedure public.remove_vendor_catalog_from_market();

-- Backfill anything vendors saved before this migration was installed.
insert into public.market_shops (vendor_shop_id, vendor_id, data, updated_at)
select id, owner_id::text, data, updated_at
from public.vendor_documents
where collection = 'shops'
on conflict (vendor_shop_id) do update
  set vendor_id = excluded.vendor_id, data = excluded.data, updated_at = excluded.updated_at;

insert into public.market_products (vendor_product_id, vendor_id, shop_id, data, updated_at)
select id, owner_id::text, coalesce(data->>'shopId', owner_id::text), data, updated_at
from public.vendor_documents
where collection = 'products'
on conflict (vendor_product_id) do update
  set vendor_id = excluded.vendor_id, shop_id = excluded.shop_id, data = excluded.data, updated_at = excluded.updated_at;

do $$ begin
  alter publication supabase_realtime add table public.market_shops;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.market_products;
exception when duplicate_object then null;
end $$;
