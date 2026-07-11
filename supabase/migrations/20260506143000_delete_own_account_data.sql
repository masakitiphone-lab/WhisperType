create or replace function public.delete_own_account_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  delete from public.transcription_history
  where user_id = current_user_id;

  delete from public.profiles
  where id = current_user_id;
end;
$$;

revoke execute on function public.delete_own_account_data() from public, anon;
grant execute on function public.delete_own_account_data() to authenticated;

