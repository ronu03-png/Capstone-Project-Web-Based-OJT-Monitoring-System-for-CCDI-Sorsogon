import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import WeeklyReportForm from "./weekly-report-form";

export default async function CreateWeeklyReportPage() {
  const user = await getCurrentUser();
  if (!user.student) redirect("/unauthorized");

  return (
    <WeeklyReportForm
      studentId={user.student.id}
    />
  );
}
