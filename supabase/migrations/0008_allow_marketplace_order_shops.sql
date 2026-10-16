-- Orders may originate from either the original public.shops catalogue or the
-- vendor marketplace catalogue. Marketplace shop IDs are vendor document IDs,
-- so they must not be constrained to public.shops.

do $$
declare
  shop_id_type text;
begin
  select data_type into shop_id_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'orders' and column_name = 'shop_id';

  if shop_id_type is not null then
    execute 'alter table public.orders drop constraint if exists orders_shop_id_fkey';
    if shop_id_type <> 'text' then
      execute 'alter table public.orders alter column shop_id type text using shop_id::text';
    end if;
  end if;
end $$;

create index if not exists orders_shop_created_idx on public.orders(shop_id, created_at desc);
