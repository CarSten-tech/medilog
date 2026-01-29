-- Add last_notified_at to recurring_checkups
ALTER TABLE public.recurring_checkups 
ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;
