-- =========================================================================
-- CCDI Sorsogon OJT Monitoring System - Supabase Schema
-- Run this in Supabase SQL Editor
-- =========================================================================

-- =========================================================================
-- ENUM TYPES
-- =========================================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'SUPERVISOR', 'STUDENT');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'DISABLED', 'PENDING');
CREATE TYPE ojt_status AS ENUM ('NOT_STARTED', 'ONGOING', 'COMPLETED', 'FAILED');
CREATE TYPE dtr_status AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED');
CREATE TYPE dtr_approval_status AS ENUM ('PENDING', 'SUPERVISOR_APPROVED', 'ADMIN_APPROVED', 'REJECTED');
CREATE TYPE task_status AS ENUM ('COMPLETED', 'ONGOING', 'UNDONE');
CREATE TYPE narrative_report_status AS ENUM ('DRAFT', 'SUBMITTED');
CREATE TYPE weekly_report_status AS ENUM ('DRAFT', 'SUBMITTED', 'SUPERVISOR_APPROVED', 'ADMIN_APPROVED', 'REJECTED');
CREATE TYPE announcement_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE notification_category AS ENUM ('DTR', 'WEEKLY_REPORT', 'TASK', 'ANNOUNCEMENT', 'SYSTEM');

-- =========================================================================
-- USERS
-- =========================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  status user_status DEFAULT 'ACTIVE',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  company_id UUID,
  company_name TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- PASSWORD RESET TOKENS
-- =========================================================================
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- =========================================================================
-- COMPANIES
-- =========================================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  location TEXT,
  industry TEXT,
  contact_number TEXT,
  email TEXT,
  is_it_company BOOLEAN DEFAULT false,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- STUDENTS
-- =========================================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  course TEXT NOT NULL,
  year_level INTEGER NOT NULL,
  section TEXT,
  contact_number TEXT,
  address TEXT,
  company_id UUID REFERENCES companies(id),
  company_name TEXT,
  company_address TEXT,
  designation TEXT,
  supervisor_id TEXT,
  supervisor_name TEXT,
  required_hours DOUBLE PRECISION DEFAULT 500,
  completed_hours DOUBLE PRECISION DEFAULT 0,
  start_date TIMESTAMPTZ,
  expected_end_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  schedule_time_in TEXT,
  schedule_time_out TEXT,
  status ojt_status DEFAULT 'NOT_STARTED',
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_archived ON students(archived);
CREATE INDEX idx_students_company_id ON students(company_id);
CREATE INDEX idx_students_supervisor_id ON students(supervisor_id);

-- =========================================================================
-- DTR RECORDS
-- =========================================================================
CREATE TABLE dtr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  break_minutes INTEGER DEFAULT 60,
  total_hours DOUBLE PRECISION DEFAULT 0,
  status dtr_status DEFAULT 'PRESENT',
  approval_status dtr_approval_status DEFAULT 'PENDING',
  remarks TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, date)
);
CREATE INDEX idx_dtr_records_student_id ON dtr_records(student_id);
CREATE INDEX idx_dtr_records_date ON dtr_records(date);
CREATE INDEX idx_dtr_records_approval_status ON dtr_records(approval_status);

-- =========================================================================
-- WEEKLY REPORTS
-- =========================================================================
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_hours DOUBLE PRECISION DEFAULT 0,
  status weekly_report_status DEFAULT 'DRAFT',
  supervisor_approved_at TIMESTAMPTZ,
  admin_approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, week_number)
);
CREATE INDEX idx_weekly_reports_student_id ON weekly_reports(student_id);
CREATE INDEX idx_weekly_reports_status ON weekly_reports(status);

-- =========================================================================
-- WEEKLY REPORT ACTIVITIES
-- =========================================================================
CREATE TABLE weekly_report_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_report_id UUID NOT NULL REFERENCES weekly_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity TEXT NOT NULL,
  description TEXT,
  skills_learned TEXT,
  remarks TEXT,
  hours_spent DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_weekly_report_activities_report_id ON weekly_report_activities(weekly_report_id);

-- =========================================================================
-- OJT EVALUATIONS
-- =========================================================================
CREATE TABLE ojt_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  department TEXT,
  training_period TEXT,
  supervisor_name TEXT,
  evaluation_date TIMESTAMPTZ DEFAULT now(),
  quality_of_work INTEGER,
  productivity_efficiency INTEGER,
  accuracy_attention_to_detail INTEGER,
  ability_to_follow_instructions INTEGER,
  ability_to_work_independently INTEGER,
  understanding_of_tasks INTEGER,
  technical_skills INTEGER,
  problem_solving_skills INTEGER,
  ability_to_learn_apply_feedback INTEGER,
  punctuality_attendance INTEGER,
  initiative INTEGER,
  responsibility_dependability INTEGER,
  professional_behavior INTEGER,
  communication_skills INTEGER,
  teamwork_collaboration INTEGER,
  customer_client_interaction INTEGER,
  work_performance_score DOUBLE PRECISION,
  knowledge_skills_score DOUBLE PRECISION,
  work_attitude_score DOUBLE PRECISION,
  communication_teamwork_score DOUBLE PRECISION,
  total_score DOUBLE PRECISION,
  comments TEXT,
  evaluator_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_ojt_evaluations_student_id ON ojt_evaluations(student_id);

-- =========================================================================
-- TASKS
-- =========================================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  status task_status DEFAULT 'UNDONE',
  skills_learned TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tasks_student_id ON tasks(student_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- =========================================================================
-- NARRATIVE REPORTS
-- =========================================================================
CREATE TABLE narrative_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status narrative_report_status DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_narrative_reports_student_id ON narrative_reports(student_id);

-- =========================================================================
-- ANNOUNCEMENTS
-- =========================================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  priority TEXT DEFAULT 'NORMAL',
  audience TEXT DEFAULT 'ALL',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_announcements_audience ON announcements(audience);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =========================================================================
-- AUDIT LOGS
-- =========================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  entity_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =========================================================================
-- SYSTEM SETTINGS
-- =========================================================================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_by_id UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - Optional but recommended
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE dtr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_report_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ojt_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE narrative_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role (server-side)
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON dtr_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON weekly_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON weekly_report_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ojt_evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON narrative_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON system_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON companies FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- SEED DATA
-- =========================================================================

-- Default settings
INSERT INTO system_settings (key, value, description) VALUES
('school_name', 'Computer Communication Development Institute - Sorsogon', NULL),
('system_name', 'Web-Based OJT Monitoring System', NULL),
('default_required_hours', '500', 'Default required OJT hours for new students');
