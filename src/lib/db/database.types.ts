// Minimal Supabase Database Types
// This is a simplified version - full types can be generated with:
// npx supabase gen types typescript --project-id wryzpscsrfhktixspqmj --schema public > src/lib/db/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "ADMIN" | "SUPERVISOR" | "STUDENT";
export type UserStatus = "ACTIVE" | "DISABLED" | "PENDING";
export type OjtStatus = "NOT_STARTED" | "ONGOING" | "COMPLETED" | "FAILED";
export type DtrStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
export type DtrApprovalStatus = "PENDING" | "SUPERVISOR_APPROVED" | "ADMIN_APPROVED" | "REJECTED" | "RESUBMITTED";
export type WeeklyReportStatus = "DRAFT" | "SUBMITTED" | "SUPERVISOR_APPROVED" | "ADMIN_APPROVED" | "REJECTED" | "RESUBMITTED";
export type TaskStatus = "COMPLETED" | "ONGOING" | "UNDONE";
export type NarrativeStatus = "DRAFT" | "SUBMITTED";
export type NotificationCategory = "DTR" | "WEEKLY_REPORT" | "TASK" | "ANNOUNCEMENT" | "SYSTEM";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          password_hash: string;
          role: UserRole;
          status: UserStatus;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          phone: string | null;
          company_id: string | null;
          company_name: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [{ foreignKeyName: "users_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }];
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          course: string;
          year_level: number;
          section: string | null;
          contact_number: string | null;
          address: string | null;
          company_id: string | null;
          company_name: string | null;
          company_address: string | null;
          designation: string | null;
          supervisor_id: string | null;
          supervisor_name: string | null;
          required_hours: number;
          completed_hours: number;
          start_date: string | null;
          expected_end_date: string | null;
          actual_end_date: string | null;
          schedule_time_in: string | null;
          schedule_time_out: string | null;
          schedule_break_start: string | null;
          schedule_break_end: string | null;
          status: OjtStatus;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
        Relationships: [{ foreignKeyName: "students_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }, { foreignKeyName: "students_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }];
      };
      dtr_records: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          time_in: string | null;
          time_out: string | null;
          pm_time_in: string | null;
          pm_time_out: string | null;
          break_minutes: number;
          total_hours: number;
          status: DtrStatus;
          approval_status: DtrApprovalStatus;
          remarks: string | null;
          attachment_url: string | null;
          attachment_name: string | null;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["dtr_records"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["dtr_records"]["Insert"]>;
        Relationships: [{ foreignKeyName: "dtr_records_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] }, { foreignKeyName: "dtr_records_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      weekly_reports: {
        Row: {
          id: string;
          student_id: string;
          week_number: number;
          week_start_date: string;
          week_end_date: string;
          total_hours: number;
          status: WeeklyReportStatus;
          supervisor_approved_at: string | null;
          admin_approved_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_reports"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["weekly_reports"]["Insert"]>;
        Relationships: [{ foreignKeyName: "weekly_reports_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] }, { foreignKeyName: "weekly_reports_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      weekly_report_activities: {
        Row: {
          id: string;
          weekly_report_id: string;
          date: string;
          activity: string;
          description: string | null;
          skills_learned: string | null;
          remarks: string | null;
          hours_spent: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_report_activities"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["weekly_report_activities"]["Insert"]>;
        Relationships: [{ foreignKeyName: "weekly_report_activities_weekly_report_id_fkey"; columns: ["weekly_report_id"]; isOneToOne: false; referencedRelation: "weekly_reports"; referencedColumns: ["id"] }];
      };
      tasks: {
        Row: {
          id: string;
          student_id: string;
          title: string;
          description: string | null;
          date: string | null;
          status: TaskStatus;
          skills_learned: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [{ foreignKeyName: "tasks_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] }];
      };
      ojt_evaluations: {
        Row: {
          id: string;
          student_id: string;
          department: string | null;
          training_period: string | null;
          supervisor_name: string | null;
          evaluation_date: string;
          quality_of_work: number | null;
          productivity_efficiency: number | null;
          accuracy_attention_to_detail: number | null;
          ability_to_follow_instructions: number | null;
          ability_to_work_independently: number | null;
          understanding_of_tasks: number | null;
          technical_skills: number | null;
          problem_solving_skills: number | null;
          ability_to_learn_apply_feedback: number | null;
          punctuality_attendance: number | null;
          initiative: number | null;
          responsibility_dependability: number | null;
          professional_behavior: number | null;
          communication_skills: number | null;
          teamwork_collaboration: number | null;
          customer_client_interaction: number | null;
          work_performance_score: number | null;
          knowledge_skills_score: number | null;
          work_attitude_score: number | null;
          communication_teamwork_score: number | null;
          total_score: number | null;
          comments: string | null;
          evaluator_signature: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ojt_evaluations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["ojt_evaluations"]["Insert"]>;
        Relationships: [{ foreignKeyName: "ojt_evaluations_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] }];
      };
      narrative_reports: {
        Row: {
          id: string;
          student_id: string;
          content: string;
          status: NarrativeStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["narrative_reports"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["narrative_reports"]["Insert"]>;
        Relationships: [{ foreignKeyName: "narrative_reports_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "students"; referencedColumns: ["id"] }];
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string;
          priority: string;
          audience: string;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["announcements"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
        Relationships: [{ foreignKeyName: "announcements_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          category: NotificationCategory;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [{ foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          description: string | null;
          entity_type: string | null;
          entity_id: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [{ foreignKeyName: "audit_logs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          description: string | null;
          updated_by_id: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["system_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["system_settings"]["Insert"]>;
        Relationships: [{ foreignKeyName: "system_settings_updated_by_id_fkey"; columns: ["updated_by_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          location: string | null;
          industry: string | null;
          contact_number: string | null;
          email: string | null;
          is_it_company: boolean;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      password_reset_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["password_reset_tokens"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["password_reset_tokens"]["Insert"]>;
        Relationships: [{ foreignKeyName: "password_reset_tokens_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] }];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      ojt_status: OjtStatus;
      dtr_status: DtrStatus;
      dtr_approval_status: DtrApprovalStatus;
      weekly_report_status: WeeklyReportStatus;
      task_status: TaskStatus;
      notification_category: NotificationCategory;
    };
    CompositeTypes: Record<string, never>;
  };
}
