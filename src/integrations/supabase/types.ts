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
      contact_messages: {
        Row: {
          admin_response: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
      portfolio_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          portfolio_id: string
          section_visibility: Json | null
          slug: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          portfolio_id: string
          section_visibility?: Json | null
          slug: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          portfolio_id?: string
          section_visibility?: Json | null
          slug?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_links_portfolio_id_fkey"
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
          certificates: Json | null
          color_mode: string | null
          contact_settings: Json | null
          created_at: string
          custom_sections: Json | null
          education: Json | null
          experience: Json | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          links: Json | null
          parent_portfolio_id: string | null
          profile_picture_url: string | null
          projects: Json | null
          published_at: string | null
          quality_score: number | null
          quality_suggestions: Json | null
          resume_file_url: string | null
          resume_text: string | null
          resume_updated_at: string | null
          role: Database["public"]["Enums"]["portfolio_role"]
          section_order: Json | null
          section_titles: Json | null
          section_visibility: Json | null
          seo_settings: Json | null
          skills: Json | null
          status: Database["public"]["Enums"]["portfolio_status"]
          template: string
          testimonials: Json | null
          theme: Json | null
          updated_at: string
          user_id: string
          username: string
          version_emphasis: string | null
          version_history: Json | null
          version_name: string | null
          workspace_id: string | null
        }
        Insert: {
          about_text?: string | null
          certificates?: Json | null
          color_mode?: string | null
          contact_settings?: Json | null
          created_at?: string
          custom_sections?: Json | null
          education?: Json | null
          experience?: Json | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          links?: Json | null
          parent_portfolio_id?: string | null
          profile_picture_url?: string | null
          projects?: Json | null
          published_at?: string | null
          quality_score?: number | null
          quality_suggestions?: Json | null
          resume_file_url?: string | null
          resume_text?: string | null
          resume_updated_at?: string | null
          role: Database["public"]["Enums"]["portfolio_role"]
          section_order?: Json | null
          section_titles?: Json | null
          section_visibility?: Json | null
          seo_settings?: Json | null
          skills?: Json | null
          status?: Database["public"]["Enums"]["portfolio_status"]
          template?: string
          testimonials?: Json | null
          theme?: Json | null
          updated_at?: string
          user_id: string
          username: string
          version_emphasis?: string | null
          version_history?: Json | null
          version_name?: string | null
          workspace_id?: string | null
        }
        Update: {
          about_text?: string | null
          certificates?: Json | null
          color_mode?: string | null
          contact_settings?: Json | null
          created_at?: string
          custom_sections?: Json | null
          education?: Json | null
          experience?: Json | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          links?: Json | null
          parent_portfolio_id?: string | null
          profile_picture_url?: string | null
          projects?: Json | null
          published_at?: string | null
          quality_score?: number | null
          quality_suggestions?: Json | null
          resume_file_url?: string | null
          resume_text?: string | null
          resume_updated_at?: string | null
          role?: Database["public"]["Enums"]["portfolio_role"]
          section_order?: Json | null
          section_titles?: Json | null
          section_visibility?: Json | null
          seo_settings?: Json | null
          skills?: Json | null
          status?: Database["public"]["Enums"]["portfolio_status"]
          template?: string
          testimonials?: Json | null
          theme?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
          version_emphasis?: string | null
          version_history?: Json | null
          version_name?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_parent_portfolio_id_fkey"
            columns: ["parent_portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          onboarding_completed: boolean
          onboarding_step: number
          profile_picture_url: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          profile_picture_url?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          profile_picture_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          id: string
          invite_accepted: boolean
          invited_email: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_accepted?: boolean
          invited_email?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_accepted?: boolean
          invited_email?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_workspace_role: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: Database["public"]["Enums"]["workspace_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      portfolio_role:
        | "developer"
        | "designer"
        | "product_manager"
        | "data_scientist"
        | "devops_engineer"
        | "qa_engineer"
        | "security_engineer"
        | "mobile_developer"
        | "ux_researcher"
        | "content_writer"
        | "marketing_manager"
        | "brand_designer"
        | "business_analyst"
        | "project_manager"
        | "sales_engineer"
        | "consultant"
      portfolio_status: "draft" | "published" | "unpublished"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
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
      app_role: ["admin", "user"],
      portfolio_role: [
        "developer",
        "designer",
        "product_manager",
        "data_scientist",
        "devops_engineer",
        "qa_engineer",
        "security_engineer",
        "mobile_developer",
        "ux_researcher",
        "content_writer",
        "marketing_manager",
        "brand_designer",
        "business_analyst",
        "project_manager",
        "sales_engineer",
        "consultant",
      ],
      portfolio_status: ["draft", "published", "unpublished"],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
