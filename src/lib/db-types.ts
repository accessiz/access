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
      activity_logs: {
        Row: {
          category: string
          created_at: string
          id: string
          is_read: boolean | null
          is_urgent: boolean | null
          message: string | null
          metadata: Json | null
          title: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message?: string | null
          metadata?: Json | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message?: string | null
          metadata?: Json | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alert_dismissals: {
        Row: {
          alert_id: string
          created_at: string | null
          dismissed_at: string | null
          expires_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string | null
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          date: string
          fetched_at: string | null
          id: string
          usd_to_gtq: number
        }
        Insert: {
          date: string
          fetched_at?: string | null
          id?: string
          usd_to_gtq: number
        }
        Update: {
          date?: string
          fetched_at?: string | null
          id?: string
          usd_to_gtq?: number
        }
        Relationships: []
      }
      featured_web_models: {
        Row: {
          created_at: string | null
          id: string
          model_id: string
          position: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id: string
          position?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "featured_web_models_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: true
            referencedRelation: "finance_summary"
            referencedColumns: ["model_id"]
          },
          {
            foreignKeyName: "featured_web_models_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: true
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_assignments: {
        Row: {
          adjustment_amount: number | null
          adjustment_amount_trade: number | null
          adjustment_reason: string | null
          adjustment_reason_trade: string | null
          amount_gtq: number | null
          created_at: string | null
          daily_fee: number | null
          exchange_rate_used: number | null
          hours_worked: number | null
          id: string
          is_confirmed: boolean | null
          model_id: string
          notes: string | null
          payment_date: string | null
          payment_status: string | null
          payment_type: string | null
          project_id: string | null
          schedule_id: string | null
          trade_category: string | null
          trade_details: string | null
          trade_fee: number | null
        }
        Insert: {
          adjustment_amount?: number | null
          adjustment_amount_trade?: number | null
          adjustment_reason?: string | null
          adjustment_reason_trade?: string | null
          amount_gtq?: number | null
          created_at?: string | null
          daily_fee?: number | null
          exchange_rate_used?: number | null
          hours_worked?: number | null
          id?: string
          is_confirmed?: boolean | null
          model_id: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: string | null
          payment_type?: string | null
          project_id?: string | null
          schedule_id?: string | null
          trade_category?: string | null
          trade_details?: string | null
          trade_fee?: number | null
        }
        Update: {
          adjustment_amount?: number | null
          adjustment_amount_trade?: number | null
          adjustment_reason?: string | null
          adjustment_reason_trade?: string | null
          amount_gtq?: number | null
          created_at?: string | null
          daily_fee?: number | null
          exchange_rate_used?: number | null
          hours_worked?: number | null
          id?: string
          is_confirmed?: boolean | null
          model_id?: string
          notes?: string | null
          payment_date?: string | null
          payment_status?: string | null
          payment_type?: string | null
          project_id?: string | null
          schedule_id?: string | null
          trade_category?: string | null
          trade_details?: string | null
          trade_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "model_assignments_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "finance_summary"
            referencedColumns: ["model_id"]
          },
          {
            foreignKeyName: "model_assignments_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "model_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "project_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          alias: string | null
          birth_country: string | null
          birth_date: string | null
          bust_cm: number | null
          chest_cm: number | null
          comp_card_blur_hashes: string[] | null
          comp_card_paths: string[] | null
          country: string | null
          cover_blur_hash: string | null
          cover_path: string | null
          created_at: string
          date_joined_agency: string | null
          email: string | null
          login_password: string | null
          eye_color: string | null
          fts_search_vector: unknown
          full_name: string
          gallery_blur_hashes: string[] | null
          gallery_paths: string[] | null
          gender: string | null
          hair_color: string | null
          height_cm: number | null
          hips_cm: number | null
          id: string
          instagram: string | null
          is_public: boolean | null
          national_id: string | null
          pants_size: number | null
          passport_number: string | null
          phone_e164: string | null
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
          birth_country?: string | null
          birth_date?: string | null
          bust_cm?: number | null
          chest_cm?: number | null
          comp_card_blur_hashes?: string[] | null
          comp_card_paths?: string[] | null
          country?: string | null
          cover_blur_hash?: string | null
          cover_path?: string | null
          created_at?: string
          date_joined_agency?: string | null
          email?: string | null
          login_password?: string | null
          eye_color?: string | null
          fts_search_vector?: unknown
          full_name: string
          gallery_blur_hashes?: string[] | null
          gallery_paths?: string[] | null
          gender?: string | null
          hair_color?: string | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          instagram?: string | null
          is_public?: boolean | null
          national_id?: string | null
          pants_size?: number | null
          passport_number?: string | null
          phone_e164?: string | null
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
          birth_country?: string | null
          birth_date?: string | null
          bust_cm?: number | null
          chest_cm?: number | null
          comp_card_blur_hashes?: string[] | null
          comp_card_paths?: string[] | null
          country?: string | null
          cover_blur_hash?: string | null
          cover_path?: string | null
          created_at?: string
          date_joined_agency?: string | null
          email?: string | null
          login_password?: string | null
          eye_color?: string | null
          fts_search_vector?: unknown
          full_name?: string
          gallery_blur_hashes?: string[] | null
          gallery_paths?: string[] | null
          gender?: string | null
          hair_color?: string | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          instagram?: string | null
          is_public?: boolean | null
          national_id?: string | null
          pants_size?: number | null
          passport_number?: string | null
          phone_e164?: string | null
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
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          model_assignment_id: string | null
          notes: string | null
          paid_at: string
          payment_method: string | null
          receipt_url: string | null
          reference_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          model_assignment_id?: string | null
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          model_assignment_id?: string | null
          notes?: string | null
          paid_at?: string
          payment_method?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_model_assignment_id_fkey"
            columns: ["model_assignment_id"]
            isOneToOne: false
            referencedRelation: "model_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      project_schedule: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          is_call_time: boolean | null
          location: string | null
          project_id: string
          start_time: string
          title: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          is_call_time?: boolean | null
          location?: string | null
          project_id: string
          start_time: string
          title: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          is_call_time?: boolean | null
          location?: string | null
          project_id?: string
          start_time?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_schedule_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          application_deadline: string | null
          brand_id: string | null
          client_amount_gtq: number | null
          client_exchange_rate_used: number | null
          client_id: string | null
          client_name: string | null
          client_payment_date: string | null
          client_payment_status: string | null
          client_payment_type: string | null
          client_trade_category: string | null
          client_trade_details: string | null
          client_trade_revenue: number | null
          created_at: string
          description: string | null
          location: string | null
          apply_start_at: string | null
          apply_end_at: string | null
          gender_target: string | null
          currency: string | null
          default_fee_type: string | null
          default_model_fee: number | null
          default_model_payment_type: string | null
          default_model_trade_category: string | null
          default_model_trade_details: string | null
          default_model_trade_fee: number | null
          end_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          password: string | null
          project_name: string
          project_types: string[] | null
          public_id: string
          revenue: number | null
          schedule: Json | null
          start_date: string | null
          status: string
          tax_percentage: number | null
          user_id: string | null
        }
        Insert: {
          application_deadline?: string | null
          brand_id?: string | null
          client_amount_gtq?: number | null
          client_exchange_rate_used?: number | null
          client_id?: string | null
          client_name?: string | null
          client_payment_date?: string | null
          client_payment_status?: string | null
          client_payment_type?: string | null
          client_trade_category?: string | null
          client_trade_details?: string | null
          client_trade_revenue?: number | null
          created_at?: string
          description?: string | null
          location?: string | null
          apply_start_at?: string | null
          apply_end_at?: string | null
          gender_target?: string | null
          currency?: string | null
          default_fee_type?: string | null
          default_model_fee?: number | null
          default_model_payment_type?: string | null
          default_model_trade_category?: string | null
          default_model_trade_details?: string | null
          default_model_trade_fee?: number | null
          end_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          password?: string | null
          project_name: string
          project_types?: string[] | null
          public_id?: string
          revenue?: number | null
          schedule?: Json | null
          start_date?: string | null
          status?: string
          tax_percentage?: number | null
          user_id?: string | null
        }
        Update: {
          application_deadline?: string | null
          brand_id?: string | null
          client_amount_gtq?: number | null
          client_exchange_rate_used?: number | null
          client_id?: string | null
          client_name?: string | null
          client_payment_date?: string | null
          client_payment_status?: string | null
          client_payment_type?: string | null
          client_trade_category?: string | null
          client_trade_details?: string | null
          client_trade_revenue?: number | null
          created_at?: string
          description?: string | null
          location?: string | null
          apply_start_at?: string | null
          apply_end_at?: string | null
          gender_target?: string | null
          currency?: string | null
          default_fee_type?: string | null
          default_model_fee?: number | null
          default_model_payment_type?: string | null
          default_model_trade_category?: string | null
          default_model_trade_details?: string | null
          default_model_trade_fee?: number | null
          end_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          password?: string | null
          project_name?: string
          project_types?: string[] | null
          public_id?: string
          revenue?: number | null
          schedule?: Json | null
          start_date?: string | null
          status?: string
          tax_percentage?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_models: {
        Row: {
          agreed_fee: number | null
          client_selection: string
          client_selection_date: string | null
          currency: string | null
          fee_type: string | null
          internal_status: string | null
          model_id: string
          model_status: string | null
          model_available_schedules: string[] | null
          notes: string | null
          project_id: string
          trade_fee: number | null
        }
        Insert: {
          agreed_fee?: number | null
          client_selection?: string
          client_selection_date?: string | null
          currency?: string | null
          fee_type?: string | null
          internal_status?: string | null
          model_id: string
          model_status?: string | null
          model_available_schedules?: string[] | null
          notes?: string | null
          project_id: string
          trade_fee?: number | null
        }
        Update: {
          agreed_fee?: number | null
          client_selection?: string
          client_selection_date?: string | null
          currency?: string | null
          fee_type?: string | null
          internal_status?: string | null
          model_id?: string
          model_status?: string | null
          model_available_schedules?: string[] | null
          notes?: string | null
          project_id?: string
          trade_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_models_model"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "finance_summary"
            referencedColumns: ["model_id"]
          },
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
            referencedRelation: "finance_summary"
            referencedColumns: ["project_id"]
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
            referencedRelation: "finance_summary"
            referencedColumns: ["project_id"]
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
      finance_summary: {
        Row: {
          brand_name: string | null
          client_name: string | null
          currency: string | null
          daily_fee: number | null
          daily_trade_fee: number | null
          days_worked: number | null
          first_work_date: string | null
          id: string | null
          last_work_date: string | null
          model_alias: string | null
          model_id: string | null
          model_name: string | null
          payment_date: string | null
          payment_status: string | null
          payment_type: string | null
          pending_amount: number | null
          project_id: string | null
          project_name: string | null
          registered_client_name: string | null
          total_amount: number | null
          total_paid: number | null
          total_paid_gtq: number | null
          total_trade_value: number | null
          trade_category: string | null
          trade_details: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_close_expired_projects: { Args: never; Returns: undefined }
      client_completes_project: {
        Args: { project_uuid: string }
        Returns: undefined
      }
      count_files_in_storage: {
        Args: { bucket_name: string; folder_path: string }
        Returns: number
      }
      get_assignment_payment_balance: {
        Args: { assignment_id: string }
        Returns: {
          balance_pending: number
          payment_count: number
          total_agreed: number
          total_paid: number
        }[]
      }
      get_model_application_stats: {
        Args: never
        Returns: {
          alias: string
          approved_count: number
          cover_path: string
          model_id: string
          rejected_count: number
          total_count: number
        }[]
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
