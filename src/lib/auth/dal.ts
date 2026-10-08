import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt, SESSION_COOKIE_NAME } from "./session";
import { supabaseAdmin } from "@/lib/db/supabase";
import { ROLE_HOME } from "@/lib/roles";
import type { UserRole } from "@/lib/db/database.types";

export interface AuthSession {
  userId: string;
  role: UserRole;
}

/** Reads and decrypts the session cookie. Returns null if absent/invalid. Does not redirect. */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = await decrypt(cookie);
  if (!payload?.userId) return null;
  return { userId: payload.userId, role: payload.role };
});

/** Requires an authenticated session. Redirects to /login when missing. */
export const verifySession = cache(async (): Promise<AuthSession> => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
});

/** Requires an authenticated session AND one of the allowed roles. */
export async function requireRole(allowed: UserRole[]): Promise<AuthSession> {
  const session = await verifySession();
  if (!allowed.includes(session.role)) {
    redirect("/unauthorized");
  }
  return session;
}

function mapUser(user: Record<string, unknown>) {
  return {
    id: user.id as string,
    email: user.email as string,
    username: user.username as string | null,
    role: user.role as UserRole,
    status: user.status as "ACTIVE" | "DISABLED" | "PENDING",
    firstName: user.first_name as string,
    lastName: user.last_name as string,
    avatarUrl: user.avatar_url as string | null,
    phone: user.phone as string | null,
    student: user.student
      ? {
          id: (user.student as Record<string, unknown>).id as string,
          studentId: (user.student as Record<string, unknown>).student_id as string,
          course: (user.student as Record<string, unknown>).course as string,
          yearLevel: (user.student as Record<string, unknown>).year_level as number,
          status: (user.student as Record<string, unknown>).status as string,
          requiredHours: (user.student as Record<string, unknown>).required_hours as number,
          completedHours: (user.student as Record<string, unknown>).completed_hours as number,
          companyName: (user.student as Record<string, unknown>).company_name as string | null,
          designation: (user.student as Record<string, unknown>).designation as string | null,
        }
      : null,
  };
}

/** Fetches the full current user record (safe fields only, no password hash). Redirects if unauthenticated. */
export const getCurrentUser = cache(async () => {
  const session = await verifySession();
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("*, student:students(id, student_id, course, year_level, status, required_hours, completed_hours, company_name, designation)")
    .eq("id", session.userId)
    .single();

  if (error || !user || user.status !== "ACTIVE") {
    redirect("/logout");
  }

  return mapUser(user);
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function homeForRole(role: UserRole) {
  return ROLE_HOME[role];
}
