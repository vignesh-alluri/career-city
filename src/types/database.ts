/**
 * Database types generated from the live Supabase schema (public schema, helper types omitted).
 * Do not edit by hand: regenerate after every migration so TypeScript catches schema drift.
 */
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
      applications: {
        Row: {
          application_url: string | null
          board_position: number
          company: string
          company_website: string | null
          created_at: string
          date_applied: string | null
          deadline: string | null
          employment_type: string
          id: string
          job_description: string | null
          location: string | null
          notes: string | null
          role: string
          status: Database['public']['Enums']['application_status']
          updated_at: string
          user_id: string
        }
        Insert: {
          application_url?: string | null
          board_position?: number
          company: string
          company_website?: string | null
          created_at?: string
          date_applied?: string | null
          deadline?: string | null
          employment_type?: string
          id?: string
          job_description?: string | null
          location?: string | null
          notes?: string | null
          role: string
          status?: Database['public']['Enums']['application_status']
          updated_at?: string
          user_id?: string
        }
        Update: {
          application_url?: string | null
          board_position?: number
          company?: string
          company_website?: string | null
          created_at?: string
          date_applied?: string | null
          deadline?: string | null
          employment_type?: string
          id?: string
          job_description?: string | null
          location?: string | null
          notes?: string | null
          role?: string
          status?: Database['public']['Enums']['application_status']
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: { created_at: string; display_name: string | null; id: string }
        Insert: { created_at?: string; display_name?: string | null; id: string }
        Update: { created_at?: string; display_name?: string | null; id?: string }
        Relationships: []
      }
      reminders: {
        Row: {
          application_id: string | null
          completed: boolean
          created_at: string
          due_at: string
          id: string
          title: string
          type: Database['public']['Enums']['reminder_type']
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          completed?: boolean
          created_at?: string
          due_at: string
          id?: string
          title: string
          type?: Database['public']['Enums']['reminder_type']
          updated_at?: string
          user_id?: string
        }
        Update: {
          application_id?: string | null
          completed?: boolean
          created_at?: string
          due_at?: string
          id?: string
          title?: string
          type?: Database['public']['Enums']['reminder_type']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reminders_application_id_fkey'
            columns: ['application_id']
            isOneToOne: false
            referencedRelation: 'applications'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      application_status: 'saved' | 'applied' | 'assessment' | 'interview' | 'offered' | 'accepted' | 'rejected'
      reminder_type: 'interview' | 'follow_up' | 'deadline' | 'custom'
    }
    CompositeTypes: { [_ in never]: never }
  }
}
