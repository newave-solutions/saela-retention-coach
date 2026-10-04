CREATE TABLE public.agent_monthly_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat text NOT NULL CHECK (seat IN ('ces','cem')),
  month text NOT NULL,
  agent_name text NOT NULL,
  calls integer,
  total_minutes numeric,
  adherence numeric,
  cancel_requests integer,
  saves integer,
  coupons numeric,
  saved_value numeric,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seat, month, agent_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_monthly_metrics TO authenticated;
GRANT ALL ON public.agent_monthly_metrics TO service_role;
ALTER TABLE public.agent_monthly_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seat leads manage metrics" ON public.agent_monthly_metrics FOR ALL TO authenticated
USING ((seat = 'ces' AND public.has_role(auth.uid(),'ces_lead')) OR (seat = 'cem' AND public.has_role(auth.uid(),'cem_lead')))
WITH CHECK ((seat = 'ces' AND public.has_role(auth.uid(),'ces_lead')) OR (seat = 'cem' AND public.has_role(auth.uid(),'cem_lead')));