CREATE TABLE public.franchise_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL DEFAULT '',
  period text NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  tickets integer NOT NULL DEFAULT 0,
  csat numeric NOT NULL DEFAULT 0,
  sla_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_performance TO anon, authenticated;
GRANT ALL ON public.franchise_performance TO service_role;
ALTER TABLE public.franchise_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_franchise_performance ON public.franchise_performance FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_franchise_performance BEFORE UPDATE ON public.franchise_performance FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.franchise_royalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL DEFAULT '',
  period text NOT NULL,
  gross_sales numeric NOT NULL DEFAULT 0,
  royalty_rate numeric NOT NULL DEFAULT 0,
  royalty_due numeric NOT NULL DEFAULT 0,
  commission_due numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'due',
  due_date date,
  paid_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_royalties TO anon, authenticated;
GRANT ALL ON public.franchise_royalties TO service_role;
ALTER TABLE public.franchise_royalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_franchise_royalties ON public.franchise_royalties FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_franchise_royalties BEFORE UPDATE ON public.franchise_royalties FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.franchise_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL DEFAULT '',
  contract_no text NOT NULL UNIQUE,
  contract_type text NOT NULL DEFAULT 'master_franchise',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + 365),
  value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  renewal_status text NOT NULL DEFAULT 'not_due',
  signed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_contracts TO anon, authenticated;
GRANT ALL ON public.franchise_contracts TO service_role;
ALTER TABLE public.franchise_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_franchise_contracts ON public.franchise_contracts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_franchise_contracts BEFORE UPDATE ON public.franchise_contracts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.franchise_fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL DEFAULT '',
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  risk_score integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  detected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_fraud_alerts TO anon, authenticated;
GRANT ALL ON public.franchise_fraud_alerts TO service_role;
ALTER TABLE public.franchise_fraud_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_franchise_fraud_alerts ON public.franchise_fraud_alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_franchise_fraud_alerts BEFORE UPDATE ON public.franchise_fraud_alerts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.franchise_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL DEFAULT '',
  title text NOT NULL,
  category text NOT NULL DEFAULT 'support',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  raised_by text NOT NULL DEFAULT '',
  assigned_to text NOT NULL DEFAULT '',
  sla_due timestamptz,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_escalations TO anon, authenticated;
GRANT ALL ON public.franchise_escalations TO service_role;
ALTER TABLE public.franchise_escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_franchise_escalations ON public.franchise_escalations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_franchise_escalations BEFORE UPDATE ON public.franchise_escalations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.franchise_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL DEFAULT '',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  channel text NOT NULL DEFAULT 'in_app',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.franchise_notifications TO anon, authenticated;
GRANT ALL ON public.franchise_notifications TO service_role;
ALTER TABLE public.franchise_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_franchise_notifications ON public.franchise_notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Realistic starter data
-- ---------------------------------------------------------------------------

INSERT INTO public.franchise_performance (franchise_id, franchise, period, revenue, leads, conversions, tickets, csat, sla_percent)
SELECT f.id, f.company, p.period, p.revenue, p.leads, p.conversions, p.tickets, p.csat, p.sla
FROM (VALUES
  ('SV-IN-MH-001','2026-04',742000,182,41,63,4.6,96.4),
  ('SV-IN-MH-001','2026-05',798500,196,47,58,4.7,97.1),
  ('SV-IN-MH-001','2026-06',845000,211,52,55,4.8,97.8),
  ('SV-IN-GJ-002','2026-04',364000,118,22,47,4.2,92.5),
  ('SV-IN-GJ-002','2026-05',389200,127,25,44,4.3,93.4),
  ('SV-IN-GJ-002','2026-06',412000,134,28,41,4.4,94.1),
  ('SV-AE-DU-003','2026-04',1105000,240,68,72,4.7,98.2),
  ('SV-AE-DU-003','2026-05',1188000,255,74,69,4.8,98.6),
  ('SV-AE-DU-003','2026-06',1260000,268,81,64,4.9,99.0),
  ('SV-IN-KA-004','2026-05',96500,64,9,28,3.9,88.2),
  ('SV-IN-KA-004','2026-06',168000,88,14,33,4.0,89.6),
  ('SV-UK-LN-005','2026-04',142000,52,6,39,3.2,74.5),
  ('SV-UK-LN-005','2026-05',68000,31,2,46,2.8,66.1),
  ('SV-UK-LN-005','2026-06',0,12,0,51,2.4,58.0)
) AS p(code, period, revenue, leads, conversions, tickets, csat, sla)
JOIN public.franchises f ON f.code = p.code;

