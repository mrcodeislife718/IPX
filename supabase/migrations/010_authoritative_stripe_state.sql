alter table public.orders
  add column if not exists stripe_state_event_created_at bigint not null default 0;

alter table public.watchdog_subscriptions
  add column if not exists stripe_state_event_created_at bigint not null default 0;

create index if not exists orders_stripe_state_event_idx
  on public.orders(stripe_state_event_created_at);

create index if not exists watchdog_subscriptions_stripe_state_event_idx
  on public.watchdog_subscriptions(stripe_state_event_created_at);
