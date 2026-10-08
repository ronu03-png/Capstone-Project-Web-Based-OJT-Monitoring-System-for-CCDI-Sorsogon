import Link from "next/link";
import { GraduationCap, Users, TrendingUp, Search, Download, Building2 } from "lucide-react";

import { getAdminStudentList } from "@/services/admin";
import { supabaseAdmin } from "@/lib/db/supabase";
import { formatDate, formatHours } from "@/lib/format";
import { AssignStudentForm } from "./assign-student-form";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not Deployed" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const course = typeof sp.course === "string" ? sp.course : undefined;
  const company = typeof sp.company === "string" ? sp.company : undefined;
  const deployment = typeof sp.deployment === "string" ? sp.deployment : undefined;
  const page = sp.page ? parseInt(typeof sp.page === "string" ? sp.page : sp.page[0], 10) : 1;

  const { students, total, courses, companies, pageCount, deployedCount, notDeployedCount, ongoingCount, completedCount } = await getAdminStudentList({ search, course, status, company, deployment, page });

  const [{ data: companyList }, { data: supervisorList }] = await Promise.all([
    supabaseAdmin.from("companies").select("id, name").order("name", { ascending: true }),
    supabaseAdmin.from("users").select("id, first_name, last_name").eq("role", "SUPERVISOR").order("last_name", { ascending: true }),
  ]);

  // Deduplicate companies by name (DB has duplicate rows from seed)
  const uniqueCompanies = new Map<string, { id: string; name: string }>();
  (companyList ?? []).forEach((c) => {
    if (!uniqueCompanies.has(c.name)) uniqueCompanies.set(c.name, c);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students & OJT Records"
        description="View and manage all student OJT records, deployment, and progress."
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/api/export/students" download><Download className="mr-1 h-4 w-4" /> Export CSV</a>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Link href="/admin/students" className="block transition-transform hover:scale-[1.02]">
          <StatCard label="Total Students" value={total} icon={Users} />
        </Link>
        <Link href="/admin/students?deployment=deployed" className="block transition-transform hover:scale-[1.02]">
          <StatCard label="Deployed" value={deployedCount} icon={Building2} tone="success" />
        </Link>
        <Link href="/admin/students?deployment=not_deployed" className="block transition-transform hover:scale-[1.02]">
          <StatCard label="Not Deployed" value={notDeployedCount} icon={Building2} tone="default" />
        </Link>
        <Link href="/admin/students?status=ONGOING" className="block transition-transform hover:scale-[1.02]">
          <StatCard label="Ongoing" value={ongoingCount} icon={TrendingUp} tone="info" />
        </Link>
        <Link href="/admin/students?status=COMPLETED" className="block transition-transform hover:scale-[1.02]">
          <StatCard label="Completed" value={completedCount} icon={TrendingUp} tone="success" />
        </Link>
        <StatCard label="Courses" value={courses.length} hint="Distinct programs" icon={GraduationCap} tone="info" />
      </div>

      <Card className="p-4">
        {/* Filter form */}
        <form className="mb-4 flex flex-wrap gap-2" action="/admin/students" method="GET">
          <Input name="search" placeholder="Search by name or ID..." defaultValue={search ?? ""} className="w-64" />
          <select name="status" className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" defaultValue={status ?? ""}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select name="course" className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" defaultValue={course ?? ""}>
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select name="company" className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" defaultValue={company ?? ""}>
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="secondary">
            <Search className="mr-1 h-4 w-4" /> Filter
          </Button>
          {(search || status || course || company || deployment) && (
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/students">Clear</Link>
            </Button>
          )}
        </form>

        {students.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students found" description="Try adjusting your search or filters." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Company / Supervisor</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const progressPct = student.requiredHours > 0
                  ? Math.min(100, (student.completedHours / student.requiredHours) * 100)
                  : 0;
                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Link href={`/admin/students/${student.id}`} className="group">
                        <p className="text-sm font-medium text-foreground group-hover:underline">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{student.studentId}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground">{student.course}</p>
                      <p className="text-xs text-muted-foreground">Year {student.yearLevel}{student.section ? ` - ${student.section}` : ""}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm text-foreground">{student.companyName ?? "Not deployed"}</p>
                          <p className="text-xs text-muted-foreground">{student.supervisorName ?? "No supervisor"}</p>
                        </div>
                        <AssignStudentForm
                          studentId={student.id}
                          currentCompanyId={student.companyId}
                          currentSupervisorId={student.supervisorId}
                          companies={Array.from(uniqueCompanies.values())}
                          supervisors={(supervisorList ?? []).map((s) => ({ id: s.id, name: `${s.first_name} ${s.last_name}` }))}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Progress value={progressPct} className="h-2 w-24" />
                        <p className="text-xs text-muted-foreground">{formatHours(student.completedHours)} / {formatHours(student.requiredHours)}</p>
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={student.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>Start: {formatDate(student.startDate)}</div>
                      <div>End: {formatDate(student.expectedEndDate)}</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Pagination page={page} totalPages={pageCount} basePath="/admin/students" searchParams={{ search, status, course, company, deployment }} />
      </Card>
    </div>
  );
}
