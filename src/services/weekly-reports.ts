import "server-only";
import { supabaseAdmin } from "@/lib/db/supabase";

function mapActivity(a: Record<string, unknown>) {
  return {
    id: a.id as string,
    date: new Date(a.date as string),
    activity: a.activity as string,
    description: (a.description as string) ?? null,
    skillsLearned: (a.skills_learned as string) ?? null,
    remarks: (a.remarks as string) ?? null,
    hoursSpent: (a.hours_spent as number) ?? null,
  };
}

function mapReport(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    studentId: r.student_id as string,
    weekNumber: r.week_number as number,
    weekStartDate: new Date(r.week_start_date as string),
    weekEndDate: new Date(r.week_end_date as string),
    totalHours: (r.total_hours as number) ?? 0,
    status: r.status as string,
    rejectionReason: (r.rejection_reason as string) ?? null,
    createdAt: new Date(r.created_at as string),
    activities: ((r.activities as Record<string, unknown>[]) ?? []).map(mapActivity),
  };
}

function mapStudent(s: Record<string, unknown>) {
  return {
    id: s.id as string,
    studentId: s.student_id as string,
    firstName: s.first_name as string,
    lastName: s.last_name as string,
    course: (s.course as string) ?? null,
    designation: (s.designation as string) ?? null,
    companyName: (s.company_name as string) ?? null,
  };
}

export async function getStudentWeeklyReports(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("weekly_reports")
    .select("*, activities:weekly_report_activities(*)")
    .eq("student_id", studentId)
    .order("week_number", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapReport);
}

export async function getWeeklyReports(studentId: string) {
  return getStudentWeeklyReports(studentId);
}

export async function getWeeklyReportById(id: string, studentId?: string) {
  let q = supabaseAdmin
    .from("weekly_reports")
    .select("*, activities:weekly_report_activities(*)")
    .eq("id", id);
  if (studentId) q = q.eq("student_id", studentId);
  const { data, error } = await q.single();
  if (error || !data) return null;
  return mapReport(data);
}

export async function getWeeklyReportByIdAdmin(id: string) {
  const { data, error } = await supabaseAdmin
    .from("weekly_reports")
    .select("*, activities:weekly_report_activities(*), student:students(id, student_id, first_name, last_name, course, designation, company_name)")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  const studentRel = Array.isArray(data.student) ? data.student[0] : data.student;
  return {
    ...mapReport(data),
    student: studentRel ? mapStudent(studentRel as Record<string, unknown>) : null,
  };
}

export async function createWeeklyReport(studentId: string, data: {
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  totalHours?: number;
  activities?: { date: string; activity: string; description?: string; skillsLearned?: string; hoursSpent?: number }[];
}) {
  const { data: report, error } = await supabaseAdmin.from("weekly_reports").insert({
    student_id: studentId,
    week_number: data.weekNumber,
    week_start_date: data.weekStartDate,
    week_end_date: data.weekEndDate,
    total_hours: data.totalHours ?? 0,
    status: "DRAFT",
  }).select().single();

  if (error) throw new Error(error.message);

  if (data.activities?.length && report) {
    await supabaseAdmin.from("weekly_report_activities").insert(
      data.activities.map((a) => ({
        weekly_report_id: report.id,
        date: a.date,
        activity: a.activity,
        description: a.description ?? null,
        skills_learned: a.skillsLearned ?? null,
        hours_spent: a.hoursSpent ?? null,
      }))
    );
  }

  return report;
}

export async function submitWeeklyReport(reportId: string) {
  const { data, error } = await supabaseAdmin
    .from("weekly_reports")
    .update({ status: "SUBMITTED" })
    .eq("id", reportId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
