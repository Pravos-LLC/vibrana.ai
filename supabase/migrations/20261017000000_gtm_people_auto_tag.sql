-- Plain-name tags (GTM cockpit, John 2026-10-16: "how can we intelligently make sure that when I mention Chetan or Abe or
-- Fatma in post content on LinkedIn it actually tags them?"). For someone marked here, the first time John writes their
-- name in a LinkedIn post, no "@" needed ("Chetan and I built..."), it goes out as a LinkedIn tag. Off by default: a
-- name like "Tom" is not tagged just because someone called Tom is on the list.
alter table public.gtm_people add column auto_tag boolean not null default false;

-- The team (proven tags: all three rendered as links on the 2026-10-02 reintroduction post).
update public.gtm_people set auto_tag = true
  where linkedin_url in ('https://www.linkedin.com/in/cnandakumar', 'https://www.linkedin.com/in/abesample20bf13e069b8', 'https://www.linkedin.com/in/fatma-sample69e210e6c2f3');
