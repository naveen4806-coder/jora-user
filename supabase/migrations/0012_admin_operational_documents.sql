-- Run after 0011. This adds Supabase storage for retained admin operations
-- such as rewards, returns, settlement requests and moderation records.

create table if not exists public.admin_documents (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

alter table public.admin_documents enable row level security;
drop policy if exists "sole admin manages operational documents" on public.admin_documents;
create policy "sole admin manages operational documents" on public.admin_documents for all
using (public.jora_is_admin()) with check (public.jora_is_admin());

do $$ begin
  alter publication supabase_realtime add table public.admin_documents;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
