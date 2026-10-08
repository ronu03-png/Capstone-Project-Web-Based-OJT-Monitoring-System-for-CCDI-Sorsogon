import { redirect, notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/db/supabase";
import EvaluationForm from "./evaluation-form";

export default async function AdminEvaluateStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user.role !== "ADMIN") redirect("/unauthorized");

  const { id } = await params;
  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id, first_name, last_name")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const studentName = `${student.first_name} ${student.last_name}`;

  return <EvaluationForm studentId={id} studentName={studentName} />;
}
