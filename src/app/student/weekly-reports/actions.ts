"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db/supabase";

interface ActivityInput {
  date: string;
  activity: string;
  hoursSpent: number;
  remarks: string;
}

export async function createWeeklyReport(formData: {
  studentId: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  activities: ActivityInput[];
}) {
  const totalHours = formData.activities.reduce((sum, a) => sum + (Number(a.hoursSpent) || 0), 0);

  const { data: report, error: reportError } = await supabaseAdmin
    .from("weekly_reports")
    .insert({
      student_id: formData.studentId,
      week_number: formData.weekNumber,
      week_start_date: formData.weekStartDate,
      week_end_date: formData.weekEndDate,
      total_hours: totalHours,
      status: "SUBMITTED",
    })
    .select()
    .single();

  if (reportError) return { error: reportError.message };

  const activities = formData.activities.map((a) => ({
    weekly_report_id: report.id,
    date: a.date,
    activity: a.activity,
    hours_spent: Number(a.hoursSpent) || 0,
    remarks: a.remarks || null,
  }));

  const { error: actError } = await supabaseAdmin
    .from("weekly_report_activities")
    .insert(activities);

  if (actError) return { error: actError.message };

  revalidatePath("/student/weekly-reports");
  return { success: true, id: report.id };
}

export async function resubmitWeeklyReport(
  reportId: string,
  formData: {
    weekNumber: number;
    weekStartDate: string;
    weekEndDate: string;
    activities: ActivityInput[];
  }
) {
  // Only rejected (or draft) reports can be resubmitted
  const { data: existing } = await supabaseAdmin
    .from("weekly_reports")
    .select("id, status")
    .eq("id", reportId)
    .single();

  if (!existing) return { error: "Report not found." };
  if (existing.status !== "REJECTED" && existing.status !== "DRAFT") {
    return { error: "Only rejected reports can be resubmitted." };
  }

  const totalHours = formData.activities.reduce((sum, a) => sum + (Number(a.hoursSpent) || 0), 0);

  const { error: reportError } = await supabaseAdmin
    .from("weekly_reports")
    .update({
      week_number: formData.weekNumber,
      week_start_date: formData.weekStartDate,
      week_end_date: formData.weekEndDate,
      total_hours: totalHours,
      status: "RESUBMITTED",
      rejection_reason: null,
    })
    .eq("id", reportId);

  if (reportError) return { error: reportError.message };

  // Replace activities
  await supabaseAdmin.from("weekly_report_activities").delete().eq("weekly_report_id", reportId);

  const activities = formData.activities.map((a) => ({
    weekly_report_id: reportId,
    date: a.date,
    activity: a.activity,
    hours_spent: Number(a.hoursSpent) || 0,
    remarks: a.remarks || null,
  }));

  const { error: actError } = await supabaseAdmin
    .from("weekly_report_activities")
    .insert(activities);

  if (actError) return { error: actError.message };

  revalidatePath("/student/weekly-reports");
  revalidatePath(`/student/weekly-reports/${reportId}`);
  return { success: true, id: reportId };
}
