"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { approveWeeklyReportBatchAction } from "./actions";

type ReportRow = {
  id: string;
  week_number: number;
  week_period: string;
  total_hours: number | null;
  activities: { date: string; activity: string; hours_spent: number | null; remarks: string | null }[];
  studentName: string;
};

export function ReportReviewList({ reports }: { reports: ReportRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === reports.length ? new Set() : new Set(reports.map((r) => r.id))));
  }

  function submit(action: "approve" | "reject") {
    setError(null);
    const fd = new FormData();
    selected.forEach((id) => fd.append("reportIds", id));
    fd.set("action", action);
    if (action === "reject") fd.set("reason", reason);

    startTransition(async () => {
      const res = await approveWeeklyReportBatchAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        setSelected(new Set());
        setRejectOpen(false);
        setReason("");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={selected.size === reports.length && reports.length > 0} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300" />
          Select All ({selected.size} selected)
        </label>
        <div className="flex gap-2">
          <Button size="sm" disabled={selected.size === 0 || isPending} onClick={() => submit("approve")}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Approve Selected
          </Button>
          <Button size="sm" variant="destructive" disabled={selected.size === 0 || isPending} onClick={() => setRejectOpen(true)}>
            <XCircle className="mr-1 h-4 w-4" /> Reject Selected
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <Card key={report.id} className="p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(report.id)}
                onChange={() => toggle(report.id)}
                className="mt-1 h-4 w-4 rounded border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{report.studentName}</p>
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Pending</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Week {report.week_number} &bull; {report.week_period} &bull; {(report.total_hours ?? 0).toFixed(1)} hrs
                </p>
                <button type="button" onClick={() => toggleExpand(report.id)} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  {expanded.has(report.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {expanded.has(report.id) ? "Hide Report" : "Review Report"}
                </button>
                {expanded.has(report.id) && (
                  <div className="mt-3 space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Activities Accomplished</p>
                    {report.activities.map((a, i) => (
                      <div key={i} className="rounded-md border-b pb-2 last:border-0">
                        <p className="font-medium">{a.date} {a.hours_spent != null && `(${a.hours_spent} hrs)`}</p>
                        <p className="whitespace-pre-wrap">{a.activity}</p>
                        {a.remarks && <p className="text-xs text-muted-foreground">{a.remarks}</p>}
                      </div>
                    ))}
                    {report.activities.length === 0 && (
                      <p className="text-muted-foreground">No activities recorded.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Reject {selected.size} selected report{selected.size !== 1 ? "s" : ""}?</h3>
            <p className="mt-1 text-sm text-muted-foreground">A rejection reason is required.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Please include more detail on activities accomplished."
              className="mt-3 w-full rounded-md border border-input px-3 py-2 text-sm"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" disabled={!reason.trim() || isPending} onClick={() => submit("reject")}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
