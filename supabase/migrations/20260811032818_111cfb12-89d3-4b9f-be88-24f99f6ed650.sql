
-- COUNTRIES
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  currency text NOT NULL,
  population bigint NOT NULL DEFAULT 0,
  market_size numeric NOT NULL DEFAULT 0,
  coverage_pct numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  expansion_plan text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.countries TO anon, authenticated;
GRANT ALL ON public.countries TO service_role;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_countries ON public.countries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_countries BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text NOT NULL UNIQUE,
  category text NOT NULL,
  kind text NOT NULL DEFAULT 'saas',
  list_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_products ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_products BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.product_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  product text NOT NULL,
  category text NOT NULL,
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL,
  region text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  discount_pct numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'saas',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_assignments TO anon, authenticated;
GRANT ALL ON public.product_assignments TO service_role;
ALTER TABLE public.product_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_product_assignments ON public.product_assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_product_assignments BEFORE UPDATE ON public.product_assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TEAM MEMBERS
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE SET NULL,
  franchise text NOT NULL DEFAULT 'Head Office',
  role text NOT NULL DEFAULT 'employee',
  last_login timestamptz,
  sessions integer NOT NULL DEFAULT 0,
  two_factor boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO anon, authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_team_members ON public.team_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_team_members BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SUPPORT TICKETS
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no text NOT NULL UNIQUE,
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE SET NULL,
  franchise text NOT NULL,
  subject text NOT NULL,
  channel text NOT NULL DEFAULT 'ticket',
  priority text NOT NULL DEFAULT 'medium',
  owner text NOT NULL DEFAULT 'Unassigned',
  sla_due timestamptz,
  first_response_mins integer,
  csat numeric,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO anon, authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_support_tickets ON public.support_tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_support_tickets BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TRAINING
CREATE TABLE public.training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'onboarding',
  duration_mins integer NOT NULL DEFAULT 60,
  enrolled integer NOT NULL DEFAULT 0,
  completed integer NOT NULL DEFAULT 0,
  avg_score numeric NOT NULL DEFAULT 0,
  certificate boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_courses TO anon, authenticated;
GRANT ALL ON public.training_courses TO service_role;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_training_courses ON public.training_courses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_training_courses BEFORE UPDATE ON public.training_courses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL,
  member text NOT NULL,
  courses_completed integer NOT NULL DEFAULT 0,
  score numeric NOT NULL DEFAULT 0,
  certificates integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_progress TO anon, authenticated;
GRANT ALL ON public.training_progress TO service_role;
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_training_progress ON public.training_progress FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_training_progress BEFORE UPDATE ON public.training_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LEGAL
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE SET NULL,
  franchise text NOT NULL,
  doc_type text NOT NULL,
  effective_date date,
  expiry_date date,
  signed_by text,
  signature_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_documents TO anon, authenticated;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_legal_documents ON public.legal_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_legal_documents BEFORE UPDATE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- MARKETING
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  audience text NOT NULL,
  sent integer NOT NULL DEFAULT 0,
  opens integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  conversions integer NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  coupons integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO anon, authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_marketing_campaigns ON public.marketing_campaigns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_marketing_campaigns BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- COMMUNICATION
CREATE TABLE public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  channel text NOT NULL,
  audience text NOT NULL,
  sent_by text NOT NULL DEFAULT 'Boss Admin',
  recipients integer NOT NULL DEFAULT 0,
  delivered integer NOT NULL DEFAULT 0,
  read_count integer NOT NULL DEFAULT 0,
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communications TO anon, authenticated;
GRANT ALL ON public.communications TO service_role;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_communications ON public.communications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_communications BEFORE UPDATE ON public.communications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ONBOARDING TASKS
CREATE TABLE public.onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id uuid REFERENCES public.franchises(id) ON DELETE CASCADE,
  franchise text NOT NULL,
  step text NOT NULL,
  step_order integer NOT NULL DEFAULT 1,
  owner text NOT NULL DEFAULT 'Onboarding Desk',
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  completed_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_tasks TO anon, authenticated;
GRANT ALL ON public.onboarding_tasks TO service_role;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY panel_all_onboarding_tasks ON public.onboarding_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER t_onboarding_tasks BEFORE UPDATE ON public.onboarding_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SEED DATA ============

