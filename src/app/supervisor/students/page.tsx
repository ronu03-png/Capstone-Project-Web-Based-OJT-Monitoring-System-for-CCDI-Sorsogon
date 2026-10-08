import { redirect } from "next/navigation";
import { Users, GraduationCap } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/db/supabase";
import { formatDate, formatHours } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export default async function SupervisorStudentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: students } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("supervisor_id", user.id)
    .order("last_name", { ascending: true });

  const studentList = students ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Students"
        description={`${studentList.length} student(s) assigned to you.`}
      />

      <div className="space-y-4">
        {studentList.map((student) => {
          const progressPct =
            student.required_hours > 0
              ? Math.min(100, (student.completed_hours / student.required_hours) * 100)
              : 0;

          return (
            <Card key={student.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">
                      {student.first_name} {student.last_name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {student.student_id} &bull; {student.course} - Year {student.year_level}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <p><span className="text-muted-foreground">Company:</span> {student.company_name ?? "—"}</p>
                    <p><span className="text-muted-foreground">Designation:</span> {student.designation ?? "—"}</p>
                    <p><span className="text-muted-foreground">Start:</span> {formatDate(student.start_date)}</p>
                    <p><span className="text-muted-foreground">Expected End:</span> {formatDate(student.expected_end_date)}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                      student.status === "ONGOING"
                        ? "bg-blue-100 text-blue-700"
                        : student.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : student.status === "NOT_STARTED"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {student.status.replace("_", " ")}
                  </span>
                  <p className="mt-2 text-sm font-medium">
                    {formatHours(student.completed_hours)} / {formatHours(student.required_hours)}
                  </p>
                  <p className="text-xs text-muted-foreground">{progressPct.toFixed(0)}% complete</p>
                </div>
              </div>
            </Card>
          );
        })}

        {studentList.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-medium">No Students Assigned</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You do not have any students assigned to you yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
