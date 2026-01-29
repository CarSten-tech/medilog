-- Create recurring_checkups table
CREATE TABLE IF NOT EXISTS public.recurring_checkups (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    patient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Optional link to specific patient
    title text NOT NULL,
    frequency_value int NOT NULL,
    frequency_unit text NOT NULL CHECK (frequency_unit IN ('months', 'years')),
    last_visit_date date,
    next_due_date date, -- Calculated by App Logic
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.recurring_checkups ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own checkups"
    ON public.recurring_checkups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkups"
    ON public.recurring_checkups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkups"
    ON public.recurring_checkups FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkups"
    ON public.recurring_checkups FOR DELETE
    USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.recurring_checkups;
