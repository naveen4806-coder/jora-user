-- Fresh Jora Supabase schema. Run this file in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create type public.jora_role as enum ('customer', 'vendor', 'delivery_partner', 'admin');
create type public.order_status as enum ('placed', 'confirmed', 'packed', 'handed_to_delivery_partner', 'out_for_delivery', 'delivered', 'cancelled', 'refunded');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.jora_role not null default 'customer',
  full_name text not null default '', email text not null default '', phone text not null default '',
  address text not null default '', avatar_url text, reward_points integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.shops (
  id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id), name text not null,
  description text not null default '', address text not null default '', phone text not null default '', hours text not null default '',
  image_url text, banner_url text, latitude numeric, longitude numeric, rating numeric not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(), shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null, description text not null default '', category text not null default 'General', price numeric(12,2) not null check (price >= 0),
  image_url text, stock integer not null default 0 check (stock >= 0), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (user_id, product_id)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id), shop_id uuid references public.shops(id),
  shop_name text not null default '', items jsonb not null default '[]'::jsonb, subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0, total numeric(12,2) not null default 0,
  delivery_address text not null, delivery_lat numeric, delivery_lng numeric, phone text not null,
  payment_method text not null default 'cod', payment_status text not null default 'pending', status public.order_status not null default 'placed',
  rider_id uuid references public.profiles(id), rider_lat numeric, rider_lng numeric,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), delivered_at timestamptz, cancelled_at timestamptz
);
create table public.product_reviews (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, rating integer not null check (rating between 1 and 5),
  comment text not null, verified_purchase boolean not null default false, created_at timestamptz not null default now(), unique(product_id, user_id)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text not null default '', read_at timestamptz, created_at timestamptz not null default now()
);
create table public.admin_banners (id uuid primary key default gen_random_uuid(), title text not null default '', image_url text, media_url text, active boolean not null default true, created_at timestamptz not null default now());
create table public.admin_offers (id uuid primary key default gen_random_uuid(), title text not null default '', image_url text, active boolean not null default true, created_at timestamptz not null default now());
create table public.categories (id uuid primary key default gen_random_uuid(), name text not null unique, image_url text, active boolean not null default true, created_at timestamptz not null default now());

create index orders_customer_created_idx on public.orders(customer_id, created_at desc);
create index products_shop_idx on public.products(shop_id);
create index products_category_idx on public.products(category);

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.wishlists enable row level security;
alter table public.orders enable row level security;
alter table public.product_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_banners enable row level security;
alter table public.admin_offers enable row level security;
alter table public.categories enable row level security;

create policy "public catalog shops" on public.shops for select using (active = true);
create policy "public catalog products" on public.products for select using (active = true);
create policy "public catalog banners" on public.admin_banners for select using (active = true);
create policy "public catalog offers" on public.admin_offers for select using (active = true);
create policy "public catalog categories" on public.categories for select using (active = true);
create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "wishlist own rows" on public.wishlists for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "orders customer read" on public.orders for select using (auth.uid() = customer_id);
create policy "orders customer create" on public.orders for insert with check (auth.uid() = customer_id and status = 'placed');
create policy "reviews public read" on public.product_reviews for select using (true);
create policy "reviews signed in create" on public.product_reviews for insert with check (auth.uid() = user_id);
create policy "notifications own rows" on public.notifications for select using (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, '')) on conflict (id) do nothing; return new; end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter publication supabase_realtime add table public.orders, public.notifications;
