-- Pending third-party approval. A Story can be held while someone outside Vibrana (a client, a guest, a partner)
-- signs off on it. The cockpit's auto-scheduler never queues a held Story, even when John has approved every
-- platform; releasing the hold ("Third party approved") lets approval schedule it as usual. This replaces
-- vibrana-gtm's config/schedule-holds.json. The owner sets and clears a hold through gtm_set_story_hold only; the
-- browser role keeps SELECT on gtm_stories, like every gtm_* table.

alter table public.gtm_stories
  add column hold_who text,
  add column hold_note text not null default '',
  add column held_at timestamptz,
  add column held_by uuid,
  add constraint gtm_stories_hold check (
    (held_at is null and hold_who is null and hold_note = '' and held_by is null)
    or (held_at is not null and length(hold_who) <= 200 and length(hold_note) <= 2000)
  );

create index gtm_stories_held_idx on public.gtm_stories (id) where held_at is not null;

-- p_held = true puts the Story on hold (who and note are optional, trimmed); false releases it.
-- Returns whether the Story is held afterwards.
create function public.gtm_set_story_hold(p_story_id text, p_held boolean, p_who text, p_note text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or
     not coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'gtm_owner')::boolean, false) then
    raise exception 'only the signed-in owner can hold a Story' using errcode = 'insufficient_privilege';
  end if;
  if p_held is null or length(coalesce(p_who, '')) > 200 or length(coalesce(p_note, '')) > 2000 then
    raise exception 'invalid hold' using errcode = 'invalid_parameter_value';
  end if;
  if p_held then
    update public.gtm_stories
       set held_at = coalesce(held_at, now()), held_by = (select auth.uid()),
           hold_who = btrim(coalesce(p_who, '')), hold_note = btrim(coalesce(p_note, '')), updated_at = now()
     where id = p_story_id;
  else
    update public.gtm_stories
       set held_at = null, held_by = null, hold_who = null, hold_note = '', updated_at = now()
     where id = p_story_id;
  end if;
  if not found then raise exception 'Story not found'; end if;
  return p_held;
end $$;
revoke all on function public.gtm_set_story_hold(text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.gtm_set_story_hold(text, boolean, text, text) to authenticated;

-- The Sun Nation shorts were held in config/schedule-holds.json; they wait on Tiam's sign-off of the v4 cut.
update public.gtm_stories
   set held_at = now(), hold_who = 'Tiam / Sun Nation', hold_note = 'Waiting on Tiam''s approval of the v4 cut'
 where id ~ '^s1-(18|19|20|21|22)-sn-' and held_at is null;
