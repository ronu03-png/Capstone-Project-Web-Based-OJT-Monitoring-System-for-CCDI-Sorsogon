import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Printer, Clock, Calendar, Pencil, AlertCircle } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/dal";
import { getWeeklyReportById } from "@/services/weekly-reports";
import { formatDate } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function StudentWeeklyReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user.student) redirect("/unauthorized");

  const { id } = await params;
  const report = await getWeeklyReportById(id, user.student.id);
  if (!report) notFound();

  const isRejected = report.status === "REJECTED";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Week ${report.weekNumber} Report`}
        description="Weekly accomplishment report details."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/student/weekly-reports"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
            </Button>
            {isRejected && (
              <Button asChild size="sm">
                <Link href={`/student/weekly-reports/${id}/edit`}>
                  <Pencil className="mr-1 h-4 w-4" /> Revise &amp; Resubmit
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/student/weekly-reports/${id}/print`}><Printer className="mr-1 h-4 w-4" /> Print</Link>
            </Button>
          </div>
        }
      />

      {/* Report summary */}
      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Week Number</p>
            <p className="text-lg font-semibold">Week {report.weekNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Period Covered</p>
            <p className="flex items-center gap-1 text-sm font-medium">
              <Calendar className="size-3.5 text-muted-foreground" />
              {formatDate(report.weekStartDate)} – {formatDate(report.weekEndDate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="flex items-center gap-1 text-sm font-medium">
              <Clock className="size-3.5 text-muted-foreground" />
              {report.totalHours.toFixed(1)} hrs
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <StatusBadge status={report.status} />
          </div>
        </div>
      </Card>

      {/* Rejection notice */}
      {isRejected && report.rejectionReason && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">This report was rejected by your supervisor.</p>
            <p className="mt-0.5"><strong>Reason:</strong> {report.rejectionReason}</p>
            <p className="mt-1 text-xs">Revise the report and resubmit it for review.</p>
          </div>
        </div>
      )}

      {/* Activities — same column layout as the printed form */}
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Activities</h2>
        {report.activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activities recorded for this week.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Date</TableHead>
                <TableHead className="w-[90px]">Hours</TableHead>
                <TableHead>Activity / Task</TableHead>
                <TableHead>Remarks / Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.activities.map((act) => (
                <TableRow key={act.id}>
                  <TableCell className="align-top font-medium">{formatDate(act.date)}</TableCell>
                  <TableCell className="align-top">{act.hoursSpent ?? "—"}</TableCell>
                  <TableCell className="align-top">
                    <p className="font-medium">{act.activity}</p>
                    {act.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{act.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {act.remarks ?? "—"}
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
