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
      blockchain_transactions: {
        Row: {
          created_at: string
          hedera_tx_id: string | null
          id: string
          metadata: Json | null
          profile_id: string | null
          status: string
          token_id: string | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hedera_tx_id?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          status?: string
          token_id?: string | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hedera_tx_id?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          status?: string
          token_id?: string | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_transactions_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          kills: number | null
          nft_earned: boolean | null
          profile_id: string | null
          score: number
          session_date: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          kills?: number | null
          nft_earned?: boolean | null
          profile_id?: string | null
          score: number
          session_date?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          kills?: number | null
          nft_earned?: boolean | null
          profile_id?: string | null
          score?: number
          session_date?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      nft_rewards: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          profile_id: string | null
          reward_type: string
          serial_number: number | null
          token_id: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          reward_type: string
          serial_number?: number | null
          token_id: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          reward_type?: string
          serial_number?: number | null
          token_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nft_rewards_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nft_rewards_transaction_id_fkey"
            columns: ["transaction_id"]
            referencedRelation: "blockchain_transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      nfts: {
        Row: {
          collection: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          minted_at: string
          name: string
          owner_address: string
          price: number | null
          rarity: string | null
          token_id: string
        }
        Insert: {
          collection?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          minted_at?: string
          name: string
          owner_address: string
          price?: number | null
          rarity?: string | null
          token_id: string
        }
        Update: {
          collection?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          minted_at?: string
          name?: string
          owner_address?: string
          price?: number | null
          rarity?: string | null
          token_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          hedera_account_id: string | null
          id: string
          rank: number | null
          total_earnings: number | null
          total_nfts: number | null
          updated_at: string
          user_id: string | null
          username: string | null
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          hedera_account_id?: string | null
          id?: string
          rank?: number | null
          total_earnings?: number | null
          total_nfts?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          wallet_address: string
          wallet_type: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          hedera_account_id?: string | null
          id?: string
          rank?: number | null
          total_earnings?: number | null
          total_nfts?: number | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_view: {
        Row: {
          avatar_url: string | null
          games_played: number | null
          rank: number | null
          total_kills: number | null
          total_nfts: number | null
          total_score: number | null
          username: string | null
          wallet_address: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      update_updated_at_column: {
        Args: {}
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
