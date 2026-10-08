import { supabaseAdmin } from "@/lib/db/supabase";
import { verifySession } from "@/lib/auth/dal";

import { PageHeader } from "@/components/shared/page-header";
import { NotificationList, MarkAllReadButton } from "@/components/notifications/notification-list";

export default async function StudentNotificationsPage() {
  const session = await verifySession();

  const { data: notifications } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false });

  const list = notifications ?? [];
  const hasUnread = list.some((n) => !n.is_read);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Your notifications and alerts."
        actions={<MarkAllReadButton hasUnread={hasUnread} />}
      />

      {list.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">No notifications.</p>
      ) : (
        <NotificationList notifications={list} />
      )}
    </div>
  );
}
