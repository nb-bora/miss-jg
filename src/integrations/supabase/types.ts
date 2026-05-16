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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      candidates: {
        Row: {
          bio: string | null
          category: Database["public"]["Enums"]["candidate_category"]
          created_at: string
          display_order: number
          gallery: Json
          id: string
          is_active: boolean
          name: string
          photo_url: string | null
          slug: string
          socials: Json
          updated_at: string
        }
        Insert: {
          bio?: string | null
          category?: Database["public"]["Enums"]["candidate_category"]
          created_at?: string
          display_order?: number
          gallery?: Json
          id?: string
          is_active?: boolean
          name: string
          photo_url?: string | null
          slug: string
          socials?: Json
          updated_at?: string
        }
        Update: {
          bio?: string | null
          category?: Database["public"]["Enums"]["candidate_category"]
          created_at?: string
          display_order?: number
          gallery?: Json
          id?: string
          is_active?: boolean
          name?: string
          photo_url?: string | null
          slug?: string
          socials?: Json
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      vote_packages: {
        Row: {
          amount: number
          created_at: string
          currency: string
          display_order: number
          id: string
          is_active: boolean
          label: string
          votes: number
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          votes: number
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          votes?: number
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          new_status: Database["public"]["Enums"]["payment_status"] | null
          payload: Json
          previous_status: Database["public"]["Enums"]["payment_status"] | null
          provider_ref: string
          source: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          new_status?: Database["public"]["Enums"]["payment_status"] | null
          payload?: Json
          previous_status?: Database["public"]["Enums"]["payment_status"] | null
          provider_ref: string
          source: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          new_status?: Database["public"]["Enums"]["payment_status"] | null
          payload?: Json
          previous_status?: Database["public"]["Enums"]["payment_status"] | null
          provider_ref?: string
          source?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "vote_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      vote_transactions: {
        Row: {
          amount: number
          buyer_contact: string | null
          buyer_name: string | null
          candidate_id: string
          created_at: string
          currency: string
          id: string
          metadata: Json
          operator: string | null
          package_id: string | null
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          provider: string
          provider_ref: string
          vote_count: number
        }
        Insert: {
          amount: number
          buyer_contact?: string | null
          buyer_name?: string | null
          candidate_id: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          operator?: string | null
          package_id?: string | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider: string
          provider_ref: string
          vote_count: number
        }
        Update: {
          amount?: number
          buyer_contact?: string | null
          buyer_name?: string | null
          candidate_id?: string
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          operator?: string | null
          package_id?: string | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider?: string
          provider_ref?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "vote_transactions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_transactions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "vote_packages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      candidate_stats: {
        Row: {
          bio: string | null
          category: Database["public"]["Enums"]["candidate_category"] | null
          display_order: number | null
          id: string | null
          is_active: boolean | null
          name: string | null
          photo_url: string | null
          slug: string | null
          socials: Json | null
          total_collected: number | null
          total_votes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      candidate_category: "miss" | "master"
      payment_status: "pending" | "paid" | "failed" | "refunded"
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
      candidate_category: ["miss", "master"],
      payment_status: ["pending", "paid", "failed", "refunded"],
    },
  },
} as const
