-- Synthetic records only, inside an isolated disposable database.
insert into public.booking_connections(id,host_id,account,token,calendars)
values ('20000000-0000-4000-8000-000000000001','john','host@example.test','ciphertext',array['calendar']);
update public.booking_hosts set destination_connection='20000000-0000-4000-8000-000000000001',destination_calendar='calendar' where id='john';
create function public.booking_test_input(bid uuid) returns jsonb language sql as $$
select jsonb_build_object('id', bid, 'host_id','john','token_hash','hash','management_secret','ciphertext','name','Test Visitor','email','visitor@example.test','context','',
  'start_at', date_trunc('day',now()) + interval '2 days 6 hours', 'end_at',date_trunc('day',now()) + interval '2 days 6 hours 30 minutes', 'revision',(select revision from public.booking_hosts where id='john'));
$$;

do $$
declare p jsonb; s jsonb; iid uuid := gen_random_uuid(); bid uuid := '30000000-0000-4000-8000-000000000001';
begin
  if (select product from public.bookings where id='90000000-0000-4000-8000-000000000001') <> 'legacy-sentinel' then raise exception 'Legacy booking data changed'; end if;
  if has_table_privilege('anon','public.booking_reservations','select') or has_table_privilege('authenticated','public.booking_connections','select') then raise exception 'Public data access'; end if;
  if has_function_privilege('anon','public.booking_reserve(jsonb,jsonb,boolean)','execute') or has_function_privilege('authenticated','public.booking_config(text,jsonb,uuid,text,jsonb)','execute') then raise exception 'Public RPC access'; end if;
  if exists(select from pg_class where oid in ('public.booking_reservations'::regclass,'public.booking_hosts'::regclass,'public.booking_connections'::regclass,'public.booking_invites'::regclass) and not relrowsecurity) then raise exception 'Missing RLS'; end if;
  select schedule into s from public.booking_hosts where id='john';
  insert into public.booking_invites(id,host_id,token_hash,from_date,to_date,expires_at,recipient) values(iid,'john','invitehash',current_date,current_date+10,now()+interval '10 days','visitor@example.test');
  p := public.booking_test_input(bid) || jsonb_build_object('invite_id',iid);
  perform public.booking_reserve(p,s);
  -- Retry remains the same booking.
  perform public.booking_reserve(p,s);
  begin
    perform public.booking_reserve(p || jsonb_build_object('id',gen_random_uuid(),'start_at',date_trunc('day',now())+interval '2 days 8 hours','end_at',date_trunc('day',now())+interval '2 days 8 hours 30 minutes'),s);
    raise exception 'TEST_FAILURE: invitation reused';
  exception when raise_exception then if sqlerrm like 'TEST_FAILURE%' then raise; end if; end;
  update public.booking_reservations set status='confirmed' where id=bid;
  perform public.booking_reserve(p || jsonb_build_object('start_at',date_trunc('day',now())+interval '2 days 8 hours','end_at',date_trunc('day',now())+interval '2 days 8 hours 30 minutes'),s,true);
  if (select status from public.booking_reservations where id=bid) <> 'moving' then raise exception 'Move not held'; end if;
  begin
    perform public.booking_reserve(public.booking_test_input(gen_random_uuid()) || jsonb_build_object('revision','old'),s);
    raise exception 'TEST_FAILURE: stale configuration accepted';
  exception when raise_exception then if sqlerrm like 'TEST_FAILURE%' then raise; end if; end;
  update public.booking_reservations set status='cancelled' where id=bid;
  begin
    perform public.booking_reserve(p || jsonb_build_object('id',gen_random_uuid()),s);
    raise exception 'TEST_FAILURE: cancelled invitation reused';
  exception when raise_exception then if sqlerrm like 'TEST_FAILURE%' then raise; end if; end;
  delete from public.booking_jobs;
  delete from public.booking_reservations;
  update public.booking_invites set revoked=true where id=iid;
  begin
    perform public.booking_reserve(p,s);
    raise exception 'TEST_FAILURE: revoked invitation accepted';
  exception when raise_exception then if sqlerrm like 'TEST_FAILURE%' then raise; end if; end;
end $$;
