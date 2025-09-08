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

export interface FooterSection {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FooterLink {
  id: string;
  section_id: string;
  title: string;
  url: string;
  target: '_self' | '_blank';
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface FooterSectionWithLinks extends FooterSection {
  links: FooterLink[];
}