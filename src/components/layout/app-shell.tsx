import { getCurrentUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/db/supabase";
import { AppShellClient } from "@/components/layout/app-shell-client";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
    supabaseAdmin
      .from("notifications")
      .select("id, title, message, link, is_read")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
  ]);

  return (
    <AppShellClient
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      }}
      notifications={(notifications ?? []).map((n) => ({ id: n.id, title: n.title, message: n.message, link: n.link, isRead: n.is_read }))}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </AppShellClient>
  );
}
