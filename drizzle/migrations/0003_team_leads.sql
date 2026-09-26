CREATE TYPE public.app_role AS ENUM ('ces_lead', 'cem_lead');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.leads_agent(_lead uuid, _agent uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles r ON r.user_id = _lead
    WHERE p.id = _agent
      AND ((r.role = 'ces_lead' AND p.position = 'ces') OR (r.role = 'cem_lead' AND p.position = 'cem'))
  )
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Leads read their seat profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.leads_agent(auth.uid(), id));
CREATE POLICY "Leads read their seat sessions" ON public.training_sessions FOR SELECT TO authenticated
  USING (public.leads_agent(auth.uid(), user_id));

CREATE TABLE public.coaching_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track text NOT NULL,
  grow jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  targets jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaching_plans TO authenticated;
GRANT ALL ON public.coaching_plans TO service_role;
ALTER TABLE public.coaching_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leads manage own plans" ON public.coaching_plans FOR ALL TO authenticated
  USING (auth.uid() = lead_id AND public.leads_agent(auth.uid(), agent_id))
  WITH CHECK (auth.uid() = lead_id AND public.leads_agent(auth.uid(), agent_id));
CREATE INDEX coaching_plans_agent_idx ON public.coaching_plans (agent_id, created_at DESC);