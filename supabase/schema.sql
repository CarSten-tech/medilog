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
