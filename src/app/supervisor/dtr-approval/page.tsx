import { redirect } from "next/navigation";
import { Clock, CheckCircle2 } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/db/supabase";
import { formatDate } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { DtrReviewList } from "./review-list";

export default async function SupervisorDtrApprovalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Get student IDs assigned to this supervisor
  const { data: students } = await supabaseAdmin
    .from("students")
    .select("id")
    .eq("supervisor_id", user.id);

  const studentIds = (students ?? []).map((s) => s.id);

  const { data: pendingDtrs, error: dtrError } = await supabaseAdmin
    .from("dtr_records")
    .select("id, date, time_in, time_out, pm_time_in, pm_time_out, total_hours, remarks, attachment_url, approval_status, student:students(first_name, last_name)")
    .in("student_id", studentIds)
    .in("approval_status", ["PENDING", "RESUBMITTED"])
    .order("date", { ascending: false });

  const dtrList = (pendingDtrs ?? []).map((d) => {
    const s = Array.isArray(d.student) ? d.student[0] : d.student;
    return {
      id: d.id,
      date: formatDate(d.date),
      time_in: d.time_in,
      time_out: d.time_out,
      total_hours: d.total_hours,
      remarks: d.remarks,
      attachment_url: d.attachment_url,
      approvalStatus: d.approval_status,
      // Complete = both shifts punched (morning out + afternoon out)
      isComplete: !!d.time_out && !!d.pm_time_out,
      pm_time_in: d.pm_time_in,
      pm_time_out: d.pm_time_out,
      studentName: `${s?.first_name ?? ""} ${s?.last_name ?? ""}`.trim() || "Unknown",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="DTR Approval"
        description="Review and approve your students' daily time records."
      />

      {dtrError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Could not load DTR submissions.</p>
          <p className="mt-1">{dtrError.message}</p>
          <p className="mt-1 text-xs">
            If this mentions a missing column, run supabase-workflow-migration.sql in the Supabase SQL Editor.
          </p>
        </div>
      )}

      {dtrError ? null : dtrList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
          <h3 className="mt-3 text-lg font-medium">All Caught Up!</h3>
          <p className="mt-1 text-sm text-muted-foreground">No pending DTR records to approve.</p>
        </div>
      ) : (
        <DtrReviewList dtrs={dtrList} />
      )}
    </div>
  );
}
