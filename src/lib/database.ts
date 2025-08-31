import { supabase } from './supabase';
import type { Image, Category, Comment } from '@/types';

// 카테고리 관련 함수들
export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async create(name: string, description?: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, description })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, name: string, description?: string): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // 해당 카테고리를 사용하는 이미지들을 카테고리 미지정(null)으로 변경
    const { error: updateError } = await supabase
      .from('images')
      .update({ category_id: null })
      .eq('category_id', id);
    
    if (updateError) throw updateError;

    // 카테고리 삭제
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// 이미지 관련 함수들
export const imageService = {
  async getAll(limit = 20, offset = 0): Promise<Image[]> {
    const { data, error } = await supabase
      .from('image_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Image | null> {
    const { data, error } = await supabase
      .from('image_stats')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  },

  async getByCategory(categoryId: string, limit = 20, offset = 0): Promise<Image[]> {
    const { data, error } = await supabase
      .from('image_stats')
      .select('*')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  },

  async search(query: string, limit = 20, offset = 0): Promise<Image[]> {
    const { data, error } = await supabase
      .from('image_stats')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  },

  async getTopLiked(limit = 3): Promise<Image[]> {
    const { data, error } = await supabase
      .from('image_stats')
      .select('*')
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false }) // 좋아요 수가 같으면 최신순
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async create(imageData: {
    title: string;
    author?: string;
    description?: string;
    url: string;
    thumbnail_url: string;
    file_name: string;
    file_size: number;
    width?: number;
    height?: number;
    category_id?: string;
    tags?: string[];
  }): Promise<Image> {
    const { data, error } = await supabase
      .from('images')
      .insert(imageData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Image>): Promise<Image> {
    const { data, error } = await supabase
      .from('images')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('images')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// 좋아요 관련 함수들
export const likeService = {
  async toggle(imageId: string, userId: string = '00000000-0000-0000-0000-000000000000'): Promise<boolean> {
    // 기존 좋아요 확인
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('image_id', imageId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // 좋아요 제거
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      return false;
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('likes')
        .insert({ image_id: imageId, user_id: userId });
      
      if (error) throw error;
      return true;
    }
  },

  async getCount(imageId: string): Promise<number> {
    const { count, error } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('image_id', imageId);
    
    if (error) throw error;
    return count || 0;
  }
};

// 댓글 관련 함수들
export const commentService = {
  async getByImageId(imageId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('image_id', imageId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async create(imageId: string, content: string, userId: string = '00000000-0000-0000-0000-000000000000'): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({ image_id: imageId, content, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};