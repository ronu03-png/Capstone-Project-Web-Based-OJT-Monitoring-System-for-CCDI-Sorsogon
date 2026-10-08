import { Megaphone } from "lucide-react";
import { supabaseAdmin } from "@/lib/db/supabase";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export default async function StudentAnnouncementsPage() {
  const { data: announcements } = await supabaseAdmin
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Important updates from the OJT office." />

      <div className="space-y-4">
        {(announcements ?? []).map((a) => (
          <Card key={a.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">{a.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{a.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(a.published_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {(!announcements || announcements.length === 0) && (
          <EmptyState icon={Megaphone} title="No Announcements" description="Check back later for updates." />
        )}
      </div>
    </div>
  );
}
