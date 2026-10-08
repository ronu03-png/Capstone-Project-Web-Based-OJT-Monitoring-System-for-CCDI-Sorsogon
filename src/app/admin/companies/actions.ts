"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db/supabase";

export async function createCompanyAction(formData: FormData) {
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const industry = formData.get("industry") as string;
  const contactNumber = formData.get("contactNumber") as string;
  const email = formData.get("email") as string;

  if (!name || !industry) {
    return { error: "Company name and industry are required." };
  }

  const { error } = await supabaseAdmin
    .from("companies")
    .insert({
      name,
      address: address || null,
      industry: industry || null,
      contact_number: contactNumber || null,
      email: email || null,
      is_it_company: industry === "Information Technology",
    });

  if (error) return { error: error.message };

  revalidatePath("/admin/companies");
  return { success: true };
}

export async function updateCompanyAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const location = formData.get("location") as string;
  const industry = formData.get("industry") as string;
  const contactNumber = formData.get("contactNumber") as string;
  const email = formData.get("email") as string;

  if (!id || !name || !industry) {
    return { error: "Company name and industry are required." };
  }

  const { error } = await supabaseAdmin
    .from("companies")
    .update({
      name,
      address: address || null,
      location: location || null,
      industry: industry || null,
      contact_number: contactNumber || null,
      email: email || null,
      is_it_company: industry === "Information Technology",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${id}`);
  return { success: true };
}
