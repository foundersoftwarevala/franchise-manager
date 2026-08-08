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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_name: string
          city: string
          company: string
          country: string
          created_at: string
          id: string
          kyc_verified: boolean
          payment_verified: boolean
          reviewer: string | null
          stage: string
          state: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_name: string
          city?: string
          company?: string
          country?: string
          created_at?: string
          id?: string
          kyc_verified?: boolean
          payment_verified?: boolean
          reviewer?: string | null
          stage?: string
          state?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_name?: string
          city?: string
          company?: string
          country?: string
          created_at?: string
          id?: string
          kyc_verified?: boolean
          payment_verified?: boolean
          reviewer?: string | null
          stage?: string
          state?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string
          at: string
          id: string
          meta: string | null
          scope: string
          target: string
        }
        Insert: {
          action: string
          actor?: string
          at?: string
          id?: string
          meta?: string | null
          scope?: string
          target?: string
        }
        Update: {
          action?: string
          actor?: string
          at?: string
          id?: string
          meta?: string | null
          scope?: string
          target?: string
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          active: boolean
          basis: string
          created_at: string
          id: string
          min_payout: number
          name: string
          rate_pct: number
          scope: string
          scope_value: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          basis?: string
          created_at?: string
          id?: string
          min_payout?: number
          name: string
          rate_pct?: number
          scope?: string
          scope_value?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          basis?: string
          created_at?: string
          id?: string
          min_payout?: number
          name?: string
          rate_pct?: number
          scope?: string
          scope_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          adjustment: number
          approver: string | null
          base: number
          created_at: string
          cycle: string
          franchise: string
          franchise_id: string | null
          id: string
          payable: number
          rate_pct: number
          status: string
          tax: number
          updated_at: string
        }
        Insert: {
          adjustment?: number
          approver?: string | null
          base?: number
          created_at?: string
          cycle: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          payable?: number
          rate_pct?: number
          status?: string
          tax?: number
          updated_at?: string
        }
        Update: {
          adjustment?: number
          approver?: string | null
          base?: number
          created_at?: string
          cycle?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          payable?: number
          rate_pct?: number
          status?: string
          tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          franchise: string | null
          id: string
          kind: string
          name: string
          scope: string
          size: number
          status: string
          storage_path: string | null
          target_id: string
          target_label: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          franchise?: string | null
          id?: string
          kind?: string
          name: string
          scope?: string
          size?: number
          status?: string
          storage_path?: string | null
          target_id?: string
          target_label?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Update: {
          category?: string
          created_at?: string
          franchise?: string | null
          id?: string
          kind?: string
          name?: string
          scope?: string
          size?: number
          status?: string
          storage_path?: string | null
          target_id?: string
          target_label?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      franchise_contracts: {
        Row: {
          contract_no: string
          contract_type: string
          created_at: string
          end_date: string
          franchise: string
          franchise_id: string | null
          id: string
          renewal_status: string
          signed_at: string | null
          start_date: string
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          contract_no: string
          contract_type?: string
          created_at?: string
          end_date?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          renewal_status?: string
          signed_at?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          value?: number
        }
        Update: {
          contract_no?: string
          contract_type?: string
          created_at?: string
          end_date?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          renewal_status?: string
          signed_at?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "franchise_contracts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_escalations: {
        Row: {
          assigned_to: string
          category: string
          created_at: string
          franchise: string
          franchise_id: string | null
          id: string
          priority: string
          raised_by: string
          resolution: string | null
          sla_due: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string
          category?: string
          created_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          priority?: string
          raised_by?: string
          resolution?: string | null
          sla_due?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          category?: string
          created_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          priority?: string
          raised_by?: string
          resolution?: string | null
          sla_due?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_escalations_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_fraud_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          detected_at: string
          franchise: string
          franchise_id: string | null
          id: string
          risk_score: number
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          description?: string
          detected_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          risk_score?: number
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          detected_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          risk_score?: number
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_fraud_alerts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_notifications: {
        Row: {
          channel: string
          created_at: string
          franchise: string
          franchise_id: string | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          channel?: string
          created_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          message?: string
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          channel?: string
          created_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_notifications_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_performance: {
        Row: {
          conversions: number
          created_at: string
          csat: number
          franchise: string
          franchise_id: string | null
          id: string
          leads: number
          period: string
          revenue: number
          sla_percent: number
          tickets: number
          updated_at: string
        }
        Insert: {
          conversions?: number
          created_at?: string
          csat?: number
          franchise?: string
          franchise_id?: string | null
          id?: string
          leads?: number
          period: string
          revenue?: number
          sla_percent?: number
          tickets?: number
          updated_at?: string
        }
        Update: {
          conversions?: number
          created_at?: string
          csat?: number
          franchise?: string
          franchise_id?: string | null
          id?: string
          leads?: number
          period?: string
          revenue?: number
          sla_percent?: number
          tickets?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_performance_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_royalties: {
        Row: {
          commission_due: number
          created_at: string
          due_date: string | null
          franchise: string
          franchise_id: string | null
          gross_sales: number
          id: string
          paid_amount: number
          paid_at: string | null
          period: string
          royalty_due: number
          royalty_rate: number
          status: string
          updated_at: string
        }
        Insert: {
          commission_due?: number
          created_at?: string
          due_date?: string | null
          franchise?: string
          franchise_id?: string | null
          gross_sales?: number
          id?: string
          paid_amount?: number
          paid_at?: string | null
          period: string
          royalty_due?: number
          royalty_rate?: number
          status?: string
          updated_at?: string
        }
        Update: {
          commission_due?: number
          created_at?: string
          due_date?: string | null
          franchise?: string
          franchise_id?: string | null
          gross_sales?: number
          id?: string
          paid_amount?: number
          paid_at?: string | null
          period?: string
          royalty_due?: number
          royalty_rate?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_royalties_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_settings: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          key: string
          label: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          key: string
          label: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      franchises: {
        Row: {
          city: string
          code: string
          commission_pct: number
          company: string
          country: string
          created_at: string
          health_score: number
          id: string
          lead_routing: boolean
          licenses: number
          owner: string
          pricing_variation: number
          products_assigned: number
          revenue_mtd: number
          risk_level: string
          royalty_rate: number
          state: string
          status: string
          tier: string
          updated_at: string
        }
        Insert: {
          city?: string
          code: string
          commission_pct?: number
          company: string
          country?: string
          created_at?: string
          health_score?: number
          id?: string
          lead_routing?: boolean
          licenses?: number
          owner: string
          pricing_variation?: number
          products_assigned?: number
          revenue_mtd?: number
          risk_level?: string
          royalty_rate?: number
          state?: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Update: {
          city?: string
          code?: string
          commission_pct?: number
          company?: string
          country?: string
          created_at?: string
          health_score?: number
          id?: string
          lead_routing?: boolean
          licenses?: number
          owner?: string
          pricing_variation?: number
          products_assigned?: number
          revenue_mtd?: number
          risk_level?: string
          royalty_rate?: number
          state?: string
          status?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          country: string
          created_at: string
          due_at: string
          franchise: string
          franchise_id: string | null
          id: string
          issued_at: string
          number: string
          status: string
          tax: number
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          country?: string
          created_at?: string
          due_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          issued_at?: string
          number: string
          status?: string
          tax?: number
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          country?: string
          created_at?: string
          due_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          issued_at?: string
          number?: string
          status?: string
          tax?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string
          country: string
          created_at: string
          id: string
          name: string
          next_action: string | null
          owner: string | null
          score: number
          source: string
          stage: string
          updated_at: string
        }
        Insert: {
          company?: string
          country?: string
          created_at?: string
          id?: string
          name: string
          next_action?: string | null
          owner?: string | null
          score?: number
          source?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          company?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          next_action?: string | null
          owner?: string | null
          score?: number
          source?: string
          stage?: string
          updated_at?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          compliance_cleared: boolean
          created_at: string
          devices: number
          devices_max: number
          domains: number
          domains_max: number
          expires_at: string
          franchise: string
          franchise_id: string | null
          id: string
          issued_at: string
          key: string
          kyc_verified: boolean
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          compliance_cleared?: boolean
          created_at?: string
          devices?: number
          devices_max?: number
          domains?: number
          domains_max?: number
          expires_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          issued_at?: string
          key: string
          kyc_verified?: boolean
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          compliance_cleared?: boolean
          created_at?: string
          devices?: number
          devices_max?: number
          domains?: number
          domains_max?: number
          expires_at?: string
          franchise?: string
          franchise_id?: string | null
          id?: string
          issued_at?: string
          key?: string
          kyc_verified?: boolean
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          assigned_to: string | null
          city: string
          country: string
          created_at: string
          id: string
          locked: boolean
          market_size: number
          population: number
          region: string
          state: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          locked?: boolean
          market_size?: number
          population?: number
          region?: string
          state?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          locked?: boolean
          market_size?: number
          population?: number
          region?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fm_approve_application: {
        Args: { _application_id: string; _reviewer?: string }
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
  public: {
    Enums: {},
  },
} as const
