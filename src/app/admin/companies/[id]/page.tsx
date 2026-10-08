import { notFound } from "next/navigation";
import { Building2, Users, MapPin, Monitor } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";
import { formatDate } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: company }, { data: students }] = await Promise.all([
    supabaseAdmin.from("companies").select("*").eq("id", id).single(),
    supabaseAdmin.from("students").select("id, student_id, first_name, last_name, course, status, start_date, expected_end_date").eq("company_id", id).order("last_name", { ascending: true }),
  ]);

  if (!company) notFound();

  const studentList = students ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={company.name} description="Company details and deployed students." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Location</span>
          </div>
          <p className="mt-1 text-sm font-medium">{company.location ?? "—"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Type</span>
          </div>
          <p className="mt-1 text-sm font-medium">{company.is_it_company ? "IT Company" : "Non-IT"}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Deployed Students</span>
          </div>
          <p className="mt-1 text-sm font-medium">{studentList.length}</p>
        </Card>
      </div>

      {company.address && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Address</p>
          <p className="text-sm font-medium">{company.address}</p>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Deployed Students</h2>
        {studentList.map((student) => (
          <Card key={student.id} className="p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">
                  {student.last_name}, {student.first_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {student.student_id} &bull; {student.course}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Start: {formatDate(student.start_date)}</p>
                <p>End: {formatDate(student.expected_end_date)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
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
            </div>
          </Card>
        ))}

        {studentList.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No students deployed to this company yet.</p>
        )}
      </div>
    </div>
  );
}
