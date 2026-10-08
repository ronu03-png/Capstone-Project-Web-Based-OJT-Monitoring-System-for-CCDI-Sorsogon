"use client";

import { useRouter } from "next/navigation";
import { StatusPieChart } from "@/components/charts/status-pie-chart";
import { StatusBarChart } from "@/components/charts/status-bar-chart";
import { ChartCard } from "@/components/shared/chart-card";

interface StatusDatum {
  name: string;
  key: string;
  value: number;
  color: string;
}

interface CourseDatum {
  name: string;
  value: number;
  color: string;
}

interface CompanyDatum {
  label: string;
  value: number;
  color: string;
}

export function DashboardCharts({
  statusData,
  courseData,
  companyData,
}: {
  statusData: StatusDatum[];
  courseData: CourseDatum[];
  companyData: CompanyDatum[];
}) {
  const router = useRouter();

  function handleStatusClick(data: { name: string }) {
    const item = statusData.find((d) => d.name === data.name);
    if (item?.key) {
      router.push(`/admin/dashboard/status/${encodeURIComponent(item.key)}`);
    }
  }

  function handleCourseClick(data: { name: string }) {
    router.push(`/admin/dashboard/course/${encodeURIComponent(data.name)}`);
  }

  function handleCompanyClick(data: { label: string }) {
    router.push(`/admin/dashboard/company/${encodeURIComponent(data.label)}`);
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Students by Status" description="Current OJT status distribution">
          <StatusPieChart data={statusData} onClick={handleStatusClick} />
        </ChartCard>
        <ChartCard title="Students by Course" description="Distribution across courses">
          <StatusPieChart data={courseData} onClick={handleCourseClick} />
        </ChartCard>
      </div>

      <ChartCard title="Students by Company" description="Number of students deployed per company">
        {companyData.length > 0 ? (
          <StatusBarChart data={companyData} height={280} onClick={handleCompanyClick} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No companies have been added yet.</p>
        )}
      </ChartCard>
    </>
  );
}
