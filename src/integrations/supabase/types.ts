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
      otp_codes: {
        Row: {
          attempts: number
          code: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          ai_confidence_score: number | null
          created_at: string
          description: string | null
          extraction_warnings: string[] | null
          id: string
          images: string[] | null
          missing_fields: string[] | null
          name: string
          price: number | null
          source_type: string | null
          source_url: string | null
          status: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          ai_confidence_score?: number | null
          created_at?: string
          description?: string | null
          extraction_warnings?: string[] | null
          id?: string
          images?: string[] | null
          missing_fields?: string[] | null
          name: string
          price?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          ai_confidence_score?: number | null
          created_at?: string
          description?: string | null
          extraction_warnings?: string[] | null
          id?: string
          images?: string[] | null
          missing_fields?: string[] | null
          name?: string
          price?: number | null
          source_type?: string | null
          source_url?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          page_id: string | null
          page_url: string
          platform: string
          store_id: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          page_id?: string | null
          page_url: string
          platform: string
          store_id: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          page_id?: string | null
          page_url?: string
          platform?: string
          store_id?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          logo: string | null
          name: string
          slug: string
          status: string | null
          updated_at: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          name: string
          slug: string
          status?: string | null
          updated_at?: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          logo?: string | null
          name?: string
          slug?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          buyer_email: string | null
          buyer_id: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          description: string | null
          estimated_delivery: string | null
          id: string
          item_name: string
          payment_method: string | null
          payment_reference: string | null
          seller_id: string
          shipping_courier: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          description?: string | null
          estimated_delivery?: string | null
          id?: string
          item_name: string
          payment_method?: string | null
          payment_reference?: string | null
          seller_id: string
          shipping_courier?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          description?: string | null
          estimated_delivery?: string | null
          id?: string
          item_name?: string
          payment_method?: string | null
          payment_reference?: string | null
          seller_id?: string
          shipping_courier?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available_balance: number | null
          created_at: string
          id: string
          pending_balance: number | null
          total_earned: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number | null
          created_at?: string
          id?: string
          pending_balance?: number | null
          total_earned?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number | null
          created_at?: string
          id?: string
          pending_balance?: number | null
          total_earned?: number | null
          updated_at?: string
          user_id?: string
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
