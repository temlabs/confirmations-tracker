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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bacentas: {
        Row: {
          constituency_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          constituency_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          constituency_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bacentas_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          created_at: string
          individual_target_hours: number | null
          member_id: string
          prayer_campaign_id: string
          total_seconds_prayed: number
        }
        Insert: {
          created_at?: string
          individual_target_hours?: number | null
          member_id: string
          prayer_campaign_id: string
          total_seconds_prayed?: number
        }
        Update: {
          created_at?: string
          individual_target_hours?: number | null
          member_id?: string
          prayer_campaign_id?: string
          total_seconds_prayed?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_prayer_campaign_id_fkey"
            columns: ["prayer_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_cumulative_view"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_members_prayer_campaign_id_fkey"
            columns: ["prayer_campaign_id"]
            isOneToOne: false
            referencedRelation: "prayer_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmations: {
        Row: {
          attended: boolean
          confirmed_by_member_id: string
          contact_number: string | null
          created_at: string
          event_id: string
          first_name: string
          id: string
          last_name: string | null
        }
        Insert: {
          attended?: boolean
          confirmed_by_member_id: string
          contact_number?: string | null
          created_at?: string
          event_id: string
          first_name: string
          id?: string
          last_name?: string | null
        }
        Update: {
          attended?: boolean
          confirmed_by_member_id?: string
          contact_number?: string | null
          created_at?: string
          event_id?: string
          first_name?: string
          id?: string
          last_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmations_confirmed_by_member_id_fkey"
            columns: ["confirmed_by_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_cumulative_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "confirmations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      constituencies: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_member_targets: {
        Row: {
          attendance_target: number | null
          confirmations_target: number | null
          event_id: string
          member_id: string
          total_attendees: number
          total_confirmations: number
        }
        Insert: {
          attendance_target?: number | null
          confirmations_target?: number | null
          event_id: string
          member_id: string
          total_attendees?: number
          total_confirmations?: number
        }
        Update: {
          attendance_target?: number | null
          confirmations_target?: number | null
          event_id?: string
          member_id?: string
          total_attendees?: number
          total_confirmations?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_member_targets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_cumulative_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_member_targets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_member_targets_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          event_timestamp: string
          id: string
          name: string
          overall_attendee_target: number | null
          total_attendance_target: number
          total_attendees: number
          total_confirmations: number
          total_confirmations_target: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_timestamp: string
          id?: string
          name: string
          overall_attendee_target?: number | null
          total_attendance_target?: number
          total_attendees?: number
          total_confirmations?: number
          total_confirmations_target?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_timestamp?: string
          id?: string
          name?: string
          overall_attendee_target?: number | null
          total_attendance_target?: number
          total_attendees?: number
          total_confirmations?: number
          total_confirmations_target?: number
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          bacenta_id: string | null
          created_at: string
          first_name: string
          full_name: string | null
          id: string
          last_name: string
          updated_at: string
        }
        Insert: {
          bacenta_id?: string | null
          created_at?: string
          first_name: string
          full_name?: string | null
          id?: string
          last_name: string
          updated_at?: string
        }
        Update: {
          bacenta_id?: string | null
          created_at?: string
          first_name?: string
          full_name?: string | null
          id?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_bacenta_id_fkey"
            columns: ["bacenta_id"]
            isOneToOne: false
            referencedRelation: "bacentas"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_campaigns: {
        Row: {
          constituency_id: string | null
          created_at: string
          end_timestamp: string
          id: string
          name: string
          start_timestamp: string
          target_hours: number | null
          total_seconds_prayed: number
          updated_at: string
        }
        Insert: {
          constituency_id?: string | null
          created_at?: string
          end_timestamp: string
          id?: string
          name: string
          start_timestamp: string
          target_hours?: number | null
          total_seconds_prayed?: number
          updated_at?: string
        }
        Update: {
          constituency_id?: string | null
          created_at?: string
          end_timestamp?: string
          id?: string
          name?: string
          start_timestamp?: string
          target_hours?: number | null
          total_seconds_prayed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_campaigns_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_sessions: {
        Row: {
          created_at: string
          duration_in_seconds: number | null
          end_timestamp: string | null
          id: string
          member_id: string | null
          prayer_campaign_id: string | null
          start_timestamp: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_in_seconds?: number | null
          end_timestamp?: string | null
          id?: string
          member_id?: string | null
          prayer_campaign_id?: string | null
          start_timestamp: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_in_seconds?: number | null
          end_timestamp?: string | null
          id?: string
          member_id?: string | null
          prayer_campaign_id?: string | null
          start_timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_sessions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_sessions_prayer_campaign_id_fkey"
            columns: ["prayer_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_cumulative_view"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "prayer_sessions_prayer_campaign_id_fkey"
            columns: ["prayer_campaign_id"]
            isOneToOne: false
            referencedRelation: "prayer_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      campaign_cumulative_view: {
        Row: {
          campaign_id: string | null
          cumulative_seconds: number | null
          day: string | null
        }
        Relationships: []
      }
      campaign_member_activity: {
        Row: {
          is_active: boolean | null
          last_seen_at: string | null
          member_id: string | null
          prayer_campaign_id: string | null
          total_seconds_prayed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_prayer_campaign_id_fkey"
            columns: ["prayer_campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_cumulative_view"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_members_prayer_campaign_id_fkey"
            columns: ["prayer_campaign_id"]
            isOneToOne: false
            referencedRelation: "prayer_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      event_bacenta_targets_view: {
        Row: {
          attendance_target: number | null
          bacenta_id: string | null
          confirmations_target: number | null
          event_id: string | null
          total_attendees: number | null
          total_confirmations: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_member_targets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_cumulative_view"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_member_targets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_bacenta_id_fkey"
            columns: ["bacenta_id"]
            isOneToOne: false
            referencedRelation: "bacentas"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cumulative_view: {
        Row: {
          cumulative_confirmations: number | null
          day: string | null
          event_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      uuid_generate_v7: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
