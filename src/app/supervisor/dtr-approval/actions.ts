"use server";

import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/dal";
import { notifyUser, auditApproval, getStudentUserId } from "@/lib/workflow";
import { formatDate } from "@/lib/format";

export async function approveDtrBatchAction(formData: FormData) {
  const user = await getCurrentUser();
  const dtrIds = formData.getAll("dtrIds") as string[];
  const action = formData.get("action") as string;
  const reason = (formData.get("reason") as string) || "";

  if (!dtrIds.length) return { error: "No records selected." };
  if (action === "reject" && !reason.trim()) return { error: "A rejection reason is required." };

  const now = new Date().toISOString();

  // Fetch the records being reviewed (with student info for notifications)
  const { data: records } = await supabaseAdmin
    .from("dtr_records")
    .select("id, student_id, date, time_out, pm_time_out, total_hours, student:students(first_name, last_name)")
    .in("id", dtrIds);

  if (!records?.length) return { error: "Records not found." };

  if (action === "approve") {
    // Approval requires a complete day — both the morning and afternoon
    // shifts must be submitted.
    const incomplete = records.filter((r) => !r.time_out || !r.pm_time_out);
    if (incomplete.length) {
      return {
        error: `Cannot approve ${incomplete.length === records.length ? "" : `${incomplete.length} of the selected records — `}the student has not timed out yet. Approval is only available after both shifts are submitted.`,
      };
    }

    const { error } = await supabaseAdmin
      .from("dtr_records")
      .update({
        approval_status: "SUPERVISOR_APPROVED",
        reviewed_by: user.id,
        reviewed_at: now,
        rejection_reason: null,
      })
      .in("id", dtrIds);
    if (error) return { error: error.message };

    // Approved hours count toward official rendered hours
    for (const r of records) {
      const { data: s } = await supabaseAdmin
        .from("students")
        .select("completed_hours")
        .eq("id", r.student_id)
        .single();
      if (s) {
        await supabaseAdmin
          .from("students")
          .update({ completed_hours: (s.completed_hours ?? 0) + (r.total_hours ?? 0) })
          .eq("id", r.student_id);
      }

      const uid = await getStudentUserId(r.student_id);
      if (uid) {
        await notifyUser(
          uid, "DTR", "DTR Approved",
          `Your DTR submission for ${formatDate(r.date)} has been approved by your supervisor. Rendered: ${(r.total_hours ?? 0).toFixed(2)} hrs.`,
          "/student/dtr",
        );
      }

      await auditApproval({
        userId: user.id,
        action: "DTR_APPROVED",
        description: `Approved DTR for ${formatDate(r.date)}`,
        entityType: "dtr_record",
        entityId: r.id,
      });
    }
  } else if (action === "reject") {
    const { error } = await supabaseAdmin
      .from("dtr_records")
      .update({
        approval_status: "REJECTED",
        reviewed_by: user.id,
        reviewed_at: now,
        rejection_reason: reason.trim(),
      })
      .in("id", dtrIds);
    if (error) return { error: error.message };

    for (const r of records) {
      const uid = await getStudentUserId(r.student_id);
      if (uid) {
        await notifyUser(
          uid, "DTR", "DTR Rejected",
          `Your DTR submission for ${formatDate(r.date)} was rejected by your supervisor. Reason: ${reason.trim()}. Please review and resubmit.`,
          "/student/dtr",
        );
      }

      await auditApproval({
        userId: user.id,
        action: "DTR_REJECTED",
        description: `Rejected DTR for ${formatDate(r.date)} — Reason: ${reason.trim()}`,
        entityType: "dtr_record",
        entityId: r.id,
      });
    }
  }

  revalidatePath("/supervisor/dtr-approval");
  return { success: true };
}
