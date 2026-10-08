"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

import { assignStudentAction } from "./actions";

export function AssignStudentForm({
  studentId,
  currentCompanyId,
  currentSupervisorId,
  companies,
  supervisors,
}: {
  studentId: string;
  currentCompanyId: string | null;
  currentSupervisorId: string | null;
  companies: { id: string; name: string }[];
  supervisors: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fully assigned — no button at all (edit via User Management instead)
  if (currentCompanyId && currentSupervisorId) return null;

  const needsCompany = !currentCompanyId;
  const needsSupervisor = !currentSupervisorId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("studentId", studentId);
    // Only send the fields that are still unassigned
    if (needsCompany) formData.set("companyId", companyId);
    else if (currentCompanyId) formData.set("companyId", currentCompanyId);
    if (needsSupervisor) formData.set("supervisorId", supervisorId);
    else if (currentSupervisorId) formData.set("supervisorId", currentSupervisorId);

    const result = await assignStudentAction(formData);
    setLoading(false);
    if (result?.error) {
      setMessage(result.error);
    } else {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="h-7 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 text-xs text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow"
        >
          <UserPlus className="mr-1 h-3.5 w-3.5" /> Assign
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm font-medium">
            {needsCompany && needsSupervisor ? "Assign Company & Supervisor"
              : needsCompany ? "Assign Company"
              : "Assign Supervisor"}
          </p>
          {needsCompany && (
            <div>
              <label className="text-xs text-muted-foreground">Company</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="">Select company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {needsSupervisor && (
            <div>
              <label className="text-xs text-muted-foreground">Supervisor</label>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
              >
                <option value="">Select supervisor...</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          {message && <p className="text-xs text-red-600">{message}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading} className="flex-1">
              {loading ? "Assigning..." : "Assign"}
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
