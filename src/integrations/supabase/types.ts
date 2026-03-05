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
      ad_placements: {
        Row: {
          active: boolean
          click_url: string | null
          config: Json | null
          content: string | null
          created_at: string
          end_date: string | null
          event_id: string | null
          id: string
          image_url: string | null
          impression_count: number
          is_global: boolean
          max_impressions: number | null
          position: string | null
          sort_order: number | null
          start_date: string | null
          title: string
          type: Database["public"]["Enums"]["ad_placement_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          click_url?: string | null
          config?: Json | null
          content?: string | null
          created_at?: string
          end_date?: string | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_global?: boolean
          max_impressions?: number | null
          position?: string | null
          sort_order?: number | null
          start_date?: string | null
          title: string
          type: Database["public"]["Enums"]["ad_placement_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          click_url?: string | null
          config?: Json | null
          content?: string | null
          created_at?: string
          end_date?: string | null
          event_id?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number
          is_global?: boolean
          max_impressions?: number | null
          position?: string | null
          sort_order?: number | null
          start_date?: string | null
          title?: string
          type?: Database["public"]["Enums"]["ad_placement_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_placements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          reading_time: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          reading_time?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          reading_time?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          event_id: string | null
          id: string
          max_uses: number | null
          min_order_amount: number | null
          updated_at: string
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          id?: string
          max_uses?: number | null
          min_order_amount?: number | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          color: string
          created_at: string
          display_name: string
          id: string
          is_system: boolean
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_name: string
          id?: string
          is_system?: boolean
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          display_name?: string
          id?: string
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_series: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          slug: string
          sort_order: number | null
          status: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          slug: string
          sort_order?: number | null
          status?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          slug?: string
          sort_order?: number | null
          status?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          city: string | null
          created_at: string
          date: string | null
          description: string | null
          end_time: string | null
          highlight: boolean | null
          id: string
          image_url: string | null
          info_sections: Json | null
          location_address: string | null
          location_name: string | null
          open_air: boolean | null
          series_id: string | null
          service_fee_enabled: boolean | null
          service_fee_type: string | null
          service_fee_value: number | null
          service_fee_vat: number | null
          slug: string
          sold_out: boolean | null
          sort_order: number | null
          status: string | null
          subtitle: string | null
          tag: string | null
          ticket_link: string | null
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          highlight?: boolean | null
          id?: string
          image_url?: string | null
          info_sections?: Json | null
          location_address?: string | null
          location_name?: string | null
          open_air?: boolean | null
          series_id?: string | null
          service_fee_enabled?: boolean | null
          service_fee_type?: string | null
          service_fee_value?: number | null
          service_fee_vat?: number | null
          slug: string
          sold_out?: boolean | null
          sort_order?: number | null
          status?: string | null
          subtitle?: string | null
          tag?: string | null
          ticket_link?: string | null
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          end_time?: string | null
          highlight?: boolean | null
          id?: string
          image_url?: string | null
          info_sections?: Json | null
          location_address?: string | null
          location_name?: string | null
          open_air?: boolean | null
          series_id?: string | null
          service_fee_enabled?: boolean | null
          service_fee_type?: string | null
          service_fee_value?: number | null
          service_fee_vat?: number | null
          slug?: string
          sold_out?: boolean | null
          sort_order?: number | null
          status?: string | null
          subtitle?: string | null
          tag?: string | null
          ticket_link?: string | null
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "event_series"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_list_members: {
        Row: {
          created_at: string
          id: string
          list_id: string
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_id: string
          subscriber_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_id?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_list_members_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "newsletter_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_list_members_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_lists: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          birth_date: string | null
          city: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          source: string | null
          tags: string[] | null
          unsubscribed: boolean | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source?: string | null
          tags?: string[] | null
          unsubscribed?: boolean | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source?: string | null
          tags?: string[] | null
          unsubscribed?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          birth_date: string | null
          created_at: string
          currency: string
          email: string
          event_id: string | null
          id: string
          items: Json
          mollie_payment_id: string | null
          name: string | null
          paid_at: string | null
          phone: string | null
          redirect_url: string | null
          service_fee: number
          status: string
          stripe_payment_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          currency?: string
          email: string
          event_id?: string | null
          id?: string
          items?: Json
          mollie_payment_id?: string | null
          name?: string | null
          paid_at?: string | null
          phone?: string | null
          redirect_url?: string | null
          service_fee?: number
          status?: string
          stripe_payment_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          currency?: string
          email?: string
          event_id?: string | null
          id?: string
          items?: Json
          mollie_payment_id?: string | null
          name?: string | null
          paid_at?: string | null
          phone?: string | null
          redirect_url?: string | null
          service_fee?: number
          status?: string
          stripe_payment_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      page_contents: {
        Row: {
          content: Json | null
          id: string
          page_key: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json | null
          id?: string
          page_key: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json | null
          id?: string
          page_key?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          created_at: string
          id: string
          left_at: string | null
          page_url: string | null
          referrer: string | null
          referrer_source: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          left_at?: string | null
          page_url?: string | null
          referrer?: string | null
          referrer_source?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          left_at?: string | null
          page_url?: string | null
          referrer?: string | null
          referrer_source?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      pending_invitations: {
        Row: {
          claimed: boolean
          created_at: string
          email: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          claimed?: boolean
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          claimed?: boolean
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted: boolean
          id: string
          permission: string
          role: string
          updated_at: string
        }
        Insert: {
          granted?: boolean
          id?: string
          permission: string
          role: string
          updated_at?: string
        }
        Update: {
          granted?: boolean
          id?: string
          permission?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      scanner_links: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          event_id: string | null
          expires_at: string | null
          id: string
          label: string | null
          token: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          token?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          event_id?: string | null
          expires_at?: string | null
          id?: string
          label?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanner_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          sender_email: string | null
          sender_name: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          sender_type?: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["support_category"]
          created_at: string
          customer_email: string
          customer_name: string | null
          event_id: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          priority: Database["public"]["Enums"]["support_priority"]
          resolved_at: string | null
          source: string | null
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          ticket_number: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          customer_email: string
          customer_name?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          priority?: Database["public"]["Enums"]["support_priority"]
          resolved_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          ticket_number?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          priority?: Database["public"]["Enums"]["support_priority"]
          resolved_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          ticket_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          badge: string | null
          category_group: string | null
          coming_soon: boolean | null
          created_at: string
          currency: string | null
          description: string | null
          event_id: string
          features: string[] | null
          group_size: number | null
          id: string
          internal_only: boolean | null
          name: string
          price: number
          sale_end: string | null
          sale_start: string | null
          sold_out: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category_group?: string | null
          coming_soon?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          event_id: string
          features?: string[] | null
          group_size?: number | null
          id?: string
          internal_only?: boolean | null
          name: string
          price?: number
          sale_end?: string | null
          sale_start?: string | null
          sold_out?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category_group?: string | null
          coming_soon?: boolean | null
          created_at?: string
          currency?: string | null
          description?: string | null
          event_id?: string
          features?: string[] | null
          group_size?: number | null
          id?: string
          internal_only?: boolean | null
          name?: string
          price?: number
          sale_end?: string | null
          sale_start?: string | null
          sold_out?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Relationships: []
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          event_id: string
          holder_email: string | null
          holder_name: string | null
          id: string
          order_id: string
          qr_code: string
          status: string
          ticket_category_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          holder_email?: string | null
          holder_name?: string | null
          id?: string
          order_id: string
          qr_code: string
          status?: string
          ticket_category_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          holder_email?: string | null
          holder_name?: string | null
          id?: string
          order_id?: string
          qr_code?: string
          status?: string
          ticket_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_category_id_fkey"
            columns: ["ticket_category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_event_logs: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          page_url: string | null
          pixel_id: string | null
          provider: string
          test_mode: boolean
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          page_url?: string | null
          pixel_id?: string | null
          provider: string
          test_mode?: boolean
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          page_url?: string | null
          pixel_id?: string | null
          provider?: string
          test_mode?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tracking_event_logs_pixel_id_fkey"
            columns: ["pixel_id"]
            isOneToOne: false
            referencedRelation: "tracking_pixels"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_pixels: {
        Row: {
          config: Json | null
          created_at: string
          enabled: boolean
          id: string
          label: string | null
          pixel_id: string
          provider: string
          test_mode: boolean
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string | null
          pixel_id: string
          provider: string
          test_mode?: boolean
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string | null
          pixel_id?: string
          provider?: string
          test_mode?: boolean
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
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
      ad_placement_type:
        | "banner"
        | "popup"
        | "ticker"
        | "interstitial"
        | "ticket_ad"
      app_role: "admin" | "moderator" | "user" | "scanner"
      support_category:
        | "refund"
        | "support"
        | "job"
        | "collaboration"
        | "location"
        | "influencer"
        | "other"
      support_priority: "low" | "normal" | "high" | "urgent"
      support_status: "open" | "in_progress" | "waiting" | "resolved" | "closed"
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
      ad_placement_type: [
        "banner",
        "popup",
        "ticker",
        "interstitial",
        "ticket_ad",
      ],
      app_role: ["admin", "moderator", "user", "scanner"],
      support_category: [
        "refund",
        "support",
        "job",
        "collaboration",
        "location",
        "influencer",
        "other",
      ],
      support_priority: ["low", "normal", "high", "urgent"],
      support_status: ["open", "in_progress", "waiting", "resolved", "closed"],
    },
  },
} as const
