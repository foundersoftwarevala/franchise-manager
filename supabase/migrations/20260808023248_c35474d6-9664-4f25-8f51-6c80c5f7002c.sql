CREATE TABLE public.franchise_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  value jsonb NOT NULL DEFAULT 'null'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_settings TO anon, authenticated;
GRANT ALL ON public.franchise_settings TO service_role;
ALTER TABLE public.franchise_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_franchise_settings ON public.franchise_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_franchise_settings BEFORE UPDATE ON public.franchise_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.franchise_settings (key, label, description, category, value) VALUES
  ('territory_exclusivity', 'Territory Exclusivity', 'Block a second franchise in a city that already has an active partner.', 'territory', 'true'::jsonb),
  ('territory_lock_days', 'Territory Lock Window (days)', 'Days a territory stays reserved for an applicant under review.', 'territory', '45'::jsonb),
  ('royalty_cycle', 'Royalty Cycle', 'Billing frequency used to generate royalty invoices.', 'finance', '"monthly"'::jsonb),
  ('royalty_grace_days', 'Royalty Grace Period (days)', 'Days after the due date before a cycle is flagged overdue.', 'finance', '7'::jsonb),
  ('default_royalty_rate', 'Default Royalty Rate (%)', 'Applied to new franchises when no tier override exists.', 'finance', '8'::jsonb),
  ('min_payout_threshold', 'Minimum Payout Threshold', 'Commission below this value rolls into the next cycle.', 'finance', '5000'::jsonb),
  ('approval_requires_kyc', 'Approval Requires KYC', 'Applications cannot be approved until KYC is verified.', 'onboarding', 'true'::jsonb),
  ('approval_requires_payment', 'Approval Requires Payment', 'Applications cannot be approved until the joining fee clears.', 'onboarding', 'true'::jsonb),
  ('onboarding_sla_days', 'Onboarding SLA (days)', 'Target days from application submission to go-live.', 'onboarding', '21'::jsonb),
  ('escalation_sla_hours', 'Escalation SLA (hours)', 'Response deadline for a critical escalation.', 'operations', '24'::jsonb),
  ('fraud_alert_threshold', 'Fraud Alert Threshold', 'Risk score at or above which an alert auto-escalates.', 'risk', '75'::jsonb),
  ('licence_device_limit', 'Default Device Limit', 'Devices allowed per licence on the starter plan.', 'licensing', '10'::jsonb),
  ('contract_renewal_notice_days', 'Renewal Notice Window (days)', 'Days before expiry that a contract is flagged due for renewal.', 'legal', '90'::jsonb),
  ('lead_routing_enabled', 'Lead Routing', 'Route inbound leads to the franchise owning the territory.', 'growth', 'true'::jsonb);

ALTER TABLE public.franchises
  ADD COLUMN IF NOT EXISTS royalty_rate numeric NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS pricing_variation numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_routing boolean NOT NULL DEFAULT false;

UPDATE public.franchises SET royalty_rate = 8, pricing_variation = 5, lead_routing = true WHERE code = 'SV-IN-MH-001';
UPDATE public.franchises SET royalty_rate = 6, pricing_variation = 3, lead_routing = true WHERE code = 'SV-IN-GJ-002';
UPDATE public.franchises SET royalty_rate = 10, pricing_variation = 8, lead_routing = true WHERE code = 'SV-AE-DU-003';
UPDATE public.franchises SET royalty_rate = 5, pricing_variation = 0, lead_routing = false WHERE code = 'SV-IN-KA-004';
UPDATE public.franchises SET royalty_rate = 7, pricing_variation = 0, lead_routing = false WHERE code = 'SV-UK-LN-005';

CREATE OR REPLACE FUNCTION public.fm_approve_application(_application_id uuid, _reviewer text DEFAULT 'Boss Admin')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app public.applications;
  new_code text;
  new_id uuid;
  seq int;
BEGIN
  SELECT * INTO app FROM public.applications WHERE id = _application_id;
  IF app.id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  IF app.stage = 'approved' THEN
    RAISE EXCEPTION 'Application already approved';
  END IF;
  IF NOT app.kyc_verified OR NOT app.payment_verified THEN
    RAISE EXCEPTION 'KYC and payment verification are required before approval';
  END IF;

  SELECT count(*)::int + 1 INTO seq FROM public.franchises;
  new_code := 'SV-' || upper(left(coalesce(nullif(app.country,''),'XX'), 2)) || '-'
              || upper(left(coalesce(nullif(app.state,''),'ZZ'), 2)) || '-'
              || lpad(seq::text, 3, '0');

  INSERT INTO public.franchises (code, company, owner, country, state, city, tier, status, commission_pct, royalty_rate)
  VALUES (new_code, app.company, app.applicant_name, app.country, app.state, app.city, 'bronze', 'onboarding', 10, 8)
  RETURNING id INTO new_id;

  UPDATE public.applications
     SET stage = 'approved', reviewer = coalesce(_reviewer, reviewer)
   WHERE id = _application_id;

  INSERT INTO public.audit_log (actor, action, target, scope, meta)
  VALUES (coalesce(_reviewer, 'system'), 'application_approved', _application_id::text, 'application',
          app.company || ' approved · franchise ' || new_code || ' created');

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fm_approve_application(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fm_approve_application(uuid, text) TO anon, authenticated, service_role;