-- Content stages, phase 1: per-format pipelines. A Story names its pipeline (short, carousel, text, episode, video); the
-- stages themselves are defined in code (vibrana-gtm lib/pipelines.ts), where the gate logic is reviewed and tested.
-- This migration stores progress: which stage a piece is at (gtm_story_stages, written by agents through the service
-- role) and an append-only log of every gate decision, bound to the bytes that were looked at
-- (gtm_story_stage_decisions). Only the final stage schedules; phase 0 (20261012210000) already keeps any non-final
-- asset off Zernio. The owner reads everything here; nothing in this migration lets the browser write.
--
-- John's rules (2026-10-12): a paper edit is reviewed in the terminal, never in /content, and an agent records his
-- approval; a third party (Tiam) sees the final only, and their sign-off blocks publishing, never a version.

alter table public.gtm_stories
  add column pipeline text check (pipeline in ('short', 'carousel', 'text', 'episode', 'video')),
  add column series text check (series ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  add column third_party_who text check (length(btrim(third_party_who)) between 1 and 200);

comment on column public.gtm_stories.pipeline is 'Per-format pipeline (vibrana-gtm lib/pipelines.ts). Null = legacy: one implicit final stage.';
comment on column public.gtm_stories.series is 'Series a piece belongs to, for batch review (e.g. sun-nation-shorts).';
comment on column public.gtm_stories.third_party_who is 'Who must approve the final before it may publish (e.g. Tiam / Sun Nation). Null = nobody.';

create index gtm_stories_series_idx on public.gtm_stories (series) where series is not null;

-- What a version was: the stage its bytes were made at, the agent's "what changed", and the pipeline's own label
-- (metadata.label, e.g. v4), review jump points and input hashes, copied from the asset at stage time.
alter table public.gtm_story_asset_versions
  add column stage text check (stage ~ '^[a-z][a-z0-9-]{0,39}$'),
  add column changes text not null default '' check (length(changes) <= 2000),
  add column metadata jsonb not null default '{}';

create or replace function public.gtm_story_asset_versioned()
returns trigger language plpgsql set search_path = '' as $$
declare existing bigint; next_label text; meta jsonb; what text;
begin
  select count(*) into existing from public.gtm_story_asset_versions v where v.asset_id = new.id;
  next_label := case when existing = 0 then 'v1' else 'v1.' || existing end;
  meta := jsonb_strip_nulls(jsonb_build_object(
    'label', new.metadata -> 'label', 'review_points', new.metadata -> 'review_points', 'inputs', new.metadata -> 'inputs'));
  what := left(coalesce(new.metadata ->> 'changes', ''), 2000);
  insert into public.gtm_story_asset_versions
    (asset_id, revision, label, sha256, kind, title, source, storage_path, poster_path, body, stage, changes, metadata)
  values
    (new.id, new.revision, next_label, new.sha256, new.kind, new.title, new.source, new.storage_path,
     new.metadata ->> 'poster_path', new.body, new.stage, what, meta)
  on conflict (asset_id, revision) do update
    set sha256 = excluded.sha256, title = excluded.title, source = excluded.source,
        storage_path = excluded.storage_path, poster_path = excluded.poster_path, body = excluded.body,
        stage = excluded.stage, changes = excluded.changes, metadata = excluded.metadata;
  return null;
end $$;
revoke all on function public.gtm_story_asset_versioned() from public, anon, authenticated;

update public.gtm_story_asset_versions v
   set stage = a.stage
  from public.gtm_story_assets a
 where a.id = v.asset_id and a.revision = v.revision and a.stage is not null;

-- One row per Story and stage: progress, written by agents (service role) and, from phase 2, by the owner's gate
-- decisions. A missing row is read by the cockpit (lib/pipeline-state.ts): a John gate without a row has not passed.
create table public.gtm_story_stages (
  story_id text not null references public.gtm_stories (id) on delete cascade,
  stage text not null check (stage ~ '^[a-z][a-z0-9-]{0,39}$'),
  status text not null check (status in ('todo', 'working', 'review', 'changes', 'approved', 'done', 'skipped', 'blocked')),
  note text not null default '' check (length(note) <= 2000),
  actor text check (length(actor) <= 200),
  updated_at timestamptz not null default now(),
  primary key (story_id, stage)
);

-- Every gate decision, never updated or deleted, bound to exactly what was looked at ([{asset_id, revision, sha256}]).
create table public.gtm_story_stage_decisions (
  id uuid primary key default gen_random_uuid(),
  story_id text not null references public.gtm_stories (id) on delete cascade,
  stage text not null check (stage ~ '^[a-z][a-z0-9-]{0,39}$'),
  party text not null check (party in ('john', 'third_party')),
  who text check (length(who) <= 200),
  decision text not null check (decision in ('approved', 'changes', 'reopened')),
  note text not null default '' check (length(note) <= 5000),
  assets jsonb not null default '[]' check (jsonb_typeof(assets) = 'array'),
  decided_by uuid,
  decided_at timestamptz not null default now()
);
create index gtm_story_stage_decisions_story_idx on public.gtm_story_stage_decisions (story_id, decided_at);

-- Deleting a Story cascades to its decisions; that delete is allowed because the parent row is already gone.
create function public.gtm_story_stage_decisions_append_only()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' and not exists (select 1 from public.gtm_stories s where s.id = old.story_id) then
    return old;
  end if;
  raise exception 'stage decisions are append-only' using errcode = 'insufficient_privilege';
end $$;
create trigger gtm_story_stage_decisions_append_only before update or delete on public.gtm_story_stage_decisions
  for each row execute function public.gtm_story_stage_decisions_append_only();
revoke all on function public.gtm_story_stage_decisions_append_only() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['gtm_story_stages', 'gtm_story_stage_decisions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format($p$create policy %I on public.%I for select to authenticated
      using (coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'gtm_owner')::boolean, false))$p$,
      t || '_owner_read', t);
  end loop;
