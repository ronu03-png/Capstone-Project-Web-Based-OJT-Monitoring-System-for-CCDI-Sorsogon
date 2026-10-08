import { requireRole } from "@/lib/auth/dal";
import { AppShell } from "@/components/layout/app-shell";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["SUPERVISOR"]);
  return <AppShell>{children}</AppShell>;
}