INSERT INTO public.countries (name, code, currency, population, market_size, coverage_pct, status, expansion_plan) VALUES
 ('India','IN','INR',1428627663,48500000,62.5,'active','Tier-2 city rollout: Pune, Jaipur, Kochi by Q4'),
 ('United Arab Emirates','AE','AED',9441129,12800000,48.0,'active','Abu Dhabi + Sharjah master franchise in Q3'),
 ('United Kingdom','UK','GBP',67736802,21500000,18.0,'active','Recover London territory, add Manchester'),
 ('Singapore','SG','SGD',5917648,7400000,0,'planned','Regional HQ for SEA, legal review in progress'),
 ('Saudi Arabia','SA','SAR',36947025,15900000,0,'planned','Riyadh pilot pending trade licence'),
 ('Kenya','KE','KES',55100586,3100000,0,'planned','Nairobi partner shortlisted for FY27');

INSERT INTO public.products (name, sku, category, kind, list_price, currency, status) VALUES
 ('Vala CRM Suite','VS-CRM-001','CRM','saas',249000,'INR','active'),
 ('Vala Billing Cloud','VS-BIL-002','Finance','saas',179000,'INR','active'),
 ('Vala POS Terminal','VS-POS-003','Retail','offline',89000,'INR','active'),
 ('Vala Marketplace Connect','VS-MKT-004','Commerce','marketplace',139000,'INR','active'),
 ('Vala Analytics Studio','VS-ANL-005','Analytics','digital',199000,'INR','active'),
 ('Vala Support Desk','VS-SUP-006','Service','saas',119000,'INR','draft');

INSERT INTO public.product_assignments (product_id, product, category, franchise_id, franchise, region, price, discount_pct, stock, kind, status)
SELECT p.id, p.name, p.category, f.id, f.company, f.state, v.price, v.disc, v.stock, p.kind, v.status
FROM (VALUES
 ('VS-CRM-001','SV-IN-MH-001',249000,10,48,'active'),
 ('VS-BIL-002','SV-IN-MH-001',179000,5,36,'active'),
 ('VS-POS-003','SV-IN-MH-001',89000,0,120,'active'),
 ('VS-CRM-001','SV-IN-GJ-002',236000,12,24,'active'),
 ('VS-ANL-005','SV-IN-GJ-002',199000,8,18,'active'),
 ('VS-CRM-001','SV-AE-DU-003',289000,5,30,'active'),
 ('VS-MKT-004','SV-AE-DU-003',159000,0,22,'active'),
 ('VS-BIL-002','SV-AE-DU-003',189000,7,26,'active'),
 ('VS-CRM-001','SV-IN-KA-004',249000,15,12,'pending'),
 ('VS-ANL-005','SV-IN-KA-004',199000,10,10,'pending'),
 ('VS-POS-003','SV-UK-LN-005',94000,0,6,'suspended')
) AS v(sku, code, price, disc, stock, status)
JOIN public.products p ON p.sku = v.sku
JOIN public.franchises f ON f.code = v.code;

