-- Enterprise Push Subscriptions Schema
-- Designed for Multi-Device Support and Robustness

create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text, -- Useful for debugging "Is this iPhone or Mac?"
  created_at timestamptz default now(),
  last_used_at timestamptz default now(),
  
  -- Constraint: One record per endpoint per user.
  -- This allows a user to have multiple subscriptions (iPad + iPhone),
  -- but prevents duplicate entries for the exact same browser instance.
  unique(user_id, endpoint)
);

-- Enable RLS
alter table push_subscriptions enable row level security;

-- Policies
create policy "Users can insert their own subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can delete their own subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Explicitly deny UPDATE. Subscriptions are immutable artifacts. 
-- If keys change, the browser generates a NEW endpoint/flow, so we should delete old and insert new.
-- No update policy = auto-deny.

-- Index for fast lookup during "Send to All Devices"
create index if not exists idx_push_subs_user_id on push_subscriptions(user_id);
