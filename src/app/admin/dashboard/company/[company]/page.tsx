import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";
import { formatDate, formatHours } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Not Started",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-700",
  ONGOING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

export default async function StudentsByCompanyPage({ params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  const decodedCompany = decodeURIComponent(company);

  const { data: students } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("company_name", decodedCompany)
    .order("last_name", { ascending: true });

  const studentList = students ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${decodedCompany}`}
        description={`${studentList.length} student(s) deployed to ${decodedCompany}.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard"><ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
        }
      />

      <div className="space-y-3">
        {studentList.map((student) => {
          const progressPct = student.required_hours > 0
            ? Math.min(100, (student.completed_hours / student.required_hours) * 100)
            : 0;
          return (
            <Card key={student.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">
                      {student.last_name}, {student.first_name}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[student.status]}`}>
                      {STATUS_LABELS[student.status] ?? student.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {student.student_id} &bull; {student.course} - Year {student.year_level}{student.section ? ` - ${student.section}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supervisor: {student.supervisor_name ?? "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium">{formatHours(student.completed_hours)} / {formatHours(student.required_hours)}</p>
                  <Progress value={progressPct} className="mt-1 h-2 w-32" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(student.start_date)} - {formatDate(student.expected_end_date)}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}

        {studentList.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-medium">No Students Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">No students deployed to this company.</p>
          </div>
        )}
      </div>
    </div>
  );
}
