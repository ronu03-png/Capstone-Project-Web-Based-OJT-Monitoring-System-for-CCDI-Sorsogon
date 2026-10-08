import { supabaseAdmin } from "@/lib/db/supabase";
import { verifySession } from "@/lib/auth/dal";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Users, Clock, FileText, CheckCircle2 } from "lucide-react";

export default async function SupervisorDashboardPage() {
  const session = await verifySession();

  const { data: myStudents } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("supervisor_id", session.userId);

  const studentIds = (myStudents ?? []).map((s) => s.id);

  const [{ data: pendingDtr }, { data: pendingReports }] = await Promise.all([
    supabaseAdmin.from("dtr_records").select("*").in("student_id", studentIds).eq("approval_status", "PENDING"),
    supabaseAdmin.from("weekly_reports").select("*").in("student_id", studentIds).eq("status", "SUBMITTED"),
  ]);

  const students = myStudents ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Dashboard"
        description="Overview of your assigned students and pending approvals."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="My Students" value={students.length} icon={Users} />
        <StatCard label="Pending DTR" value={(pendingDtr ?? []).length} icon={Clock} tone="warning" />
        <StatCard label="Pending Reports" value={(pendingReports ?? []).length} icon={FileText} tone="warning" />
        <StatCard label="Approved" value={students.filter((s) => s.status === "COMPLETED").length} icon={CheckCircle2} tone="success" />
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <div key={student.id} className="rounded-lg border p-4">
            <p className="font-medium">{student.last_name}, {student.first_name}</p>
            <p className="text-sm text-muted-foreground">{student.course} &bull; {student.company_name ?? "No company"}</p>
            <p className="text-sm text-muted-foreground">{formatHours(student.completed_hours)} / {formatHours(student.required_hours)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatHours(hours: number | null) {
  if (hours === null || hours === undefined) return "0h";
  return `${hours.toFixed(0)}h`;
}
