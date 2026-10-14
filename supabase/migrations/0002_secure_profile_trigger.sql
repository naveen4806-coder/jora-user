-- Prevent browser/API roles from calling the profile trigger function directly.
-- The auth.users trigger can still call it when a customer signs up.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
