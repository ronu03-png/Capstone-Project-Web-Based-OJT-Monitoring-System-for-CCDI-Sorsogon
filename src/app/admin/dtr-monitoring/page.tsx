import Link from "next/link";
import { Clock, Users, AlertCircle, TrendingUp } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";
import { formatHours } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDtrMonitoringPage() {
  const [{ data: students }, { data: allDtr }] = await Promise.all([
    supabaseAdmin.from("students").select("*").eq("archived", false).order("last_name", { ascending: true }),
    supabaseAdmin.from("dtr_records").select("status, approval_status"),
  ]);

  const studentList = students ?? [];
  const dtrList = allDtr ?? [];

  const totalRecords = dtrList.length;
  const pendingCount = dtrList.filter((d) => d.approval_status === "PENDING").length;
  const lateCount = dtrList.filter((d) => d.status === "LATE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="DTR Monitoring"
        description="Overview of all student daily time records grouped by student."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Students" value={studentList.length} icon={Users} />
        <StatCard label="Total DTR Entries" value={totalRecords} icon={Clock} />
        <StatCard label="Pending Approval" value={pendingCount} icon={AlertCircle} tone="warning" />
        <StatCard label="Late Entries" value={lateCount} icon={TrendingUp} tone="danger" />
      </div>

      <div className="space-y-4">
        {studentList.map((student) => (
          <Card key={student.id} className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {student.last_name}, {student.first_name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      student.status === "ONGOING"
                        ? "bg-blue-100 text-blue-700"
                        : student.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {student.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {student.student_id} &bull; {student.course} &bull; {student.company_name ?? "No company"}
                </p>
                <p className="mt-1 text-sm">
                  <span className="text-muted-foreground">Hours:</span>{" "}
                  <span className="font-medium">{formatHours(student.completed_hours)} / {formatHours(student.required_hours)}</span>
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/students/${student.id}`}>View Details</Link>
              </Button>
            </div>
          </Card>
        ))}

        {studentList.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-medium">No Students Found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
