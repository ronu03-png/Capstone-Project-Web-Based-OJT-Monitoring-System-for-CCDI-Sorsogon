"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";

import { createWeeklyReport, resubmitWeeklyReport } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";

interface ActivityRow {
  id: string;
  date: string;
  hoursSpent: string;
  activity: string;
  remarks: string;
}

interface WeeklyReportFormProps {
  studentId: string;
  report?: {
    id: string;
    weekNumber: number;
    weekStartDate: Date;
    weekEndDate: Date;
    rejectionReason: string | null;
    activities: { date: Date; activity: string; hoursSpent: number | null; remarks: string | null }[];
  };
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function WeeklyReportForm({
  studentId,
  report,
}: WeeklyReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [weekNumber, setWeekNumber] = useState(report ? String(report.weekNumber) : "");
  const [weekStartDate, setWeekStartDate] = useState(report ? toInputDate(report.weekStartDate) : "");
  const [weekEndDate, setWeekEndDate] = useState(report ? toInputDate(report.weekEndDate) : "");
  const [activities, setActivities] = useState<ActivityRow[]>(
    report?.activities?.length
      ? report.activities.map((a) => ({
          id: crypto.randomUUID(),
          date: toInputDate(new Date(a.date)),
          hoursSpent: a.hoursSpent != null ? String(a.hoursSpent) : "",
          activity: a.activity,
          remarks: a.remarks ?? "",
        }))
      : [{ id: crypto.randomUUID(), date: "", hoursSpent: "", activity: "", remarks: "" }]
  );

  const totalHours = activities.reduce(
    (sum, a) => sum + (Number(a.hoursSpent) || 0),
    0
  );

  function addRow() {
    if (activities.length >= 5) {
      setError("Maximum 5 activities allowed (matches the official form).");
      return;
    }
    setError("");
    setActivities((prev) => [
      ...prev,
      { id: crypto.randomUUID(), date: "", hoursSpent: "", activity: "", remarks: "" },
    ]);
  }

  function removeRow(id: string) {
    setActivities((prev) => prev.filter((r) => r.id !== id));
    setError("");
  }

  function updateRow(id: string, field: keyof ActivityRow, value: string) {
    setActivities((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    setError("");
  }

  function validate(): boolean {
    if (!weekNumber || !weekStartDate || !weekEndDate) {
      setError("Please fill in the week number and date range.");
      return false;
    }
    if (new Date(weekStartDate) > new Date(weekEndDate)) {
      setError("Start date cannot be after end date.");
      return false;
    }
    const filledActivities = activities.filter((a) => a.date && a.activity);
    if (filledActivities.length === 0) {
      setError("Please add at least one activity.");
      return false;
    }
    for (const act of filledActivities) {
      if (!act.hoursSpent || Number(act.hoursSpent) <= 0) {
        setError("Each activity must have hours greater than 0.");
        return false;
      }
    }
    setError("");
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const activitiesPayload = activities
      .filter((a) => a.date && a.activity)
      .map((a) => ({
        date: a.date,
        activity: a.activity,
        hoursSpent: Number(a.hoursSpent) || 0,
        remarks: a.remarks,
      }));

    startTransition(async () => {
      const res = report
        ? await resubmitWeeklyReport(report.id, {
            weekNumber: Number(weekNumber),
            weekStartDate,
            weekEndDate,
            activities: activitiesPayload,
          })
        : await createWeeklyReport({
            studentId,
            weekNumber: Number(weekNumber),
            weekStartDate,
            weekEndDate,
            activities: activitiesPayload,
          });
      if (res.success) {
        router.push("/student/weekly-reports");
      } else {
        setError(res.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={report ? "Revise & Resubmit Report" : "Create Weekly Report"}
        description={report ? "Correct your report and resubmit for supervisor review." : "Fill in your weekly accomplishment details."}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/student/weekly-reports">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
        }
      />

      {report?.rejectionReason && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-600">
          <p className="font-medium">This report was rejected.</p>
          <p className="mt-1">Reason: {report.rejectionReason}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reporting Period */}
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Reporting Period
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="weekNumber">Week Number *</Label>
              <Input
                id="weekNumber"
                type="number"
                min={1}
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                placeholder="e.g. 1"
                required
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={weekEndDate}
                onChange={(e) => setWeekEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {/* Weekly Activities */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Weekly Activities</h3>
              <p className="text-xs text-muted-foreground">
                Max 5 rows (matches official form). Total Hours: <strong>{totalHours.toFixed(1)} hrs</strong>
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={activities.length >= 5}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Row ({activities.length}/5)
            </Button>
          </div>

          <div className="space-y-3">
            {activities.map((row, index) => (
              <div
                key={row.id}
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_100px_1fr_1fr_auto]"
              >
                <div>
                  <Label className="text-xs">Date *</Label>
                  <Input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(row.id, "date", e.target.value)}
                    required={index === 0}
                  />
                </div>
                <div>
                  <Label className="text-xs">Hours *</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0}
                    max={24}
                    value={row.hoursSpent}
                    onChange={(e) => updateRow(row.id, "hoursSpent", e.target.value)}
                    required={index === 0}
                  />
                </div>
                <div>
                  <Label className="text-xs">Activity / Task *</Label>
                  <Input
                    value={row.activity}
                    onChange={(e) => updateRow(row.id, "activity", e.target.value)}
                    placeholder="Describe what you did..."
                    required={index === 0}
                  />
                </div>
                <div>
                  <Label className="text-xs">Remarks / Details</Label>
                  <Input
                    value={row.remarks}
                    onChange={(e) => updateRow(row.id, "remarks", e.target.value)}
                    placeholder="Optional..."
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    disabled={activities.length === 1}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isPending} size="lg">
            {isPending ? "Saving..." : report ? "Resubmit Report" : "Save & Generate Report"}
          </Button>
        </div>
      </form>
    </div>
  );
}