INSERT INTO public.franchise_royalties (franchise_id, franchise, period, gross_sales, royalty_rate, royalty_due, commission_due, paid_amount, status, due_date, paid_at)
SELECT f.id, f.company, r.period, r.gross, r.rate, r.royalty, r.commission, r.paid, r.status, r.due::date, r.paid_at::date
FROM (VALUES
  ('SV-IN-MH-001','2026-04',742000,8,59360,92750,59360,'paid','2026-05-10','2026-05-08'),
  ('SV-IN-MH-001','2026-05',798500,8,63880,99812,63880,'paid','2026-06-10','2026-06-09'),
  ('SV-IN-MH-001','2026-06',845000,8,67600,105625,0,'due','2026-07-10',NULL),
  ('SV-IN-GJ-002','2026-05',389200,6,23352,38920,23352,'paid','2026-06-10','2026-06-12'),
  ('SV-IN-GJ-002','2026-06',412000,6,24720,41200,0,'due','2026-07-10',NULL),
  ('SV-AE-DU-003','2026-05',1188000,10,118800,178200,118800,'paid','2026-06-10','2026-06-07'),
  ('SV-AE-DU-003','2026-06',1260000,10,126000,189000,60000,'partial','2026-07-10',NULL),
  ('SV-IN-KA-004','2026-06',168000,5,8400,20160,0,'due','2026-07-10',NULL),
  ('SV-UK-LN-005','2026-04',142000,7,9940,11360,0,'overdue','2026-05-10',NULL),
  ('SV-UK-LN-005','2026-05',68000,7,4760,5440,0,'overdue','2026-06-10',NULL)
) AS r(code, period, gross, rate, royalty, commission, paid, status, due, paid_at)
JOIN public.franchises f ON f.code = r.code;

INSERT INTO public.franchise_contracts (franchise_id, franchise, contract_no, contract_type, start_date, end_date, value, status, renewal_status, signed_at)
SELECT f.id, f.company, c.no, c.ctype, c.sd::date, c.ed::date, c.val, c.status, c.renewal, c.signed::date
FROM (VALUES
  ('SV-IN-MH-001','CT-2024-0011','master_franchise','2024-04-01','2027-03-31',4500000,'active','not_due','2024-03-22'),
  ('SV-IN-GJ-002','CT-2025-0027','unit_franchise','2025-01-15','2026-09-30',1800000,'active','due_soon','2025-01-10'),
  ('SV-AE-DU-003','CT-2023-0004','master_franchise','2023-07-01','2026-08-31',9200000,'active','due_soon','2023-06-18'),
  ('SV-IN-KA-004','CT-2026-0041','unit_franchise','2026-05-01','2029-04-30',2100000,'active','not_due','2026-04-24'),
  ('SV-UK-LN-005','CT-2024-0019','area_developer','2024-10-01','2026-07-15',3400000,'under_review','at_risk','2024-09-20'),
  ('SV-AE-DU-003','CT-2025-0033','addendum','2025-11-01','2026-10-31',450000,'active','not_due','2025-10-28')
) AS c(code, no, ctype, sd, ed, val, status, renewal, signed)
JOIN public.franchises f ON f.code = c.code;

