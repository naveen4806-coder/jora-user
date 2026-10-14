-- Remove the optional Jora demo catalogue from existing projects.
-- Future projects no longer receive the demo seed migration.
-- The exact names prevent this cleanup from touching real merchant data.

delete from public.products
where shop_id in (
  select id
  from public.shops
  where name in ('Jora Demo Grocery', 'Jora Demo Fresh Market')
)
or (name like 'Demo %' and description ilike '%jora demo%');

delete from public.shops
where name in ('Jora Demo Grocery', 'Jora Demo Fresh Market');
