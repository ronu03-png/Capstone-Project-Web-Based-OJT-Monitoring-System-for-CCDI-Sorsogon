import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateStudentForm } from "./create-student-form";
import { CreateSupervisorForm } from "./create-supervisor-form";
import { UserResetList } from "./user-reset-list";

export default async function AdminUsersPage() {
  const [{ data: users }, { data: companies }] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, email, username, role, status, first_name, last_name, student:students(student_id, course)")
      .in("role", ["STUDENT", "SUPERVISOR"])
      .order("last_name", { ascending: true }),
    supabaseAdmin.from("companies").select("id, name").order("name", { ascending: true }),
  ]);

  // Deduplicate companies by name
  const seen = new Set<string>();
  const companyList = (companies ?? []).filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  const userList = (users ?? []).map((u) => {
    const studentRel = Array.isArray(u.student) ? u.student[0] : u.student;
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      student: studentRel
        ? { studentId: studentRel.student_id, course: studentRel.course }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Create and manage student and supervisor accounts."
      />

      <Tabs defaultValue="create-student" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-fit">
          <TabsTrigger value="create-student">Create Student</TabsTrigger>
          <TabsTrigger value="create-supervisor">Create Supervisor</TabsTrigger>
          <TabsTrigger value="reset">Manage Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="create-student" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Create Student Account</h2>
            <CreateStudentForm />
          </Card>
        </TabsContent>

        <TabsContent value="create-supervisor" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Create Supervisor Account</h2>
            <CreateSupervisorForm companies={companyList} />
          </Card>
        </TabsContent>

        <TabsContent value="reset" className="space-y-4">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Manage User Accounts</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              View student and supervisor accounts. Select a user to reset their password to the default (<strong>Password123!</strong>).
            </p>
            <UserResetList users={userList} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
