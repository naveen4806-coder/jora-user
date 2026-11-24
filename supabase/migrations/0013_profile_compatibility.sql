-- Adds the profile fields used by the customer account page to an existing project.
alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists phone text default '';
alter table public.profiles add column if not exists address text default '';
alter table public.profiles add column if not exists pincode text default '';
alter table public.profiles add column if not exists lat numeric;
alter table public.profiles add column if not exists lng numeric;
alter table public.profiles add column if not exists avatar_url text;
update public.profiles set full_name = name where full_name = '' and name <> '';
