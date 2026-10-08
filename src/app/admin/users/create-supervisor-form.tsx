"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createSupervisorAccountAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSupervisorForm({ companies }: { companies: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await createSupervisorAccountAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: "Supervisor account created successfully. Default password: Password123!" });
      } else {
        setMessage({ type: "error", text: res.error ?? "Failed to create account." });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {message?.type === "success" && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" /> {message.text}
        </div>
      )}
      {message?.type === "error" && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" name="firstName" placeholder="Juan" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" name="lastName" placeholder="Dela Cruz" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" placeholder="supervisor@ccdi.edu.ph" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username *</Label>
          <Input id="username" name="username" placeholder="supervisor1" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyId">Company</Label>
          <select
            id="companyId"
            name="companyId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Select company...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactNumber">Contact Number</Label>
          <Input id="contactNumber" name="contactNumber" placeholder="09XX-XXX-XXXX" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="password">Password (optional)</Label>
          <Input id="password" name="password" type="password" placeholder="Default: Password123!" />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Creating..." : "Create Supervisor Account"}
      </Button>
    </form>
  );
}
