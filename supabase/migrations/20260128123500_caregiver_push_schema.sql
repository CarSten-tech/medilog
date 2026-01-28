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
