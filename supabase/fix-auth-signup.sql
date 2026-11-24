-- Run this once in Supabase Dashboard -> SQL Editor.
-- It repairs the Auth trigger responsible for creating a public profile at signup.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade
);

alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists phone text default '';
alter table public.profiles add column if not exists address text default '';
alter table public.profiles add column if not exists pincode text default '';
alter table public.profiles add column if not exists lat numeric;
alter table public.profiles add column if not exists lng numeric;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, full_name, email, phone, address, pincode, lat, lng)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'address', ''),
    coalesce(new.raw_user_meta_data ->> 'pincode', ''),
    nullif(new.raw_user_meta_data ->> 'lat', '')::numeric,
    nullif(new.raw_user_meta_data ->> 'lng', '')::numeric
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "jora profile owner" on public.profiles;
create policy "jora profile owner" on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
