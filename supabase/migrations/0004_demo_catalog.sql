-- Optional, repeatable Jora demo catalogue for a brand-new Supabase project.
-- Every row is clearly labelled "Demo" and can be removed later from Table Editor.

insert into public.categories (name, active)
values ('Grocery', true), ('Fruits & Vegetables', true), ('Dairy & Eggs', true), ('Personal Care', true)
on conflict (name) do update set active = excluded.active;

insert into public.shops (name, description, address, phone, hours, image_url, latitude, longitude, rating, active)
select 'Jora Demo Grocery', 'Clearly labelled demo shop for testing the customer journey.', 'Pappampatti, Coimbatore, Tamil Nadu 641103', '9876543210', '8:00 AM – 9:00 PM', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80', 10.9270, 77.0110, 4.8, true
where not exists (select 1 from public.shops where name = 'Jora Demo Grocery');

insert into public.shops (name, description, address, phone, hours, image_url, latitude, longitude, rating, active)
select 'Jora Demo Fresh Market', 'Clearly labelled demo shop with fresh essentials.', 'Kannampalayam, Coimbatore, Tamil Nadu 641103', '9876543211', '8:00 AM – 8:00 PM', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80', 10.9295, 77.0140, 4.7, true
where not exists (select 1 from public.shops where name = 'Jora Demo Fresh Market');

insert into public.products (shop_id, name, description, category, price, image_url, stock, active)
select s.id, p.name, p.description, p.category, p.price, p.image_url, 50, true
from public.shops s
cross join (values
  ('Demo Wheat Flour 1 kg', 'Jora demo product for cart and checkout testing.', 'Grocery', 70.00, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'),
  ('Demo Basmati Rice 1 kg', 'Jora demo product for cart and wishlist testing.', 'Grocery', 95.00, 'https://images.unsplash.com/photo-1586208958839-06c17cacdf08?auto=format&fit=crop&w=800&q=80'),
  ('Demo Fresh Tomatoes 500 g', 'Jora demo product for checkout testing.', 'Fruits & Vegetables', 35.00, 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=800&q=80'),
  ('Demo Farm Eggs 6 pack', 'Jora demo product for wishlist testing.', 'Dairy & Eggs', 72.00, 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?auto=format&fit=crop&w=800&q=80')
) as p(name, description, category, price, image_url)
where s.name = 'Jora Demo Grocery'
  and not exists (select 1 from public.products existing where existing.shop_id = s.id and existing.name = p.name);

insert into public.products (shop_id, name, description, category, price, image_url, stock, active)
select s.id, p.name, p.description, p.category, p.price, p.image_url, 40, true
from public.shops s
cross join (values
  ('Demo Bananas 1 kg', 'Jora demo fruit product.', 'Fruits & Vegetables', 55.00, 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80'),
  ('Demo Full Cream Milk 1 L', 'Jora demo dairy product.', 'Dairy & Eggs', 62.00, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80'),
  ('Demo Hand Wash 250 ml', 'Jora demo personal care product.', 'Personal Care', 89.00, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80')
) as p(name, description, category, price, image_url)
where s.name = 'Jora Demo Fresh Market'
  and not exists (select 1 from public.products existing where existing.shop_id = s.id and existing.name = p.name);

select 'seed complete' as status,
  (select count(*) from public.shops where name like 'Jora Demo %') as demo_shops,
  (select count(*) from public.products where name like 'Demo %') as demo_products;
