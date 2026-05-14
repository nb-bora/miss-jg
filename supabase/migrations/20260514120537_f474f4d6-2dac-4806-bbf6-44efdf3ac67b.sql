
-- Roles enum & user_roles table (separate from profiles for security)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Candidates
CREATE TYPE public.candidate_category AS ENUM ('miss', 'master');

CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category public.candidate_category NOT NULL DEFAULT 'miss',
  bio TEXT,
  photo_url TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  socials JSONB NOT NULL DEFAULT '{}'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active candidates"
  ON public.candidates FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all candidates"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage candidates"
  ON public.candidates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vote packages
CREATE TABLE public.vote_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),
  votes INT NOT NULL CHECK (votes > 0),
  currency TEXT NOT NULL DEFAULT 'XAF',
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vote_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.vote_packages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON public.vote_packages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vote transactions
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TABLE public.vote_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE RESTRICT,
  package_id UUID REFERENCES public.vote_packages(id) ON DELETE SET NULL,
  amount INT NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'XAF',
  vote_count INT NOT NULL CHECK (vote_count > 0),
  provider TEXT NOT NULL,
  provider_ref TEXT NOT NULL,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  buyer_contact TEXT,
  buyer_name TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  UNIQUE (provider, provider_ref)
);
ALTER TABLE public.vote_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_tx_candidate_status ON public.vote_transactions (candidate_id, payment_status);
CREATE INDEX idx_tx_created_at ON public.vote_transactions (created_at DESC);

CREATE POLICY "Admins can view all transactions"
  ON public.vote_transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public ranking view (only paid transactions count)
CREATE OR REPLACE VIEW public.candidate_stats
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.category,
  c.photo_url,
  c.bio,
  c.socials,
  c.is_active,
  c.display_order,
  COALESCE(SUM(t.amount) FILTER (WHERE t.payment_status = 'paid'), 0)::BIGINT AS total_collected,
  COALESCE(SUM(t.vote_count) FILTER (WHERE t.payment_status = 'paid'), 0)::BIGINT AS total_votes
FROM public.candidates c
LEFT JOIN public.vote_transactions t ON t.candidate_id = c.id
GROUP BY c.id;

GRANT SELECT ON public.candidate_stats TO anon, authenticated;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER candidates_touch_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default packages
INSERT INTO public.vote_packages (label, amount, votes, display_order) VALUES
  ('Vote unique', 500, 1, 1),
  ('Pack Booster', 1000, 3, 2),
  ('Pack Supporter', 2500, 10, 3),
  ('Pack Champion', 5000, 25, 4),
  ('Pack Légende', 10000, 60, 5);
