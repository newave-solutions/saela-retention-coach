ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS track text NOT NULL DEFAULT 'retention',
  ADD COLUMN IF NOT EXISTS detail_checks jsonb;

CREATE INDEX IF NOT EXISTS training_sessions_user_track_idx
  ON public.training_sessions (user_id, track, created_at DESC);