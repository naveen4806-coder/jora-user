-- Shared pricing snapshots, sole-admin authorization and safe legacy lifecycle.
-- Apply after 0010 in Supabase SQL Editor. Existing orders retain their values.

alter table public.orders add column if not exists product_amount numeric(12,2);
alter table public.orders add column if not exists delivery_charge numeric(12,2);
alter table public.orders add column if not exists product_tax numeric(12,2) not null default 0;
alter table public.orders add column if not exists distance_km numeric(8,1);
alter table public.orders add column if not exists tax_settings_snapshot jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists delivery_area text;
alter table public.orders add column if not exists delivery_city text;
alter table public.orders add column if not exists delivery_state text;
alter table public.orders add column if not exists delivery_pincode text;

create table if not exists public.tax_settings (
  id boolean primary key default true check (id),
  mode text not null default 'percent' check (mode in ('percent', 'flat')),
  value numeric(12,2) not null default 0 check (value >= 0),
  per_category jsonb not null default '{}'::jsonb,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);
insert into public.tax_settings (id) values (true) on conflict (id) do nothing;

create or replace function public.jora_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.role = 'admin' and lower(u.email) = 'joraofficial@gmail.com'
  );
$$;
revoke all on function public.jora_is_admin() from public, anon, authenticated;

-- The named account is the only account able to receive the administrative role.
create or replace function public.enforce_jora_admin_identity()
returns trigger language plpgsql security definer set search_path = public as $$
declare allowed uuid;
begin
  select id into allowed from auth.users where lower(email) = 'joraofficial@gmail.com' limit 1;
  if new.role = 'admin' and (allowed is null or new.id <> allowed) then
    raise exception 'Only the configured Jora administrator may hold the admin role';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_enforce_jora_admin on public.profiles;
create trigger profiles_enforce_jora_admin before insert or update of role on public.profiles
for each row execute procedure public.enforce_jora_admin_identity();
update public.profiles p set role = 'admin'
from auth.users u where p.id = u.id and lower(u.email) = 'joraofficial@gmail.com';

alter table public.tax_settings enable row level security;
drop policy if exists "tax settings readable" on public.tax_settings;
create policy "tax settings readable" on public.tax_settings for select using (true);
drop policy if exists "sole admin manages tax settings" on public.tax_settings;
create policy "sole admin manages tax settings" on public.tax_settings for all
using (public.jora_is_admin()) with check (public.jora_is_admin());

-- The command-centre account can audit operational records, while write access
-- remains limited to the explicit actions/policies below.
drop policy if exists "sole admin reads profiles" on public.profiles;
create policy "sole admin reads profiles" on public.profiles for select using (public.jora_is_admin());
drop policy if exists "sole admin reads orders" on public.orders;
create policy "sole admin reads orders" on public.orders for select using (public.jora_is_admin());
drop policy if exists "sole admin updates orders" on public.orders;
create policy "sole admin updates orders" on public.orders for update using (public.jora_is_admin()) with check (public.jora_is_admin());
drop policy if exists "sole admin reads partner presence" on public.delivery_partner_presence;
create policy "sole admin reads partner presence" on public.delivery_partner_presence for select using (public.jora_is_admin());
do $$ begin
  if to_regclass('public.vendor_documents') is not null then
    execute 'drop policy if exists "sole admin reads vendor documents" on public.vendor_documents';
    execute 'create policy "sole admin reads vendor documents" on public.vendor_documents for select using (public.jora_is_admin())';
  end if;
  if to_regclass('public.jora_documents') is not null then
    execute 'drop policy if exists "sole admin reads legacy documents" on public.jora_documents';
    execute 'create policy "sole admin reads legacy documents" on public.jora_documents for select using (public.jora_is_admin())';
  end if;
end $$;

-- Participants use this RPC for status transitions. It preserves the existing
-- enum names used by the deployed portals.
create or replace function public.jora_transition_order(order_id uuid, next_status public.order_status)
returns public.orders language plpgsql security definer set search_path = public as $$
declare current_order public.orders;
begin
  select * into current_order from public.orders where id = order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if public.jora_is_admin() then null;
  elsif auth.uid() = current_order.vendor_id and ((current_order.status = 'placed' and next_status = 'confirmed') or (current_order.status = 'confirmed' and next_status = 'packed')) then null;
  elsif auth.uid() = current_order.rider_id and ((current_order.status = 'handed_to_delivery_partner' and next_status = 'out_for_delivery') or (current_order.status = 'out_for_delivery' and next_status = 'delivered')) then null;
  elsif auth.uid() = current_order.customer_id and next_status = 'cancelled' and current_order.status = 'placed' then null;
  else raise exception 'This status change is not permitted';
  end if;
  update public.orders set status = next_status, updated_at = now(),
    delivered_at = case when next_status = 'delivered' then now() else delivered_at end,
    cancelled_at = case when next_status = 'cancelled' then now() else cancelled_at end
  where id = order_id returning * into current_order;
  return current_order;
end;
$$;
revoke all on function public.jora_transition_order(uuid, public.order_status) from public, anon;
grant execute on function public.jora_transition_order(uuid, public.order_status) to authenticated;
notify pgrst, 'reload schema';
