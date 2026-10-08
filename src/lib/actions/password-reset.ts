"use server";

import { randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/db/supabase";
import { hashPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormState,
  type ResetPasswordFormState,
} from "@/lib/validations/auth";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function requestPasswordResetAction(
  _prevState: ForgotPasswordFormState,
  formData: FormData
): Promise<ForgotPasswordFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    identifier: formData.get("identifier"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { identifier } = parsed.data;

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, email, status")
    .or(`email.eq.${identifier},username.eq.${identifier}`)
    .single();

  if (error || !user || user.status !== "ACTIVE") {
    return { success: true };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  await supabaseAdmin.from("password_reset_tokens").insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password?token=${token}`;
  console.log(`[password-reset] Reset link for ${user.email}: ${resetUrl}`);

  await logAudit({
    userId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "User",
    entityId: user.id,
  });

  return {
    success: true,
    devResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
  };
}

export async function resetPasswordAction(
  _prevState: ResetPasswordFormState,
  formData: FormData
): Promise<ResetPasswordFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { token, password } = parsed.data;

  const { data: resetToken, error } = await supabaseAdmin
    .from("password_reset_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !resetToken || resetToken.used_at || new Date(resetToken.expires_at) < new Date()) {
    return {
      error: "This password reset link is invalid or has expired. Please request a new one.",
    };
  }

  const passwordHash = await hashPassword(password);

  await supabaseAdmin.from("users").update({ password_hash: passwordHash }).eq("id", resetToken.user_id);
  await supabaseAdmin.from("password_reset_tokens").update({ used_at: new Date().toISOString() }).eq("id", resetToken.id);

  await logAudit({
    userId: resetToken.user_id,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "User",
    entityId: resetToken.user_id,
  });

  return { success: true };
}
