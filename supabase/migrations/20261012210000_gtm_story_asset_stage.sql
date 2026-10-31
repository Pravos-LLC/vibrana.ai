-- Content stages, phase 0: an asset knows which stage of its pipeline it is at, so a rough cut can never be
-- scheduled or published. Null is a final (or legacy, single-stage) asset and behaves exactly as before.
--
-- Approval of a non-final asset is still allowed on purpose: John approves a rough cut to say "the edit is good".
-- The cockpit (vibrana-gtm) is what keeps that approval from ever scheduling: its auto-scheduler treats a channel as
-- ready only when every bound media asset is final, and its publish gate refuses a non-final asset before Zernio.
--
-- Moving an asset from one stage to another (rough-cut -> final, or back) clears its channel approvals, even when the
-- bytes are unchanged: approving a rough cut ("the edit is good") is not approving the final ("these bytes go out").
-- Setting a stage on an asset that had none keeps them, so the Sun Nation approvals below now mean "rough cut approved".

alter table public.gtm_story_assets
  add column stage text check (stage ~ '^[a-z][a-z0-9-]{0,39}$');

comment on column public.gtm_story_assets.stage is
  'Pipeline stage of this asset (e.g. rough-cut, final). Null = final/legacy. Only null or final can be scheduled.';

create or replace function public.gtm_story_asset_changed()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.revision := old.revision;
  if new.sha256 is distinct from old.sha256
     or new.source is distinct from old.source
     or new.title is distinct from old.title
     or new.kind is distinct from old.kind
     or new.storage_path is distinct from old.storage_path
     or new.body is distinct from old.body
     or new.url is distinct from old.url then
    new.revision := old.revision + 1;
    update public.gtm_story_asset_channels
       set status = 'pending', approved_sha256 = null, reviewed_by = null,
           reviewed_at = null, note = '', updated_at = now()
     where asset_id = old.id;
  elsif old.stage is not null and new.stage is distinct from old.stage then
    update public.gtm_story_asset_channels
       set status = 'pending', approved_sha256 = null, reviewed_by = null,
           reviewed_at = null, note = '', updated_at = now()
     where asset_id = old.id and status = 'approved';
  end if;
  return new;
end $$;
revoke all on function public.gtm_story_asset_changed() from public, anon, authenticated;

-- The Sun Nation shorts (s1-18..22) are rough cuts (no B-roll, no Motion yet). Captions stay stageless.
update public.gtm_story_assets
   set stage = 'rough-cut'
 where story_id ~ '^s1-(18|19|20|21|22)-sn-' and kind = 'video' and stage is null;

-- A third-party hold blocks publishing, not a version: Tiam only ever sees the final cut, never a rough one. The holds
-- above said "Waiting on Tiam's approval of the v4 cut"; the cockpit now reads "Publishing blocked until Tiam / Sun
-- Nation approves the final cut", and the note says the rest.
update public.gtm_stories
   set hold_note = 'Tiam only ever sees final versions, never rough cuts', updated_at = now()
 where id ~ '^s1-(18|19|20|21|22)-sn-' and held_at is not null;
