import "server-only";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function getNarrativeReport(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("narrative_reports")
    .select("*")
    .eq("student_id", studentId)
    .single();
  if (error && error.code !== "PGRST116") throw new Error(error.message); // PGRST116 = no rows
  return data;
}

export async function upsertNarrativeReport(studentId: string, content: string) {
  const existing = await getNarrativeReport(studentId);
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("narrative_reports")
      .update({ content, status: "DRAFT" })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }
  const { data, error } = await supabaseAdmin.from("narrative_reports").insert({
    student_id: studentId,
    content,
    status: "DRAFT",
  }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

// Generates a draft narrative from the student's tasks and weekly report activities
export async function generateNarrativeReport(studentId: string) {
  const [{ data: tasks }, { data: activities }] = await Promise.all([
    supabaseAdmin
      .from("tasks")
      .select("date, title, description, skills_learned")
      .eq("student_id", studentId)
      .order("date", { ascending: true }),
    supabaseAdmin
      .from("weekly_report_activities")
      .select("date, activity, skills_learned, weekly_reports!inner(student_id)")
      .eq("weekly_reports.student_id", studentId)
      .order("date", { ascending: true }),
  ]);

  const lines: string[] = [];
  for (const a of activities ?? []) {
    lines.push(`On ${a.date}, I ${a.activity}.${a.skills_learned ? ` Through this, I learned ${a.skills_learned}.` : ""}`);
  }
  for (const t of tasks ?? []) {
    lines.push(`${t.date ? `On ${t.date}, ` : ""}I worked on: ${t.title}.${t.description ? ` ${t.description}` : ""}${t.skills_learned ? ` Skills gained: ${t.skills_learned}.` : ""}`);
  }

  const content = lines.length
    ? `During my On-the-Job Training, I accomplished the following:\n\n${lines.join("\n")}`
    : "No OJT activities have been recorded yet. Add tasks or weekly accomplishment reports first.";

  return upsertNarrativeReport(studentId, content);
}

export async function regenerateNarrativeReport(studentId: string) {
  return generateNarrativeReport(studentId);
}

export async function submitNarrativeReport(studentId: string) {
  const existing = await getNarrativeReport(studentId);
  if (!existing) throw new Error("No narrative report to submit.");
  const { data, error } = await supabaseAdmin
    .from("narrative_reports")
    .update({ status: "SUBMITTED" })
    .eq("id", existing.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
