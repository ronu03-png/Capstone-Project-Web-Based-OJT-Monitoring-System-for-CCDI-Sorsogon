"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { RotateCcw, CheckCircle2, AlertCircle, Search, Pencil } from "lucide-react";
import { resetUserPasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  username: string | null;
  role: string;
  firstName: string;
  lastName: string;
  student: { studentId: string; course: string } | null;
}

const ROLE_TABS = [
  { value: "STUDENT", label: "Students" },
  { value: "SUPERVISOR", label: "Supervisors" },
];

export function UserResetList({ users }: { users: User[] }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [isPending, startTransition] = useTransition();
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const q = search.toLowerCase();
  const filtered = users.filter(
    (u) =>
      u.role === role &&
      ((u.firstName ?? "").toLowerCase().includes(q) ||
        (u.lastName ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q) ||
        (u.student?.studentId ?? "").toLowerCase().includes(q))
  );

  function handleReset(userId: string) {
    setResettingId(userId);
    setMessage(null);
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("defaultPassword", "Password123!");
    startTransition(async () => {
      const res = await resetUserPasswordAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: "Password reset successfully to Password123!" });
      } else {
        setMessage({ type: "error", text: res.error ?? "Failed to reset password." });
      }
      setResettingId(null);
    });
  }

  return (
    <div className="space-y-4">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, username, or student ID..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {ROLE_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setRole(t.value)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition",
                role === t.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {user.lastName}, {user.firstName}
                </p>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  user.role === "SUPERVISOR" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                )}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {user.email} &bull; {user.username ?? "—"}
              </p>
              {user.student && (
                <p className="text-xs text-muted-foreground">
                  {user.student.studentId} &bull; {user.student.course}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/users/${user.id}/edit`}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending && resettingId === user.id}
                onClick={() => handleReset(user.id)}
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                {resettingId === user.id ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">No {role === "STUDENT" ? "students" : "supervisors"} found.</p>
        )}
      </div>
    </div>
  );
}
