import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const FILTERS: Record<string, { title: string; match: (s: StudentRow) => boolean }> = {
  deployed: {
    title: "Deployed Students",
    match: (s) => !!s.company_name,
  },
  ongoing: {
    title: "Ongoing Students",
    match: (s) => s.status === "ONGOING",
  },
  "not-deployed": {
    title: "Not Deployed Students",
    match: (s) => !s.company_name,
  },
  completed: {
    title: "Completed Students",
    match: (s) => s.status === "COMPLETED",
  },
  failed: {
    title: "Failed Students",
    match: (s) => s.status === "FAILED",
  },
};

export default async function ReportFilterPage({
  params,
}: {
  params: Promise<{ filter: string }>;
}) {
  const { filter } = await params;
  const config = FILTERS[filter];
  if (!config) notFound();

  const { data: students } = await supabaseAdmin
    .from("students")
    .select("id, first_name, last_name, student_id, status, course, year_level, section, company_name")
    .order("last_name", { ascending: true });

  const visible = (students ?? []).filter(config.match);

  // Group by company for deployed view
  const byCompany = new Map<string, StudentRow[]>();
  visible.forEach((s) => {
    const key = s.company_name ?? "No Company";
    const list = byCompany.get(key) ?? [];
    list.push(s);
    byCompany.set(key, list);
  });
  const groups = Array.from(byCompany.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={`${visible.length} student${visible.length !== 1 ? "s" : ""} found.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/reports">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Reports
            </Link>
          </Button>
        }
      />

      <Card className="p-5">
        {groups.length === 0 ? (
          <EmptyState title="No students" description="No students match this category." />
        ) : (
          <div className="space-y-4">
            {groups.map(([company, members]) => (
              <div key={company}>
                <div className="mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{company}</span>
                  <span className="text-xs text-muted-foreground">({members.length})</span>
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
