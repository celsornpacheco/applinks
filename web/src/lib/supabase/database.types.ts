// Gerado pelo Supabase a partir do banco (projeto inovapet-manutencao). Não edite à mão:
// depois de uma migração, gere de novo.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          parent_id: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "areas_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
          { foreignKeyName: "areas_site_id_fkey"; columns: ["site_id"]; isOneToOne: false; referencedRelation: "sites"; referencedColumns: ["id"] },
        ]
      }
      asset_downtimes: {
        Row: {
          asset_id: string
          created_at: string
          created_by: string | null
          ended_at: string | null
          id: string
          reason: string | null
          started_at: string
          work_order_id: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at: string
          work_order_id?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "asset_downtimes_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] },
          { foreignKeyName: "asset_downtimes_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "asset_downtimes_work_order_fk"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      assets: {
        Row: {
          area_id: string
          created_at: string
          criticality: string
          extra: Json
          id: string
          manufacturer: string | null
          model: string | null
          name: string
          photo_path: string | null
          qr_token: string
          responsible_id: string | null
          serial_number: string | null
          status: string
          system_id: string | null
          tag: string
          updated_at: string
          year: number | null
        }
        Insert: {
          area_id: string
          created_at?: string
          criticality?: string
          extra?: Json
          id?: string
          manufacturer?: string | null
          model?: string | null
          name: string
          photo_path?: string | null
          qr_token?: string
          responsible_id?: string | null
          serial_number?: string | null
          status?: string
          system_id?: string | null
          tag: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          area_id?: string
          created_at?: string
          criticality?: string
          extra?: Json
          id?: string
          manufacturer?: string | null
          model?: string | null
          name?: string
          photo_path?: string | null
          qr_token?: string
          responsible_id?: string | null
          serial_number?: string | null
          status?: string
          system_id?: string | null
          tag?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          { foreignKeyName: "assets_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
          { foreignKeyName: "assets_responsible_id_fkey"; columns: ["responsible_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "assets_system_id_fkey"; columns: ["system_id"]; isOneToOne: false; referencedRelation: "systems"; referencedColumns: ["id"] },
        ]
      }
      attachments: {
        Row: {
          asset_id: string | null
          caption: string | null
          checklist_item_id: string | null
          created_at: string
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          taken_at: string | null
          uploaded_by: string | null
          work_order_id: string | null
        }
        Insert: {
          asset_id?: string | null
          caption?: string | null
          checklist_item_id?: string | null
          created_at?: string
          id?: string
          mime_type: string
          size_bytes: number
          storage_path: string
          taken_at?: string | null
          uploaded_by?: string | null
          work_order_id?: string | null
        }
        Update: {
          asset_id?: string | null
          caption?: string | null
          checklist_item_id?: string | null
          created_at?: string
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          taken_at?: string | null
          uploaded_by?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          { foreignKeyName: "attachments_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] },
          { foreignKeyName: "attachments_checklist_item_id_fkey"; columns: ["checklist_item_id"]; isOneToOne: false; referencedRelation: "checklist_items"; referencedColumns: ["id"] },
          { foreignKeyName: "attachments_uploaded_by_fkey"; columns: ["uploaded_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "attachments_work_order_id_fkey"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      categories: {
        Row: { active: boolean; created_at: string; id: string; name: string; updated_at: string }
        Insert: { active?: boolean; created_at?: string; id?: string; name: string; updated_at?: string }
        Update: { active?: boolean; created_at?: string; id?: string; name?: string; updated_at?: string }
        Relationships: []
      }
      checklist_answers: {
        Row: {
          answered_at: string
          answered_by: string | null
          created_at: string
          id: string
          item_id: string
          out_of_range: boolean
          updated_at: string
          value_bool: boolean | null
          value_number: number | null
          value_text: string | null
          work_order_id: string
        }
        Insert: {
          answered_at?: string
          answered_by?: string | null
          created_at?: string
          id?: string
          item_id: string
          out_of_range?: boolean
          updated_at?: string
          value_bool?: boolean | null
          value_number?: number | null
          value_text?: string | null
          work_order_id: string
        }
        Update: {
          answered_at?: string
          answered_by?: string | null
          created_at?: string
          id?: string
          item_id?: string
          out_of_range?: boolean
          updated_at?: string
          value_bool?: boolean | null
          value_number?: number | null
          value_text?: string | null
          work_order_id?: string
        }
        Relationships: [
          { foreignKeyName: "checklist_answers_answered_by_fkey"; columns: ["answered_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "checklist_answers_item_id_fkey"; columns: ["item_id"]; isOneToOne: false; referencedRelation: "checklist_items"; referencedColumns: ["id"] },
          { foreignKeyName: "checklist_answers_work_order_id_fkey"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      checklist_items: {
        Row: {
          archived: boolean
          created_at: string
          critical: boolean
          id: string
          kind: string
          label: string
          max_value: number | null
          min_value: number | null
          options: Json | null
          position: number
          required: boolean
          template_id: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          critical?: boolean
          id?: string
          kind: string
          label: string
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          position: number
          required?: boolean
          template_id: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          critical?: boolean
          id?: string
          kind?: string
          label?: string
          max_value?: number | null
          min_value?: number | null
          options?: Json | null
          position?: number
          required?: boolean
          template_id?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "checklist_items_template_id_fkey"; columns: ["template_id"]; isOneToOne: false; referencedRelation: "checklist_templates"; referencedColumns: ["id"] },
        ]
      }
      checklist_templates: {
        Row: { active: boolean; created_at: string; id: string; name: string; system_id: string | null; updated_at: string }
        Insert: { active?: boolean; created_at?: string; id?: string; name: string; system_id?: string | null; updated_at?: string }
        Update: { active?: boolean; created_at?: string; id?: string; name?: string; system_id?: string | null; updated_at?: string }
        Relationships: [
          { foreignKeyName: "checklist_templates_system_id_fkey"; columns: ["system_id"]; isOneToOne: false; referencedRelation: "systems"; referencedColumns: ["id"] },
        ]
      }
      documents: {
        Row: {
          area_id: string | null
          asset_id: string | null
          created_at: string
          expires_on: string | null
          id: string
          kind: string
          name: string
          storage_path: string
          system_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          area_id?: string | null
          asset_id?: string | null
          created_at?: string
          expires_on?: string | null
          id?: string
          kind?: string
          name: string
          storage_path: string
          system_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          area_id?: string | null
          asset_id?: string | null
          created_at?: string
          expires_on?: string | null
          id?: string
          kind?: string
          name?: string
          storage_path?: string
          system_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          { foreignKeyName: "documents_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_system_id_fkey"; columns: ["system_id"]; isOneToOne: false; referencedRelation: "systems"; referencedColumns: ["id"] },
          { foreignKeyName: "documents_uploaded_by_fkey"; columns: ["uploaded_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      maintenance_plans: {
        Row: {
          active: boolean
          assignee_id: string | null
          created_at: string
          created_by: string | null
          ends_on: string | null
          estimated_minutes: number | null
          every_n: number
          every_unit: string
          id: string
          name: string
          priority: string
          starts_on: string
          team_id: string | null
          template_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          estimated_minutes?: number | null
          every_n: number
          every_unit: string
          id?: string
          name: string
          priority?: string
          starts_on: string
          team_id?: string | null
          template_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          estimated_minutes?: number | null
          every_n?: number
          every_unit?: string
          id?: string
          name?: string
          priority?: string
          starts_on?: string
          team_id?: string | null
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "maintenance_plans_assignee_id_fkey"; columns: ["assignee_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "maintenance_plans_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "maintenance_plans_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "teams"; referencedColumns: ["id"] },
          { foreignKeyName: "maintenance_plans_template_id_fkey"; columns: ["template_id"]; isOneToOne: false; referencedRelation: "checklist_templates"; referencedColumns: ["id"] },
        ]
      }
      material_requests: {
        Row: {
          created_at: string
          currency: string
          decided_at: string | null
          decided_by: string | null
          free_text: string | null
          id: string
          material_id: string | null
          note: string | null
          quantity: number
          requested_by: string | null
          status: string
          unit_cost_cents: number | null
          updated_at: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          decided_at?: string | null
          decided_by?: string | null
          free_text?: string | null
          id?: string
          material_id?: string | null
          note?: string | null
          quantity: number
          requested_by?: string | null
          status?: string
          unit_cost_cents?: number | null
          updated_at?: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          decided_at?: string | null
          decided_by?: string | null
          free_text?: string | null
          id?: string
          material_id?: string | null
          note?: string | null
          quantity?: number
          requested_by?: string | null
          status?: string
          unit_cost_cents?: number | null
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          { foreignKeyName: "material_requests_decided_by_fkey"; columns: ["decided_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "material_requests_material_id_fkey"; columns: ["material_id"]; isOneToOne: false; referencedRelation: "materials"; referencedColumns: ["id"] },
          { foreignKeyName: "material_requests_requested_by_fkey"; columns: ["requested_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "material_requests_work_order_id_fkey"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      materials: {
        Row: { active: boolean; code: string; created_at: string; id: string; name: string; unit: string; updated_at: string }
        Insert: { active?: boolean; code: string; created_at?: string; id?: string; name: string; unit?: string; updated_at?: string }
        Update: { active?: boolean; code?: string; created_at?: string; id?: string; name?: string; unit?: string; updated_at?: string }
        Relationships: []
      }
      notifications: {
        Row: { created_at: string; id: string; kind: string; profile_id: string; read_at: string | null; title: string; work_order_id: string | null }
        Insert: { created_at?: string; id?: string; kind: string; profile_id: string; read_at?: string | null; title: string; work_order_id?: string | null }
        Update: { created_at?: string; id?: string; kind?: string; profile_id?: string; read_at?: string | null; title?: string; work_order_id?: string | null }
        Relationships: [
          { foreignKeyName: "notifications_profile_id_fkey"; columns: ["profile_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_work_order_id_fkey"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      plan_assets: {
        Row: { asset_id: string; plan_id: string }
        Insert: { asset_id: string; plan_id: string }
        Update: { asset_id?: string; plan_id?: string }
        Relationships: [
          { foreignKeyName: "plan_assets_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] },
          { foreignKeyName: "plan_assets_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "maintenance_plans"; referencedColumns: ["id"] },
        ]
      }
      profile_areas: {
        Row: { area_id: string; profile_id: string }
        Insert: { area_id: string; profile_id: string }
        Update: { area_id?: string; profile_id?: string }
        Relationships: [
          { foreignKeyName: "profile_areas_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
          { foreignKeyName: "profile_areas_profile_id_fkey"; columns: ["profile_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      profiles: {
        Row: { active: boolean; created_at: string; email: string; full_name: string; id: string; role: string; team_id: string | null; updated_at: string }
        Insert: { active?: boolean; created_at?: string; email: string; full_name: string; id: string; role?: string; team_id?: string | null; updated_at?: string }
        Update: { active?: boolean; created_at?: string; email?: string; full_name?: string; id?: string; role?: string; team_id?: string | null; updated_at?: string }
        Relationships: [
          { foreignKeyName: "profiles_team_id_fkey"; columns: ["team_id"]; isOneToOne: false; referencedRelation: "teams"; referencedColumns: ["id"] },
        ]
      }
      settings: {
        Row: {
          email_notifications: boolean
          id: boolean
          preventive_horizon_days: number
          requester_sees_costs: boolean
          require_signature: boolean
          sla_risk_percent: number
          updated_at: string
        }
        Insert: {
          email_notifications?: boolean
          id?: boolean
          preventive_horizon_days?: number
          requester_sees_costs?: boolean
          require_signature?: boolean
          sla_risk_percent?: number
          updated_at?: string
        }
        Update: {
          email_notifications?: boolean
          id?: boolean
          preventive_horizon_days?: number
          requester_sees_costs?: boolean
          require_signature?: boolean
          sla_risk_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      signatures: {
        Row: { created_at: string; id: string; signed_at: string; signer_id: string | null; signer_name: string; signer_role: string; storage_path: string; work_order_id: string }
        Insert: { created_at?: string; id?: string; signed_at: string; signer_id?: string | null; signer_name: string; signer_role: string; storage_path: string; work_order_id: string }
        Update: { created_at?: string; id?: string; signed_at?: string; signer_id?: string | null; signer_name?: string; signer_role?: string; storage_path?: string; work_order_id?: string }
        Relationships: [
          { foreignKeyName: "signatures_signer_id_fkey"; columns: ["signer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "signatures_work_order_id_fkey"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      sites: {
        Row: { address: string | null; city: string | null; created_at: string; id: string; name: string; state: string | null; updated_at: string }
        Insert: { address?: string | null; city?: string | null; created_at?: string; id?: string; name: string; state?: string | null; updated_at?: string }
        Update: { address?: string | null; city?: string | null; created_at?: string; id?: string; name?: string; state?: string | null; updated_at?: string }
        Relationships: []
      }
      sla_rules: {
        Row: { category_id: string | null; created_at: string; id: string; priority: string; resolution_minutes: number; response_minutes: number; updated_at: string }
        Insert: { category_id?: string | null; created_at?: string; id?: string; priority: string; resolution_minutes: number; response_minutes: number; updated_at?: string }
        Update: { category_id?: string | null; created_at?: string; id?: string; priority?: string; resolution_minutes?: number; response_minutes?: number; updated_at?: string }
        Relationships: [
          { foreignKeyName: "sla_rules_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
        ]
      }
      systems: {
        Row: { created_at: string; id: string; name: string; updated_at: string }
        Insert: { created_at?: string; id?: string; name: string; updated_at?: string }
        Update: { created_at?: string; id?: string; name?: string; updated_at?: string }
        Relationships: []
      }
      teams: {
        Row: { created_at: string; id: string; name: string; updated_at: string }
        Insert: { created_at?: string; id?: string; name: string; updated_at?: string }
        Update: { created_at?: string; id?: string; name?: string; updated_at?: string }
        Relationships: []
      }
      time_entries: {
        Row: { created_at: string; ended_at: string; id: string; profile_id: string; started_at: string; work_order_id: string }
        Insert: { created_at?: string; ended_at: string; id?: string; profile_id: string; started_at: string; work_order_id: string }
        Update: { created_at?: string; ended_at?: string; id?: string; profile_id?: string; started_at?: string; work_order_id?: string }
        Relationships: [
          { foreignKeyName: "time_entries_profile_id_fkey"; columns: ["profile_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "time_entries_work_order_id_fkey"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      work_order_events: {
        Row: { actor_id: string | null; created_at: string; from_value: string | null; id: number; kind: string; note: string | null; to_value: string | null; work_order_id: string }
        Insert: { actor_id?: string | null; created_at?: string; from_value?: string | null; id?: never; kind: string; note?: string | null; to_value?: string | null; work_order_id: string }
        Update: { actor_id?: string | null; created_at?: string; from_value?: string | null; id?: never; kind?: string; note?: string | null; to_value?: string | null; work_order_id?: string }
        Relationships: [
          { foreignKeyName: "work_order_events_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "work_order_events_work_order_id_fkey"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      work_order_technicians: {
        Row: { assigned_at: string; profile_id: string; work_order_id: string }
        Insert: { assigned_at?: string; profile_id: string; work_order_id: string }
        Update: { assigned_at?: string; profile_id?: string; work_order_id?: string }
        Relationships: [
          { foreignKeyName: "work_order_technicians_profile_id_fkey"; columns: ["profile_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "work_order_technicians_work_order_id_fkey"; columns: ["work_order_id"]; isOneToOne: false; referencedRelation: "work_orders"; referencedColumns: ["id"] },
        ]
      }
      work_orders: {
        Row: {
          area_id: string
          asset_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          category_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_minutes: number | null
          first_action_at: string | null
          id: string
          kind: string
          machine_stopped: boolean
          number: number
          opened_at: string
          opened_by: string | null
          origin: string
          plan_id: string | null
          priority: string
          rating: number | null
          rating_comment: string | null
          reopen_count: number
          resolution_due_at: string | null
          response_due_at: string | null
          scheduled_for: string | null
          started_at: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area_id: string
          asset_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          first_action_at?: string | null
          id?: string
          kind: string
          machine_stopped?: boolean
          number?: number
          opened_at?: string
          opened_by?: string | null
          origin?: string
          plan_id?: string | null
          priority?: string
          rating?: number | null
          rating_comment?: string | null
          reopen_count?: number
          resolution_due_at?: string | null
          response_due_at?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area_id?: string
          asset_id?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          first_action_at?: string | null
          id?: string
          kind?: string
          machine_stopped?: boolean
          number?: number
          opened_at?: string
          opened_by?: string | null
          origin?: string
          plan_id?: string | null
          priority?: string
          rating?: number | null
          rating_comment?: string | null
          reopen_count?: number
          resolution_due_at?: string | null
          response_due_at?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "work_orders_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
          { foreignKeyName: "work_orders_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] },
          { foreignKeyName: "work_orders_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
          { foreignKeyName: "work_orders_opened_by_fkey"; columns: ["opened_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "work_orders_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "maintenance_plans"; referencedColumns: ["id"] },
          { foreignKeyName: "work_orders_template_id_fkey"; columns: ["template_id"]; isOneToOne: false; referencedRelation: "checklist_templates"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      v_asset_mtbf: {
        Row: { asset_id: string | null; failures: number | null; mtbf_hours: number | null }
        Relationships: [
          { foreignKeyName: "work_orders_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] },
        ]
      }
      v_asset_mttr: {
        Row: { asset_id: string | null; mttr_hours: number | null; repairs: number | null }
        Relationships: [
          { foreignKeyName: "work_orders_asset_id_fkey"; columns: ["asset_id"]; isOneToOne: false; referencedRelation: "assets"; referencedColumns: ["id"] },
        ]
      }
      v_plan_adherence: {
        Row: { area_id: string | null; done: number | null; month: string | null; on_time: number | null; planned: number | null }
        Relationships: [
          { foreignKeyName: "work_orders_area_id_fkey"; columns: ["area_id"]; isOneToOne: false; referencedRelation: "areas"; referencedColumns: ["id"] },
        ]
      }
      v_sla_monthly: {
        Row: {
          category_id: string | null
          month: string | null
          priority: string | null
          reopened: number | null
          resolution_ok: number | null
          response_ok: number | null
          total: number | null
        }
        Relationships: [
          { foreignKeyName: "work_orders_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
        ]
      }
      v_work_order_hours: {
        Row: { estimated_minutes: number | null; logged_minutes: number | null; work_order_id: string | null }
        Relationships: []
      }
    }
    Functions: {
      can_see_area: { Args: { p_area: string }; Returns: boolean }
      can_see_work_order: { Args: { p_wo: string }; Returns: boolean }
      check_sla: { Args: never; Returns: number }
      current_role_name: { Args: never; Returns: string }
      generate_preventive_work_orders: { Args: { p_plan?: string }; Returns: number }
      is_manager: { Args: never; Returns: boolean }
      reschedule_plan: { Args: { p_plan: string }; Returns: number }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]
export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
