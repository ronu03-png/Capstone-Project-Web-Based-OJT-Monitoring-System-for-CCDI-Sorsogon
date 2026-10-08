import "server-only";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function getDtrRecords(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("dtr_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getDtrRecordById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("dtr_records")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getStudentDtrSummary(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("dtr_records")
    .select("status, total_hours, approval_status")
    .eq("student_id", studentId);
  if (error) throw new Error(error.message);

  const records = data ?? [];
  // Only supervisor-approved records count toward official rendered hours
  const approved = records.filter((r) => ["SUPERVISOR_APPROVED", "ADMIN_APPROVED"].includes(r.approval_status));
  return {
    totalHours: approved.reduce((sum, r) => sum + (r.total_hours ?? 0), 0),
    presentCount: records.filter((r) => r.status === "PRESENT").length,
    lateCount: records.filter((r) => r.status === "LATE").length,
    absentCount: records.filter((r) => r.status === "ABSENT").length,
    excusedCount: records.filter((r) => r.status === "EXCUSED").length,
    recordCount: records.length,
  };
}

export async function createDtrRecord(studentId: string, data: {
  date: string;
  timeIn?: string;
  timeOut?: string;
  breakMinutes?: number;
  totalHours?: number;
  status?: string;
  remarks?: string;
  attachmentUrl?: string;
  attachmentName?: string;
}) {
  const { data: record, error } = await supabaseAdmin.from("dtr_records").insert({
    student_id: studentId,
    date: data.date,
    time_in: data.timeIn ?? null,
    time_out: data.timeOut ?? null,
    break_minutes: data.breakMinutes ?? 60,
    total_hours: data.totalHours ?? 0,
    status: (data.status as any) ?? "PRESENT",
    remarks: data.remarks ?? null,
    attachment_url: data.attachmentUrl ?? null,
    attachment_name: data.attachmentName ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  return record;
}
