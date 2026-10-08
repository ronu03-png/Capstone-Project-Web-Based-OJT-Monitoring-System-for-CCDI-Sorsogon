import Link from "next/link";
import { Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";

import { getAdminDashboardStats } from "@/services/dashboard";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "./dashboard-charts";

const VARIANT_COLOR: Record<string, string> = {
  success: "var(--color-status-success)",
  warning: "var(--color-status-warning)",
  danger: "var(--color-status-danger)",
  info: "var(--color-status-info)",
  neutral: "var(--color-status-neutral)",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const statusData = [
    { name: "Not Started", key: "NOT_STARTED", value: stats.notStartedCount, color: VARIANT_COLOR["neutral"] },
    { name: "Ongoing", key: "ONGOING", value: stats.ongoingCount, color: VARIANT_COLOR["info"] },
    { name: "Completed", key: "COMPLETED", value: stats.completedCount, color: VARIANT_COLOR["success"] },
    { name: "Failed", key: "FAILED", value: stats.failedCount, color: VARIANT_COLOR["danger"] },
  ];

  function hueFromString(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const phi = 0.618033988749895;
    const h = Math.abs(hash) * phi;
    return Math.round((h - Math.floor(h)) * 360);
  }

  const courseData = stats.courseStats.map((c) => ({
    name: c.course,
    value: c.count,
    color: `hsl(${hueFromString(c.course)}, 70%, 50%)`,
  }));

  const companyData = stats.companyStats.map((c) => ({
    label: c.name,
    value: c.count,
    color: `hsl(${hueFromString(c.name)}, 65%, 55%)`,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin Dashboard"
        description="System-wide overview of students and OJT progress."
        actions={
          <Button asChild>
            <Link href="/admin/students">Manage Students</Link>
          </Button>
        }
      />

      {/* Essential Stats — 4 clean cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/admin/students" className="transition hover:opacity-80">
          <StatCard label="Students" value={stats.totalStudents} icon={Users} />
        </Link>
        <Link href="/admin/reports/ongoing" className="transition hover:opacity-80">
          <StatCard label="Ongoing" value={stats.ongoingCount} icon={TrendingUp} tone="info" />
        </Link>
        <Link href="/admin/reports/completed" className="transition hover:opacity-80">
          <StatCard label="Completed" value={stats.completedCount} icon={CheckCircle2} tone="success" />
        </Link>
        <Link href="/admin/reports" className="transition hover:opacity-80">
          <StatCard label="Total Hours" value={`${stats.totalCompletedHours.toFixed(0)}h`} icon={Clock} tone="warning" />
        </Link>
      </div>

      {/* Charts */}
      <DashboardCharts statusData={statusData} courseData={courseData} companyData={companyData} />
    </div>
  );
}
