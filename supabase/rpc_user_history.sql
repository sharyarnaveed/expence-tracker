-- RPC: Get transaction history for the current (or specified) user from userhistory
-- Call from app: supabase.rpc('get_user_history') or supabase.rpc('get_user_history', { p_userid: userId })
create or replace function public.get_user_history(p_userid uuid default auth.uid())
returns setof public.userhistory
language sql
security definer
set search_path = public
as $$
  select *
  from public.userhistory
  where userid = p_userid
  order by created_at desc;
$$;

-- RPC: Get add-amount history for the current (or specified) user from addmounthistory
-- Call from app: supabase.rpc('get_add_amount_history') or supabase.rpc('get_add_amount_history', { p_userid: userId })
create or replace function public.get_add_amount_history(p_userid uuid default auth.uid())
returns setof public.addmounthistory
language sql
security definer
set search_path = public
as $$
  select *
  from public.addmounthistory
  where userid = p_userid
  order by created_at desc;
$$;

-- Optional: grant execute to authenticated users (adjust if you use anon or other roles)
grant execute on function public.get_user_history(uuid) to authenticated;
grant execute on function public.get_add_amount_history(uuid) to authenticated;
