"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { updateUserAction } from "../../actions";

type UserData = {
  id: string;
  role: string;
  status: string;
  firstName: string;
  lastName: string;
  username: string;
  companyId: string;
  student: {
    id: string;
    studentId: string;
    course: string | null;
    yearLevel: number | null;
    section: string | null;
    requiredHours: number | null;
    companyId: string;
    supervisorId: string;
    status: string;
    startDate: string;
    expectedEndDate: string;
    designation: string;
    scheduleTimeIn: string | null;
    scheduleTimeOut: string | null;
    scheduleBreakStart: string | null;
    scheduleBreakEnd: string | null;
  } | null;
};

export function UserEditForm({
  user,
  companies,
  supervisors,
}: {
  user: UserData;
  companies: { id: string; name: string }[];
  supervisors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-compute expected end date: requiredHours / 40 hrs per week
  const [startDate, setStartDate] = useState(user.student?.startDate ?? "");
  const [requiredHours, setRequiredHours] = useState(String(user.student?.requiredHours ?? 500));
  const [endDate, setEndDate] = useState(user.student?.expectedEndDate ?? "");
  const [endDateEdited, setEndDateEdited] = useState(!!user.student?.expectedEndDate);

  function computeEnd(start: string, hours: string) {
    const h = Number(hours);
    if (!start || !Number.isFinite(h) || h <= 0) return "";
    const d = new Date(`${start}T00:00:00`);
    d.setDate(d.getDate() + Math.ceil(h / 40) * 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateUserAction(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/admin/users");
    }
  }

  const isStudent = user.role === "STUDENT" && user.student;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      <input type="hidden" name="userId" value={user.id} />
      <input type="hidden" name="role" value={user.role} />
      {user.student && <input type="hidden" name="studentRecordId" value={user.student.id} />}

      <div className="mb-2 rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-sm font-medium">{user.lastName}, {user.firstName}</p>
        <p className="text-xs text-muted-foreground">{user.role} &bull; {user.username}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {isStudent && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="companyId">Assigned Company</Label>
              <select
                id="companyId"
                name="companyId"
                defaultValue={user.student!.companyId}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">No company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supervisorId">Assigned Supervisor</Label>
              <select
                id="supervisorId"
                name="supervisorId"
                defaultValue={user.student!.supervisorId}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">No supervisor</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="course">Course</Label>
              <select
                id="course"
                name="course"
                defaultValue={user.student!.course ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Select course...</option>
                <option value="BSIT">BSIT</option>
                <option value="BSIS">BSIS</option>
                <option value="ACT">ACT</option>
                <option value="BSCS">BSCS</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="yearLevel">Year Level</Label>
              <Input id="yearLevel" name="yearLevel" type="number" min={1} max={6} defaultValue={user.student!.yearLevel ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section">Section</Label>
              <Input id="section" name="section" defaultValue={user.student!.section ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requiredHours">Required Hours</Label>
              <Input
                id="requiredHours"
                name="requiredHours"
                type="number"
                min={1}
                value={requiredHours}
                onChange={(e) => {
                  setRequiredHours(e.target.value);
                  if (!endDateEdited) setEndDate(computeEnd(startDate, e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="flex gap-1">
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="flex-1"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDateEdited) setEndDate(computeEnd(e.target.value, requiredHours));
                  }}
                />
                {startDate && (
                  <Button type="button" variant="ghost" size="sm" className="h-9 px-2" onClick={() => setStartDate("")}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expectedEndDate">Expected End Date</Label>
              <div className="flex gap-1">
                <Input
                  id="expectedEndDate"
                  name="expectedEndDate"
                  type="date"
                  className="flex-1"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setEndDateEdited(true);
                  }}
                />
                {endDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2"
                    onClick={() => { setEndDate(""); setEndDateEdited(false); }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Auto-computed from required hours ({Math.ceil((Number(requiredHours) || 0) / 40)} weeks). Editable.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduleTimeIn">Morning Shift — Start</Label>
              <Input id="scheduleTimeIn" name="scheduleTimeIn" type="time" defaultValue={user.student!.scheduleTimeIn ?? "08:00"} />
              <p className="text-[10px] text-muted-foreground">Time In opens 30 min before this.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduleBreakStart">Morning Shift — End</Label>
              <Input id="scheduleBreakStart" name="scheduleBreakStart" type="time" defaultValue={user.student!.scheduleBreakStart ?? "12:00"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduleBreakEnd">Afternoon Shift — Start</Label>
              <Input id="scheduleBreakEnd" name="scheduleBreakEnd" type="time" defaultValue={user.student!.scheduleBreakEnd ?? "13:00"} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduleTimeOut">Afternoon Shift — End</Label>
              <Input id="scheduleTimeOut" name="scheduleTimeOut" type="time" defaultValue={user.student!.scheduleTimeOut ?? "17:00"} />
              <p className="text-[10px] text-muted-foreground">The gap between shifts is the lunch break.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" name="designation" placeholder="e.g. IT Support Intern" defaultValue={user.student!.designation} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ojtStatus">OJT Status</Label>
              <select
                id="ojtStatus"
                name="ojtStatus"
                defaultValue={user.student!.status}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </>
        )}

        {user.role === "SUPERVISOR" && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="companyId">Company</Label>
            <select
              id="companyId"
              name="companyId"
              defaultValue={user.companyId}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="status">Account Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={user.status}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/users")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
