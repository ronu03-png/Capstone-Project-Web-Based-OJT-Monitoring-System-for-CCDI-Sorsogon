import { supabaseAdmin } from "@/lib/db/supabase";

export async function logAudit(data: {
  userId?: string;
  action: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
}) {
  await supabaseAdmin.from("audit_logs").insert({
    user_id: data.userId ?? null,
    action: data.action,
    description: data.description ?? null,
    entity_type: data.entityType ?? null,
    entity_id: data.entityId ?? null,
    ip_address: data.ipAddress ?? null,
  });
}
