import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  CalendarClock,
  BarChart3,
  Megaphone,
  Settings,
  Users,
  FileText,
  Clock,
  Building2,
  UserPlus,
} from "lucide-react";
import type { UserRole } from "@/lib/db/database.types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  STUDENT: [
    { label: "My OJT", href: "/student/ojt", icon: GraduationCap },
    { label: "Daily Time Record", href: "/student/dtr", icon: Clock },
    { label: "Weekly Accomplishment", href: "/student/weekly-reports", icon: FileText },
    { label: "Announcements", href: "/student/announcements", icon: Megaphone },
    { label: "Settings", href: "/student/settings", icon: Settings },
  ],
  SUPERVISOR: [
    { label: "Dashboard", href: "/supervisor/dashboard", icon: LayoutDashboard },
    { label: "My Students", href: "/supervisor/students", icon: Users },
    { label: "DTR Approval", href: "/supervisor/dtr-approval", icon: Clock },
    { label: "Weekly Reports", href: "/supervisor/weekly-reports", icon: ClipboardList },
    { label: "Settings", href: "/supervisor/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Companies", href: "/admin/companies", icon: Building2 },
    { label: "OJT Records", href: "/admin/ojt-records", icon: GraduationCap },
    { label: "DTR Monitoring", href: "/admin/dtr-monitoring", icon: CalendarClock },
    { label: "Accomplishment Reports", href: "/admin/accomplishment-reports", icon: ClipboardList },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "User Management", href: "/admin/users", icon: UserPlus },
  ],
};
