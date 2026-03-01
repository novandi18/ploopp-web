export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  is_anonymous: boolean;
  created_at: number; // Unix timestamp
}

export type VisibilityType = "PUBLIC" | "PRIVATE";

export interface Drop {
  drop_id: string; // Document ID
  creator_id: string;
  visibility_type: VisibilityType;
  allowed_users: string[]; // empty or ["*"] for PUBLIC, specific UIDs for PRIVATE
  geohash: string; // 7-character precision
  latitude: number;
  longitude: number;
  title_hint: string;
  is_guest_post: boolean;
  expires_at: number; // Unix timestamp
  created_at: number; // Unix timestamp
  requires_password?: boolean; // True if password is set, false if open to public instantly
  // Optional playful UI properties
  color_theme?: string;
  popped_count?: number;
}

export interface DropContent {
  drop_id: string; // Matches 'drops' document ID
  encrypted_data: string; // Base64 AES-GCM output
  key_hash: string; // SHA-256 of the password
  burn_after_reading: boolean;
  content_type?: "text" | "image";
  file_url?: string;
}
