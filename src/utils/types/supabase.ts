export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;                     // Corresponds to the "id" field in the profiles model
          auth_user_id: string;           // Corresponds to "auth_user_id" in the profiles model
          username: string | null;        // Corresponds to "username" in the profiles model
          full_name: string | null;       // Corresponds to "full_name" in the profiles model
          email: string | null;           // Corresponds to "email" in the profiles model
          avatar_url: string | null;      // Corresponds to "avatar_url" in the profiles model
          stripe_customer_id: string | null; // Corresponds to "stripe_customer_id" in the profiles model
        };
        Insert: {
          id?: string;                    // Allow optional for insertion if auto-generated
          auth_user_id: string;           // Required during insertion
          username?: string | null;       // Optional on insert
          full_name?: string | null;      // Optional on insert
          email?: string | null;          // Optional on insert
          avatar_url?: string | null;     // Optional on insert
          stripe_customer_id?: string | null; // Optional on insert
        };
        Update: {
          id?: string;                    // Allow optional for updates
          auth_user_id?: string;          // Optional on updates
          username?: string | null;       // Optional on updates
          full_name?: string | null;      // Optional on updates
          email?: string | null;          // Optional on updates
          avatar_url?: string | null;     // Optional on updates
          stripe_customer_id?: string | null; // Optional on updates
        };
        Relationships: [
          {
            foreignKeyName: "profiles_stripe_customer_id_fkey";
            columns: ["stripe_customer_id"];    // The foreign key column in profiles
            isOneToOne: true;                   // One-to-one relationship with subscriptions
            referencedRelation: "subscriptions"; // The referenced relation
            referencedColumns: ["stripe_customer_id"]; // The referenced column in subscriptions
          }
        ];
      };
      subscriptions: {
        Row: {
          stripe_customer_id: string;       // Corresponds to "stripe_customer_id" in the subscriptions model
          created_at: string;               // Corresponds to "created_at" in the subscriptions model
          email: string | null;             // Corresponds to "email" in the subscriptions model
          end_at: string | null;            // Corresponds to "end_at" in the subscriptions model
          stripe_subscription_id?: string | null;   // Corresponds to "stripe_subscription_id" in the subscriptions model
        };
        Insert: {
          stripe_customer_id: string;       // Required during insertion
          created_at?: string;              // Optional during insertion (default: now())
          email?: string | null;            // Optional during insertion
          end_at?: string | null;           // Optional during insertion
          stripe_subscription_id?: string | null;   // Required during insertion
        };
        Update: {
          stripe_customer_id?: string;      // Optional during updates
          created_at?: string;              // Optional during updates
          email?: string | null;            // Optional during updates
          end_at?: string | null;           // Optional during updates
          stripe_subscription_id?: string | null;  // Optional during updates
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_email_fkey";
            columns: ["email"];             // The foreign key column in subscriptions
            isOneToOne: true;               // One-to-one relationship with profiles
            referencedRelation: "profiles"; // The referenced relation
            referencedColumns: ["email"];   // The referenced column in profiles
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
