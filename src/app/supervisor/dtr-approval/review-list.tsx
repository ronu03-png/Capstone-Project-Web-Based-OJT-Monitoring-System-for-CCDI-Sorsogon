"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, AlertCircle, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { approveDtrBatchAction } from "./actions";

type DtrRow = {
  id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  pm_time_in: string | null;
  pm_time_out: string | null;
  total_hours: number | null;
  remarks: string | null;
  attachment_url: string | null;
  approvalStatus: string;
  isComplete: boolean;
  studentName: string;
};

export function DtrReviewList({ dtrs }: { dtrs: DtrRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [viewProof, setViewProof] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const selectable = dtrs.filter((d) => d.isComplete);
    setSelected((prev) => (prev.size === selectable.length ? new Set() : new Set(selectable.map((d) => d.id))));
  }

  function submit(action: "approve" | "reject") {
    setError(null);
    const fd = new FormData();
    selected.forEach((id) => fd.append("dtrIds", id));
    fd.set("action", action);
    if (action === "reject") fd.set("reason", reason);

    startTransition(async () => {
      const res = await approveDtrBatchAction(fd);
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
          <input type="checkbox" checked={selected.size === dtrs.filter((d) => d.isComplete).length && selected.size > 0} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300" />
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
        {dtrs.map((dtr) => (
          <Card key={dtr.id} className="p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(dtr.id)}
                onChange={() => toggle(dtr.id)}
                disabled={!dtr.isComplete}
                title={dtr.isComplete ? undefined : "Student has not timed out yet"}
                className="mt-1 h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{dtr.studentName}</p>
                  {dtr.isComplete ? (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                      {dtr.approvalStatus === "RESUBMITTED" ? "Resubmitted" : "Pending"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Awaiting Time Out
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {dtr.date} &bull; AM {dtr.time_in ? new Date(dtr.time_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} - {dtr.time_out ? new Date(dtr.time_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  {(dtr.pm_time_in || dtr.pm_time_out) && (
                    <> &bull; PM {dtr.pm_time_in ? new Date(dtr.pm_time_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} - {dtr.pm_time_out ? new Date(dtr.pm_time_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</>
                  )}
                  {" "}&bull; {(dtr.total_hours ?? 0).toFixed(2)} hrs
                </p>
                {dtr.remarks && <p className="mt-1 text-xs text-muted-foreground">{dtr.remarks}</p>}
                {dtr.attachment_url && (
                  <button type="button" onClick={() => setViewProof(dtr.attachment_url)} className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Eye className="h-3 w-3" /> View Proof
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reject reason dialog */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Reject {selected.size} selected submission{selected.size !== 1 ? "s" : ""}?</h3>
            <p className="mt-1 text-sm text-muted-foreground">A rejection reason is required.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Proof of entry is unclear. Please upload a clearer image."
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

      {/* Proof viewer */}
      {viewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewProof(null)}>
          <div className="max-h-[90vh] max-w-3xl overflow-auto rounded-xl bg-white p-2">
            <img src={viewProof} alt="Proof of entry" className="max-h-[85vh] rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
