export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          skill: string
          submission_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          messages?: Json
          skill: string
          submission_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          skill?: string
          submission_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      innovations: {
        Row: {
          author_id: string | null
          categories: Database["public"]["Enums"]["challenge_category"][]
          created_at: string
          description: string | null
          easy_read_description: string | null
          id: string
          lead: string | null
          pilot_slots: number
          published: boolean
          slug: string
          stage: Database["public"]["Enums"]["innovation_stage"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          categories?: Database["public"]["Enums"]["challenge_category"][]
          created_at?: string
          description?: string | null
          easy_read_description?: string | null
          id?: string
          lead?: string | null
          pilot_slots?: number
          published?: boolean
          slug: string
          stage?: Database["public"]["Enums"]["innovation_stage"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          categories?: Database["public"]["Enums"]["challenge_category"][]
          created_at?: string
          description?: string | null
          easy_read_description?: string | null
          id?: string
          lead?: string | null
          pilot_slots?: number
          published?: boolean
          slug?: string
          stage?: Database["public"]["Enums"]["innovation_stage"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "innovations_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          from_assistant: boolean
          id: string
          thread_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          from_assistant?: boolean
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          from_assistant?: boolean
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_reviews: {
        Row: {
          approved: boolean
          attribution: string
          created_at: string
          feedback: string | null
          id: string
          improvement: string | null
          is_public: boolean
          pilot_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          approved?: boolean
          attribution: string
          created_at?: string
          feedback?: string | null
          id?: string
          improvement?: string | null
          is_public?: boolean
          pilot_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          approved?: boolean
          attribution?: string
          created_at?: string
          feedback?: string | null
          id?: string
          improvement?: string | null
          is_public?: boolean
          pilot_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilot_reviews_pilot_id_fkey"
            columns: ["pilot_id"]
            isOneToOne: true
            referencedRelation: "pilots"
            referencedColumns: ["id"]
          },
        ]
      }
      pilots: {
        Row: {
          contact_email: string
          created_at: string
          id: string
          innovation_id: string
          municipality: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          plan: string | null
          status: Database["public"]["Enums"]["pilot_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          id?: string
          innovation_id: string
          municipality: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          plan?: string | null
          status?: Database["public"]["Enums"]["pilot_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          id?: string
          innovation_id?: string
          municipality?: string
          organization_type?: Database["public"]["Enums"]["organization_type"]
          plan?: string | null
          status?: Database["public"]["Enums"]["pilot_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pilots_innovation_id_fkey"
            columns: ["innovation_id"]
            isOneToOne: false
            referencedRelation: "innovations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          municipality: string | null
          organization: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          municipality?: string | null
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          municipality?: string | null
          organization?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      submissions: {
        Row: {
          author_id: string
          body: string
          case_number: string
          category: Database["public"]["Enums"]["challenge_category"] | null
          contact_email: string | null
          county: string | null
          created_at: string
          expert_id: string | null
          id: string
          kind: Database["public"]["Enums"]["submission_kind"]
          municipality: string | null
          possible_duplicate_id: string | null
          priority: Database["public"]["Enums"]["priority"] | null
          status: Database["public"]["Enums"]["submission_status"]
          tracking_token: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          body: string
          case_number?: string
          category?: Database["public"]["Enums"]["challenge_category"] | null
          contact_email?: string | null
          county?: string | null
          created_at?: string
          expert_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["submission_kind"]
          municipality?: string | null
          possible_duplicate_id?: string | null
          priority?: Database["public"]["Enums"]["priority"] | null
          status?: Database["public"]["Enums"]["submission_status"]
          tracking_token?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          case_number?: string
          category?: Database["public"]["Enums"]["challenge_category"] | null
          contact_email?: string | null
          county?: string | null
          created_at?: string
          expert_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["submission_kind"]
          municipality?: string | null
          possible_duplicate_id?: string | null
          priority?: Database["public"]["Enums"]["priority"] | null
          status?: Database["public"]["Enums"]["submission_status"]
          tracking_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_possible_duplicate_id_fkey"
            columns: ["possible_duplicate_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          added_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          id: string
          subject: string
          submission_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          subject: string
          submission_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          subject?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "threads_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_thread_participant: { Args: { p_thread_id: string }; Returns: boolean }
      owns_active_pilot: { Args: { p_pilot_id: string }; Returns: boolean }
      set_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      shares_thread_with: { Args: { p_user_id: string }; Returns: boolean }
      track_submission: {
        Args: { p_case_number: string; p_token: string }
        Returns: {
          case_number: string
          created_at: string
          kind: Database["public"]["Enums"]["submission_kind"]
          status: Database["public"]["Enums"]["submission_status"]
          updated_at: string
        }[]
      }
    }
    Enums: {
      challenge_category:
        | "aging"
        | "mental_health"
        | "loneliness"
        | "digital_exclusion"
        | "service_access"
        | "coordination"
        | "depopulation"
      innovation_stage: "idea" | "pilot" | "deployed"
      organization_type: "municipality" | "ngo" | "community_group" | "other"
      pilot_status:
        | "applied"
        | "accepted"
        | "in_progress"
        | "completed"
        | "rejected"
      priority: "low" | "medium" | "high"
      submission_kind: "problem" | "idea"
      submission_status:
        | "received"
        | "in_review"
        | "with_expert"
        | "answered"
        | "closed"
      user_role: "user" | "expert" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      challenge_category: [
        "aging",
        "mental_health",
        "loneliness",
        "digital_exclusion",
        "service_access",
        "coordination",
        "depopulation",
      ],
      innovation_stage: ["idea", "pilot", "deployed"],
      organization_type: ["municipality", "ngo", "community_group", "other"],
      pilot_status: [
        "applied",
        "accepted",
        "in_progress",
        "completed",
        "rejected",
      ],
      priority: ["low", "medium", "high"],
      submission_kind: ["problem", "idea"],
      submission_status: [
        "received",
        "in_review",
        "with_expert",
        "answered",
        "closed",
      ],
      user_role: ["user", "expert", "admin"],
    },
  },
} as const
