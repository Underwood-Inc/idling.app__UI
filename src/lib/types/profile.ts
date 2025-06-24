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
}
