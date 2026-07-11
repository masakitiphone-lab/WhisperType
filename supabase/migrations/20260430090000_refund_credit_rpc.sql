create or replace function public.refund_credit(user_id_param uuid, amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_credits integer;
begin
  if amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  update public.profiles
  set credits = credits + amount
  where id = user_id_param
  returning credits into remaining_credits;

  if remaining_credits is null then
    raise exception 'profile not found';
  end if;

  return remaining_credits;
end;
$$;

grant execute on function public.refund_credit(uuid, integer) to service_role;
