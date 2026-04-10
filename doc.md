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

CREATE OR REPLACE FUNCTION get_auth_user_age_months(uid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    (DATE_PART('year', AGE(NOW(), created_at)) * 12 +
     DATE_PART('month', AGE(NOW(), created_at)))::int
  FROM auth.users
  WHERE id = uid;
$$;


CREATE OR REPLACE FUNCTION get_user_category_counts(uid uuid)
RETURNS TABLE(categoryname text, usage_count bigint)
LANGUAGE sql
AS $$
  SELECT categoryname, COUNT(*) AS usage_count
  FROM userhistory
  WHERE userid = uid
  GROUP BY categoryname
  ORDER BY usage_count DESC;
$$;



CREATE OR REPLACE FUNCTION get_last_7_days_expenses(user_id_input UUID)
RETURNS TABLE(day_label TEXT, total_amount DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(d.day, 'Dy') AS day_label,
    COALESCE(SUM(h.amount), 0) AS total_amount
  FROM
    generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    ) AS d(day)
  LEFT JOIN public.userhistory h
    ON LEFT(h.date, 10)::DATE = d.day::DATE
    AND h.userid = user_id_input
  GROUP BY d.day
  ORDER BY d.day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_weekly_expense_sum(user_id_input UUID)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT SUM(amount)
      FROM public.userhistory
      WHERE userid = user_id_input
        AND LEFT(date, 10)::DATE >= DATE_TRUNC('week', CURRENT_DATE)::DATE
        AND LEFT(date, 10)::DATE <= CURRENT_DATE
    ),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



DROP FUNCTION IF EXISTS get_todays_expense_sum(uuid);

CREATE OR REPLACE FUNCTION get_todays_expense_sum(user_id_input UUID)
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT SUM(amount)
      FROM public.userhistory
      WHERE userid = user_id_input
        AND date LIKE TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') || '%'
    ),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_monthly_expense(user_id UUID)
RETURNS TABLE(total_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(h.amount::numeric), 0) AS total_amount
  FROM userhistory h
  WHERE h.userid = user_id
    AND DATE_TRUNC('month', h.created_at) = DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION get_monthly_amounts(user_id UUID)
RETURNS TABLE(total_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(a.amount::numeric), 0) AS total_amount
  FROM addmounthistory a
  WHERE a.userid = user_id
    AND DATE_TRUNC('month', a.created_at::timestamptz) = DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;