-- ============================================================
-- CCDI OJT Monitoring System - Supabase Seed Data (UPSERT)
-- Use this if accounts already exist (updates password hash)
-- ============================================================

-- Update Admin password (or create if missing)
INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
VALUES (
  gen_random_uuid(),
  'admin@ccdi.edu.ph',
  'admin',
  '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO',
  'ADMIN',
  'ACTIVE',
  'System',
  'Administrator'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  status = EXCLUDED.status,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Update Student Juan user (or create if missing)
WITH upsert_user AS (
  INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name, phone)
  VALUES (
    gen_random_uuid(),
    'juan.delacruz@ccdi.edu.ph',
    '2026-001',
    '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO',
    'STUDENT',
    'ACTIVE',
    'Juan',
    'Dela Cruz',
    '0917-200-3001'
  )
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    username = EXCLUDED.username
  RETURNING id
)
INSERT INTO students (
  id, user_id, student_id, first_name, last_name,
  course, year_level, section, contact_number, address,
  company_name, company_address, designation,
  required_hours, completed_hours,
  start_date, expected_end_date,
  status
)
SELECT
  gen_random_uuid(),
  upsert_user.id,
  '2026-001',
  'Juan',
  'Dela Cruz',
  'BSIS',
  4,
  'A',
  '0917-200-3001',
  'Brgy. Bibincahan, Sorsogon City',
  'ABC Technologies',
  'Rizal Street, Sorsogon City, Sorsogon',
  'IT Support Intern',
  500,
  312,
  '2026-07-06',
  '2026-10-05',
  'ONGOING'
FROM upsert_user
ON CONFLICT (student_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  course = EXCLUDED.course,
  year_level = EXCLUDED.year_level,
  section = EXCLUDED.section,
  contact_number = EXCLUDED.contact_number,
  address = EXCLUDED.address,
  company_name = EXCLUDED.company_name,
  company_address = EXCLUDED.company_address,
  designation = EXCLUDED.designation,
  required_hours = EXCLUDED.required_hours,
  completed_hours = EXCLUDED.completed_hours,
  start_date = EXCLUDED.start_date,
  expected_end_date = EXCLUDED.expected_end_date,
  status = EXCLUDED.status;

-- Add remaining demo students (only if they don't exist)
DO $$
DECLARE
  u_id UUID;
BEGIN
  -- Jose Rizal
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'jose.bonifacio@ccdi.edu.ph') THEN
    u_id := gen_random_uuid();
    INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
    VALUES (u_id, 'jose.bonifacio@ccdi.edu.ph', '2026-006', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Jose Rizal', 'Bonifacio');
    INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, start_date, expected_end_date, status)
    VALUES (gen_random_uuid(), u_id, '2026-006', 'Jose Rizal', 'Bonifacio', 'BSIT', 4, 'A', 'ABC Technologies', 500, 400, '2026-06-01', '2026-09-01', 'ONGOING');
  END IF;

  -- Ana Marie
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'ana.gonzales@ccdi.edu.ph') THEN
    u_id := gen_random_uuid();
    INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
    VALUES (u_id, 'ana.gonzales@ccdi.edu.ph', '2026-004', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Ana Marie', 'Gonzales');
    INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, status)
    VALUES (gen_random_uuid(), u_id, '2026-004', 'Ana Marie', 'Gonzales', 'BSIS', 4, 'B', NULL, 500, 0, 'NOT_STARTED');
  END IF;

  -- Andres Luna
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'andres.luna@ccdi.edu.ph') THEN
    u_id := gen_random_uuid();
    INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
    VALUES (u_id, 'andres.luna@ccdi.edu.ph', '2026-005', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Andres', 'Luna');
    INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, start_date, expected_end_date, status)
    VALUES (gen_random_uuid(), u_id, '2026-005', 'Andres', 'Luna', 'BSIS', 4, 'B', 'Sorsogon Data Systems', 500, 46, '2026-07-20', '2026-10-19', 'FAILED');
  END IF;

  -- Pedro Reyes
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'pedro.reyes@ccdi.edu.ph') THEN
    u_id := gen_random_uuid();
    INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
    VALUES (u_id, 'pedro.reyes@ccdi.edu.ph', '2026-003', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Pedro', 'Reyes');
    INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, start_date, expected_end_date, status)
    VALUES (gen_random_uuid(), u_id, '2026-003', 'Pedro', 'Reyes', 'BSIS', 4, 'B', 'Sorsogon Data Systems', 500, 120, '2026-07-13', '2026-10-12', 'ONGOING');
  END IF;

  -- Maria Clara
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'maria.santos@ccdi.edu.ph') THEN
    u_id := gen_random_uuid();
    INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
    VALUES (u_id, 'maria.santos@ccdi.edu.ph', '2026-002', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Maria Clara', 'Santos');
    INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, start_date, expected_end_date, status)
    VALUES (gen_random_uuid(), u_id, '2026-002', 'Maria Clara', 'Santos', 'BSIS', 4, 'A', 'XYZ Solutions Inc.', 500, 500, '2026-04-06', '2026-07-06', 'COMPLETED');
  END IF;
END $$;

-- Ensure companies exist
INSERT INTO companies (id, name, address, location, is_it_company) VALUES
(gen_random_uuid(), 'ABC Technologies', 'Rizal Street, Sorsogon City', 'Sorsogon City', true),
(gen_random_uuid(), 'XYZ Solutions Inc.', 'Legazpi City', 'Outside Sorsogon', true),
(gen_random_uuid(), 'Sorsogon Data Systems', 'Bibincahan, Sorsogon City', 'Sorsogon City', true)
ON CONFLICT DO NOTHING;

-- Link students to companies (use LIMIT 1 to avoid duplicates)
UPDATE students SET company_id = (SELECT id FROM companies WHERE name = 'ABC Technologies' LIMIT 1) WHERE company_name = 'ABC Technologies' AND company_id IS NULL;
UPDATE students SET company_id = (SELECT id FROM companies WHERE name = 'XYZ Solutions Inc.' LIMIT 1) WHERE company_name = 'XYZ Solutions Inc.' AND company_id IS NULL;
UPDATE students SET company_id = (SELECT id FROM companies WHERE name = 'Sorsogon Data Systems' LIMIT 1) WHERE company_name = 'Sorsogon Data Systems' AND company_id IS NULL;

-- System settings
INSERT INTO system_settings (key, value, description) VALUES
('school_name', 'Computer Communication Development Institute - Sorsogon', NULL),
('system_name', 'Web-Based OJT Monitoring System', NULL),
('default_required_hours', '500', 'Default required OJT hours for new students')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Verify: show all users
SELECT id, email, username, role, status, first_name, last_name FROM users;
