// Hand-written from supabase/migrations until the schema is pushed.
// Once it is, regenerate with `pnpm db:types` (overwrites this file).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Enum<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Enum<"user_role">;
          display_name: string | null;
          organization: string | null;
          municipality: string | null;
          created_at: string;
        };
        Insert: never;
        Update: {
          display_name?: string | null;
          organization?: string | null;
          municipality?: string | null;
        };
        Relationships: [];
      };
      innovations: {
        Row: {
          id: string;
          slug: string;
          title: string;
          lead: string | null;
          description: string | null;
          easy_read_description: string | null;
          categories: Enum<"challenge_category">[];
          stage: Enum<"innovation_stage">;
          author_id: string | null;
          pilot_slots: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          lead?: string | null;
          description?: string | null;
          easy_read_description?: string | null;
          categories?: Enum<"challenge_category">[];
          stage?: Enum<"innovation_stage">;
          author_id?: string | null;
          pilot_slots?: number;
          published?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["innovations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "innovations_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          id: string;
          case_number: string;
          tracking_token: string;
          author_id: string;
          kind: Enum<"submission_kind">;
          body: string;
          municipality: string | null;
          county: string | null;
          contact_email: string | null;
          category: Enum<"challenge_category"> | null;
          priority: Enum<"priority"> | null;
          possible_duplicate_id: string | null;
          status: Enum<"submission_status">;
          expert_id: string | null;
          created_at: string;
          updated_at: string;
        };
        // Only the columns granted INSERT to authenticated.
        Insert: {
          kind?: Enum<"submission_kind">;
          body: string;
          municipality?: string | null;
          county?: string | null;
          contact_email?: string | null;
        };
        Update: {
          category?: Enum<"challenge_category"> | null;
          priority?: Enum<"priority"> | null;
          possible_duplicate_id?: string | null;
          status?: Enum<"submission_status">;
          expert_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_expert_id_fkey";
            columns: ["expert_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_possible_duplicate_id_fkey";
            columns: ["possible_duplicate_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      pilots: {
        Row: {
          id: string;
          innovation_id: string;
          user_id: string;
          organization_type: Enum<"organization_type">;
          municipality: string;
          plan: string | null;
          contact_email: string;
          status: Enum<"pilot_status">;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          innovation_id: string;
          organization_type: Enum<"organization_type">;
          municipality: string;
          plan?: string | null;
          contact_email: string;
        };
        Update: {
          status?: Enum<"pilot_status">;
        };
        Relationships: [
          {
            foreignKeyName: "pilots_innovation_id_fkey";
            columns: ["innovation_id"];
            isOneToOne: false;
            referencedRelation: "innovations";
            referencedColumns: ["id"];
          },
        ];
      };
      pilot_reviews: {
        Row: {
          id: string;
          pilot_id: string;
          rating: number;
          feedback: string | null;
          improvement: string | null;
          attribution: string;
          is_public: boolean;
          approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          pilot_id: string;
          rating: number;
          feedback?: string | null;
          improvement?: string | null;
          attribution: string;
          is_public?: boolean;
        };
        Update: {
          rating?: number;
          feedback?: string | null;
          improvement?: string | null;
          attribution?: string;
          is_public?: boolean;
          approved?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "pilot_reviews_pilot_id_fkey";
            columns: ["pilot_id"];
            isOneToOne: true;
            referencedRelation: "pilots";
            referencedColumns: ["id"];
          },
        ];
      };
      threads: {
        Row: {
          id: string;
          submission_id: string | null;
          subject: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id?: string | null;
          subject: string;
        };
        Update: {
          subject?: string;
        };
        Relationships: [
          {
            foreignKeyName: "threads_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      thread_participants: {
        Row: {
          thread_id: string;
          user_id: string;
          added_at: string;
        };
        Insert: {
          thread_id: string;
          user_id: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          author_id: string | null;
          from_assistant: boolean;
          body: string;
          created_at: string;
        };
        Insert: {
          thread_id: string;
          body: string;
          author_id?: string | null;
          from_assistant?: boolean;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "threads";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Enum<"user_role">;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      set_user_role: {
        Args: { p_user_id: string; p_role: Enum<"user_role"> };
        Returns: undefined;
      };
      track_submission: {
        Args: { p_case_number: string; p_token: string };
        Returns: {
          case_number: string;
          kind: Enum<"submission_kind">;
          status: Enum<"submission_status">;
          created_at: string;
          updated_at: string;
        }[];
      };
      is_thread_participant: {
        Args: { p_thread_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "user" | "expert" | "admin";
      challenge_category:
        | "aging"
        | "mental_health"
        | "loneliness"
        | "digital_exclusion"
        | "service_access"
        | "coordination"
        | "depopulation";
      innovation_stage: "idea" | "pilot" | "deployed";
      submission_kind: "problem" | "idea";
      submission_status:
        | "received"
        | "in_review"
        | "with_expert"
        | "answered"
        | "closed";
      priority: "low" | "medium" | "high";
      pilot_status:
        | "applied"
        | "accepted"
        | "in_progress"
        | "completed"
        | "rejected";
      organization_type: "municipality" | "ngo" | "community_group" | "other";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
