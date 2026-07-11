create or replace function public.record_transcription(
  user_id_param uuid,
  transcribed_text_param text,
  credits_used_param integer default 1
)
returns table(history_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_history_id uuid;
  new_remaining_credits integer;
begin
  new_remaining_credits := public.decrement_credits(user_id_param, credits_used_param);

  insert into public.transcription_history (user_id, transcribed_text, credits_used)
  values (user_id_param, coalesce(transcribed_text_param, ''), credits_used_param)
  returning id into new_history_id;

  return query
  select new_history_id, new_remaining_credits;
end;
$$;

grant execute on function public.record_transcription(uuid, text, integer) to service_role;

create or replace function public.record_transcription(
  transcribed_text_param text,
  credits_used_param integer default 1
)
returns table(history_id uuid, remaining_credits integer)
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
  select *
  from public.record_transcription(
    current_user_id,
    transcribed_text_param,
    credits_used_param
  );
end;
$$;

grant execute on function public.record_transcription(text, integer) to authenticated;
