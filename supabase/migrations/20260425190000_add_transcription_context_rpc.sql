create or replace function public.get_transcription_context()
returns table(user_id uuid, credits integer)
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

  return query
  select p.id, p.credits
  from public.profiles p
  where p.id = current_user_id;
end;
$$;

grant execute on function public.get_transcription_context() to authenticated;
