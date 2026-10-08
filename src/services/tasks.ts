import "server-only";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function getTasks(studentId: string) {
  const { data, error } = await supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createTask(studentId: string, data: {
  title: string;
  description?: string;
  date?: string;
  skillsLearned?: string;
  remarks?: string;
}) {
  const { data: task, error } = await supabaseAdmin.from("tasks").insert({
    student_id: studentId,
    title: data.title,
    description: data.description ?? null,
    date: data.date ?? null,
    status: "UNDONE",
    skills_learned: data.skillsLearned ?? null,
    remarks: data.remarks ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  return task;
}
