---
# INTERNAL (never rendered): anonymised pen-name study for a European real-estate
# firm. Do NOT reintroduce the real name, the named expert, or colleagues. Source:
# the RAG email-assistant build + the week-3 Claude Code / spec-driven training.
published: true
publishedAt: 2026-07-06
client: null
anonymizedName: A European real-estate firm
vertical: Real estate / PropTech
size: 50 FTE
geography: Europe (cross-border)
engagement: Overnight AI prototype + a hands-on Claude Code program for 7 of their people
oneLineOutcome: We built their AI. Then taught them to build.
summary: For twenty years, one person was the company's knowledge base — everyone messaged him. We turned that into software the whole team could use, then trained seven of their people to build the next tool themselves.
metrics:
  - value: "20 yrs"
    label: of expertise, made searchable
  - value: "7"
    label: of their team trained to build with AI
  # Was "7–11 hrs per week". JE (2026-10-03): show a yearly figure, top of the
  # range: 11 hrs x 48 working weeks = 528. Persona-review BLOCKed the bare number
  # (top of range with no basis), so it says "up to" and shows the arithmetic.
  - value: "Up to 528 hrs"
    label: "saved per trained person, per year (estimated: 7–11 hrs a week × 48 weeks)"
---

## The situation

Every company has one. The person who's been there forever and knows everything —
the one everyone messages when a client asks something hard. For this cross-border
real-estate firm, that person had held the knowledge for two decades. It worked,
right up until it didn't scale: answers were slow, they varied across languages,
and they all funnelled through a single human.

## The challenge

Get that knowledge out of one head and into the hands of the whole team — so
anyone could answer a client email accurately, in the right language, fast — and
do it without leaking personal data along the way.

## What we built

- **A knowledge assistant, built overnight.** It reads the incoming client email,
  strips personal data before anything else happens, searches a knowledge base of
  261 real answers, and drafts a grounded, cited reply in the client's language —
  in the company's voice, with a review step for anything sensitive. We hardened it
  with the team in a workshop the next day.
- **A training program, so they don't need us.** Rather than hand over a black box,
  we taught seven of their people to build the way we do — with Claude Code and
  spec-driven development, the write-the-spec-first method that produced the
  assistant in the first place. They left able to extend it themselves.

```chart
{
  "type": "bar",
  "title": "Time saved per trained champion, per week (hours)",
  "data": [
    { "label": "Low", "value": 7, "color": "cyan" },
    { "label": "High", "value": 11, "color": "violet" }
  ]
}
```

## What changed

- **Twenty years of expertise became a searchable, multilingual base** the whole
  team draws on — grounded in real answers, not guesses.
- **Seven people can now build, not just use.** Each saves an estimated 7–11 hours
  a week, and the firm can make the next change without waiting on us.
- **It proved a pattern:** an overnight prototype plus a hands-on workshop is a
  fast, low-risk way to show a team what AI does — and leave them able to keep
  going.
