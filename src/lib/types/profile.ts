export interface UserProfileData {
  id: string;
  providerAccountId?: string;
  username?: string;
  name?: string;
  bio?: string;
  location?: string;
  email?: string;
  image?: string;
  created_at?: string;
  profile_public?: boolean;
  total_submissions?: number;
  posts_count?: number;
  replies_count?: number;
  last_activity?: Date | null;
  // User preferences
  spacing_theme?: 'cozy' | 'compact';
  pagination_mode?: 'traditional' | 'infinite';
  emoji_panel_behavior?: 'close_after_select' | 'stay_open';
  font_preference?: 'monospace' | 'default';
  // Background settings
  background_movement_direction?: 'static' | 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down';
  background_movement_speed?: 'slow' | 'normal' | 'fast';
  background_animation_layers?: {
    stars: boolean;
    particles: boolean;
    nebula: boolean;
    planets: boolean;
    aurora: boolean;
  };
}
