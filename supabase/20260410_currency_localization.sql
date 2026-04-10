-- Currency localization migration
-- Adds country/currency fields and conversion RPC for user-level currency changes.

-- 1) User profile fields (stored in useramount for each auth user)
alter table if exists public.useramount
  add column if not exists country_iso text,
  add column if not exists currency_iso text not null default 'USD',
  add column if not exists is_default_currency boolean not null default true;

-- 2) Financial records now carry currency ISO
alter table if exists public.userhistory
  add column if not exists currency_iso text not null default 'USD';

alter table if exists public.addmounthistory
  add column if not exists currency_iso text not null default 'USD';

-- 3) Ensure legacy records are marked USD
update public.userhistory set currency_iso = 'USD' where currency_iso is null;
update public.addmounthistory set currency_iso = 'USD' where currency_iso is null;
update public.useramount set currency_iso = 'USD' where currency_iso is null;

-- Optional check constraints for ISO shape
alter table if exists public.userhistory
  drop constraint if exists userhistory_currency_iso_len_check;
alter table if exists public.userhistory
  add constraint userhistory_currency_iso_len_check check (char_length(currency_iso) = 3);

alter table if exists public.addmounthistory
  drop constraint if exists addmounthistory_currency_iso_len_check;
alter table if exists public.addmounthistory
  add constraint addmounthistory_currency_iso_len_check check (char_length(currency_iso) = 3);

alter table if exists public.useramount
  drop constraint if exists useramount_currency_iso_len_check;
alter table if exists public.useramount
  add constraint useramount_currency_iso_len_check check (char_length(currency_iso) = 3);

-- 4) Conversion RPC: converts all stored amounts in one transaction.
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
