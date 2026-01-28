-- Database Schema for MediLog
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles Table (Linked to Auth)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  telegram_chat_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- Medications Table
create table medications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  form_factor text,
  strength text,
  current_stock int default 0,
  refill_threshold int default 0,
  expiry_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table medications enable row level security;

create policy "Users can view their own medications" on medications
  for select using (auth.uid() = user_id);

create policy "Users can insert their own medications" on medications
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own medications" on medications
  for update using (auth.uid() = user_id);

create policy "Users can delete their own medications" on medications
  for delete using (auth.uid() = user_id);

-- Medication Schedules Table
create table medication_schedules (
  id uuid default gen_random_uuid() primary key,
  medication_id uuid references medications(id) on delete cascade not null,
  time_of_day text check (time_of_day in ('Morning', 'Noon', 'Evening', 'Night')),
  dosage_quantity int not null,
  log_time time not null,
  created_at timestamptz default now()
);

alter table medication_schedules enable row level security;

create policy "Users can view their own schedules" on medication_schedules
  for select using (
    exists (
      select 1 from medications
      where medications.id = medication_schedules.medication_id
      and medications.user_id = auth.uid()
    )
  );

create policy "Users can insert their own schedules" on medication_schedules
  for insert with check (
    exists (
      select 1 from medications
      where medications.id = medication_schedules.medication_id
      and medications.user_id = auth.uid()
    )
  );

create policy "Users can update their own schedules" on medication_schedules
  for update using (
    exists (
      select 1 from medications
      where medications.id = medication_schedules.medication_id
      and medications.user_id = auth.uid()
    )
  );

create policy "Users can delete their own schedules" on medication_schedules
  for delete using (
    exists (
      select 1 from medications
      where medications.id = medication_schedules.medication_id
      and medications.user_id = auth.uid()
    )
  );

-- Intake Logs Table
create table intake_logs (
  id uuid default gen_random_uuid() primary key,
  medication_id uuid references medications(id) on delete cascade not null,
  taken_at timestamptz default now(),
  status text check (status in ('taken', 'skipped')),
  created_at timestamptz default now()
);

alter table intake_logs enable row level security;

create policy "Users can view their own logs" on intake_logs
  for select using (
    exists (
      select 1 from medications
      where medications.id = intake_logs.medication_id
      and medications.user_id = auth.uid()
    )
  );

create policy "Users can insert their own logs" on intake_logs
  for insert with check (
    exists (
      select 1 from medications
      where medications.id = intake_logs.medication_id
      and medications.user_id = auth.uid()
    )
  );

-- Auth Trigger for New User
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- 1. Care Relationships Table
create type care_status as enum ('pending', 'accepted');

create table if not exists care_relationships (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references auth.users(id) not null,
  caregiver_id uuid references auth.users(id) not null,
  status care_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(patient_id, caregiver_id)
);

alter table care_relationships enable row level security;

-- RLS: Users can view/edit if they are participant
create policy "Users can view their own care relationships"
  on care_relationships for select
  using (auth.uid() = patient_id or auth.uid() = caregiver_id);

create policy "Users can insert care relationships"
  on care_relationships for insert
  with check (auth.uid() = patient_id); -- Patient invites caregiver

create policy "Users can update their own care relationships"
  on care_relationships for update
  using (auth.uid() = patient_id or auth.uid() = caregiver_id);

create policy "Users can delete their own care relationships"
  on care_relationships for delete
  using (auth.uid() = patient_id or auth.uid() = caregiver_id);


-- 2. Push Subscriptions Table
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  endpoint text not null,
  keys jsonb not null,
  device_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, endpoint)
);

alter table push_subscriptions enable row level security;

create policy "Users can manage their own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id);


-- 3. Medications Updates
-- Add low_stock_threshold (if not exists, prompt said ensure it exists)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'medications' and column_name = 'low_stock_threshold') then
    alter table medications add column low_stock_threshold int default 8;
  end if;
end $$;

-- Update Medications RLS to allow Caregivers to VIEW
-- Drop old policy if strictly separate, or OR it.
-- We'll creating a new policy for Caregivers.
create policy "Caregivers can view patient medications"
  on medications for select
  using (
    exists (
      select 1 from care_relationships
      where care_relationships.patient_id = medications.user_id
      and care_relationships.caregiver_id = auth.uid()
      and care_relationships.status = 'accepted'
    )
  );
  
-- Allow Caregivers to UPDATE logs/meds? Prompt said "Update meds RLS: Allow SELECT". 
-- Usually caregivers need to log intake too. Let's allowing SELECT is the request. 
-- But for "Escalation", Edge Function does the check.
-- "dashboard" likely needs to READ.
-- If caregivers need to Log Intake, `intake_logs` needs policy too.
-- I'll add `intake_logs` policy for completeness of the feature "Caregiver Sharing".

create policy "Caregivers can view patient logs"
  on intake_logs for select
  using (
    exists (
      select 1 from medications
      join care_relationships on care_relationships.patient_id = medications.user_id
      where medications.id = intake_logs.medication_id
      and care_relationships.caregiver_id = auth.uid()
      and care_relationships.status = 'accepted'
    )
  );

-- 4. Helper RPC for Invites (Security Definer)
-- Allows checking if an email exists and getting UUID to insert into care_relationships
create or replace function get_user_id_by_email(email_input text)
returns uuid
language plpgsql
security definer
as $$
declare
  target_id uuid;
begin
  -- Check profiles or auth.users? Ideally profiles if exist, or auth.users.
  -- Accessing auth.users requires security definer.
  select id into target_id from auth.users where email = email_input;
  return target_id;
end;
$$;

-- SECURITY: Revoke access from public/authenticated to prevent email enumeration
revoke execute on function get_user_id_by_email from public;
revoke execute on function get_user_id_by_email from authenticated;
grant execute on function get_user_id_by_email to service_role;
