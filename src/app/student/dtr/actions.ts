"use server";

import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/dal";

async function getMyStudentId() {
  const user = await getCurrentUser();
  if (!user.student) return null;
  return user.student.id as string;
}

function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export async function timeInAction() {
  const studentId = await getMyStudentId();
  if (!studentId) return { error: "No student profile found." };

  const today = todayDate();

  // Prevent duplicate submissions for the same date
  const { data: existing } = await supabaseAdmin
    .from("dtr_records")
    .select("id, approval_status")
    .eq("student_id", studentId)
    .eq("date", today)
    .single();

  if (existing && existing.approval_status !== "REJECTED") {
    return { error: "You have already timed in today." };
  }

  const timeIn = new Date().toISOString(); // server timestamp — never client-provided

  if (existing) {
    // Rejected record → resubmit
    const { error } = await supabaseAdmin
      .from("dtr_records")
      .update({
        time_in: timeIn,
        time_out: null,
        pm_time_in: null,
        pm_time_out: null,
        total_hours: 0,
        approval_status: "RESUBMITTED",
        rejection_reason: null,
        updated_at: timeIn,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("schedule_time_in")
      .eq("id", studentId)
      .single();

    // Mark LATE if past scheduled shift start
    let status: "PRESENT" | "LATE" = "PRESENT";
    if (student?.schedule_time_in) {
      const m = String(student.schedule_time_in).match(/(\d{1,2})[:.](\d{2})/);
      if (m) {
        const sched = new Date();
        sched.setHours(Number(m[1]), Number(m[2]), 0, 0);
        if (new Date() > sched) status = "LATE";
      }
    }

    const { error } = await supabaseAdmin.from("dtr_records").insert({
      student_id: studentId,
      date: today,
      time_in: timeIn,
      status,
      approval_status: "PENDING",
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/student/dtr");
  return { success: true };
}

// Student can withdraw their own submission only while it is still
// awaiting supervisor review (PENDING / RESUBMITTED).
export async function cancelDtrAction() {
  const studentId = await getMyStudentId();
  if (!studentId) return { error: "No student profile found." };

  const today = todayDate();
  const { data: dtr } = await supabaseAdmin
    .from("dtr_records")
    .select("id, approval_status")
    .eq("student_id", studentId)
    .eq("date", today)
    .single();

  if (!dtr) return { error: "No submission to cancel." };
  if (dtr.approval_status !== "PENDING" && dtr.approval_status !== "RESUBMITTED") {
    return { error: "This submission can no longer be cancelled." };
  }

  const { error } = await supabaseAdmin.from("dtr_records").delete().eq("id", dtr.id);
  if (error) return { error: error.message };

  revalidatePath("/student/dtr");
  return { success: true };
}

export async function uploadProofAction(dtrId: string, dataUrl: string) {
  const studentId = await getMyStudentId();
  if (!studentId) return { error: "No student profile found." };

  if (!dataUrl.startsWith("data:image/")) return { error: "Only image files are allowed." };
  if (dataUrl.length > 800_000) return { error: "Image is too large." };

  const { error } = await supabaseAdmin
    .from("dtr_records")
    .update({
      attachment_url: dataUrl,
      attachment_name: "proof-of-entry",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dtrId)
    .eq("student_id", studentId);

  if (error) return { error: error.message };
  revalidatePath("/student/dtr");
  return { success: true };
}

export async function pmTimeInAction(dtrId: string) {
  const studentId = await getMyStudentId();
  if (!studentId) return { error: "No student profile found." };

  const { data: dtr } = await supabaseAdmin
    .from("dtr_records")
    .select("id, time_out, pm_time_in")
    .eq("id", dtrId)
    .eq("student_id", studentId)
    .single();

  if (!dtr) return { error: "DTR record not found." };
  if (!dtr.time_out) return { error: "Finish your morning shift first." };
  if (dtr.pm_time_in) return { error: "You have already timed in for the afternoon." };

  const now = new Date().toISOString(); // server timestamp — never client-provided
  const { error } = await supabaseAdmin
    .from("dtr_records")
    .update({ pm_time_in: now, updated_at: now })
    .eq("id", dtrId);

  if (error) return { error: error.message };
  revalidatePath("/student/dtr");
  return { success: true };
}

export async function timeOutAction(dtrId: string) {
  const studentId = await getMyStudentId();
  if (!studentId) return { error: "No student profile found." };

  const { data: dtr } = await supabaseAdmin
    .from("dtr_records")
    .select("id, time_in, time_out, pm_time_in, pm_time_out, break_minutes")
    .eq("id", dtrId)
    .eq("student_id", studentId)
    .single();

  if (!dtr) return { error: "DTR record not found." };
  if (!dtr.time_in) return { error: "No time in recorded." };

  const timeOut = new Date();
  const nowIso = timeOut.toISOString();

  if (!dtr.time_out) {
    // Morning shift out (lunch break start) — the day is not complete yet
    const { error } = await supabaseAdmin
      .from("dtr_records")
      .update({ time_out: nowIso, updated_at: nowIso })
      .eq("id", dtrId);
    if (error) return { error: error.message };
  } else if (!dtr.pm_time_in) {
    return { error: "Please time in for the afternoon shift first." };
  } else if (!dtr.pm_time_out) {
    // Afternoon shift out — day complete; total = both sessions, lunch excluded
    const morningMs = new Date(dtr.time_out).getTime() - new Date(dtr.time_in).getTime();
    const afternoonMs = timeOut.getTime() - new Date(dtr.pm_time_in).getTime();
    const lunchMs = new Date(dtr.pm_time_in).getTime() - new Date(dtr.time_out).getTime();
    const totalHours = Math.max(0, (morningMs + afternoonMs) / 3_600_000);

    const { error } = await supabaseAdmin
      .from("dtr_records")
      .update({
        pm_time_out: nowIso,
        break_minutes: Math.max(0, Math.round(lunchMs / 60_000)),
        total_hours: Math.round(totalHours * 100) / 100,
        updated_at: nowIso,
      })
      .eq("id", dtrId);
    if (error) return { error: error.message };
  } else {
    return { error: "You have already timed out." };
  }

  revalidatePath("/student/dtr");
  return { success: true };
}
