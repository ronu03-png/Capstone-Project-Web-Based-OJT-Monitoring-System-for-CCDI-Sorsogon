"use server";

import { supabaseAdmin } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/dal";

export async function markNotificationReadAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user?.id) return { error: "Not authenticated." };

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user?.id) return { error: "Not authenticated." };

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { error: error.message };
  return { success: true };
}
