import "server-only";

import { supabaseAdmin } from "@/lib/db/supabase";

export async function notifyUser(
  userId: string,
  category: "DTR" | "WEEKLY_REPORT" | "TASK" | "ANNOUNCEMENT" | "SYSTEM",
  title: string,
  message: string,
  link?: string,
) {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    category,
    title,
    message,
    link: link ?? null,
  });
}

export async function auditApproval(entry: {
  userId: string;
  action: string;
  description: string;
  entityType: string;
  entityId: string;
}) {
  await supabaseAdmin.from("audit_logs").insert({
    user_id: entry.userId,
    action: entry.action,
    description: entry.description,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
  });
}

// Get the user_id for a student record (needed to send notifications)
export async function getStudentUserId(studentId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("students")
    .select("user_id")
    .eq("id", studentId)
    .single();
  return data?.user_id ?? null;
}
