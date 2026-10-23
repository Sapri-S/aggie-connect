-- Demo members for Aggie Connect, so the home page and directory have
-- people in them during development and demos.
--
-- Run in Supabase → SQL Editor after all migrations. Safe to run again:
-- existing demo emails are skipped.
--
-- These accounts can't be signed into: they have no password and no login
-- identity. Every one uses the reserved domain demo.aggieconnect.invalid
-- (".invalid" can never receive mail), and every bio says it's a demo.
-- Remove them all before launch with remove_demo_accounts.sql.
--
-- No temporary tables: the SQL Editor doesn't keep them between statements.
-- Each person's details ride along in their sign-up metadata instead.

-- 1. Create the accounts. The sign-up trigger creates a pending profile
--    for each one.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  d.email,
  '',
  now(),
  '{"provider": "email", "providers": ["email"], "demo": true}'::jsonb,
  jsonb_build_object(
    'first_name', d.first_name,
    'last_name', d.last_name,
    'role', d.role,
    'class_year', d.class_year,
    'demo_headline', d.headline,
    'demo_job_title', d.job_title,
    'demo_company', d.company,
    'demo_major', d.major,
    'demo_city', d.city,
    'demo_bio', d.bio
  ),
  now() - (random() * interval '30 days'),
  now(),
  '', '', '', ''
from (values
  ('jordan.mitchell@demo.aggieconnect.invalid', 'Jordan', 'Mitchell', 'alumni', 2016,
   'Software engineer · Mentor for CS students', 'Senior Software Engineer', 'Microsoft',
   'Computer Science', 'Seattle, WA',
   'Built my first app in Marteena Hall. Happy to review resumes and do mock interviews for Aggies going into tech.'),
  ('aaliyah.brooks@demo.aggieconnect.invalid', 'Aaliyah', 'Brooks', 'alumni', 2012,
   'Nurse leader · Proud A&T nursing alum', 'Nurse Manager', 'Cone Health',
   'Nursing', 'Greensboro, NC',
   'Twelve years in critical care. Ask me about clinicals, the NCLEX, and finding your first unit.'),
  ('marcus.johnson@demo.aggieconnect.invalid', 'Marcus', 'Johnson', 'alumni', 2008,
   'Mechanical engineer in aerospace', 'Principal Engineer', 'Lockheed Martin',
   'Mechanical Engineering', 'Atlanta, GA',
   'Former Blue and Gold Marching Machine trumpet. Hiring interns every summer.'),
  ('kendra.williams@demo.aggieconnect.invalid', 'Kendra', 'Williams', 'alumni', 2019,
   'Data analyst · Charlotte chapter volunteer', 'Data Analyst', 'Bank of America',
   'Industrial and Systems Engineering', 'Charlotte, NC',
   'I help organize Charlotte Aggie meetups. Message me if you are moving to the Queen City.'),
  ('darius.carter@demo.aggieconnect.invalid', 'Darius', 'Carter', 'alumni', 2014,
   'Electrical engineer · Power systems', 'Electrical Engineer', 'Duke Energy',
   'Electrical Engineering', 'Raleigh, NC',
   'Grid modernization and renewables. Always glad to talk power systems with EE students.'),
  ('simone.harris@demo.aggieconnect.invalid', 'Simone', 'Harris', 'alumni', 2004,
   'Journalist · Storyteller', 'Senior Producer', 'Public radio',
   'Journalism and Mass Communication', 'Washington, DC',
   'From The A&T Register to the newsroom. I mentor student journalists every semester.'),
  ('andre.thompson@demo.aggieconnect.invalid', 'Andre', 'Thompson', 'alumni', 1998,
   'Agribusiness owner · Aggie for life', 'Founder', 'Thompson Family Farms',
   'Agricultural Economics', 'Durham, NC',
   'Third-generation farmer and first-generation college grad. Ask me about starting a business.'),
  ('brianna.scott@demo.aggieconnect.invalid', 'Brianna', 'Scott', 'alumni', 2022,
   'Accountant · CPA candidate', 'Audit Associate', 'Deloitte',
   'Accounting', 'Charlotte, NC',
   'Studying for the CPA while working in audit. Happy to share how I prepped for recruiting.'),
  ('tyler.green@demo.aggieconnect.invalid', 'Tyler', 'Green', 'alumni', 2020,
   'Product designer', 'Product Designer', 'Red Ventures',
   'Graphic Design Technology', 'Charlotte, NC',
   'Design portfolios, UX research and freelancing. Bring your questions.'),
  ('nia.robinson@demo.aggieconnect.invalid', 'Nia', 'Robinson', 'student', 2027,
   'CS junior · Looking for a summer internship', null, null,
   'Computer Science', 'Greensboro, NC',
   'Vice president of the ACM chapter. Interested in machine learning and cloud.'),
  ('jalen.edwards@demo.aggieconnect.invalid', 'Jalen', 'Edwards', 'student', 2026,
   'Senior in mechanical engineering', 'Engineering Intern', 'Honda Aircraft Company',
   'Mechanical Engineering', 'Greensboro, NC',
   'Interned on the composites team last summer. Graduating in May.'),
  ('imani.foster@demo.aggieconnect.invalid', 'Imani', 'Foster', 'student', 2028,
   'Biology sophomore · Pre-med', null, null,
   'Biology', 'Greensboro, NC',
   'Pre-med and looking for research and shadowing opportunities.'),
  ('caleb.washington@demo.aggieconnect.invalid', 'Caleb', 'Washington', 'student', 2027,
   'Marketing junior · Content creator', null, null,
   'Marketing', 'Greensboro, NC',
   'I run social media for two student orgs. Looking for a marketing internship.'),
  ('zoe.adams@demo.aggieconnect.invalid', 'Zoe', 'Adams', 'student', 2029,
   'First-year in electrical engineering', null, null,
   'Electrical Engineering', 'Greensboro, NC',
   'New Aggie! Interested in robotics and NSBE.')
) as d(email, first_name, last_name, role, class_year, headline, job_title, company, major, city, bio)
where not exists (select 1 from auth.users u where u.email = d.email);

-- 2. Fill in the profiles from that metadata and approve them, so they
--    show up for approved members.
update public.profiles p
   set status    = 'approved',
       headline  = u.raw_user_meta_data ->> 'demo_headline',
       job_title = u.raw_user_meta_data ->> 'demo_job_title',
       company   = u.raw_user_meta_data ->> 'demo_company',
       major     = u.raw_user_meta_data ->> 'demo_major',
       city      = u.raw_user_meta_data ->> 'demo_city',
       bio       = (u.raw_user_meta_data ->> 'demo_bio') || ' (Demo profile.)'
  from auth.users u
 where p.id = u.id
   and u.email like '%@demo.aggieconnect.invalid';

-- 3. Should say 14.
select count(*) as demo_members
  from auth.users
 where email like '%@demo.aggieconnect.invalid';
