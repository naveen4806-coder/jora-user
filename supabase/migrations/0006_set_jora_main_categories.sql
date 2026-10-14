-- Keep Jora's public catalogue on the five current top-level categories.
-- Product records retain their own category text; subcategories can be added in a later migration.

delete from public.categories
where name not in ('Food', 'Snacks', 'Grocery', 'Fresh Meats', 'Medicine');

insert into public.categories (name, active)
values
  ('Food', true),
  ('Snacks', true),
  ('Grocery', true),
  ('Fresh Meats', true),
  ('Medicine', true)
on conflict (name) do update
set active = excluded.active;
