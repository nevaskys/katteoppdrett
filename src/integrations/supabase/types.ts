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
      cats: {
        Row: {
          breed: string
          breeder: string | null
          color: string | null
          created_at: string
          date_of_birth: string | null
          ems_code: string | null
          gender: string
          id: string
          images: string[] | null
          name: string
          notes: string | null
          owner: string | null
          pedigree_url: string | null
          registration_number: string | null
          updated_at: string
        }
        Insert: {
          breed: string
          breeder?: string | null
          color?: string | null
          created_at?: string
          date_of_birth?: string | null
          ems_code?: string | null
          gender: string
          id?: string
          images?: string[] | null
          name: string
          notes?: string | null
          owner?: string | null
          pedigree_url?: string | null
          registration_number?: string | null
          updated_at?: string
        }
        Update: {
          breed?: string
          breeder?: string | null
          color?: string | null
          created_at?: string
          date_of_birth?: string | null
          ems_code?: string | null
          gender?: string
          id?: string
          images?: string[] | null
          name?: string
          notes?: string | null
          owner?: string | null
          pedigree_url?: string | null
          registration_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      judges: {
        Row: {
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      judging_results: {
        Row: {
          cat_id: string
          created_at: string
          date: string
          id: string
          images: string[] | null
          judge_id: string | null
          my_rating: number | null
          notes: string | null
          ocr_text: string | null
          result: string | null
          show_id: string | null
          structured_result: Json | null
          updated_at: string
        }
        Insert: {
          cat_id: string
          created_at?: string
          date: string
          id?: string
          images?: string[] | null
          judge_id?: string | null
          my_rating?: number | null
          notes?: string | null
          ocr_text?: string | null
          result?: string | null
          show_id?: string | null
          structured_result?: Json | null
          updated_at?: string
        }
        Update: {
          cat_id?: string
          created_at?: string
          date?: string
          id?: string
          images?: string[] | null
          judge_id?: string | null
          my_rating?: number | null
          notes?: string | null
          ocr_text?: string | null
          result?: string | null
          show_id?: string | null
          structured_result?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "judging_results_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judging_results_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judging_results_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      kittens: {
        Row: {
          color: string | null
          created_at: string
          ems_code: string | null
          gender: string | null
          id: string
          images: string[] | null
          litter_id: string
          name: string | null
          notes: string | null
          reserved_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          ems_code?: string | null
          gender?: string | null
          id?: string
          images?: string[] | null
          litter_id: string
          name?: string | null
          notes?: string | null
          reserved_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          ems_code?: string | null
          gender?: string | null
          id?: string
          images?: string[] | null
          litter_id?: string
          name?: string | null
          notes?: string | null
          reserved_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kittens_litter_id_fkey"
            columns: ["litter_id"]
            isOneToOne: false
            referencedRelation: "litters"
            referencedColumns: ["id"]
          },
        ]
      }
      litters: {
        Row: {
          alternative_combinations: string | null
          birth_date: string | null
          blood_type_notes: string | null
          buyers_info: string | null
          completion_date: string | null
          created_at: string
          evaluation: string | null
          expected_date: string | null
          external_father_name: string | null
          external_father_pedigree_url: string | null
          father_id: string | null
          id: string
          inbreeding_coefficient: number | null
          kitten_count: number | null
          mating_date: string | null
          mating_date_from: string | null
          mating_date_to: string | null
          mother_id: string | null
          mother_weight_log: Json | null
          name: string
          notes: string | null
          nrr_registered: boolean | null
          pregnancy_notes: string | null
          reasoning: string | null
          status: string
          updated_at: string
        }
        Insert: {
          alternative_combinations?: string | null
          birth_date?: string | null
          blood_type_notes?: string | null
          buyers_info?: string | null
          completion_date?: string | null
          created_at?: string
          evaluation?: string | null
          expected_date?: string | null
          external_father_name?: string | null
          external_father_pedigree_url?: string | null
          father_id?: string | null
          id?: string
          inbreeding_coefficient?: number | null
          kitten_count?: number | null
          mating_date?: string | null
          mating_date_from?: string | null
          mating_date_to?: string | null
          mother_id?: string | null
          mother_weight_log?: Json | null
          name: string
          notes?: string | null
          nrr_registered?: boolean | null
          pregnancy_notes?: string | null
          reasoning?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          alternative_combinations?: string | null
          birth_date?: string | null
          blood_type_notes?: string | null
          buyers_info?: string | null
          completion_date?: string | null
          created_at?: string
          evaluation?: string | null
          expected_date?: string | null
          external_father_name?: string | null
          external_father_pedigree_url?: string | null
          father_id?: string | null
          id?: string
          inbreeding_coefficient?: number | null
          kitten_count?: number | null
          mating_date?: string | null
          mating_date_from?: string | null
          mating_date_to?: string | null
          mother_id?: string | null
          mother_weight_log?: Json | null
          name?: string
          notes?: string | null
          nrr_registered?: boolean | null
          pregnancy_notes?: string | null
          reasoning?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "litters_father_id_fkey"
            columns: ["father_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "litters_mother_id_fkey"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          created_at: string
          date: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          organization: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_cat_id: string | null
          related_litter_id: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_cat_id?: string | null
          related_litter_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_cat_id?: string | null
          related_litter_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_related_cat_id_fkey"
            columns: ["related_cat_id"]
            isOneToOne: false
            referencedRelation: "cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_litter_id_fkey"
            columns: ["related_litter_id"]
            isOneToOne: false
            referencedRelation: "litters"
            referencedColumns: ["id"]
          },
        ]
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