end $$;

-- A note says which stage it was written at, so the agent knows "this is about the rough cut".
alter table public.gtm_story_feedback add column stage text check (stage ~ '^[a-z][a-z0-9-]{0,39}$');
update public.gtm_story_feedback f set stage = a.stage from public.gtm_story_assets a where a.id = f.asset_id and a.stage is not null;

create or replace function public.gtm_add_story_feedback(p_asset_id text, p_channel text, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid; current_revision bigint; current_stage text;
begin
  if (select auth.uid()) is null or
     not coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'gtm_owner')::boolean, false) then
    raise exception 'only the signed-in owner can leave Story feedback' using errcode = 'insufficient_privilege';
  end if;
  if p_body is null or length(btrim(p_body)) = 0 or length(p_body) > 5000 then
    raise exception 'invalid Story feedback' using errcode = 'invalid_parameter_value';
  end if;
  select a.revision, a.stage into current_revision, current_stage from public.gtm_story_assets a where a.id = p_asset_id;
  if current_revision is null then raise exception 'Story asset not found'; end if;
  insert into public.gtm_story_feedback (asset_id, channel, body, revision, stage)
    values (p_asset_id, p_channel, p_body, current_revision, current_stage)
    returning id into new_id;
  return new_id;
end $$;
revoke all on function public.gtm_add_story_feedback(text, text, text) from public, anon, authenticated;
grant execute on function public.gtm_add_story_feedback(text, text, text) to authenticated;

-- Backfill. The season-1 pieces get their pipeline from vibrana-gtm config/season1.json (kind: short, carousel, video,
-- video+carousel -> video); 13 to 17 are finished podcast clips (short). Everything already made was made outside the
-- stage system, so every non-final stage is recorded as done and the assets stay final (stage null): nothing that is
-- approved or scheduled changes, and none of these pieces shows a stage badge.
update public.gtm_stories s
   set pipeline = v.pipeline
  from (values
    ('s1-01-maturity-model', 'video'), ('s1-02-the-wave', 'video'), ('s1-03-ai-eating-your-brain', 'video'),
    ('s1-04-top-10-agentic-engineers', 'carousel'), ('s1-05-loop-engineering', 'video'), ('s1-06-grief-and-agency', 'video'),
    ('s1-07-top-7-company-brain', 'carousel'), ('s1-08-codebase-falling-apart', 'video'), ('s1-09-context-hubs', 'video'),
    ('s1-10-surfing-flow', 'video'), ('s1-11-top-10-open-source-ai', 'carousel'), ('s1-12-engineers-hate-me', 'video'),
    ('s1-13-power-vs-purpose', 'short'), ('s1-14-double-edged-sword', 'short'), ('s1-15-great-divide', 'short'),
    ('s1-16-combinatory-creature', 'short'), ('s1-17-bias-beneath-the-code', 'short')
  ) as v (id, pipeline)
 where s.id = v.id and s.pipeline is null;

insert into public.gtm_story_stages (story_id, stage, status, note, actor)
select s.id, st.stage, 'done', 'made before stages existed', 'backfill'
  from public.gtm_stories s
  join (values
    ('short', 'paper-edit'), ('short', 'rough-cut'), ('short', 'enhance-plan'), ('short', 'broll'), ('short', 'motion'), ('short', 'finish'),
    ('carousel', 'copy'), ('carousel', 'slide-copy'), ('video', 'storyboard'), ('video', 'motion')
  ) as st (pipeline, stage) on st.pipeline = s.pipeline
 where s.id ~ '^s1-(0[1-9]|1[0-7])-'
on conflict do nothing;

-- The Sun Nation shorts (18 to 22): rough cuts (phase 0 set their video to stage rough-cut), Tiam signs off on the final.
-- The paper edits were approved in the episode PLAN.md. The rough-cut row reads the current platform decisions on the
-- video: approved on every platform -> approved, any sent back -> changes, otherwise waiting on John.
update public.gtm_stories
   set pipeline = 'short', series = 'sun-nation-shorts', third_party_who = 'Tiam / Sun Nation'
 where id ~ '^s1-(18|19|20|21|22)-sn-';

insert into public.gtm_story_stages (story_id, stage, status, note, actor)
select s.id, 'paper-edit', 'approved', 'approved in the episode PLAN.md, 2026-10', 'backfill'
  from public.gtm_stories s where s.id ~ '^s1-(18|19|20|21|22)-sn-'
on conflict do nothing;

insert into public.gtm_story_stages (story_id, stage, status, note, actor)
select s.id, 'rough-cut',
       case
         when bool_or(c.status = 'rejected') then 'changes'
         when count(c.*) > 0 and bool_and(c.status = 'approved' and c.approved_sha256 = a.sha256) then 'approved'
         else 'review'
       end,
       '', 'backfill'
  from public.gtm_stories s
  join public.gtm_story_assets a on a.story_id = s.id and a.kind = 'video' and a.stage = 'rough-cut'
  left join public.gtm_story_asset_channels c on c.asset_id = a.id
 where s.id ~ '^s1-(18|19|20|21|22)-sn-'
 group by s.id
on conflict do nothing;
