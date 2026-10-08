import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, Printer, Eye, Pencil } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/dal";
import { getStudentWeeklyReports } from "@/services/weekly-reports";
import { getStudentDtrSummary } from "@/services/dtr";
import { formatDate, formatHours } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartCard } from "@/components/shared/chart-card";

export default async function StudentWeeklyReportsPage() {
  const user = await getCurrentUser();
  if (!user.student) redirect("/unauthorized");

  const [reports, dtrSummary] = await Promise.all([
    getStudentWeeklyReports(user.student.id),
    getStudentDtrSummary(user.student.id),
  ]);

  const remainingHours = Math.max(0, user.student.requiredHours - user.student.completedHours);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Accomplishment"
        description="View your weekly accomplishment reports and DTR attendance."
        actions={
          <Button asChild>
            <Link href="/student/weekly-reports/create">Create New Report</Link>
          </Button>
        }
      />

      {/* DTR / Attendance Summary */}
      <ChartCard title="Weekly DTR / Attendance" description="Your OJT attendance summary">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{user.student.completedHours}</p>
            <p className="text-xs text-muted-foreground">Approved Hours</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{remainingHours}</p>
            <p className="text-xs text-muted-foreground">Remaining Hours</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold">{dtrSummary.recordCount}</p>
            <p className="text-xs text-muted-foreground">DTR Entries</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{dtrSummary.lateCount}</p>
            <p className="text-xs text-muted-foreground">Late Days</p>
          </div>
        </div>
      </ChartCard>

      {/* Weekly Reports List */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Weekly Accomplishment Reports</h2>
        {reports.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-medium">No Weekly Reports Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create your first weekly accomplishment report.</p>
            <Button asChild className="mt-4">
              <Link href="/student/weekly-reports/create">Create Report</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Week</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="w-[90px]">Hours</TableHead>
                <TableHead className="w-[110px]">Activities</TableHead>
                <TableHead className="w-[130px]">Status</TableHead>
                <TableHead className="w-[220px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="align-top font-medium">Week {report.weekNumber}</TableCell>
                  <TableCell className="align-top">
                    {formatDate(report.weekStartDate)} – {formatDate(report.weekEndDate)}
                  </TableCell>
                  <TableCell className="align-top">{report.totalHours.toFixed(1)}</TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {report.activities.length} {report.activities.length === 1 ? "entry" : "entries"}
                  </TableCell>
                  <TableCell className="align-top">
                    <StatusBadge status={report.status} />
                    {report.status === "REJECTED" && report.rejectionReason && (
                      <p className="mt-1 max-w-[220px] text-xs text-red-600">{report.rejectionReason}</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/student/weekly-reports/${report.id}`}>
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Link>
                      </Button>
                      {report.status === "REJECTED" && (
                        <Button asChild size="sm">
                          <Link href={`/student/weekly-reports/${report.id}/edit`}>
                            <Pencil className="mr-1 h-4 w-4" /> Revise
                          </Link>
                        </Button>
                      )}
                      {report.status !== "DRAFT" && report.status !== "REJECTED" && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/student/weekly-reports/${report.id}/print`}>
                            <Printer className="mr-1 h-4 w-4" /> Print
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
