# Jora data migration map

No export or live database credentials are present in this checkout, so no one-time data migration script was created.

| Previous collection | Supabase table | Key relationship |
| --- | --- | --- |
| users | profiles | Auth user UUID is the primary key |
| vendors | vendors / shops | `user_id` references profiles |
| products | products | vendor relationship replaces document reference |
| carts | carts / cart_items | cart belongs to one user |
| orders | orders / order_items | UUID foreign keys replace document references |
| partners | delivery_partners / partner_slots / partner_locations | partner belongs to profile |
| complaints | complaints / complaint_replies | reply belongs to complaint |
| banners / notifications | banners / notifications | notification targets a user or role |
| tax / fees | platform_settings | singleton configuration row |
| earnings | partner_earnings | one earning record per order |