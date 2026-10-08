"use server";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function getAdminStudentList({
  search,
  course,
  status,
  company,
  deployment,
  page = 1,
  pageSize = 10,
}: {
  search?: string;
  course?: string;
  status?: string;
  company?: string;
  deployment?: string;
  page?: number;
  pageSize?: number;
}) {
  let query = supabaseAdmin.from("students").select("*", { count: "exact" });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,student_id.ilike.%${search}%`);
  }
  if (course && course !== "ALL") query = query.eq("course", course);
  if (status && status !== "ALL") query = query.eq("status", status as "NOT_STARTED" | "ONGOING" | "COMPLETED" | "FAILED");
  if (company && company !== "ALL") query = query.eq("company_name", company);
  if (deployment === "deployed") query = query.not("company_id", "is", null);
  if (deployment === "not_deployed") query = query.is("company_id", null);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: students, count: total, error } = await query.order("last_name", { ascending: true }).range(from, to);
  if (error) throw new Error(error.message);

  const { data: courses } = await supabaseAdmin.from("students").select("course");
  const courseMap = new Map<string, number>();
  courses?.forEach((c) => courseMap.set(c.course, (courseMap.get(c.course) ?? 0) + 1));

  const { data: companies } = await supabaseAdmin.from("students").select("company_name").not("company_name", "is", null);
  const companySet = new Set(companies?.map((c) => c.company_name).filter(Boolean));

  const { count: deployedCount } = await supabaseAdmin.from("students").select("*", { count: "exact", head: true }).not("company_id", "is", null);
  const { count: notDeployedCount } = await supabaseAdmin.from("students").select("*", { count: "exact", head: true }).is("company_id", null);
  const { count: ongoingCount } = await supabaseAdmin.from("students").select("*", { count: "exact", head: true }).eq("status", "ONGOING");
  const { count: completedCount } = await supabaseAdmin.from("students").select("*", { count: "exact", head: true }).eq("status", "COMPLETED");

  return {
    students: (students ?? []).map((s) => ({
      id: s.id,
      studentId: s.student_id,
      firstName: s.first_name,
      lastName: s.last_name,
      course: s.course,
      yearLevel: s.year_level,
      section: s.section,
      companyId: s.company_id,
      companyName: s.company_name,
      designation: s.designation,
      supervisorId: s.supervisor_id,
      supervisorName: s.supervisor_name,
      requiredHours: s.required_hours,
      completedHours: s.completed_hours,
      startDate: s.start_date,
      expectedEndDate: s.expected_end_date,
      status: s.status,
    })),
    total: total ?? 0,
    courses: Array.from(courseMap.keys()),
    companies: Array.from(companySet) as string[],
    pageCount: Math.ceil((total ?? 0) / pageSize),
    deployedCount: deployedCount ?? 0,
    notDeployedCount: notDeployedCount ?? 0,
    ongoingCount: ongoingCount ?? 0,
    completedCount: completedCount ?? 0,
  };
}

export async function getStudentDetail(id: string) {
  const { data: student, error } = await supabaseAdmin.from("students").select("*").eq("id", id).single();
  if (error || !student) return null;

  const [
    { data: dtrRecords },
    { data: weeklyReports },
    { data: tasks },
    { data: ojtEvaluations },
  ] = await Promise.all([
    supabaseAdmin.from("dtr_records").select("*").eq("student_id", id).order("date", { ascending: false }),
    supabaseAdmin.from("weekly_reports").select("*, activities:weekly_report_activities(*)").eq("student_id", id).order("week_number", { ascending: true }),
    supabaseAdmin.from("tasks").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    supabaseAdmin.from("ojt_evaluations").select("*").eq("student_id", id).order("evaluation_date", { ascending: false }),
  ]);

  return {
    ...student,
    userId: student.user_id,
    studentId: student.student_id,
    firstName: student.first_name,
    lastName: student.last_name,
    yearLevel: student.year_level,
    section: student.section,
    contactNumber: student.contact_number,
    requiredHours: student.required_hours,
    completedHours: student.completed_hours,
    companyName: student.company_name,
    companyAddress: student.company_address,
    designation: student.designation,
    supervisorName: student.supervisor_name,
    startDate: student.start_date,
    expectedEndDate: student.expected_end_date,
    actualEndDate: student.actual_end_date,
    scheduleTimeIn: student.schedule_time_in,
    scheduleTimeOut: student.schedule_time_out,
    dtrRecords: (dtrRecords ?? []).map((d) => ({
      ...d,
      timeIn: d.time_in,
      timeOut: d.time_out,
      totalHours: d.total_hours,
      attachmentUrl: d.attachment_url,
      attachmentName: d.attachment_name,
      approvalStatus: d.approval_status,
    })),
    weeklyReports: (weeklyReports ?? []).map((w) => ({
      ...w,
      weekNumber: w.week_number,
      weekStartDate: w.week_start_date,
      weekEndDate: w.week_end_date,
      totalHours: w.total_hours,
      supervisorApprovedAt: w.supervisor_approved_at,
      adminApprovedAt: w.admin_approved_at,
      rejectedAt: w.rejected_at,
      rejectionReason: w.rejection_reason,
      activities: (w.activities ?? []).map((a) => ({
        ...a,
        weeklyReportId: a.weekly_report_id,
        skillsLearned: a.skills_learned,
        hoursSpent: a.hours_spent,
      })),
    })),
    tasks: tasks ?? [],
    ojtEvaluations: (ojtEvaluations ?? []).map((e) => ({
      ...e,
      evaluationDate: e.evaluation_date,
      supervisorName: e.supervisor_name,
      trainingPeriod: e.training_period,
      qualityOfWork: e.quality_of_work,
      productivityEfficiency: e.productivity_efficiency,
      accuracyAttentionToDetail: e.accuracy_attention_to_detail,
      abilityToFollowInstructions: e.ability_to_follow_instructions,
      abilityToWorkIndependently: e.ability_to_work_independently,
      understandingOfTasks: e.understanding_of_tasks,
      technicalSkills: e.technical_skills,
      problemSolvingSkills: e.problem_solving_skills,
      abilityToLearnApplyFeedback: e.ability_to_learn_apply_feedback,
      punctualityAttendance: e.punctuality_attendance,
      initiative: e.initiative,
      responsibilityDependability: e.responsibility_dependability,
      professionalBehavior: e.professional_behavior,
      communicationSkills: e.communication_skills,
      teamworkCollaboration: e.teamwork_collaboration,
      customerClientInteraction: e.customer_client_interaction,
      workPerformanceScore: e.work_performance_score,
      knowledgeSkillsScore: e.knowledge_skills_score,
      workAttitudeScore: e.work_attitude_score,
      communicationTeamworkScore: e.communication_teamwork_score,
      totalScore: e.total_score,
      evaluatorSignature: e.evaluator_signature,
    })),
  };
}
