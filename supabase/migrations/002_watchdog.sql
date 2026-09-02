create type public.watchdog_source_kind as enum ('web','marketplace','app_store','code_host','domain','social','publication','patent_record','trademark_record','custom');
create type public.watchdog_match_status as enum ('new','triaged','dismissed','escalated','confirmed_related','resolved');

create table public.watchdog_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  tier text not null check (tier in ('individual','professional','enterprise')),
  status public.billing_status not null default 'pending',
  stripe_subscription_id text unique,
  max_assets integer,
  scan_interval_minutes integer not null check (scan_interval_minutes >= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.watchdog_assets (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.watchdog_subscriptions(id) on delete cascade,
  record_id uuid not null references public.ip_records(id) on delete cascade,
  enabled boolean not null default true,
  watch_terms text[] not null default '{}',
  known_domains text[] not null default '{}',
  known_accounts text[] not null default '{}',
  perceptual_fingerprints jsonb not null default '{}'::jsonb,
  code_fingerprints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(subscription_id, record_id)
);

create table public.watchdog_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind public.watchdog_source_kind not null,
  name text not null,
  base_url text,
  enabled boolean not null default true,
  terms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.watchdog_scans (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.watchdog_assets(id) on delete cascade,
  source_id uuid references public.watchdog_sources(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running','complete','failed','partial')),
  request_fingerprint text not null,
  result_count integer not null default 0,
  error_code text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.watchdog_matches (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.watchdog_scans(id) on delete cascade,
  asset_id uuid not null references public.watchdog_assets(id) on delete cascade,
  source_kind public.watchdog_source_kind not null,
  source_url text not null,
  discovered_at timestamptz not null default now(),
  observed_at timestamptz,
  title text,
  excerpt text,
  content_hash text not null,
  similarity_score numeric(5,4) check (similarity_score between 0 and 1),
  provenance_score numeric(5,4) check (provenance_score between 0 and 1),
  legal_risk_score numeric(5,4) check (legal_risk_score between 0 and 1),
  confidence_score numeric(5,4) check (confidence_score between 0 and 1),
  rationale jsonb not null default '{}'::jsonb,
  status public.watchdog_match_status not null default 'new',
  evidence_item_id uuid references public.evidence_items(id),
  created_at timestamptz not null default now(),
  unique(asset_id, source_url, content_hash)
);
create index watchdog_matches_asset_idx on public.watchdog_matches(asset_id, discovered_at desc);
create index watchdog_matches_status_idx on public.watchdog_matches(status, confidence_score desc);

create table public.watchdog_alerts (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.watchdog_matches(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel text not null check (channel in ('email','in_app','webhook','api')),
  destination_ref text,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  delivery_status text not null default 'pending' check (delivery_status in ('pending','sent','failed','acknowledged')),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.watchdog_subscriptions enable row level security;
alter table public.watchdog_assets enable row level security;
alter table public.watchdog_sources enable row level security;
alter table public.watchdog_scans enable row level security;
alter table public.watchdog_matches enable row level security;
alter table public.watchdog_alerts enable row level security;

create policy watchdog_subscriptions_read on public.watchdog_subscriptions for select to authenticated using (user_id=(select auth.uid()));
create policy watchdog_assets_read on public.watchdog_assets for select to authenticated using (exists (select 1 from public.watchdog_subscriptions s where s.id=subscription_id and s.user_id=(select auth.uid())));
create policy watchdog_sources_read on public.watchdog_sources for select to authenticated using (exists (select 1 from public.organization_members m where m.organization_id=watchdog_sources.organization_id and m.user_id=(select auth.uid())));
create policy watchdog_scans_read on public.watchdog_scans for select to authenticated using (exists (select 1 from public.watchdog_assets a join public.watchdog_subscriptions s on s.id=a.subscription_id where a.id=asset_id and s.user_id=(select auth.uid())));
create policy watchdog_matches_read on public.watchdog_matches for select to authenticated using (exists (select 1 from public.watchdog_assets a join public.watchdog_subscriptions s on s.id=a.subscription_id where a.id=asset_id and s.user_id=(select auth.uid())));
create policy watchdog_alerts_read on public.watchdog_alerts for select to authenticated using (exists (select 1 from public.organization_members m where m.organization_id=watchdog_alerts.organization_id and m.user_id=(select auth.uid())));
