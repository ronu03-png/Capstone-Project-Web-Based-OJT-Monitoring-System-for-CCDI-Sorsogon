-- ============================================================
-- CCDI OJT Monitoring System - Supabase Seed Data
-- Run this in Supabase SQL Editor after creating tables
-- ============================================================

-- Correct bcrypt hash for "Password123!" with 12 salt rounds
-- Generated with: bcrypt.hash('Password123!', 12)

-- Create Admin
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
);

-- Create Demo Student (Juan Dela Cruz)
WITH new_user AS (
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
  new_user.id,
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
FROM new_user;

-- Create additional demo students

-- Jose Rizal Bonifacio (BSIT - Completed)
WITH new_user AS (
  INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
  VALUES (gen_random_uuid(), 'jose.bonifacio@ccdi.edu.ph', '2026-006', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Jose Rizal', 'Bonifacio')
  RETURNING id
)
INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, start_date, expected_end_date, status)
SELECT gen_random_uuid(), new_user.id, '2026-006', 'Jose Rizal', 'Bonifacio', 'BSIT', 4, 'A', 'ABC Technologies', 500, 400, '2026-06-01', '2026-09-01', 'ONGOING'
FROM new_user;

-- Ana Marie Gonzales (BSIS - Not Started)
WITH new_user AS (
  INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
  VALUES (gen_random_uuid(), 'ana.gonzales@ccdi.edu.ph', '2026-004', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Ana Marie', 'Gonzales')
  RETURNING id
)
INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, required_hours, completed_hours, status)
SELECT gen_random_uuid(), new_user.id, '2026-004', 'Ana Marie', 'Gonzales', 'BSIS', 4, 'B', 500, 0, 'NOT_STARTED'
FROM new_user;

-- Andres Luna (BSIS - Failed)
WITH new_user AS (
  INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
  VALUES (gen_random_uuid(), 'andres.luna@ccdi.edu.ph', '2026-006', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Andres', 'Luna')
  RETURNING id
)
INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, start_date, expected_end_date, status)
SELECT gen_random_uuid(), new_user.id, '2026-005', 'Andres', 'Luna', 'BSIS', 4, 'B', 'Sorsogon Data Systems', 500, 46, '2026-07-20', '2026-10-19', 'FAILED'
FROM new_user;

-- Pedro Reyes (BSIS - Ongoing)
WITH new_user AS (
  INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
  VALUES (gen_random_uuid(), 'pedro.reyes@ccdi.edu.ph', '2026-003', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Pedro', 'Reyes')
  RETURNING id
)
INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, start_date, expected_end_date, status)
SELECT gen_random_uuid(), new_user.id, '2026-003', 'Pedro', 'Reyes', 'BSIS', 4, 'B', 'Sorsogon Data Systems', 500, 120, '2026-07-13', '2026-10-12', 'ONGOING'
FROM new_user;

-- Maria Clara Santos (BSIS - Completed)
WITH new_user AS (
  INSERT INTO users (id, email, username, password_hash, role, status, first_name, last_name)
  VALUES (gen_random_uuid(), 'maria.santos@ccdi.edu.ph', '2026-002', '$2b$12$zQiR2lzHJ0aoCFxylGDLl.ig40hb1KOU7A2z9Ejobb7rGolcMCxlO', 'STUDENT', 'ACTIVE', 'Maria Clara', 'Santos')
  RETURNING id
)
INSERT INTO students (id, user_id, student_id, first_name, last_name, course, year_level, section, company_name, required_hours, completed_hours, start_date, expected_end_date, status)
SELECT gen_random_uuid(), new_user.id, '2026-002', 'Maria Clara', 'Santos', 'BSIS', 4, 'A', 'XYZ Solutions Inc.', 500, 500, '2026-04-06', '2026-07-06', 'COMPLETED'
FROM new_user;

-- Create demo companies
INSERT INTO companies (id, name, address, location, is_it_company) VALUES
(gen_random_uuid(), 'ABC Technologies', 'Rizal Street, Sorsogon City', 'Sorsogon City', true),
(gen_random_uuid(), 'XYZ Solutions Inc.', 'Legazpi City', 'Outside Sorsogon', true),
(gen_random_uuid(), 'Sorsogon Data Systems', 'Bibincahan, Sorsogon City', 'Sorsogon City', true);

-- Link students to companies (update company_id)
UPDATE students SET company_id = (SELECT id FROM companies WHERE name = 'ABC Technologies') WHERE company_name = 'ABC Technologies';
UPDATE students SET company_id = (SELECT id FROM companies WHERE name = 'XYZ Solutions Inc.') WHERE company_name = 'XYZ Solutions Inc.';
UPDATE students SET company_id = (SELECT id FROM companies WHERE name = 'Sorsogon Data Systems') WHERE company_name = 'Sorsogon Data Systems';

-- Create some DTR records for Juan
INSERT INTO dtr_records (id, student_id, date, time_in, time_out, total_hours, status, approval_status)
SELECT gen_random_uuid(), s.id, '2026-10-01', '2026-10-01T07:30:00', '2026-10-01T17:00:00', 8, 'PRESENT', 'ADMIN_APPROVED'
FROM students s WHERE s.student_id = '2026-001';

INSERT INTO dtr_records (id, student_id, date, time_in, time_out, total_hours, status, approval_status)
SELECT gen_random_uuid(), s.id, '2026-10-02', '2026-10-02T07:30:00', '2026-10-02T17:00:00', 8, 'PRESENT', 'ADMIN_APPROVED'
FROM students s WHERE s.student_id = '2026-001';

INSERT INTO dtr_records (id, student_id, date, time_in, time_out, total_hours, status, approval_status)
SELECT gen_random_uuid(), s.id, '2026-10-03', '2026-10-03T08:00:00', '2026-10-03T17:00:00', 7.5, 'LATE', 'PENDING'
FROM students s WHERE s.student_id = '2026-001';

-- Create a weekly report for Juan
WITH new_report AS (
  INSERT INTO weekly_reports (id, student_id, week_number, week_start_date, week_end_date, total_hours, status)
  SELECT gen_random_uuid(), s.id, 1, '2026-10-01', '2026-10-05', 23.5, 'SUBMITTED'
  FROM students s WHERE s.student_id = '2026-001'
  RETURNING id
)
INSERT INTO weekly_report_activities (id, weekly_report_id, date, activity, description, hours_spent)
SELECT gen_random_uuid(), new_report.id, '2026-10-01', 'Installed network equipment', 'Setup routers and switches', 8
FROM new_report;

-- System settings
INSERT INTO system_settings (key, value, description) VALUES
('school_name', 'Computer Communication Development Institute - Sorsogon', 'School name displayed in the system'),
('system_name', 'Web-Based OJT Monitoring System', 'System application name'),
('default_required_hours', '500', 'Default required OJT hours for new students');
