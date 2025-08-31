export interface Image {
  id: string;
  title: string;
  author?: string;
  description?: string;
  url: string;
  thumbnail_url: string;
  tags: string[];
  category_id?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  user_id: string;
  file_name?: string;
  file_size: number;
  width?: number;
  height?: number;
  comments_count?: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  image_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Like {
  id: string;
  image_id: string;
  user_id: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}