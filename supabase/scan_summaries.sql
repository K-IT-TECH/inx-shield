-- Deployed with the Supabase apply_migration API: private_scan_summaries.
create table public.scan_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  source text not null check (source in ('sms','email','whatsapp','other')),
  verdict text not null check (verdict in ('scam','caution','promotion','low','unclear')),
  reason_codes text[] not null default '{}' check (cardinality(reason_codes) <= 12 and reason_codes <@ array['credentials','urgency','threat','prize','payment','remote','impersonation','short_link','unusual_link','link','promotion']::text[]),
  engine_version text not null check (length(engine_version) <= 30)
);
create index scan_summaries_owner_date on public.scan_summaries (user_id, created_at desc);
alter table public.scan_summaries enable row level security;
revoke all on public.scan_summaries from anon, authenticated;
grant select, insert, delete on public.scan_summaries to authenticated;
create policy "Read own summaries" on public.scan_summaries for select to authenticated using ((select auth.uid()) = user_id);
create policy "Save own summaries" on public.scan_summaries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own summaries" on public.scan_summaries for delete to authenticated using ((select auth.uid()) = user_id);
comment on table public.scan_summaries is 'Opt-in result metadata only. No message body, phone numbers, links, or email addresses.';
