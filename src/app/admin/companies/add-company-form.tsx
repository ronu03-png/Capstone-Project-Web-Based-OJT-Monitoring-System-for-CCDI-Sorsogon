"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { createCompanyAction } from "./actions";

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

export function AddCompanyForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setMessage(null);

    const formData = new FormData(form);
    const result = await createCompanyAction(formData);
    setLoading(false);
    if (result?.error) {
      setMessage(result.error);
    } else {
      setOpen(false);
      form.reset();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Add Company
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm font-medium">Add Company</p>
          <div>
            <label className="text-xs text-muted-foreground">Company Name *</label>
            <Input name="name" required className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Address</label>
            <Input name="address" className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Industry *</label>
            <select
              name="industry"
              required
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Contact Number</label>
            <Input name="contactNumber" className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <Input name="email" type="email" className="mt-1" />
          </div>
          {message && <p className={`text-xs ${message.includes("error") ? "text-red-600" : "text-green-600"}`}>{message}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Company"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
