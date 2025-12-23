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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      portfolio_ab_tests: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          name: string
          started_at: string
          status: string
          traffic_split: number
          updated_at: string
          user_id: string
          version_a_id: string
          version_b_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          name: string
          started_at?: string
          status?: string
          traffic_split?: number
          updated_at?: string
          user_id: string
          version_a_id: string
          version_b_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          started_at?: string
          status?: string
          traffic_split?: number
          updated_at?: string
          user_id?: string
          version_a_id?: string
          version_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_ab_tests_version_a_id_fkey"
            columns: ["version_a_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_ab_tests_version_b_id_fkey"
            columns: ["version_b_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_analytics: {
        Row: {
          created_at: string
          id: string
          portfolio_id: string
          unique_visitors: number
          view_count: number
          view_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          portfolio_id: string
          unique_visitors?: number
          view_count?: number
          view_date?: string
        }
        Update: {
          created_at?: string
          id?: string
          portfolio_id?: string
          unique_visitors?: number
          view_count?: number
          view_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_analytics_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_link_clicks: {
        Row: {
          click_count: number
          created_at: string
          id: string
          last_clicked_at: string | null
          link_type: string
          link_url: string
          portfolio_id: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          link_type: string
          link_url: string
          portfolio_id: string
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          link_type?: string
          link_url?: string
          portfolio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_link_clicks_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          about_text: string | null
          created_at: string
          education: Json | null
          experience: Json | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          links: Json | null
          parent_portfolio_id: string | null
          projects: Json | null
          published_at: string | null
          quality_score: number | null
          quality_suggestions: Json | null
          resume_file_url: string | null
          resume_text: string | null
          resume_updated_at: string | null
          role: Database["public"]["Enums"]["portfolio_role"]
          skills: Json | null
          status: Database["public"]["Enums"]["portfolio_status"]
          template: string
          theme: Json | null
          updated_at: string
          user_id: string
          username: string
          version_emphasis: string | null
          version_name: string | null
        }
        Insert: {
          about_text?: string | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          links?: Json | null
          parent_portfolio_id?: string | null
          projects?: Json | null
          published_at?: string | null
          quality_score?: number | null
          quality_suggestions?: Json | null
          resume_file_url?: string | null
          resume_text?: string | null
          resume_updated_at?: string | null
          role: Database["public"]["Enums"]["portfolio_role"]
          skills?: Json | null
          status?: Database["public"]["Enums"]["portfolio_status"]
          template?: string
          theme?: Json | null
          updated_at?: string
          user_id: string
          username: string
          version_emphasis?: string | null
          version_name?: string | null
        }
        Update: {
          about_text?: string | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          links?: Json | null
          parent_portfolio_id?: string | null
          projects?: Json | null
          published_at?: string | null
          quality_score?: number | null
          quality_suggestions?: Json | null
          resume_file_url?: string | null
          resume_text?: string | null
          resume_updated_at?: string | null
          role?: Database["public"]["Enums"]["portfolio_role"]
          skills?: Json | null
          status?: Database["public"]["Enums"]["portfolio_status"]
          template?: string
          theme?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
          version_emphasis?: string | null
          version_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_parent_portfolio_id_fkey"
            columns: ["parent_portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      portfolio_role: "developer" | "designer" | "product_manager"
      portfolio_status: "draft" | "published" | "unpublished"
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
    Enums: {
      portfolio_role: ["developer", "designer", "product_manager"],
      portfolio_status: ["draft", "published", "unpublished"],
    },
  },
} as const