INSERT INTO public.team_members (name, email, phone, franchise_id, franchise, role, last_login, sessions, two_factor, status)
SELECT v.name, v.email, v.phone, f.id, f.company, v.role, now() - (v.hrs || ' hours')::interval, v.sessions, v.tfa, v.status
FROM (VALUES
 ('Rahul Mehta','rahul.mehta@valasystems.in','+91 98200 41122','SV-IN-MH-001','owner',3,4,true,'active'),
 ('Sneha Kulkarni','sneha.k@valasystems.in','+91 98202 88431','SV-IN-MH-001','manager',9,2,true,'active'),
 ('Imran Sheikh','imran.s@valasystems.in','+91 99303 55120','SV-IN-MH-001','sales',28,1,false,'active'),
 ('Priya Shah','priya.shah@valaahmedabad.in','+91 97250 66031','SV-IN-GJ-002','owner',5,3,true,'active'),
 ('Nikhil Patel','nikhil.p@valaahmedabad.in','+91 97256 12094','SV-IN-GJ-002','finance',52,1,false,'active'),
 ('Omar Farid','omar.farid@valagulf.ae','+971 50 774 8811','SV-AE-DU-003','owner',2,5,true,'active'),
 ('Layla Haddad','layla.h@valagulf.ae','+971 55 209 3374','SV-AE-DU-003','marketing',14,2,true,'active'),
 ('Anita Rao','anita.rao@valabengaluru.in','+91 98450 71209','SV-IN-KA-004','owner',22,1,false,'pending'),
 ('James Corden','james.c@valauk.co.uk','+44 7700 900321','SV-UK-LN-005','owner',360,0,false,'locked'),
 ('Deepak Nair','deepak.nair@valasystems.in','+91 98999 41200','SV-IN-MH-001','support',6,3,true,'active')
) AS v(name,email,phone,code,role,hrs,sessions,tfa,status)
JOIN public.franchises f ON f.code = v.code;

INSERT INTO public.team_members (name, email, phone, franchise, role, last_login, sessions, two_factor, status) VALUES
 ('Boss Admin','admin@softwarevala.com','+91 98100 00001','Head Office','global_admin', now() - interval '20 minutes', 6, true, 'active'),
 ('Meera Iyer','meera.iyer@softwarevala.com','+91 98100 00042','Head Office','approver', now() - interval '4 hours', 2, true, 'active'),
 ('Arjun Verma','arjun.verma@softwarevala.com','+91 98100 00077','Head Office','finance', now() - interval '31 hours', 1, false, 'active');

INSERT INTO public.support_tickets (ticket_no, franchise_id, franchise, subject, channel, priority, owner, sla_due, first_response_mins, csat, status)
SELECT v.no, f.id, f.company, v.subject, v.channel, v.priority, v.owner, now() + (v.sla || ' hours')::interval, v.frt, v.csat, v.status
FROM (VALUES
 ('TKT-2041','SV-IN-MH-001','License activation failing on 3 devices','ticket','high','Deepak Nair',6,18,NULL,'open'),
 ('TKT-2042','SV-IN-GJ-002','GST invoice format mismatch','email','medium','Arjun Verma',30,42,4.5,'in_progress'),
 ('TKT-2043','SV-AE-DU-003','Arabic invoice localisation request','whatsapp','low','Layla Haddad',72,55,4.8,'resolved'),
 ('TKT-2044','SV-IN-KA-004','Onboarding portal access blocked','ticket','critical','Meera Iyer',-4,12,NULL,'open'),
 ('TKT-2045','SV-UK-LN-005','VAT rules for renewals','call','medium','Arjun Verma',-26,90,3.2,'open'),
 ('TKT-2046','SV-IN-MH-001','POS terminal firmware update','ticket','medium','Deepak Nair',48,25,4.6,'resolved'),
 ('TKT-2047','SV-AE-DU-003','Add 2 sub-dealer logins','live_chat','low','Sneha Kulkarni',96,8,5.0,'closed'),
 ('TKT-2048','SV-IN-GJ-002','Analytics dashboard slow after update','ticket','high','Deepak Nair',12,20,NULL,'in_progress')
) AS v(no,code,subject,channel,priority,owner,sla,frt,csat,status)
JOIN public.franchises f ON f.code = v.code;

