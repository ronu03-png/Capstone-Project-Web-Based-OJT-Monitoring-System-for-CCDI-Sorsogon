"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db/supabase";
import type { Database } from "@/lib/db/database.types";
import { hashPassword } from "@/lib/auth/password";

export async function deployStudentAction(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const companyId = formData.get("companyId") as string;
  const supervisorName = formData.get("supervisorName") as string;
  const designation = formData.get("designation") as string;
  const startDate = formData.get("startDate") as string;
  const expectedEndDate = formData.get("expectedEndDate") as string;
  const scheduleTimeIn = formData.get("scheduleTimeIn") as string;
  const scheduleTimeOut = formData.get("scheduleTimeOut") as string;

  if (!studentId || !companyId) return { error: "Student and company are required." };

  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (!company) return { error: "Company not found." };

  const { error } = await supabaseAdmin
    .from("students")
    .update({
      company_id: companyId,
      company_name: company.name,
      company_address: company.address,
      supervisor_name: supervisorName || null,
      designation: designation || null,
      start_date: startDate || null,
      expected_end_date: expectedEndDate || null,
      schedule_time_in: scheduleTimeIn || null,
      schedule_time_out: scheduleTimeOut || null,
      status: "ONGOING",
    })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}

export async function assignStudentAction(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const companyId = formData.get("companyId") as string;
  const supervisorId = formData.get("supervisorId") as string;

  if (!studentId) return { error: "Student ID is required." };

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("company_id, supervisor_id, required_hours, start_date")
    .eq("id", studentId)
    .single();
  if (!student) return { error: "Student not found." };

  const updateData: Record<string, string | null> = {};

  if (companyId) {
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();
    if (!company) return { error: "Company not found." };
    updateData.company_id = companyId;
    updateData.company_name = company.name;
    updateData.company_address = company.address;
    updateData.status = "ONGOING";
  }

  if (supervisorId) {
    const { data: supervisor } = await supabaseAdmin
      .from("users")
      .select("first_name, last_name")
      .eq("id", supervisorId)
      .eq("role", "SUPERVISOR")
      .single();
    if (!supervisor) return { error: "Supervisor not found." };
    updateData.supervisor_id = supervisorId;
    updateData.supervisor_name = `${supervisor.first_name} ${supervisor.last_name}`;
    updateData.status = "ONGOING";
  }

  if (Object.keys(updateData).length === 0) return { error: "Select at least one assignment." };

  // When both company AND supervisor end up assigned, auto-fill deployment dates
  const finalCompanyId = updateData.company_id ?? student.company_id;
  const finalSupervisorId = updateData.supervisor_id ?? student.supervisor_id;
  if (finalCompanyId && finalSupervisorId && !student.start_date) {
    const start = new Date();
    const weeks = Math.ceil((student.required_hours ?? 500) / 40); // 8 hrs/day, 5 days/week
    const end = new Date(start);
    end.setDate(end.getDate() + weeks * 7);
    updateData.start_date = start.toISOString();
    updateData.expected_end_date = end.toISOString();
  }

  const { error } = await supabaseAdmin
    .from("students")
    .update(updateData as Database["public"]["Tables"]["students"]["Update"])
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}

export async function resetAccountAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const defaultPassword = (formData.get("defaultPassword") as string) || "Password123!";

  if (!userId) return { error: "User ID is required." };

  const passwordHash = await hashPassword(defaultPassword);

  const { error } = await supabaseAdmin
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  return { success: true };
}
