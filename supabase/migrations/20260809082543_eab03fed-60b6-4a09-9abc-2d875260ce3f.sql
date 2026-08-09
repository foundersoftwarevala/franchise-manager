CREATE TABLE public.franchise_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL DEFAULT '',
  requirement text NOT NULL,
  category text NOT NULL DEFAULT 'legal',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  last_checked date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_compliance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_compliance TO anon;
GRANT ALL ON public.franchise_compliance TO service_role;

ALTER TABLE public.franchise_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY panel_all_franchise_compliance ON public.franchise_compliance
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER t_franchise_compliance BEFORE UPDATE ON public.franchise_compliance
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS old_value text,
  ADD COLUMN IF NOT EXISTS new_value text,
  ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'success';

INSERT INTO public.franchise_compliance (franchise_id, franchise, requirement, category, severity, status, due_date, last_checked, notes)
SELECT f.id, f.company, v.requirement, v.category, v.severity, v.status, v.due_date::date, v.last_checked::date, v.notes
FROM (VALUES
  ('SV-IN-MH-001','GST return filing — Q2 FY26','financial','high','compliant','2026-09-20','2026-08-05','GSTR-3B filed on time; challan on record.'),
  ('SV-IN-MH-001','Shop & Establishment licence renewal','legal','medium','pending','2026-10-15',NULL,'Renewal application drafted, awaiting municipal fee receipt.'),
  ('SV-IN-MH-001','Brand standards audit — storefront','brand','low','compliant','2026-07-30','2026-07-28','Score 94/100. Signage refreshed.'),
  ('SV-IN-GJ-002','GST return filing — Q2 FY26','financial','high','warned','2026-08-20',NULL,'Filed 6 days late; warning issued to owner.'),
  ('SV-IN-GJ-002','Professional tax registration','legal','medium','compliant','2026-06-30','2026-06-25','Certificate uploaded to vault.'),
  ('SV-IN-GJ-002','Staff training certification refresh','operational','medium','pending','2026-09-30',NULL,'3 of 7 staff pending recertification.'),
  ('SV-AE-DU-003','DED trade licence renewal','legal','critical','escalated','2026-08-31','2026-08-01','Licence expires in 22 days; escalated to Legal Team.'),
  ('SV-AE-DU-003','UAE VAT return — Q2 2026','financial','high','compliant','2026-07-28','2026-07-26','Return accepted by FTA.'),
  ('SV-AE-DU-003','Brand standards audit — mall kiosk','brand','low','compliant','2026-07-12','2026-07-12','Score 88/100. Minor lighting fix noted.'),
  ('SV-IN-KA-004','GST return filing — Q2 FY26','financial','high','pending','2026-09-20',NULL,'Books being reconciled by regional accountant.'),
  ('SV-IN-KA-004','Fire safety NOC','operational','high','breach','2026-07-15',NULL,'NOC lapsed. Operations restricted until renewal.'),
  ('SV-IN-KA-004','Data protection (DPDP) registration','legal','medium','resolved','2026-06-20','2026-06-18','Registration completed after escalation.'),
  ('SV-UK-LN-005','HMRC VAT return — Q2 2026','financial','high','compliant','2026-08-07','2026-08-04','Submitted via MTD bridge.'),
  ('SV-UK-LN-005','ICO data protection registration','legal','medium','compliant','2026-05-31','2026-05-29','Annual fee paid.'),
  ('SV-UK-LN-005','Franchise agreement compliance review','legal','high','pending','2026-09-15',NULL,'Legal review scheduled with external counsel.')
) AS v(code, requirement, category, severity, status, due_date, last_checked, notes)
JOIN public.franchises f ON f.code = v.code;