INSERT INTO public.training_courses (title, kind, duration_mins, enrolled, completed, avg_score, certificate, status) VALUES
 ('Franchise Onboarding Essentials','onboarding',120,13,11,88.4,true,'active'),
 ('Vala CRM Product Certification','product',240,13,8,82.1,true,'active'),
 ('Sales Playbook & Objection Handling','sales',180,9,6,79.5,true,'active'),
 ('Support SLA & Escalation Handling','support',90,7,7,91.2,true,'active'),
 ('Compliance, KYC & Brand Standards','compliance',150,13,9,85.0,true,'active'),
 ('Advanced Analytics for Owners','product',200,5,2,74.6,true,'draft');

INSERT INTO public.training_progress (franchise_id, franchise, member, courses_completed, score, certificates)
SELECT f.id, f.company, v.member, v.done, v.score, v.certs
FROM (VALUES
 ('SV-IN-MH-001','Rahul Mehta',5,92.4,5),
 ('SV-IN-MH-001','Sneha Kulkarni',5,89.1,5),
 ('SV-AE-DU-003','Omar Farid',4,88.7,4),
 ('SV-IN-GJ-002','Priya Shah',4,84.2,4),
 ('SV-IN-MH-001','Deepak Nair',3,86.5,3),
 ('SV-AE-DU-003','Layla Haddad',3,81.0,3),
 ('SV-IN-GJ-002','Nikhil Patel',2,76.4,2),
 ('SV-IN-KA-004','Anita Rao',1,68.9,1),
 ('SV-UK-LN-005','James Corden',0,0,0)
) AS v(code,member,done,score,certs)
JOIN public.franchises f ON f.code = v.code;

INSERT INTO public.legal_documents (title, franchise_id, franchise, doc_type, effective_date, expiry_date, signed_by, signature_status, status)
SELECT v.title, f.id, f.company, v.dtype, v.eff::date, v.exp::date, v.signer, v.sig, v.status
FROM (VALUES
 ('Master Franchise Agreement — Mumbai','SV-IN-MH-001','franchise_agreement','2024-04-01','2029-03-31','Rahul Mehta','signed','active'),
 ('Mutual NDA — Mumbai','SV-IN-MH-001','nda','2024-03-18','2027-03-17','Rahul Mehta','signed','active'),
 ('Master Franchise Agreement — Ahmedabad','SV-IN-GJ-002','franchise_agreement','2024-07-15','2029-07-14','Priya Shah','signed','active'),
 ('Master Franchise Agreement — Dubai','SV-AE-DU-003','franchise_agreement','2023-11-01','2026-10-31','Omar Farid','signed','active'),
 ('Pricing Addendum — Dubai (AED)','SV-AE-DU-003','addendum','2025-01-10','2026-10-31','Omar Farid','signed','active'),
 ('Master Franchise Agreement — Bengaluru','SV-IN-KA-004','franchise_agreement','2026-08-01','2031-07-31',NULL,'pending','under_review'),
 ('Brand Usage Policy 2026','SV-IN-KA-004','policy','2026-01-01','2027-12-31',NULL,'pending','under_review'),
 ('Termination Notice — London','SV-UK-LN-005','termination','2026-06-20',NULL,'Boss Admin','signed','escalated'),
 ('Renewal Proposal — Dubai','SV-AE-DU-003','renewal','2026-09-01','2029-08-31',NULL,'pending','draft')
) AS v(title,code,dtype,eff,exp,signer,sig,status)
JOIN public.franchises f ON f.code = v.code;

