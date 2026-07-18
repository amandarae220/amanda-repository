-- ─────────────────────────────────────────────────────────────────────────────
-- Calculator2.0 — analytics event schema
--
-- Run this in the Supabase SQL editor for the calculator's project. The anon
-- key in assets/config.js is public by design; the security boundary is the
-- Row Level Security policies below.
--
-- Security model:
--   • Anonymous clients can INSERT events only, and only events that pass the
--     WITH CHECK constraints (whitelisted event_type + length caps). No read,
--     no update, no delete.
--   • Only the specific admin user (identified by email) can SELECT events.
--     Even if Supabase email sign-ups are enabled and an attacker registers,
--     they still can't read data unless they own the admin email.
--
-- Apply once, then visit /admin to log in.
--
-- If you're migrating from the previous (looser) policies, see the
-- "migration from v1 policies" section at the bottom of this file — run
-- those DROP statements first, then re-run the CREATE statements above them.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Admin email — the ONE identity allowed to read events ───────────────────
-- Change this if the admin address ever changes, then re-run the SELECT policy.
-- SELECT policy hardcodes it because parameterizing at policy-eval time isn't
-- possible in Postgres RLS.

create table if not exists calculator_events (
  id               uuid        primary key default gen_random_uuid(),
  visitor_id       text        not null,
  event_type       text        not null,
  page             text,
  label            text,
  payload          jsonb,
  referrer         text,
  device           text,
  browser          text,
  duration_seconds integer,
  created_at       timestamptz not null default now()
);

create index if not exists calculator_events_created_at_idx
  on calculator_events (created_at desc);

create index if not exists calculator_events_event_type_idx
  on calculator_events (event_type);

alter table calculator_events enable row level security;

-- ── INSERT policy (anon) ────────────────────────────────────────────────────
-- Anyone can insert, but the WITH CHECK caps input length and whitelists
-- event_type. This blocks attackers from writing multi-megabyte payloads or
-- exotic event types designed to poison the admin UI.

create policy "anon can insert bounded events"
  on calculator_events for insert
  to anon
  with check (
    event_type in (
      'page_view',
      'page_exit',
      'scenario_saved',
      'insight_focused',
      'mobile_sheet_opened',
      'calculation',
      'coast_fi_used'
    )
    and length(visitor_id) between 8 and 64
    and length(coalesce(page,     '')) <= 200
    and length(coalesce(label,    '')) <= 100
    and length(coalesce(referrer, '')) <= 200
    and length(coalesce(device,   '')) <= 32
    and length(coalesce(browser,  '')) <= 32
    and (duration_seconds is null or duration_seconds between 0 and 86400)
  );

-- ── SELECT policy (authenticated admin only) ────────────────────────────────
-- Restricted to the specific admin email. Even if email signups are enabled
-- and an attacker registers a new account, they can't SELECT anything unless
-- their email matches. This is the defense against the "authenticated ==
-- authorized" gap in the previous policy.

create policy "admin can read events"
  on calculator_events for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'amandarae19@gmail.com');

-- (No update or delete policies = those operations are denied to all clients.)

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration from the earlier "authenticated can read" + "anon can insert"
-- policies. Run these BEFORE re-executing the CREATE POLICY statements above
-- if you already applied v1 of this schema.
--
--   drop policy if exists "authenticated can read events" on calculator_events;
--   drop policy if exists "anon can insert events"        on calculator_events;
--
-- After running the drops, the CREATE POLICY statements above will succeed.
-- Then reload PostgREST's schema cache so the new policies take effect:
--
--   notify pgrst, 'reload schema';
-- ─────────────────────────────────────────────────────────────────────────────
