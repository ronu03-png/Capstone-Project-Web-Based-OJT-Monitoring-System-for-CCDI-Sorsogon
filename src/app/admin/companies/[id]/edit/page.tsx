import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { CompanyEditForm } from "./edit-form";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("id, name, address, location, industry, contact_number, email")
    .eq("id", id)
    .single();

  if (!company) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${company.name}`}
        description="Update company information."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/companies">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Companies
            </Link>
          </Button>
        }
      />

      <Card className="p-6">
        <CompanyEditForm company={company} />
      </Card>
    </div>
  );
}
