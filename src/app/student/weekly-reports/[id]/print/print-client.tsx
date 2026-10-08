"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfDownloadButton from "@/components/shared/pdf-download-button";

export default function PrintActions({ reportId }: { reportId: string }) {
  return (
    <div className="mb-4 flex items-center justify-between print:hidden">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/student/weekly-reports/${reportId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Weekly Accomplishment Report</h1>
      </div>
      <div className="flex gap-2">
        <PdfDownloadButton
          targetId="weekly-report-document"
          filename={`OJT_Weekly_Report_${reportId}.pdf`}
          label="Download PDF"
        />
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> Print
        </Button>
      </div>
    </div>
  );
}
