export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      bills: {
        Row: {
          data: Json
          description: string | null
          id: string
          last_updated: string | null
          status: string | null
          title: string
        }
        Insert: {
          data: Json
          description?: string | null
          id: string
          last_updated?: string | null
          status?: string | null
          title: string
        }
        Update: {
          data?: Json
          description?: string | null
          id?: string
          last_updated?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      IL_legislators: {
        Row: {
          biography: string | null
          birth_date: string | null
          capitol_address: string | null
          capitol_fax: string | null
          capitol_voice: string | null
          current_chamber: string | null
          current_district: number | null
          current_party: string | null
          death_date: string | null
          district_address: string | null
          district_fax: string | null
          district_voice: string | null
          email: string | null
          facebook: string | null
          family_name: string | null
          gender: string | null
          given_name: string | null
          id: string | null
          image: string | null
          instagram: string | null
          links: string | null
          name: string | null
          sources: string | null
          twitter: string | null
          wikidata: string | null
          youtube: string | null
        }
        Insert: {
          biography?: string | null
          birth_date?: string | null
          capitol_address?: string | null
          capitol_fax?: string | null
          capitol_voice?: string | null
          current_chamber?: string | null
          current_district?: number | null
          current_party?: string | null
          death_date?: string | null
          district_address?: string | null
          district_fax?: string | null
          district_voice?: string | null
          email?: string | null
          facebook?: string | null
          family_name?: string | null
          gender?: string | null
          given_name?: string | null
          id?: string | null
          image?: string | null
          instagram?: string | null
          links?: string | null
          name?: string | null
          sources?: string | null
          twitter?: string | null
          wikidata?: string | null
          youtube?: string | null
        }
        Update: {
          biography?: string | null
          birth_date?: string | null
          capitol_address?: string | null
          capitol_fax?: string | null
          capitol_voice?: string | null
          current_chamber?: string | null
          current_district?: number | null
          current_party?: string | null
          death_date?: string | null
          district_address?: string | null
          district_fax?: string | null
          district_voice?: string | null
          email?: string | null
          facebook?: string | null
          family_name?: string | null
          gender?: string | null
          given_name?: string | null
          id?: string | null
          image?: string | null
          instagram?: string | null
          links?: string | null
          name?: string | null
          sources?: string | null
          twitter?: string | null
          wikidata?: string | null
          youtube?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
