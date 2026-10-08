-- =========================================================================
-- APPROVAL WORKFLOW MIGRATION
-- Run this in Supabase SQL Editor
-- =========================================================================

-- Add RESUBMITTED status to both approval enums
ALTER TYPE dtr_approval_status ADD VALUE IF NOT EXISTS 'RESUBMITTED';
ALTER TYPE weekly_report_status ADD VALUE IF NOT EXISTS 'RESUBMITTED';

-- DTR workflow columns
ALTER TABLE dtr_records
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Weekly report workflow columns (rejection_reason already exists)
ALTER TABLE weekly_reports
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Split shift: morning = schedule_time_in → schedule_break_start,
-- lunch break = the gap, afternoon = schedule_break_end → schedule_time_out
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS schedule_break_start TEXT,
  ADD COLUMN IF NOT EXISTS schedule_break_end TEXT;

-- Afternoon session punches (morning uses the existing time_in/time_out)
ALTER TABLE dtr_records
  ADD COLUMN IF NOT EXISTS pm_time_in TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pm_time_out TIMESTAMPTZ;

-- Refresh Supabase API schema cache
NOTIFY pgrst, 'reload schema';
