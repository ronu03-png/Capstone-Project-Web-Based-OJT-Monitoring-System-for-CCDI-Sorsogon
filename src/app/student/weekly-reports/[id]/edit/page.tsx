import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/dal";
import { getWeeklyReportById } from "@/services/weekly-reports";

import WeeklyReportForm from "../../create/weekly-report-form";

export default async function EditWeeklyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user.student) redirect("/unauthorized");

  const { id } = await params;
  const report = await getWeeklyReportById(id, user.student.id);
  if (!report) notFound();
  if (report.status !== "REJECTED" && report.status !== "DRAFT") {
    redirect(`/student/weekly-reports/${id}`);
  }

  return (
    <WeeklyReportForm
      studentId={user.student.id}
      report={{
        id: report.id,
        weekNumber: report.weekNumber,
        weekStartDate: report.weekStartDate,
        weekEndDate: report.weekEndDate,
        rejectionReason: report.rejectionReason,
        activities: report.activities.map((a) => ({
          date: a.date,
          activity: a.activity,
          hoursSpent: a.hoursSpent,
          remarks: a.remarks,
        })),
      }}
    />
  );
}
