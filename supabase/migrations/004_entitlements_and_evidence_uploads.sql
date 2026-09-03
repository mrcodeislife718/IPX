create table public.evidence_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  record_id uuid not null references public.ip_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  filename text not null,
  media_type text not null,
  expected_byte_size bigint not null check (expected_byte_size > 0 and expected_byte_size <= 104857600),
  status text not null default 'pending' check (status in ('pending','uploaded','finalized','expired','cancelled')),
  expires_at timestamptz not null,
  finalized_evidence_id uuid references public.evidence_items(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index evidence_upload_sessions_owner_idx on public.evidence_upload_sessions(user_id, created_at desc);

create table public.service_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  service_code text not null,
  status text not null default 'active' check (status in ('active','consumed','expired','revoked','refunded')),
  quantity integer not null default 1 check (quantity > 0),
  consumed_quantity integer not null default 0 check (consumed_quantity >= 0),
  metadata jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (consumed_quantity <= quantity)
);
create index service_entitlements_org_idx on public.service_entitlements(organization_id,status,service_code);

alter table public.evidence_upload_sessions enable row level security;
alter table public.service_entitlements enable row level security;

create policy evidence_upload_sessions_read on public.evidence_upload_sessions for select to authenticated using (user_id=(select auth.uid()));
create policy service_entitlements_read on public.service_entitlements for select to authenticated using (user_id=(select auth.uid()) or exists (select 1 from public.organization_members m where m.organization_id=service_entitlements.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin')));

alter table public.orders add column if not exists stripe_checkout_session_id text unique;
alter table public.orders add column if not exists fulfilled_at timestamptz;

alter table public.watchdog_subscriptions add column if not exists stripe_checkout_session_id text unique;
alter table public.watchdog_subscriptions add column if not exists current_period_end timestamptz;
alter table public.watchdog_subscriptions add column if not exists cancel_at_period_end boolean not null default false;
