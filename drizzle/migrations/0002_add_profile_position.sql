ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_position_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_position_check CHECK (position IS NULL OR position IN ('ces','cem'));