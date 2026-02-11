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
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string
          id: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      category_settings: {
        Row: {
          category_slug: string
          coming_soon: boolean
          id: string
          updated_at: string
        }
        Insert: {
          category_slug: string
          coming_soon?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          category_slug?: string
          coming_soon?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          custom_order_id: string | null
          customer_name: string
          customer_whatsapp: string
          delivery_address: string | null
          delivery_date: string | null
          delivery_notes: string | null
          delivery_time: string | null
          id: string
          order_id: string
          package_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_order_id?: string | null
          customer_name: string
          customer_whatsapp: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_notes?: string | null
          delivery_time?: string | null
          id?: string
          order_id: string
          package_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_order_id?: string | null
          customer_name?: string
          customer_whatsapp?: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_notes?: string | null
          delivery_time?: string | null
          id?: string
          order_id?: string
          package_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          order_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          order_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          order_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean
          message: string | null
          order_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message?: string | null
          order_id: string
          sender_id: string
          sender_role: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message?: string | null
          order_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_response: string | null
          admin_set_price: number | null
          created_at: string
          custom_order_id: string | null
          custom_request: string | null
          customer_email: string
          customer_name: string
          customer_whatsapp: string
          delivery_address: string | null
          delivery_date: string | null
          delivery_notes: string | null
          delivery_time: string | null
          discount_amount: number | null
          final_price: number
          id: string
          installment_plan: string | null
          notes: string | null
          package_class: string | null
          package_name: string
          payment_method: string
          payment_proof_type: string | null
          payment_proof_url: string | null
          payment_reference: string | null
          payment_status: string | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          quantity: number
          status: string
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          admin_set_price?: number | null
          created_at?: string
          custom_order_id?: string | null
          custom_request?: string | null
          customer_email: string
          customer_name: string
          customer_whatsapp: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_notes?: string | null
          delivery_time?: string | null
          discount_amount?: number | null
          final_price: number
          id?: string
          installment_plan?: string | null
          notes?: string | null
          package_class?: string | null
          package_name: string
          payment_method: string
          payment_proof_type?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          quantity?: number
          status?: string
          total_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          admin_set_price?: number | null
          created_at?: string
          custom_order_id?: string | null
          custom_request?: string | null
          customer_email?: string
          customer_name?: string
          customer_whatsapp?: string
          delivery_address?: string | null
          delivery_date?: string | null
          delivery_notes?: string | null
          delivery_time?: string | null
          discount_amount?: number | null
          final_price?: number
          id?: string
          installment_plan?: string | null
          notes?: string | null
          package_class?: string | null
          package_name?: string
          payment_method?: string
          payment_proof_type?: string | null
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          quantity?: number
          status?: string
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      package_classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          package_id: string
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          package_id: string
          price: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          package_id?: string
          price?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_classes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          base_price: number | null
          category_id: string
          class_image_url: string | null
          created_at: string
          description: string | null
          has_classes: boolean
          id: string
          image_url: string | null
          is_hidden: boolean
          name: string
          starting_price: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category_id: string
          class_image_url?: string | null
          created_at?: string
          description?: string | null
          has_classes?: boolean
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          name: string
          starting_price?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category_id?: string
          class_image_url?: string | null
          created_at?: string
          description?: string | null
          has_classes?: boolean
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          name?: string
          starting_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          account_name: string
          account_number: string
          additional_note: string | null
          bank_name: string
          id: string
          updated_at: string
        }
        Insert: {
          account_name?: string
          account_number?: string
          additional_note?: string | null
          bank_name?: string
          id?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          additional_note?: string | null
          bank_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_custom_order_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "super_admin"
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
      app_role: ["admin", "customer", "super_admin"],
    },
  },
} as const
