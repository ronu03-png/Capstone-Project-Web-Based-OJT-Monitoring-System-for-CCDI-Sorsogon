"use client";

import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { createStudentAccountAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getRequiredHoursByCourse(course: string): number {
  const normalized = course.trim().toUpperCase();
  const twoYearCourses = ["ACT", "ASCT", "ASSOCIATE", "2-YEAR", "2 YEAR"];
  const diplomaCourses = ["DIP", "DIPLOMA", "DIT"];
  if (twoYearCourses.some((c) => normalized.includes(c))) return 300;
  if (diplomaCourses.some((c) => normalized.includes(c))) return 400;
  return 500; // default 4-year
}

export function CreateStudentForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [course, setCourse] = useState("");
  const [requiredHours, setRequiredHours] = useState(500);

  function handleCourseChange(value: string) {
    setCourse(value);
    setRequiredHours(getRequiredHoursByCourse(value));
  }

  function handleSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const res = await createStudentAccountAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: "Student account created successfully. Default password: Password123!" });
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
          <Label htmlFor="studentId">Student ID *</Label>
          <Input id="studentId" name="studentId" placeholder="e.g. 2026-001" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" placeholder="student@ccdi.edu.ph" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" name="firstName" placeholder="Juan" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" name="lastName" placeholder="Dela Cruz" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="course">Course *</Label>
          <Input
            id="course"
            name="course"
            value={course}
            onChange={(e) => handleCourseChange(e.target.value)}
            placeholder="e.g. BSIT, BSIS, Diploma in IT"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="yearLevel">Year Level *</Label>
          <Input id="yearLevel" name="yearLevel" type="number" min={1} max={5} placeholder="4" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="section">Section <span className="text-muted-foreground">(Optional)</span></Label>
          <Input id="section" name="section" placeholder="A, B, C..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="requiredHours">Required OJT Hours *</Label>
          <Input
            id="requiredHours"
            name="requiredHours"
            type="number"
            value={requiredHours}
            onChange={(e) => setRequiredHours(Number(e.target.value))}
            min={0}
            required
          />
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            Auto-filled: 4yr=500, Diploma=400, 2yr=300
          </p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="password">Password (optional)</Label>
          <Input id="password" name="password" type="password" placeholder="Default: Password123!" />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Creating..." : "Create Student Account"}
      </Button>
    </form>
  );
}
