ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS opportunity_checks jsonb;
ALTER TABLE public.training_sessions ADD COLUMN IF NOT EXISTS language_flags jsonb;