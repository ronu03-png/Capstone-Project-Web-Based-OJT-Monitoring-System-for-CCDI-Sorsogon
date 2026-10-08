import Link from "next/link";
import { Building2, Users, UserCheck, UserX, UserMinus } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  student_id: string;
  status: string;
  course: string | null;
  year_level: number | null;
  section: string | null;
  company_name: string | null;
};

function StatLinkCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </div>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

export default async function AdminReportsPage() {
  const { data: students } = await supabaseAdmin
    .from("students")
    .select("id, first_name, last_name, student_id, status, course, year_level, section, company_name")
    .order("last_name", { ascending: true });

  const studentList: StudentRow[] = students ?? [];

  const deployed = studentList.filter((s) => s.company_name);
  const ongoing = studentList.filter((s) => s.status === "ONGOING");
  const notDeployed = studentList.filter((s) => !s.company_name);
  const failed = studentList.filter((s) => s.status === "FAILED");

  // Group deployed students by company
  const byCompany = new Map<string, StudentRow[]>();
  deployed.forEach((s) => {
    const list = byCompany.get(s.company_name!) ?? [];
    list.push(s);
    byCompany.set(s.company_name!, list);
  });
  const companyGroups = Array.from(byCompany.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="OJT deployment statistics per company." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatLinkCard label="Deployed" value={deployed.length} icon={UserCheck} href="/admin/reports/deployed" />
        <StatLinkCard label="Ongoing" value={ongoing.length} icon={Users} href="/admin/reports/ongoing" />
        <StatLinkCard label="Not Deployed" value={notDeployed.length} icon={UserX} href="/admin/reports/not-deployed" />
        <StatLinkCard label="Failed" value={failed.length} icon={UserMinus} href="/admin/reports/failed" />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Deployment by Company</h2>
        </div>

        {companyGroups.length === 0 ? (
          <EmptyState title="No deployments" description="No students have been assigned to a company yet." />
        ) : (
          <div className="space-y-4">
            {companyGroups.map(([company, members]) => (
              <div key={company}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">{company}</span>
                  <span className="text-xs text-muted-foreground">({members.length} student{members.length !== 1 ? "s" : ""})</span>
                </div>
                <ul className="space-y-1.5 rounded-lg border bg-muted/20 px-3 py-2">
                  {members.map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.last_name}, {s.first_name}</span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.status} className="text-[10px]" />
                        <span className="text-xs text-muted-foreground">{s.student_id} &middot; {s.course} {s.year_level}-{s.section}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
