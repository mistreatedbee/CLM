export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'info_requested'
export type UserRole = 'applicant' | 'admin' | 'reviewer' | 'member'
export type LeadershipLevel = 'Trainee' | 'Deacon' | 'Elder' | 'Leader'
export type MemberStatus = 'active' | 'inactive' | 'suspended'
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          phone: string | null
          role: UserRole
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: UserRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          email?: string | null
          phone?: string | null
          role?: UserRole
          avatar_url?: string | null
          updated_at?: string
        }
      }
      clm_applications: {
        Row: {
          id: string
          ref: string
          full_name: string
          id_number: string
          gender: 'Male' | 'Female'
          marital_status: string
          whatsapp: string | null
          phone: string
          email: string | null
          physical_address: string
          country: string
          accepted_christ_date: string
          baptized: boolean
          attends_church: boolean
          church_name: string
          church_denomination: string
          pastor_name: string
          serves_ministry: boolean
          ministry_detail: string | null
          reason_joining: string
          leadership_experience: string
          spiritual_gifts: string
          growth_areas: string
          called_to_leadership: boolean
          leadership_vision_explanation: string
          long_term_vision: string
          reference_name: string
          reference_phone: string
          reference_relationship: string
          signature: string
          signature_date: string
          course: string | null
          status: ApplicationStatus
          assigned_admin: string | null
          admin_notes: string | null
          applicant_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ref?: string
          full_name: string
          id_number: string
          gender: 'Male' | 'Female'
          marital_status: string
          whatsapp?: string | null
          phone: string
          email?: string | null
          physical_address: string
          country?: string
          accepted_christ_date: string
          baptized: boolean
          attends_church: boolean
          church_name: string
          church_denomination: string
          pastor_name: string
          serves_ministry: boolean
          ministry_detail?: string | null
          reason_joining: string
          leadership_experience: string
          spiritual_gifts: string
          growth_areas: string
          called_to_leadership: boolean
          leadership_vision_explanation: string
          long_term_vision: string
          reference_name: string
          reference_phone: string
          reference_relationship: string
          signature: string
          signature_date: string
          course?: string | null
          status?: ApplicationStatus
          assigned_admin?: string | null
          admin_notes?: string | null
          applicant_user_id?: string | null
        }
        Update: {
          status?: ApplicationStatus
          assigned_admin?: string | null
          admin_notes?: string | null
          updated_at?: string
        }
      }
      application_notes: {
        Row: {
          id: string
          application_id: string
          author_id: string | null
          author_name: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          application_id: string
          author_id?: string | null
          author_name: string
          text: string
          created_at?: string
        }
        Update: never
      }
      members: {
        Row: {
          id: string
          member_number: string
          application_id: string | null
          full_name: string
          phone: string
          email: string | null
          church: string
          course: string | null
          leadership_level: LeadershipLevel
          status: MemberStatus
          joined_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_number: string
          application_id?: string | null
          full_name: string
          phone: string
          email?: string | null
          church: string
          course?: string | null
          leadership_level?: LeadershipLevel
          status?: MemberStatus
          joined_date?: string
        }
        Update: {
          course?: string | null
          leadership_level?: LeadershipLevel
          status?: MemberStatus
          updated_at?: string
        }
      }
      whatsapp_templates: {
        Row: {
          id: string
          name: string
          trigger_type: string
          body: string
          active: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          trigger_type: string
          body: string
          active?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          trigger_type?: string
          body?: string
          active?: boolean
          is_default?: boolean
          updated_at?: string
        }
      }
      whatsapp_logs: {
        Row: {
          id: string
          application_id: string | null
          applicant_name: string
          whatsapp_number: string
          template_id: string | null
          template_name: string | null
          message_body: string
          trigger_type: string
          sent_by: string
          sent_at: string
        }
        Insert: {
          id?: string
          application_id?: string | null
          applicant_name: string
          whatsapp_number: string
          template_id?: string | null
          template_name?: string | null
          message_body: string
          trigger_type: string
          sent_by?: string
          sent_at?: string
        }
        Update: never
      }
      whatsapp_settings: {
        Row: {
          id: number
          auto_send_on_submission: boolean
          auto_send_on_approval: boolean
          auto_send_on_rejection: boolean
        }
        Insert: {
          id?: number
          auto_send_on_submission?: boolean
          auto_send_on_approval?: boolean
          auto_send_on_rejection?: boolean
        }
        Update: {
          auto_send_on_submission?: boolean
          auto_send_on_approval?: boolean
          auto_send_on_rejection?: boolean
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: NotificationType
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: NotificationType
          read?: boolean
          created_at?: string
        }
        Update: {
          read?: boolean
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          actor_name: string | null
          action: string
          target_type: string
          target_id: string | null
          target_name: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          actor_name?: string | null
          action: string
          target_type: string
          target_id?: string | null
          target_name?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: never
      }
    }
    Functions: {
      generate_clm_ref: {
        Args: Record<never, never>
        Returns: string
      }
      generate_member_number: {
        Args: Record<never, never>
        Returns: string
      }
      is_admin: {
        Args: Record<never, never>
        Returns: boolean
      }
    }
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ClmApplication = Database['public']['Tables']['clm_applications']['Row']
export type ApplicationNote = Database['public']['Tables']['application_notes']['Row']
export type Member = Database['public']['Tables']['members']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type WhatsAppTemplate = Database['public']['Tables']['whatsapp_templates']['Row']
export type WhatsAppLog = Database['public']['Tables']['whatsapp_logs']['Row']
export type WhatsAppSettings = Database['public']['Tables']['whatsapp_settings']['Row']
