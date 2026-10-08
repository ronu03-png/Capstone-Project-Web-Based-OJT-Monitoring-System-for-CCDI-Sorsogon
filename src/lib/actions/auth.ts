"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/db/supabase";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, deleteSession } from "@/lib/auth/session";
import { getSession, homeForRole } from "@/lib/auth/dal";
import { loginSchema, type LoginFormState } from "@/lib/validations/auth";
import { logAudit } from "@/lib/audit";
import { ROLE_BASE_PATH } from "@/lib/roles";

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { identifier, password } = parsed.data;

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .or(`email.eq.${identifier},username.eq.${identifier}`)
    .single();

  if (error || !user) {
    // Try matching by student_id
    const { data: studentUser } = await supabaseAdmin
      .from("students")
      .select("user:users(*)")
      .eq("student_id", identifier)
      .single();

    if (!studentUser || !studentUser.user) {
      return { error: "Invalid credentials. Please check your username/email and password." };
    }

    const u = Array.isArray(studentUser.user) ? studentUser.user[0] : studentUser.user;
    const validPassword = await verifyPassword(password, u.password_hash as string);
    if (!validPassword) {
      await logAudit({ userId: u.id as string, action: "LOGIN_FAILED", description: "Invalid password attempt" });
      return { error: "Invalid credentials. Please check your username/email and password." };
    }

    const remember = formData.get("remember") === "on";
    await createSession(u.id as string, u.role as "ADMIN" | "SUPERVISOR" | "STUDENT", remember);
    await supabaseAdmin.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", u.id as string);
    await logAudit({ userId: u.id as string, action: "LOGIN", description: `${u.first_name} ${u.last_name} logged in`, entityType: "User", entityId: u.id as string });

    const nextPath = formData.get("next")?.toString();
    const target = nextPath && nextPath.startsWith(ROLE_BASE_PATH[u.role as "ADMIN" | "SUPERVISOR" | "STUDENT"]) ? nextPath : homeForRole(u.role as "ADMIN" | "SUPERVISOR" | "STUDENT");
    redirect(target);
  }

  const genericError = "Invalid credentials. Please check your username/email and password.";

  if (user.status === "DISABLED") {
    return { error: "Your account has been disabled. Please contact the administrator." };
  }
  if (user.status === "PENDING") {
    return { error: "Your account is pending activation. Please contact the administrator." };
  }

  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) {
    await logAudit({ userId: user.id, action: "LOGIN_FAILED", description: "Invalid password attempt" });
    return { error: genericError };
  }

  const remember = formData.get("remember") === "on";
  await createSession(user.id, user.role, remember);
  await supabaseAdmin.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
  await logAudit({ userId: user.id, action: "LOGIN", description: `${user.first_name} ${user.last_name} logged in`, entityType: "User", entityId: user.id });

  const nextPath = formData.get("next")?.toString();
  const target = nextPath && nextPath.startsWith(ROLE_BASE_PATH[user.role]) ? nextPath : homeForRole(user.role);
  redirect(target);
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await logAudit({ userId: session.userId, action: "LOGOUT", entityType: "User", entityId: session.userId });
  }
  await deleteSession();
  redirect("/login");
}
