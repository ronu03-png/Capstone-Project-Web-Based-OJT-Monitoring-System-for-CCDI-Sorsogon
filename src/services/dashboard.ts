import "server-only";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function getStudentDashboardData(studentId: string) {
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  if (error || !student) return null;

  const [
    { data: taskStats },
    { count: weeklyReportCount },
    { count: dtrCount },
    { data: recentDtr },
    { data: recentTasks },
  ] = await Promise.all([
    supabaseAdmin.from("tasks").select("status").eq("student_id", studentId),
    supabaseAdmin.from("weekly_reports").select("*", { count: "exact", head: true }).eq("student_id", studentId),
    supabaseAdmin.from("dtr_records").select("*", { count: "exact", head: true }).eq("student_id", studentId),
    supabaseAdmin.from("dtr_records").select("id, date, time_in, time_out, total_hours, status").eq("student_id", studentId).order("date", { ascending: false }).limit(5),
    supabaseAdmin.from("tasks").select("id, title, status, date").eq("student_id", studentId).order("created_at", { ascending: false }).limit(5),
  ]);

  const completed = taskStats?.filter((t) => t.status === "COMPLETED").length ?? 0;
  const ongoing = taskStats?.filter((t) => t.status === "ONGOING").length ?? 0;
  const undone = taskStats?.filter((t) => t.status === "UNDONE").length ?? 0;

  return {
    student: {
      id: student.id,
      studentId: student.student_id,
      firstName: student.first_name,
      lastName: student.last_name,
      course: student.course,
      yearLevel: student.year_level,
      section: student.section,
      companyName: student.company_name,
      companyAddress: student.company_address,
      designation: student.designation,
      requiredHours: student.required_hours,
      completedHours: student.completed_hours,
      startDate: student.start_date,
      expectedEndDate: student.expected_end_date,
      status: student.status,
    },
    taskStats: { completed, ongoing, undone, total: completed + ongoing + undone },
    weeklyReportCount: weeklyReportCount ?? 0,
    dtrCount: dtrCount ?? 0,
    recentDtr: recentDtr ?? [],
    recentTasks: recentTasks ?? [],
  };
}

export async function getAdminDashboardStats() {
  // Fetch all data in parallel with minimal queries
  const [
    { data: allStudents },
    { data: allReports },
    { data: allCompanies },
  ] = await Promise.all([
    supabaseAdmin.from("students").select("status, course, company_name, completed_hours"),
    supabaseAdmin.from("weekly_reports").select("status"),
    supabaseAdmin.from("companies").select("id"),
  ]);

  const students = allStudents ?? [];
  const reports = allReports ?? [];

  // Compute counts in-memory (much faster than multiple API calls)
  const totalStudents = students.length;
  const ongoingCount = students.filter((s) => s.status === "ONGOING").length;
  const completedCount = students.filter((s) => s.status === "COMPLETED").length;
  const notStartedCount = students.filter((s) => s.status === "NOT_STARTED").length;
  const failedCount = students.filter((s) => s.status === "FAILED").length;
  const deployedCount = students.filter((s) => s.company_name).length;
  const notDeployedCount = totalStudents - deployedCount;
  const totalCompletedHours = students.reduce((sum, s) => sum + (s.completed_hours ?? 0), 0);

  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === "SUBMITTED").length;
  const supervisorApprovedReports = reports.filter((r) => r.status === "SUPERVISOR_APPROVED").length;
  const adminApprovedReports = reports.filter((r) => r.status === "ADMIN_APPROVED").length;

  // Course stats
  const courseMap = new Map<string, number>();
  students.forEach((s) => {
    courseMap.set(s.course, (courseMap.get(s.course) ?? 0) + 1);
  });

  // Company stats
  const companyMap = new Map<string, number>();
  students.forEach((s) => {
    if (s.company_name) {
      companyMap.set(s.company_name, (companyMap.get(s.company_name) ?? 0) + 1);
    }
  });

  return {
    totalStudents,
    ongoingCount,
    completedCount,
    notStartedCount,
    failedCount,
    totalCompletedHours,
    courseStats: Array.from(courseMap.entries()).map(([course, count]) => ({ course, count })),
    companyStats: Array.from(companyMap.entries()).map(([name, count]) => ({ name, count })),
    totalReports,
    pendingReports,
    supervisorApprovedReports,
    adminApprovedReports,
    pendingDtrCount: 0, // Can be added if needed
    totalCompanies: (allCompanies ?? []).length,
    deployedCount,
    notDeployedCount,
  };
}
