import { GraduationCap, Building2, User, Calendar, MapPin, CheckCircle2, ListChecks, Loader2 } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/db/supabase";
import { getRequiredHoursByCourse } from "@/lib/course-hours";
import { formatDate, formatHours } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartCard } from "@/components/shared/chart-card";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

export default async function StudentOjtPage() {
  const user = await getCurrentUser();
  if (!user.student) {
    return (
      <div className="space-y-6">
        <PageHeader title="My OJT" description="Your on-the-job training overview." />
        <EmptyState icon={GraduationCap} title="No OJT profile found" description="Please contact the administrator to set up your OJT profile." />
      </div>
    );
  }

  const [{ data: student }, { data: taskStats }] = await Promise.all([
    supabaseAdmin.from("students").select("*").eq("id", user.student.id).single(),
    supabaseAdmin.from("tasks").select("status").eq("student_id", user.student.id),
  ]);

  if (!student) {
    return (
      <div className="space-y-6">
        <PageHeader title="My OJT" description="Your on-the-job training overview." />
        <EmptyState icon={GraduationCap} title="No OJT profile found" description="Please contact the administrator to set up your OJT profile." />
      </div>
    );
  }

  // Use the student's assigned required hours (admin-overridable), fallback to course default
  const requiredHours = student.required_hours ?? getRequiredHoursByCourse(student.course);

  const completedTasks = taskStats?.filter((s) => s.status === "COMPLETED").length ?? 0;
  const ongoingTasks = taskStats?.filter((s) => s.status === "ONGOING").length ?? 0;
  const undoneTasks = taskStats?.filter((s) => s.status === "UNDONE").length ?? 0;
  const totalTasks = completedTasks + ongoingTasks + undoneTasks;
  const pendingTasks = ongoingTasks + undoneTasks;

  const progressPct = requiredHours > 0 ? Math.min(100, (student.completed_hours / requiredHours) * 100) : 0;
  const remainingHours = Math.max(requiredHours - student.completed_hours, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="My OJT" description="Your on-the-job training placement and progress." />

      {/* Company & Supervisor Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-10 w-10 text-primary" />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">{student.company_name ?? "Not assigned"}</h2>
              {student.company_address && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {student.company_address}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Assigned Supervisor</p>
                  <p className="text-sm font-medium">{student.supervisor_name ?? "Not assigned"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Designation</p>
                  <p className="text-sm font-medium">{student.designation ?? "Not assigned"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <StatusBadge status={student.status} />
            <p className="mt-1 text-xs text-muted-foreground">
              {student.course} - Year {student.year_level}
            </p>
          </div>
        </div>
      </Card>

      {/* OJT Hours Progress */}
      <ChartCard title="OJT Hours Progress" description={`${student.course} program requires ${formatHours(requiredHours)}`}>
        <div className="space-y-4">
          <Progress value={progressPct} className="h-4" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{formatHours(student.completed_hours)} completed</span>
            <span className="font-medium">{progressPct.toFixed(1)}%</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-lg font-bold">{formatHours(requiredHours)}</p>
              <p className="text-xs text-muted-foreground">Required Hours</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-lg font-bold text-green-600">{formatHours(student.completed_hours)}</p>
              <p className="text-xs text-muted-foreground">Completed Hours</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-lg font-bold text-orange-600">{formatHours(remainingHours)}</p>
              <p className="text-xs text-muted-foreground">Remaining Hours</p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Task Stats */}
      <ChartCard title="Task Status Summary" description="Overview of submitted and pending tasks">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <ListChecks className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalTasks}</p>
              <p className="text-xs text-muted-foreground">Tasks Uploaded</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{completedTasks}</p>
              <p className="text-xs text-muted-foreground">Tasks Approved</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
              <Loader2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-orange-600">{pendingTasks}</p>
              <p className="text-xs text-muted-foreground">Tasks Pending</p>
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Timeline */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ChartCard title="Start Date">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{formatDate(student.start_date)}</span>
          </div>
        </ChartCard>
        <ChartCard title="Expected End">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{formatDate(student.expected_end_date)}</span>
          </div>
        </ChartCard>
        <ChartCard title="Actual End">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{formatDate(student.actual_end_date)}</span>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
