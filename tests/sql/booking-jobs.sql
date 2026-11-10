begin;
do $$
declare
  bid uuid := '40000000-0000-4000-8000-000000000001';
  wid uuid := gen_random_uuid(); jid uuid; got integer; i integer; allowed boolean;
begin
  perform public.booking_reserve(public.booking_test_input(bid) || '{"ai_consent":true}', (select schedule from public.booking_hosts where id='john'));
  update public.booking_reservations set status='confirmed',meet_url='https://meet.google.com/synthetic' where id=bid;
  if (select count(*) from public.booking_jobs where booking_id=bid) <> 2 then raise exception 'Expected separate durable CRM and opt-in brief jobs'; end if;
  update public.booking_reservations set status='confirmed' where id=bid;
  if (select count(*) from public.booking_jobs where booking_id=bid) <> 2 then raise exception 'Duplicate status update enqueued duplicate jobs'; end if;
  if exists(select 1 from public.booking_jobs where payload ? 'management_secret' or payload ? 'token_hash' or payload ? 'token') then raise exception 'Private management credential in integration payload'; end if;
  select count(*) into got from public.booking_claim_job(array['crm'],wid);
  if got <> 1 then raise exception 'CRM job not claimed'; end if;
  select count(*) into got from public.booking_claim_job(array['crm'],gen_random_uuid());
  if got <> 0 then raise exception 'Another worker stole the same job'; end if;
  select id into jid from public.booking_claim_job(array['briefing'],wid);
  if not public.booking_start_brief(jid,wid) then raise exception 'First paid attempt refused'; end if;
  if public.booking_start_brief(jid,wid) then raise exception 'Duplicate paid attempt allowed'; end if;
  for i in 1..20 loop
    insert into public.booking_jobs(booking_id,host_id,kind,event_key,payload,worker_id)
      values(bid,'john','briefing','budget-'||i,'{}',wid) returning id into jid;
    allowed := public.booking_start_brief(jid,wid);
    if allowed <> (i<20) then raise exception 'Global daily AI ceiling failed'; end if;
  end loop;
  if (select hits from public.booking_ai_budget where day=current_date) <> 20 then raise exception 'AI budget count incorrect'; end if;
  update public.booking_reservations set status='moving' where id=bid;
  update public.booking_reservations set status='confirmed',start_at=start_at+interval '1 hour',end_at=end_at+interval '1 hour' where id=bid;
  if (select count(*) from public.booking_jobs where booking_id=bid and kind='crm') <> 2 then raise exception 'Reschedule activity missing'; end if;
  update public.booking_reservations set status='cancelling' where id=bid;
  update public.booking_reservations set status='cancelled' where id=bid;
  if (select count(*) from public.booking_jobs where booking_id=bid and kind='crm') <> 3 then raise exception 'Cancellation activity missing'; end if;
  if has_function_privilege('anon','public.booking_claim_job(text[],uuid)','execute') or has_function_privilege('authenticated','public.booking_start_brief(uuid,uuid)','execute') then raise exception 'Public job access'; end if;
  if has_table_privilege('anon','public.booking_jobs','select') or has_table_privilege('authenticated','public.booking_ai_budget','select') then raise exception 'Public integration data'; end if;
end $$;
rollback;
