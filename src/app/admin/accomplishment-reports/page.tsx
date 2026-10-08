import Link from "next/link";
import { ClipboardList, FileText, CheckCircle2, Clock } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminAccomplishmentReportsPage() {
  const [{ data: students }, { data: allReports }] = await Promise.all([
    supabaseAdmin.from("students").select("id, first_name, last_name, course, student_id").eq("archived", false).order("last_name", { ascending: true }),
    supabaseAdmin.from("weekly_reports").select("*, student:students(first_name, last_name, course, student_id)").order("week_number", { ascending: true }),
  ]);

  const studentList = students ?? [];
  const reportList = allReports ?? [];

  // Group reports by week
  const reportsByWeek = new Map<number, typeof reportList>();
  for (const report of reportList) {
    const existing = reportsByWeek.get(report.week_number) ?? [];
    existing.push(report);
    reportsByWeek.set(report.week_number, existing);
  }

  const totalPending = reportList.filter((r) => r.status === "SUBMITTED").length;
  const totalSupervisorApproved = reportList.filter((r) => r.status === "SUPERVISOR_APPROVED").length;
  const totalAdminApproved = reportList.filter((r) => r.status === "ADMIN_APPROVED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accomplishment Reports"
        description="Weekly accomplishment reports organized by week."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Reports" value={reportList.length} icon={FileText} />
        <StatCard label="Pending" value={totalPending} icon={Clock} tone="warning" />
        <StatCard label="Supervisor Approved" value={totalSupervisorApproved} icon={CheckCircle2} tone="info" />
        <StatCard label="Admin Approved" value={totalAdminApproved} icon={CheckCircle2} tone="success" />
      </div>

      <div className="space-y-6">
        {Array.from(reportsByWeek.entries()).map(([weekNumber, reports]) => {
          const submittedIds = new Set(reports.map((r) => r.student_id));
          const notSubmitted = studentList.filter((s) => !submittedIds.has(s.id));

          return (
            <Card key={weekNumber} className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Week {weekNumber}</h2>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="w-[100px]">Course</TableHead>
                    <TableHead className="w-[90px]">Hours</TableHead>
                    <TableHead className="w-[160px]">Status</TableHead>
                    <TableHead className="w-[90px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const s = Array.isArray(report.student) ? report.student[0] : report.student;
                    const statusLabel = report.status === "SUBMITTED" || report.status === "RESUBMITTED"
                      ? (report.status === "RESUBMITTED" ? "Resubmitted" : "Pending Review")
                      : report.status.replace(/_/g, " ");
                    const statusClass =
                      report.status === "ADMIN_APPROVED" || report.status === "SUPERVISOR_APPROVED"
                        ? "bg-green-100 text-green-700"
                        : report.status === "SUBMITTED" || report.status === "RESUBMITTED"
                        ? "bg-yellow-100 text-yellow-700"
                        : report.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700";
                    return (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {s?.first_name} {s?.last_name}
                          <span className="ml-2 text-xs text-muted-foreground">{s?.student_id}</span>
                        </TableCell>
                        <TableCell>{s?.course ?? "—"}</TableCell>
                        <TableCell>{report.total_hours?.toFixed(1) ?? "0.0"}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/admin/students/${report.student_id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {notSubmitted.map((student) => (
                    <TableRow key={student.id} className="opacity-60">
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                        <span className="ml-2 text-xs text-muted-foreground">{student.student_id}</span>
                      </TableCell>
                      <TableCell>{student.course ?? "—"}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Not Submitted
                        </span>
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          );
        })}

        {reportList.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-medium">No Reports Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No weekly accomplishment reports have been submitted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
