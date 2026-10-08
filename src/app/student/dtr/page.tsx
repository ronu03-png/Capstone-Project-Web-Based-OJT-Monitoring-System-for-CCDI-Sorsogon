import { redirect } from "next/navigation";
import { Clock } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/db/supabase";
import { formatDate, formatTime } from "@/lib/format";

import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { DtrToday } from "./dtr-today";

const APPROVAL_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
  RESUBMITTED: { label: "Resubmitted", className: "bg-blue-100 text-blue-700" },
  SUPERVISOR_APPROVED: { label: "Approved", className: "bg-green-100 text-green-700" },
  ADMIN_APPROVED: { label: "Approved", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
};

function parseTime(t: string | null): { h: number; m: number } | null {
  if (!t) return null;
  const m = String(t).match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  return { h: Number(m[1]), m: Number(m[2]) };
}

// "07:30" -> "7:30 AM", "17:00" -> "5:00 PM"
function to12h(t: string | null): string {
  const p = parseTime(t);
  if (!p) return "—";
  const period = p.h >= 12 ? "PM" : "AM";
  const h12 = p.h % 12 || 12;
  return `${h12}:${String(p.m).padStart(2, "0")} ${period}`;
}

export default async function StudentDtrPage() {
  const user = await getCurrentUser();
  if (!user.student) redirect("/unauthorized");

  const [{ data: student }, { data: dtrRecords }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, schedule_time_in, schedule_time_out, schedule_break_start, schedule_break_end")
      .eq("id", user.student.id)
      .single(),
    supabaseAdmin
      .from("dtr_records")
      .select("*")
      .eq("student_id", user.student.id)
      .order("date", { ascending: false }),
  ]);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const all = dtrRecords ?? [];
  const todayDtr = all.find((r) => r.date === today) ?? null;
  const history = all.filter((r) => r.date !== today);

  // 30-minute availability rule (morning = schedule_time_in, afternoon = schedule_break_end)
  function availability(t: string | null): { can: boolean; at: string | null } {
    const p = parseTime(t);
    if (!p) return { can: true, at: null };
    const mins = p.h * 60 + p.m - 30;
    const avail = new Date(now);
    avail.setHours(Math.floor(mins / 60) % 24, mins % 60, 0, 0);
    const h = avail.getHours();
    const period = h >= 12 ? "PM" : "AM";
    return {
      can: now >= avail,
      at: `${h % 12 || 12}:${String(avail.getMinutes()).padStart(2, "0")} ${period}`,
    };
  }

  const am = availability(student?.schedule_time_in ?? "08:00");
  // The afternoon session is always part of the day — it defaults to
  // 1:00 PM – 5:00 PM when the admin hasn't configured break times.
  const pm = availability(student?.schedule_break_end ?? "13:00");

  const morningShift = `${to12h(student?.schedule_time_in ?? "08:00")} – ${to12h(student?.schedule_break_start ?? "12:00")}`;
  const afternoonShift = `${to12h(student?.schedule_break_end ?? "13:00")} – ${to12h(student?.schedule_time_out ?? "17:00")}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Time Record"
        description="Record your OJT attendance and view your history."
      />

      <Card className="p-6">
        <h2 className="mb-1 text-lg font-semibold">Today&apos;s OJT Attendance</h2>
        <p className="mb-4 text-sm text-muted-foreground">{formatDate(today)}</p>
        <DtrToday
          dtr={todayDtr}
          canTimeIn={am.can}
          availableAt={am.at}
          morningShift={morningShift}
          afternoonShift={afternoonShift}
          canPmTimeIn={pm.can}
          pmAvailableAt={pm.at}
        />
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">DTR History</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Morning (In – Out)</TableHead>
              <TableHead>Afternoon (In – Out)</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((r) => {
              const badge = APPROVAL_LABEL[r.approval_status] ?? { label: r.approval_status, className: "bg-gray-100 text-gray-700" };
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{formatDate(r.date)}</TableCell>
                  <TableCell>{formatTime(r.time_in)} – {formatTime(r.time_out)}</TableCell>
                  <TableCell>
                    {r.pm_time_in || r.pm_time_out
                      ? `${formatTime(r.pm_time_in)} – ${formatTime(r.pm_time_out)}`
                      : "—"}
                  </TableCell>
                  <TableCell>{(r.total_hours ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                    {r.approval_status === "REJECTED" && r.rejection_reason && (
                      <p className="mt-1 max-w-[200px] text-xs text-red-600">{r.rejection_reason}</p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {history.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  No previous DTR records.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
