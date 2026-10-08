import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { UserEditForm } from "./edit-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: user }, { data: companies }, { data: supervisors }] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, email, username, role, status, first_name, last_name, company_id, student:students(id, student_id, course, year_level, section, required_hours, company_id, supervisor_id, status, start_date, expected_end_date, designation, schedule_time_in, schedule_time_out, schedule_break_start, schedule_break_end)")
      .eq("id", id)
      .single(),
    supabaseAdmin.from("companies").select("id, name").order("name", { ascending: true }),
    supabaseAdmin.from("users").select("id, first_name, last_name").eq("role", "SUPERVISOR").order("last_name", { ascending: true }),
  ]);

  if (!user) notFound();

  const studentRel = Array.isArray(user.student) ? user.student[0] : user.student;

  const mappedUser = {
    id: user.id,
    role: user.role,
    status: user.status,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    username: user.username ?? "",
    companyId: user.company_id ?? "",
    student: studentRel
      ? {
          id: studentRel.id,
          studentId: studentRel.student_id,
          course: studentRel.course,
          yearLevel: studentRel.year_level,
          section: studentRel.section,
          requiredHours: studentRel.required_hours,
          companyId: studentRel.company_id ?? "",
          supervisorId: studentRel.supervisor_id ?? "",
          status: studentRel.status,
          startDate: studentRel.start_date ? String(studentRel.start_date).slice(0, 10) : "",
          expectedEndDate: studentRel.expected_end_date ? String(studentRel.expected_end_date).slice(0, 10) : "",
          designation: studentRel.designation ?? "",
          scheduleTimeIn: studentRel.schedule_time_in ?? null,
          scheduleTimeOut: studentRel.schedule_time_out ?? null,
          scheduleBreakStart: studentRel.schedule_break_start ?? null,
          scheduleBreakEnd: studentRel.schedule_break_end ?? null,
        }
      : null,
  };

  // Deduplicate companies by name
  const seen = new Set<string>();
  const companyList = (companies ?? []).filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  const supervisorList = (supervisors ?? []).map((s) => ({
    id: s.id,
    name: `${s.first_name} ${s.last_name}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${user.first_name} ${user.last_name}`}
        description="Update account assignments and details."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to User Management
            </Link>
          </Button>
        }
      />

      <Card className="p-6">
        <UserEditForm user={mappedUser} companies={companyList} supervisors={supervisorList} />
      </Card>
    </div>
  );
}
