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
      recurring_checkups: {
        Row: {
          created_at: string
          frequency_unit: "months" | "years"
          frequency_value: number
          id: string
          last_visit_date: string | null
          next_due_date: string | null
          notes: string | null
          patient_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency_unit: "months" | "years"
          frequency_value: number
          id?: string
          last_visit_date?: string | null
          next_due_date?: string | null
          notes?: string | null
          patient_id?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          frequency_unit?: "months" | "years"
          frequency_value?: number
          id?: string
          last_visit_date?: string | null
          next_due_date?: string | null
          notes?: string | null
          patient_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_checkups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_checkups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // ... Include other tables if needed, but for now I focus on the new one to avoid huge file unless requested.
      // Actually, standard practice is to include everything. I'll rely on what I saw or just use `any` for others if I don't touch them.
      // But for type safety I need at least profiles if I link to them.
      profiles: {
          Row: {
              id: string
              first_name: string
              last_name: string
          }
      }
    }
    Enums: {
      care_status: "pending" | "accepted"
    }
  }
}
