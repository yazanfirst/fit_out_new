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
      companies: {
        Row: {
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      drawings: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          project_id: string
          storage_path: string
          type: Database["public"]["Enums"]["drawing_type"]
          updated_at: string
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          project_id: string
          storage_path: string
          type: Database["public"]["Enums"]["drawing_type"]
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          storage_path?: string
          type?: Database["public"]["Enums"]["drawing_type"]
          updated_at?: string
          upload_date?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drawings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          file_path: string | null
          id: string
          invoice_date: string
          invoice_number: string
          item_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          file_path?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          item_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          file_path?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          item_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_items: {
        Row: {
          category: string
          company: string | null
          company_id: string | null
          completion_percentage: number | null
          created_at: string
          id: string
          lpo_status: Database["public"]["Enums"]["lpo_status"] | null
          name: string
          notes: string | null
          project_id: string
          quantity: number | null
          scope: Database["public"]["Enums"]["project_scope"]
          status: Database["public"]["Enums"]["item_status"]
          updated_at: string
          work_description: string | null
        }
        Insert: {
          category: string
          company?: string | null
          company_id?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          lpo_status?: Database["public"]["Enums"]["lpo_status"] | null
          name: string
          notes?: string | null
          project_id: string
          quantity?: number | null
          scope: Database["public"]["Enums"]["project_scope"]
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
          work_description?: string | null
        }
        Update: {
          category?: string
          company?: string | null
          company_id?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          lpo_status?: Database["public"]["Enums"]["lpo_status"] | null
          name?: string
          notes?: string | null
          project_id?: string
          quantity?: number | null
          scope?: Database["public"]["Enums"]["project_scope"]
          status?: Database["public"]["Enums"]["item_status"]
          updated_at?: string
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          chain: string
          created_at: string
          end_date: string | null
          id: string
          location: string | null
          main_contractor: string | null
          name: string
          notes: string | null
          progress: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          chain: string
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          main_contractor?: string | null
          name: string
          notes?: string | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          chain?: string
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string | null
          main_contractor?: string | null
          name?: string
          notes?: string | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: []
      }
      timeline_milestones: {
        Row: {
          actual_date: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          planned_date: string
          project_id: string
          status: Database["public"]["Enums"]["timeline_status"]
          updated_at: string
        }
        Insert: {
          actual_date?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          planned_date: string
          project_id: string
          status?: Database["public"]["Enums"]["timeline_status"]
          updated_at?: string
        }
        Update: {
          actual_date?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          planned_date?: string
          project_id?: string
          status?: Database["public"]["Enums"]["timeline_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_milestones_project_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      drawing_type: "Drawing" | "Photo"
      invoice_status:
        | "Not Submitted"
        | "Submitted"
        | "Approved"
        | "Paid"
        | "Rejected"
      invoice_type: "25%" | "50%" | "100%"
      item_category:
        | "S/S Items"
        | "Furniture"
        | "Signage"
        | "Fire Suppression"
        | "Smallware"
        | "Cold Room"
        | "Equipment"
      item_status:
        | "Ordered"
        | "Not Ordered"
        | "Partially Ordered"
        | "Delivered"
        | "Installed"
      lpo_status: "LPO Received" | "LPO Pending" | "N/A"
      project_scope: "Owner" | "Contractor"
      project_status:
        | "In Progress"
        | "Completed"
        | "Delayed"
        | "On Hold"
        | "Not Started"
      timeline_status: "Not Started" | "In Progress" | "Completed" | "Delayed"
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
    Enums: {
      drawing_type: ["Drawing", "Photo"],
      invoice_status: [
        "Not Submitted",
        "Submitted",
        "Approved",
        "Paid",
        "Rejected",
      ],
      invoice_type: ["25%", "50%", "100%"],
      item_category: [
        "S/S Items",
        "Furniture",
        "Signage",
        "Fire Suppression",
        "Smallware",
        "Cold Room",
        "Equipment",
      ],
      item_status: [
        "Ordered",
        "Not Ordered",
        "Partially Ordered",
        "Delivered",
        "Installed",
      ],
      lpo_status: ["LPO Received", "LPO Pending", "N/A"],
      project_scope: ["Owner", "Contractor"],
      project_status: [
        "In Progress",
        "Completed",
        "Delayed",
        "On Hold",
        "Not Started",
      ],
      timeline_status: ["Not Started", "In Progress", "Completed", "Delayed"],
    },
  },
} as const
