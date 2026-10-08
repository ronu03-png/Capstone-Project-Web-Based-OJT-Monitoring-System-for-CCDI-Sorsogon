import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/db/supabase";
import { formatDate } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { ReportReviewList } from "./review-list";

export default async function SupervisorWeeklyReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: students } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("supervisor_id", user.id);

  const studentIds = (students ?? []).map((s) => s.id);

  const { data: pendingReports } = await supabaseAdmin
    .from("weekly_reports")
    .select("id, week_number, week_start_date, week_end_date, total_hours, student:students(first_name, last_name), activities:weekly_report_activities(*)")
    .in("student_id", studentIds)
    .in("status", ["SUBMITTED", "RESUBMITTED"])
    .order("week_number", { ascending: true });

  const reportList = (pendingReports ?? []).map((r) => {
    const s = Array.isArray(r.student) ? r.student[0] : r.student;
    return {
      id: r.id,
      week_number: r.week_number,
      week_period: `${formatDate(r.week_start_date)} - ${formatDate(r.week_end_date)}`,
      total_hours: r.total_hours,
      activities: (r.activities ?? []).map((a) => ({
        date: formatDate(a.date),
        activity: a.activity,
        hours_spent: a.hours_spent,
        remarks: a.remarks,
      })),
      studentName: `${s?.first_name ?? ""} ${s?.last_name ?? ""}`.trim() || "Unknown",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Reports"
        description="Review and approve your students' weekly accomplishment reports."
      />

      {reportList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
          <h3 className="mt-3 text-lg font-medium">All Caught Up!</h3>
          <p className="mt-1 text-sm text-muted-foreground">No pending weekly reports to approve.</p>
        </div>
      ) : (
        <ReportReviewList reports={reportList} />
      )}
    </div>
  );
}
