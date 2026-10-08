"use server";

import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/dal";

export async function updateAvatarAction(avatarDataUrl: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  if (!avatarDataUrl.startsWith("data:image/")) {
    return { error: "Invalid image file." };
  }

  if (avatarDataUrl.length > 500_000) {
    return { error: "Image is too large. Please choose a smaller image." };
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ avatar_url: avatarDataUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
