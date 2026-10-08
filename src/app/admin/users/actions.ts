"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db/supabase";
import type { Database, OjtStatus, UserStatus } from "@/lib/db/database.types";
import { hashPassword } from "@/lib/auth/password";

export async function createStudentAccountAction(formData: FormData) {
  const studentId = formData.get("studentId") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const course = formData.get("course") as string;
  const yearLevel = Number(formData.get("yearLevel"));
  const section = formData.get("section") as string;
  const requiredHours = Number(formData.get("requiredHours"));
  const password = (formData.get("password") as string) || "Password123!";

  if (!studentId || !firstName || !lastName || !email || !course || !yearLevel) {
    return { error: "All required fields must be filled." };
  }

  // Check for existing user
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .or(`email.eq.${email},username.eq.${studentId}`)
    .single();

  if (existing) return { error: "A user with this email or username already exists." };

  const passwordHash = await hashPassword(password);
  const userId = crypto.randomUUID();

  const { error: userError } = await supabaseAdmin
    .from("users")
    .insert({
      id: userId,
      email,
      username: studentId,
      password_hash: passwordHash,
      role: "STUDENT",
      status: "ACTIVE",
      first_name: firstName,
      last_name: lastName,
    });

  if (userError) return { error: userError.message };

  const { error: studentError } = await supabaseAdmin
    .from("students")
    .insert({
      user_id: userId,
      student_id: studentId,
      first_name: firstName,
      last_name: lastName,
      course,
      year_level: yearLevel,
      section: section || null,
      required_hours: Number.isFinite(requiredHours) && requiredHours > 0 ? requiredHours : 500,
      completed_hours: 0,
      status: "NOT_STARTED",
    });

  if (studentError) return { error: studentError.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function createSupervisorAccountAction(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const companyId = formData.get("companyId") as string;
  const contactNumber = formData.get("contactNumber") as string;
  const password = (formData.get("password") as string) || "Password123!";

  if (!firstName || !lastName || !email || !username) {
    return { error: "All required fields must be filled." };
  }

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .or(`email.eq.${email},username.eq.${username}`)
    .single();

  if (existing) return { error: "A user with this email or username already exists." };

  let companyName: string | null = null;
  if (companyId) {
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single();
    if (!company) return { error: "Company not found." };
    companyName = company.name;
  }

  const passwordHash = await hashPassword(password);

  const { error } = await supabaseAdmin
    .from("users")
    .insert({
      email,
      username,
      password_hash: passwordHash,
      role: "SUPERVISOR",
      status: "ACTIVE",
      first_name: firstName,
      last_name: lastName,
      phone: contactNumber || null,
      company_id: companyId || null,
      company_name: companyName,
    });

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  const status = formData.get("status") as string;
  const companyId = formData.get("companyId") as string;

  if (!userId) return { error: "User ID is required." };

  let company: { id: string; name: string; address: string | null } | null = null;
  if (companyId) {
    const { data } = await supabaseAdmin
      .from("companies")
      .select("id, name, address")
      .eq("id", companyId)
      .single();
    if (!data) return { error: "Company not found." };
    company = data;
  }

  if (role === "STUDENT") {
    const studentRecordId = formData.get("studentRecordId") as string;
    const supervisorId = formData.get("supervisorId") as string;
    const course = formData.get("course") as string;
    const yearLevel = Number(formData.get("yearLevel"));
    const section = formData.get("section") as string;
    const requiredHours = Number(formData.get("requiredHours"));
    const ojtStatus = formData.get("ojtStatus") as string;
    const startDate = formData.get("startDate") as string;
    const expectedEndDate = formData.get("expectedEndDate") as string;
    const designation = formData.get("designation") as string;
    const scheduleTimeIn = formData.get("scheduleTimeIn") as string;
    const scheduleTimeOut = formData.get("scheduleTimeOut") as string;
    const scheduleBreakStart = formData.get("scheduleBreakStart") as string;
    const scheduleBreakEnd = formData.get("scheduleBreakEnd") as string;

    let supervisorName: string | null = null;
    if (supervisorId) {
      const { data: sup } = await supabaseAdmin
        .from("users")
        .select("first_name, last_name")
        .eq("id", supervisorId)
        .eq("role", "SUPERVISOR")
        .single();
      if (!sup) return { error: "Supervisor not found." };
      supervisorName = `${sup.first_name} ${sup.last_name}`;
    }

    const studentUpdate: Database["public"]["Tables"]["students"]["Update"] = {
      company_id: company?.id ?? null,
      company_name: company?.name ?? null,
      company_address: company?.address ?? null,
      supervisor_id: supervisorId || null,
      supervisor_name: supervisorName,
      section: section || null,
      required_hours: Number.isFinite(requiredHours) && requiredHours > 0 ? requiredHours : 500,
      status: (ojtStatus || "NOT_STARTED") as OjtStatus,
      start_date: startDate || null,
      expected_end_date: expectedEndDate || null,
      designation: designation || null,
      schedule_time_in: scheduleTimeIn || null,
      schedule_time_out: scheduleTimeOut || null,
      schedule_break_start: scheduleBreakStart || null,
      schedule_break_end: scheduleBreakEnd || null,
      updated_at: new Date().toISOString(),
    };
    // course and year_level are NOT NULL — only update when provided
    if (course) studentUpdate.course = course;
    if (Number.isFinite(yearLevel) && yearLevel > 0) studentUpdate.year_level = yearLevel;

    const { error: sErr } = await supabaseAdmin
      .from("students")
      .update(studentUpdate)
      .eq("id", studentRecordId);

    if (sErr) return { error: sErr.message };
  } else {
    // Supervisor: update company on the users record
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        company_id: company?.id ?? null,
        company_name: company?.name ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) return { error: error.message };
  }

  // Account status applies to both
  if (status) {
    await supabaseAdmin.from("users").update({ status: status as UserStatus }).eq("id", userId);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/students");
  return { success: true };
}

export async function resetUserPasswordAction(formData: FormData) {
  const userId = formData.get("userId") as string;
  const defaultPassword = (formData.get("defaultPassword") as string) || "Password123!";

  if (!userId) return { error: "User ID is required." };

  const passwordHash = await hashPassword(defaultPassword);

  const { error } = await supabaseAdmin
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}
