import "server-only";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function getAuditLogs(page = 1, pageSize = 50) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabaseAdmin
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { logs: data ?? [], total: count ?? 0, pageCount: Math.ceil((count ?? 0) / pageSize) };
}
