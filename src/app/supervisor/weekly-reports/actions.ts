"use server";

import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/dal";
import { notifyUser, auditApproval, getStudentUserId } from "@/lib/workflow";

export async function approveWeeklyReportBatchAction(formData: FormData) {
  const user = await getCurrentUser();
  const reportIds = formData.getAll("reportIds") as string[];
  const action = formData.get("action") as string;
  const reason = (formData.get("reason") as string) || "";

  if (!reportIds.length) return { error: "No reports selected." };
  if (action === "reject" && !reason.trim()) return { error: "A rejection reason is required." };

  const now = new Date().toISOString();

  const { data: reports } = await supabaseAdmin
    .from("weekly_reports")
    .select("id, student_id, week_number")
    .in("id", reportIds);

  if (!reports?.length) return { error: "Reports not found." };

  if (action === "approve") {
    const { error } = await supabaseAdmin
      .from("weekly_reports")
      .update({
        status: "SUPERVISOR_APPROVED",
        supervisor_approved_at: now,
        reviewed_by: user.id,
        reviewed_at: now,
        rejection_reason: null,
      })
      .in("id", reportIds);
    if (error) return { error: error.message };

    for (const r of reports) {
      const uid = await getStudentUserId(r.student_id);
      if (uid) {
        await notifyUser(
          uid, "WEEKLY_REPORT", "Weekly Report Approved",
          `Your Week ${r.week_number} accomplishment report has been approved by your supervisor.`,
          "/student/weekly-reports",
        );
      }
      await auditApproval({
        userId: user.id,
        action: "WEEKLY_REPORT_APPROVED",
        description: `Approved Week ${r.week_number} accomplishment report`,
        entityType: "weekly_report",
        entityId: r.id,
      });
    }
  } else if (action === "reject") {
    const { error } = await supabaseAdmin
      .from("weekly_reports")
      .update({
        status: "REJECTED",
        reviewed_by: user.id,
        reviewed_at: now,
        rejection_reason: reason.trim(),
      })
      .in("id", reportIds);
    if (error) return { error: error.message };

    for (const r of reports) {
      const uid = await getStudentUserId(r.student_id);
      if (uid) {
        await notifyUser(
          uid, "WEEKLY_REPORT", "Weekly Report Rejected",
          `Your Week ${r.week_number} accomplishment report was rejected by your supervisor. Reason: ${reason.trim()}. Please review and resubmit.`,
          "/student/weekly-reports",
        );
      }
      await auditApproval({
        userId: user.id,
        action: "WEEKLY_REPORT_REJECTED",
        description: `Rejected Week ${r.week_number} accomplishment report — Reason: ${reason.trim()}`,
        entityType: "weekly_report",
        entityId: r.id,
      });
    }
  }

  revalidatePath("/supervisor/weekly-reports");
  return { success: true };
}
