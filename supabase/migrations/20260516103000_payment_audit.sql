-- Traçabilité paiements : journal d'événements + colonne opérateur
ALTER TABLE public.vote_transactions
  ADD COLUMN IF NOT EXISTS operator TEXT;

CREATE INDEX IF NOT EXISTS idx_tx_provider_ref ON public.vote_transactions (provider_ref);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.vote_transactions(id) ON DELETE SET NULL,
  provider_ref TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_status public.payment_status,
  new_status public.payment_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_provider_ref ON public.payment_events (provider_ref DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_transaction_id ON public.payment_events (transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON public.payment_events (created_at DESC);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payment events"
  ON public.payment_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Cohérence montant / votes (nouvelles lignes)
ALTER TABLE public.vote_transactions
  DROP CONSTRAINT IF EXISTS vote_transactions_amount_per_vote_check;

ALTER TABLE public.vote_transactions
  ADD CONSTRAINT vote_transactions_amount_per_vote_check
  CHECK (amount = vote_count * 100);
