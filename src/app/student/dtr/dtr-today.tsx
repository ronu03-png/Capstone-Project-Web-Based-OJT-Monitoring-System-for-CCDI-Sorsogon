"use client";

import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, ImageUp, AlertCircle, CheckCircle2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  cancelDtrAction,
  pmTimeInAction,
  timeInAction,
  timeOutAction,
  uploadProofAction,
} from "./actions";

type TodayDtr = {
  id: string;
  time_in: string | null;
  time_out: string | null;
  pm_time_in: string | null;
  pm_time_out: string | null;
  total_hours: number | null;
  approval_status: string;
  attachment_url: string | null;
  rejection_reason: string | null;
} | null;

async function resizeImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1024;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

function fmtTime(t: string | null) {
  return t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
}

export function DtrToday({
  dtr,
  canTimeIn,
  availableAt,
  morningShift,
  afternoonShift,
  canPmTimeIn,
  pmAvailableAt,
}: {
  dtr: TodayDtr;
  canTimeIn: boolean;
  availableAt: string | null;
  morningShift: string;
  afternoonShift: string | null;
  canPmTimeIn: boolean;
  pmAvailableAt: string | null;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isRejected = dtr?.approval_status === "REJECTED";
  const isCancellable =
    dtr?.approval_status === "PENDING" || dtr?.approval_status === "RESUBMITTED";
  const hasAfternoon = !!afternoonShift;

  // Session stages — a rejected record resets the card to a fresh morning state
  const amIn = !isRejected && !!dtr?.time_in;
  const amOut = amIn && !!dtr?.time_out;
  const pmIn = amOut && !!dtr?.pm_time_in;
  const pmOut = pmIn && !!dtr?.pm_time_out;
  const dayComplete = hasAfternoon ? pmOut : amOut;

  const inAfternoonSession = hasAfternoon && amOut && !pmOut;
  const shiftLabel = dayComplete ? "Scheduled Shift" : inAfternoonSession ? "Afternoon Shift" : "Morning Shift";
  const shiftRange = dayComplete
    ? hasAfternoon
      ? `${morningShift} • ${afternoonShift}`
      : morningShift
    : inAfternoonSession
      ? afternoonShift
      : morningShift;

  async function run(fn: () => Promise<{ error?: string; success?: boolean } | undefined>) {
    setLoading(true);
    setError(null);
    const res = await fn();
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !dtr) return;
    setError(null);
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      setError("Only JPG / JPEG / PNG images are allowed.");
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await resizeImage(file);
      setPreview(dataUrl);
      const res = await uploadProofAction(dtr.id, dataUrl);
      if (res?.error) setError(res.error);
    } catch {
      setError("Failed to upload image.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleCancel() {
    if (!dtr) return;
    if (!window.confirm("Cancel this DTR submission? It will be removed and you can submit a new Time In.")) return;
    run(() => cancelDtrAction());
  }

  const proofUrl = preview ?? dtr?.attachment_url ?? null;
  const statusLabel: Record<string, string> = {
    PENDING: "Pending Supervisor Approval",
    RESUBMITTED: "Resubmitted — Pending Supervisor Approval",
    SUPERVISOR_APPROVED: "Approved",
    ADMIN_APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  const proofBlock = (
    <div>
      <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Proof of Entry (JPG / PNG)</p>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => fileRef.current?.click()}>
          <ImageUp className="mr-1 h-4 w-4" /> Upload Image
        </Button>
        {proofUrl && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-4 w-4" /> Uploaded
          </span>
        )}
      </div>
      {proofUrl && (
        <img src={proofUrl} alt="Proof of entry" className="mt-2 max-h-48 rounded-lg border" />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">{shiftLabel}</p>
          <p className="font-medium">{shiftRange ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Time</p>
          <p className="font-medium tabular-nums">
            {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
          </p>
        </div>
      </div>

      {dtr && (
        <div className="rounded-lg border bg-muted/30 p-3 text-sm">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <span>
              Morning: <strong>{fmtTime(dtr.time_in)} – {fmtTime(dtr.time_out)}</strong>
            </span>
            {(dtr.pm_time_in || dtr.pm_time_out || (hasAfternoon && dtr.time_out)) && (
              <span>
                Afternoon: <strong>{fmtTime(dtr.pm_time_in)} – {fmtTime(dtr.pm_time_out)}</strong>
              </span>
            )}
            {dtr.total_hours != null && dtr.total_hours > 0 && (
              <span>Rendered: <strong>{dtr.total_hours.toFixed(2)} hrs</strong></span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Status: {statusLabel[dtr.approval_status] ?? dtr.approval_status}
          </p>
          {isRejected && dtr.rejection_reason && (
            <p className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              <strong>Reason:</strong> {dtr.rejection_reason}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}

      {/* Morning Time In (or fresh card after rejection) */}
      {!amIn && (
        <div className="space-y-1">
          <Button onClick={() => run(timeInAction)} disabled={loading || !canTimeIn} className="w-full sm:w-auto">
            <LogIn className="mr-1 h-4 w-4" />
            {loading ? "Recording..." : isRejected ? "Resubmit Time In" : "TIME IN"}
          </Button>
          {!canTimeIn && availableAt && (
            <p className="text-xs text-muted-foreground">Time In available at {availableAt}</p>
          )}
        </div>
      )}

      {/* Morning session active — proof + lunch Time Out */}
      {amIn && !amOut && (
        <div className="space-y-3">
          {proofBlock}
          <Button
            onClick={() => dtr && run(() => timeOutAction(dtr.id))}
            disabled={loading}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-1 h-4 w-4" />
            {loading ? "Recording..." : hasAfternoon ? "TIME OUT (LUNCH)" : "TIME OUT"}
          </Button>
        </div>
      )}

      {/* Lunch break — afternoon Time In unlocks 30 min before the shift */}
      {amOut && hasAfternoon && !pmIn && (
        <div className="space-y-1">
          <Button
            onClick={() => dtr && run(() => pmTimeInAction(dtr.id))}
            disabled={loading || !canPmTimeIn}
            className="w-full sm:w-auto"
          >
            <LogIn className="mr-1 h-4 w-4" />
            {loading ? "Recording..." : "TIME IN (AFTERNOON)"}
          </Button>
          {!canPmTimeIn && pmAvailableAt && (
            <p className="text-xs text-muted-foreground">Afternoon Time In available at {pmAvailableAt}</p>
          )}
        </div>
      )}

      {/* Afternoon session active — proof + final Time Out */}
      {pmIn && !pmOut && (
        <div className="space-y-3">
          {proofBlock}
          <Button
            onClick={() => dtr && run(() => timeOutAction(dtr.id))}
            disabled={loading}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-1 h-4 w-4" />
            {loading ? "Recording..." : "TIME OUT"}
          </Button>
        </div>
      )}

      {dayComplete && (
        <p className="text-sm text-muted-foreground">
          Attendance complete for today. Your supervisor will review this submission.
        </p>
      )}

      {dtr && isCancellable && (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={loading}
            className="text-muted-foreground"
          >
            <Undo2 className="mr-1 h-4 w-4" />
            Cancel Request
          </Button>
        </div>
      )}
    </div>
  );
}
