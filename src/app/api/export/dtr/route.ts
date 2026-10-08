import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function GET() {
  const { data: records } = await supabaseAdmin
    .from("dtr_records")
    .select("*, student:students(student_id, first_name, last_name)")
    .order("date", { ascending: false });

  const headers = [
    "Student ID", "Student Name", "Date", "Time In", "Time Out",
    "Break Minutes", "Total Hours", "Status", "Remarks",
  ];

  const rows = (records ?? []).map((r) => {
    const s = Array.isArray(r.student) ? r.student[0] : r.student;
    return [
      s?.student_id ?? "",
      `${s?.first_name ?? ""} ${s?.last_name ?? ""}`,
      r.date,
      r.time_in ?? "",
      r.time_out ?? "",
      String(r.break_minutes ?? 60),
      String(r.total_hours ?? 0),
      r.status,
      r.remarks ?? "",
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="dtr-records.csv"',
    },
  });
}
