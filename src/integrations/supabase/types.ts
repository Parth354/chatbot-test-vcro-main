export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          avatar_url: string | null
          colors: Json | null
          created_at: string
          cta_buttons: Json | null
          description: string | null
          id: string
          lead_backup_trigger: Json | null
          lead_collection_enabled: boolean | null
          lead_form_fields: Json | null
          lead_form_triggers: Json | null
          lead_submit_text: string | null
          lead_success_message: string | null
          name: string
          rotating_messages: string[] | null
          status: string | null
          suggested_prompts: string[] | null
          updated_at: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          avatar_url?: string | null
          colors?: Json | null
          created_at?: string
          cta_buttons?: Json | null
          description?: string | null
          id?: string
          lead_backup_trigger?: Json | null
          lead_collection_enabled?: boolean | null
          lead_form_fields?: Json | null
          lead_form_triggers?: Json | null
          lead_submit_text?: string | null
          lead_success_message?: string | null
          name: string
          rotating_messages?: string[] | null
          status?: string | null
          suggested_prompts?: string[] | null
          updated_at?: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          avatar_url?: string | null
          colors?: Json | null
          created_at?: string
          cta_buttons?: Json | null
          description?: string | null
          id?: string
          lead_backup_trigger?: Json | null
          lead_collection_enabled?: boolean | null
          lead_form_fields?: Json | null
          lead_form_triggers?: Json | null
          lead_submit_text?: string | null
          lead_success_message?: string | null
          name?: string
          rotating_messages?: string[] | null
          status?: string | null
          suggested_prompts?: string[] | null
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          agent_id: string
          created_at: string
          cta_button_1_clicks: number | null
          cta_button_2_clicks: number | null
          id: string
          last_message_at: string | null
          priority: string | null
          session_cookie: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          user_email: string | null
          user_name: string | null
          linkedin_prompt_message_count: number | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          cta_button_1_clicks?: number | null
          cta_button_2_clicks?: number | null
          id?: string
          last_message_at?: string | null
          priority?: string | null
          session_cookie?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_email?: string | null
          user_name?: string | null
          linkedin_prompt_message_count?: number | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          cta_button_1_clicks?: number | null
          cta_button_2_clicks?: number | null
          id?: string
          last_message_at?: string | null
          priority?: string | null
          session_cookie?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_email?: string | null
          user_name?: string | null
          linkedin_prompt_message_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_submissions: {
        Row: {
          agent_id: string
          created_at: string
          form_data: Json
          id: string
          session_id: string | null
          submitted_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          form_data?: Json
          id?: string
          session_id?: string | null
          submitted_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          form_data?: Json
          id?: string
          session_id?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_submissions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      message_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          message_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          message_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          message_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_feedback_session_id_fkey",
            columns: ["session_id"],
            isOneToOne: false,
            referencedRelation: "chat_sessions",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_feedback_message_id_fkey",
            columns: ["message_id"],
            isOneToOne: false,
            referencedRelation: "chat_messages",
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
          persona_data: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
          persona_data?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
          persona_data?: boolean | null
        }
        Relationships: []
      }
      prompt_responses: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          is_dynamic: boolean
          keywords: string[] | null
          prompt: string
          response: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          is_dynamic?: boolean
          keywords?: string[] | null
          prompt: string
          response: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          is_dynamic?: boolean
          keywords?: string[] | null
          prompt?: string
          response?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_cta_clicks: {
        Args: { session_id: string; button_number: number }
        Returns: undefined
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
  public: {
    Enums: {},
  },
} as const
