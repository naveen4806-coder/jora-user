-- Vendor-to-partner assignment for the shared customer, vendor and partner flow.
-- Run this in the same Supabase project after 0009_shared_delivery_tracking.sql.

drop function if exists public.assign_delivery_partner(text, uuid);

create function public.assign_delivery_partner(order_id text, partner_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_presence public.delivery_partner_presence;
begin
  select * into v_order
  from public.orders
  where id = order_id::uuid
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.vendor_id is distinct from auth.uid() then
    raise exception 'Only the order vendor can assign a delivery partner';
  end if;

  if v_order.status not in ('confirmed', 'packed') then
    raise exception 'This order cannot be assigned in its current status';
  end if;

  select * into v_presence
  from public.delivery_partner_presence
  where id = partner_id
  for update;

  if not found or not v_presence.is_online then
    raise exception 'Selected delivery partner is not online';
  end if;

  if v_presence.active_order_id is not null and v_presence.active_order_id <> v_order.id then
    raise exception 'Selected delivery partner already has an active order';
  end if;

  update public.orders
  set rider_id = partner_id,
      status = 'handed_to_delivery_partner',
      rider_lat = v_presence.latitude,
      rider_lng = v_presence.longitude,
      rider_location_accuracy = v_presence.location_accuracy,
      rider_location_updated_at = v_presence.location_updated_at,
      updated_at = now()
  where id = v_order.id
  returning * into v_order;

  update public.delivery_partner_presence
  set active_order_id = v_order.id,
      updated_at = now()
  where id = partner_id;

  return v_order;
end;
$$;

revoke all on function public.assign_delivery_partner(text, uuid) from public, anon;
grant execute on function public.assign_delivery_partner(text, uuid) to authenticated;

-- Refresh the PostgREST RPC cache so the browser sees order_id and partner_id.
notify pgrst, 'reload schema';
