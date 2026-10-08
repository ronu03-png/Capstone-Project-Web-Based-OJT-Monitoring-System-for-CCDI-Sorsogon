import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function GET() {
  const { data: students } = await supabaseAdmin
    .from("students")
    .select("*")
    .order("last_name", { ascending: true });

  const headers = [
    "Student ID", "First Name", "Last Name", "Course", "Year Level", "Section",
    "Company", "Designation", "Required Hours", "Completed Hours", "Status",
    "Start Date", "Expected End Date",
  ];

  const rows = (students ?? []).map((s) => [
    s.student_id,
    s.first_name,
    s.last_name,
    s.course,
    String(s.year_level),
    s.section ?? "",
    s.company_name ?? "",
    s.designation ?? "",
    String(s.required_hours),
    String(s.completed_hours),
    s.status,
    s.start_date ?? "",
    s.expected_end_date ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="students.csv"',
    },
  });
}
