export interface UserProfileData {
  id: string;
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
  slug?: string;
}
