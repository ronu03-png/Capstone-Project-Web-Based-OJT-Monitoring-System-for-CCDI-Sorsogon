import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { SettingsPage } from "@/components/shared/settings-page";

export default async function SupervisorSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <SettingsPage basePath="/supervisor" />;
}
