import Link from "next/link";
import { Building2, Users, MapPin, Phone, Mail } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

import { AddCompanyForm } from "./add-company-form";
import { CompanyFilters } from "./filter";

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; location?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type ?? "";
  const location = sp.location ?? "";

  const [{ data: companies }, { data: students }] = await Promise.all([
    supabaseAdmin.from("companies").select("*").order("name", { ascending: true }),
    supabaseAdmin.from("students").select("company_name"),
  ]);

  const companyList = companies ?? [];
  const studentList = students ?? [];

  // Deduplicate companies by name
  const uniqueCompanies = new Map<string, typeof companyList[0]>();
  companyList.forEach((c) => {
    if (!uniqueCompanies.has(c.name)) uniqueCompanies.set(c.name, c);
  });
  const allCompanies = Array.from(uniqueCompanies.values());

  // Filter by industry
  let filtered = allCompanies;
  if (type) {
    filtered = filtered.filter((c) =>
      type === "Other"
        ? !c.industry || c.industry === "Other"
        : c.industry === type || (type === "Information Technology" && c.is_it_company)
    );
  }

  // Filter by location ("Outside Sorsogon" contains "sorsogon", so exclude it explicitly)
  const isSorsogon = (loc?: string | null) =>
    !!loc && loc.toLowerCase().includes("sorsogon") && !loc.toLowerCase().includes("outside");
  if (location === "sorsogon") filtered = filtered.filter((c) => isSorsogon(c.location));
  else if (location === "outside") filtered = filtered.filter((c) => !isSorsogon(c.location));

  const studentCounts = new Map<string, number>();
  studentList.forEach((s) => {
    if (s.company_name) {
      studentCounts.set(s.company_name, (studentCounts.get(s.company_name) ?? 0) + 1);
    }
  });

  const totalDeployed = Array.from(studentCounts.values()).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage company placements and view deployment statistics."
        actions={<AddCompanyForm />}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatCard label="Total Companies" value={allCompanies.length} icon={Building2} />
        <StatCard label="Total Deployed" value={totalDeployed} icon={Users} tone="success" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <CompanyFilters type={type} location={location} />
      </Card>

      <div className="space-y-4">
        {filtered.map((company) => {
          const deployedCount = studentCounts.get(company.name) ?? 0;
          return (
            <Card key={company.id} className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{company.name}</h3>
                    {company.is_it_company && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">IT</span>
                    )}
                    {company.industry && !company.is_it_company && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{company.industry}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {company.address ?? "No address"} &bull; {company.location ?? "No location"}
                  </p>
                  {company.industry && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Industry: {company.industry}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {company.contact_number && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {company.contact_number}
                      </span>
                    )}
                    {company.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {company.email}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">{deployedCount}</span>{" "}
                    <span className="text-muted-foreground">student(s) deployed</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/companies/${company.id}/edit`}>
                      <Pencil className="mr-1 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/companies/${company.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-lg font-medium">No Companies Found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters or add a new company.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
