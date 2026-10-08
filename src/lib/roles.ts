import type { UserRole } from "@/lib/db/database.types";

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  SUPERVISOR: "/supervisor/dashboard",
  STUDENT: "/student/ojt",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  SUPERVISOR: "Supervisor",
  STUDENT: "Student",
};

export const ROLE_BASE_PATH: Record<UserRole, string> = {
  ADMIN: "/admin",
  SUPERVISOR: "/supervisor",
  STUDENT: "/student",
};

export function getRoleFromPath(pathname: string): UserRole | null {
  const entry = (Object.entries(ROLE_BASE_PATH) as [UserRole, string][]).find(([, base]) =>
    pathname.startsWith(base)
  );
  return entry ? entry[0] : null;
}