INSERT INTO public.franchise_fraud_alerts (franchise_id, franchise, alert_type, severity, risk_score, description, status, detected_at)
SELECT f.id, f.company, a.atype, a.sev, a.risk, a.descr, a.status, a.at::timestamptz
FROM (VALUES
  ('SV-UK-LN-005','under_reporting','critical',92,'Declared gross sales 61% below POS-reported volume for two consecutive cycles.','investigating','2026-06-28 09:15+00'),
  ('SV-UK-LN-005','licence_sharing','high',78,'Same licence key active from 4 unregistered domains outside assigned territory.','open','2026-07-02 14:40+00'),
  ('SV-IN-KA-004','duplicate_invoice','medium',54,'Two invoices with identical amount and buyer GSTIN raised within 48 hours.','open','2026-07-05 06:20+00'),
  ('SV-IN-GJ-002','price_deviation','low',31,'Unit prices 12% under approved floor price on 9 line items.','resolved','2026-06-11 11:05+00'),
  ('SV-AE-DU-003','refund_spike','medium',47,'Refund ratio jumped from 1.8% to 6.4% month-over-month.','investigating','2026-06-30 08:00+00'),
  ('SV-IN-MH-001','territory_breach','low',24,'Three leads serviced from a postcode assigned to a neighbouring franchise.','dismissed','2026-05-27 15:30+00')
) AS a(code, atype, sev, risk, descr, status, at)
JOIN public.franchises f ON f.code = a.code;

INSERT INTO public.franchise_escalations (franchise_id, franchise, title, category, priority, status, raised_by, assigned_to, sla_due, resolution)
SELECT f.id, f.company, e.title, e.cat, e.prio, e.status, e.raised, e.assigned, e.sla::timestamptz, e.res
FROM (VALUES
  ('SV-UK-LN-005','Royalty arrears unresolved for two cycles','finance','critical','open','Regional Controller','Priya Nair','2026-07-12 12:00+00',NULL),
  ('SV-IN-KA-004','Onboarding blocked — KYC document mismatch','onboarding','high','in_progress','Onboarding Desk','Rahul Mehta','2026-07-10 18:00+00',NULL),
  ('SV-AE-DU-003','Enterprise client SLA breach on ticket #48120','support','high','in_progress','Key Account Team','Ayesha Khan','2026-07-09 09:00+00',NULL),
  ('SV-IN-GJ-002','Marketing collateral used without brand approval','legal','medium','resolved','Brand Compliance','Neha Shah','2026-06-25 17:00+00','Collateral withdrawn and reissued from approved template library.'),
  ('SV-IN-MH-001','Territory overlap dispute with Pune unit','territory','medium','open','Franchise Ops','Vikram Rao','2026-07-15 12:00+00',NULL),
  ('SV-AE-DU-003','Device activation limit exceeded on scale plan','license','low','closed','Licensing Bot','Ayesha Khan','2026-06-20 12:00+00','Plan upgraded to enterprise; limit raised to 250 devices.')
) AS e(code, title, cat, prio, status, raised, assigned, sla, res)
JOIN public.franchises f ON f.code = e.code;

INSERT INTO public.franchise_notifications (franchise_id, franchise, title, message, type, channel, read, created_at)
SELECT f.id, f.company, n.title, n.msg, n.ntype, n.channel, n.read, n.at::timestamptz
FROM (VALUES
  ('SV-UK-LN-005','Account suspended','Licence suspended pending royalty settlement of GBP 14,700.','critical','email',false,'2026-07-06 10:00+00'),
  ('SV-AE-DU-003','Contract renewal window open','Master franchise CT-2023-0004 expires 31 Aug 2026. Renewal pack sent.','warning','email',false,'2026-07-04 08:30+00'),
  ('SV-IN-MH-001','Royalty invoice generated','June 2026 royalty of INR 67,600 is due on 10 Jul 2026.','info','in_app',true,'2026-07-01 06:00+00'),
  ('SV-IN-KA-004','KYC re-upload required','Partnership deed page 3 was unreadable. Please re-upload.','warning','in_app',false,'2026-06-29 12:45+00'),
  ('SV-IN-GJ-002','Tier review passed','Silver tier retained with health score 74. Next review Oct 2026.','success','in_app',true,'2026-06-20 09:10+00'),
  ('SV-AE-DU-003','Payout released','Commission payout of AED 178,200 credited for May 2026.','success','sms',true,'2026-06-07 11:20+00')
) AS n(code, title, msg, ntype, channel, read, at)
JOIN public.franchises f ON f.code = n.code;