INSERT INTO public.marketing_campaigns (name, channel, audience, sent, opens, clicks, leads, conversions, spend, coupons, start_date, end_date, status) VALUES
 ('Q3 Franchise Expansion — India','email','Prospect owners, Tier-2 India',18420,7361,2214,412,63,285000,0,'2026-07-01','2026-09-30','active'),
 ('Gulf Retail Push','whatsapp','UAE SMB retailers',6250,4187,1502,238,41,192000,150,'2026-07-15','2026-08-31','active'),
 ('CRM Upgrade Offer','email','Existing franchise customers',9840,5122,1834,196,88,84000,400,'2026-06-01','2026-08-15','active'),
 ('Monsoon POS Bundle','sms','Maharashtra + Gujarat retailers',24100,0,1806,321,52,131000,600,'2026-06-10','2026-07-31','completed'),
 ('London Relaunch Teaser','social','UK SMB owners',4100,1520,388,44,3,96000,0,'2026-08-05','2026-09-15','paused'),
 ('Analytics Studio Webinar','push','Owners + managers',3820,2011,742,118,27,42000,0,'2026-08-20','2026-08-20','draft');

INSERT INTO public.communications (subject, body, channel, audience, sent_by, recipients, delivered, read_count, scheduled_at, status) VALUES
 ('Q3 royalty cycle closes 31 Aug','Please reconcile gross sales before the cycle closes. Statements auto-generate on 1 Sep.','announcement','All franchises','Boss Admin',13,13,11,now() - interval '2 days','sent'),
 ('New Analytics Studio release notes','Version 4.2 adds cohort retention and territory heatmaps.','email','Owners + managers','Boss Admin',13,13,9,now() - interval '5 days','sent'),
 ('Brand audit visits — September schedule','Auditors will visit Mumbai, Ahmedabad and Dubai. Prepare signage and licence copies.','email','India + UAE franchises','Meera Iyer',9,9,6,now() - interval '9 hours','sent'),
 ('KYC re-verification reminder','Bengaluru and London must re-upload KYC documents within 7 days.','whatsapp','Pending KYC franchises','Meera Iyer',2,2,1,now() - interval '1 day','sent'),
 ('Quarterly owners town-hall','Video town-hall covering FY27 expansion, pricing and support SLAs.','video_meeting','All owners','Boss Admin',5,0,0,now() + interval '3 days','scheduled'),
 ('Festive pricing policy draft','Draft variation caps for the festive quarter — feedback requested.','broadcast','All franchises','Arjun Verma',13,0,0,NULL,'draft');

INSERT INTO public.onboarding_tasks (franchise_id, franchise, step, step_order, owner, status, due_date, completed_at)
SELECT f.id, f.company, v.step, v.ord, v.owner, v.status, v.due::date, v.done::date
FROM (VALUES
 ('SV-IN-KA-004','Agreement Signed',1,'Meera Iyer','completed','2026-07-20','2026-07-19'),
 ('SV-IN-KA-004','Payment Cleared',2,'Arjun Verma','completed','2026-07-25','2026-07-24'),
 ('SV-IN-KA-004','Account Provisioned',3,'Onboarding Desk','completed','2026-07-28','2026-07-28'),
 ('SV-IN-KA-004','License Issued',4,'Onboarding Desk','in_progress','2026-08-12',NULL),
 ('SV-IN-KA-004','Products Assigned',5,'Sneha Kulkarni','in_progress','2026-08-14',NULL),
 ('SV-IN-KA-004','Territory Locked',6,'Meera Iyer','pending','2026-08-18',NULL),
 ('SV-IN-KA-004','Team Onboarded',7,'Onboarding Desk','pending','2026-08-22',NULL),
 ('SV-IN-KA-004','Training Started',8,'Training Desk','pending','2026-08-25',NULL),
 ('SV-IN-KA-004','Go-Live',9,'Boss Admin','pending','2026-08-30',NULL),
 ('SV-IN-GJ-002','Team Onboarded',7,'Onboarding Desk','completed','2024-08-02','2024-08-01'),
 ('SV-IN-GJ-002','Training Started',8,'Training Desk','completed','2024-08-05','2024-08-04'),
 ('SV-IN-GJ-002','Go-Live',9,'Boss Admin','completed','2024-08-10','2024-08-09')
) AS v(code,step,ord,owner,status,due,done)
JOIN public.franchises f ON f.code = v.code;
