import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export default async function AdminAuditLogsPage() {
  const { data: logs, error } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="System activity and audit trail." />

      <div className="space-y-2">
        {(logs ?? []).map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{log.action}</p>
                <p className="text-xs text-muted-foreground">{log.description ?? "—"}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          </Card>
        ))}

        {(!logs || logs.length === 0) && (
          <p className="py-8 text-center text-muted-foreground">No audit logs found.</p>
        )}
      </div>
    </div>
  );
}
