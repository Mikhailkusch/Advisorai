export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          email: string
          last_contact: string
          status: 'active' | 'pending' | 'inactive'
          portfolio_value: number
          risk_profile: 'conservative' | 'moderate' | 'aggressive'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      prompts: {
        Row: {
          id: string
          category: string
          prompt: string
          description: string
          response_type: 'email' | 'proposal'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['prompts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['prompts']['Insert']>
      }
      responses: {
        Row: {
          id: string
          client_id: string
          summary: string
          content: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          category: string
          missing_info: string[]
          response_type: 'email' | 'proposal'
          full_query: Json
        }
        Insert: Omit<Database['public']['Tables']['responses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['responses']['Insert']>
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
  }
} 