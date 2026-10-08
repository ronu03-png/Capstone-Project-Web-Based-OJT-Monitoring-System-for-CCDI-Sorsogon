"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateCompanyAction } from "../../actions";

const INDUSTRIES = [
  "Government / Public Sector",
  "Information Technology",
  "Construction",
  "Education",
  "Banking and Finance",
  "Telecommunications",
  "Business Services",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Media and Communications",
  "Security Services",
  "Other",
];

type Company = {
  id: string;
  name: string;
  address: string | null;
  location: string | null;
  industry: string | null;
  contact_number: string | null;
  email: string | null;
};

export function CompanyEditForm({ company }: { company: Company }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateCompanyAction(formData);
    setLoading(false);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      router.push("/admin/companies");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message?.type === "error" && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {message.text}
        </div>
      )}
      {message?.type === "success" && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" /> {message.text}
        </div>
      )}

      <input type="hidden" name="id" value={company.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input id="name" name="name" required defaultValue={company.name} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={company.address ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <select
            id="location"
            name="location"
            defaultValue={company.location ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Select location...</option>
            <option value="Sorsogon City">Sorsogon City</option>
            <option value="Outside Sorsogon">Outside Sorsogon</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="industry">Industry *</Label>
          <select
            id="industry"
            name="industry"
            required
            defaultValue={company.industry ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Select industry...</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input id="contactNumber" name="contactNumber" defaultValue={company.contact_number ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={company.email ?? ""} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/companies")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
