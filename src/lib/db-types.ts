export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgreseVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgresVersion: "13.0.5"
  }
  public: {
    Tables: {
      models: {
        Row: {
          alias: string | null
          birth_date: string | null
          bust_cm: number | null
          chest_cm: number | null
          comp_card_paths: string[] | null
          country: string | null
          cover_path: string | null
          created_at: string
          date_joined_agency: string | null
          email: string | null
          eye_color: string | null
          fts_search_vector: unknown
          full_name: string
          gender: string | null
          hair_color: string | null
          height_cm: number | null
          hips_cm: number | null
          id: string
          instagram: string | null
          national_id: string | null
          pants_size: number | null
          phone_e164: string | null
          portfolio_path: string | null
          profile_completeness: number | null
          shoe_size_us: number | null
          shoulders_cm: number | null
          status: string
          tiktok: string | null
          top_size: string | null
          user_id: string | null
          waist_cm: number | null
        }
        Insert: {
          alias?: string | null
          birth_date?: string | null
          bust_cm?: number | null
          chest_cm?: number | null
          comp_card_paths?: string[] | null
          country?: string | null
          cover_path?: string | null
          created_at?: string
          date_joined_agency?: string | null
          email?: string | null
          eye_color?: string | null
          fts_search_vector?: unknown
          full_name: string
          gender?: string | null
          hair_color?: string | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          instagram?: string | null
          national_id?: string | null
          pants_size?: number | null
          phone_e164?: string | null
          portfolio_path?: string | null
          profile_completeness?: number | null
          shoe_size_us?: number | null
          shoulders_cm?: number | null
          status?: string
          tiktok?: string | null
          top_size?: string | null
          user_id?: string | null
          waist_cm?: number | null
        }
        Update: {
          alias?: string | null
          birth_date?: string | null
          bust_cm?: number | null
          chest_cm?: number | null
          comp_card_paths?: string[] | null
          country?: string | null
          cover_path?: string | null
          created_at?: string
          date_joined_agency?: string | null
          email?: string | null
          eye_color?: string | null
          fts_search_vector?: unknown
          full_name?: string
          gender?: string | null
          hair_color?: string | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          instagram?: string | null
          national_id?: string | null
          pants_size?: number | null
          phone_e164?: string | null
          portfolio_path?: string | null
          profile_completeness?: number | null
          shoe_size_us?: number | null
          shoulders_cm?: number | null
          status?: string
          tiktok?: string | null
          top_size?: string | null
          user_id?: string | null
          waist_cm?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_name: string | null
          created_at: string
          id: string
          password: string | null
          project_name: string
          public_id: string
          schedule: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          id?: string
          password?: string | null
          project_name: string
          public_id?: string
          schedule?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string
          id?: string
          password?: string | null
          project_name?: string
          public_id?: string
          schedule?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      projects_models: {
        Row: {
          client_selection: string
          client_selection_date: string | null
          model_id: string
          project_id: string
        }
        Insert: {
          client_selection?: string
          client_selection_date?: string | null
          model_id: string
          project_id: string
        }
        Update: {
          client_selection?: string
          client_selection_date?: string | null
          model_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_models_model"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_models_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_models_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_completes_project: {
        Args: { project_uuid: string }
        Returns: undefined
      }
      count_files_in_storage: {
        Args: { bucket_name: string; folder_path: string }
        Returns: number
      }
      get_model_report: {
        Args: never
        Returns: {
          alias: string
          comp_card_paths: string[]
          full_name: string
          tiene_portada: boolean
          tiene_portafolio: boolean
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
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
