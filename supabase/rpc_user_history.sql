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

-- RPC: Convert all amounts for one user from old currency to new currency.
create or replace function public.convert_user_currency(
  p_userid uuid,
  p_from_currency_iso text,
  p_to_currency_iso text,
  p_rate numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_userid is null then
    raise exception 'p_userid is required';
  end if;

  if p_rate is null or p_rate <= 0 then
    raise exception 'p_rate must be > 0';
  end if;

  if upper(coalesce(p_from_currency_iso, '')) = upper(coalesce(p_to_currency_iso, '')) then
    return;
  end if;

  update public.userhistory
  set
    amount = round((amount::numeric * p_rate)::numeric, 2),
    currency_iso = upper(p_to_currency_iso)
  where userid = p_userid
    and upper(currency_iso) = upper(p_from_currency_iso);

  update public.addmounthistory
  set
    amount = round((amount::numeric * p_rate)::numeric, 2),
    currency_iso = upper(p_to_currency_iso)
  where userid = p_userid
    and upper(currency_iso) = upper(p_from_currency_iso);

  update public.useramount
  set
    addedamount = round((addedamount::numeric * p_rate)::numeric, 2),
    currency_iso = upper(p_to_currency_iso),
    is_default_currency = false
  where userid = p_userid;
end;
$$;

grant execute on function public.convert_user_currency(uuid, text, text, numeric) to authenticated;
