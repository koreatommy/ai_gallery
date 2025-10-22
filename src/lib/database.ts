import { supabase } from './supabase';
import type { Image, Category, Comment, Like } from '@/types';

// 환경 변수 체크 함수
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://dummy.supabase.co';
};

// 카테고리 관련 함수들
export const categoryService = {
  async getAll(): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase가 설정되지 않았습니다. 빈 카테고리 목록을 반환합니다.');
      return [];
    }
    
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
    if (!isSupabaseConfigured()) {
      console.warn('Supabase가 설정되지 않았습니다. 빈 이미지 목록을 반환합니다.');
      return [];
    }
    
    const { data, error } = await supabase
      .from('image_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  },

  async getTotalCount(): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }
    
    const { count, error } = await supabase
      .from('image_stats')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  },

  async getCategoryImageCounts(): Promise<{ [categoryId: string]: number }> {
    if (!isSupabaseConfigured()) {
      return {};
    }
    
    const { data, error } = await supabase
      .from('image_stats')
      .select('category_id')
      .not('category_id', 'is', null);
    
    if (error) throw error;
    
    // 카테고리별 개수 계산
    const counts: { [categoryId: string]: number } = {};
    data?.forEach(item => {
      if (item.category_id) {
        counts[item.category_id] = (counts[item.category_id] || 0) + 1;
      }
    });
    
    return counts;
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

  async getCategoryCount(categoryId: string): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }
    
    const { count, error } = await supabase
      .from('image_stats')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);
    
    if (error) throw error;
    return count || 0;
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

  async getSearchCount(query: string): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }
    
    const { count, error } = await supabase
      .from('image_stats')
      .select('*', { count: 'exact', head: true })
      .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
    
    if (error) throw error;
    return count || 0;
  },

  async getTopLiked(limit = 3): Promise<Image[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase가 설정되지 않았습니다. 빈 이미지 목록을 반환합니다.');
      return [];
    }
    
    try {
      console.log('인기 이미지 조회 시작...');
      
      // 먼저 image_stats 뷰에서 조회 시도
      let { data, error } = await supabase
        .from('image_stats')
        .select('*')
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false }) // 좋아요 수가 같으면 최신순
        .limit(limit);
      
      // image_stats 뷰가 없는 경우 images 테이블에서 직접 조회
      if (error && (error.code === 'PGRST116' || error.message?.includes('relation "image_stats" does not exist'))) {
        console.warn('image_stats 뷰가 없습니다. images 테이블에서 직접 조회합니다.');
        
        const { data: imagesData, error: imagesError } = await supabase
          .from('images')
          .select(`
            *,
            categories(name)
          `)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (imagesError) {
          console.error('images 테이블 조회 실패:', imagesError);
          throw imagesError;
        }
        
        // 좋아요 수를 포함한 데이터로 변환
        const imagesWithStats = await Promise.all(
          (imagesData || []).map(async (image) => {
            const likesCount = await likeService.getCount(image.id);
            return {
              ...image,
              likes_count: likesCount,
              comments_count: 0, // 기본값
              category_name: image.categories?.name || null
            };
          })
        );
        
        // 좋아요 수로 정렬
        imagesWithStats.sort((a, b) => b.likes_count - a.likes_count);
        
        console.log('images 테이블에서 조회 성공:', imagesWithStats.length, '개');
        return imagesWithStats.slice(0, limit);
      }
      
      if (error) {
        console.error('인기 이미지 조회 실패:', error);
        console.error('에러 코드:', error.code);
        console.error('에러 메시지:', error.message);
        console.error('에러 세부사항:', error.details);
        console.error('에러 힌트:', error.hint);
        
        // 네트워크 에러인 경우 빈 배열 반환
        if (error.message?.includes('fetch failed') || error.message?.includes('network')) {
          console.warn('네트워크 연결 문제로 인해 빈 배열을 반환합니다.');
          return [];
        }
        
        throw error;
      }
      
      console.log('인기 이미지 조회 성공:', data?.length || 0, '개');
      return data || [];
    } catch (error) {
      console.error('getTopLiked 에러:', error);
      console.error('에러 타입:', typeof error);
      console.error('에러 메시지:', error instanceof Error ? error.message : '알 수 없는 에러');
      
      // 네트워크 에러나 연결 실패인 경우 빈 배열 반환
      if (error instanceof Error && (
        error.message.includes('fetch failed') || 
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND')
      )) {
        console.warn('네트워크 연결 문제로 인해 빈 배열을 반환합니다.');
        return [];
      }
      
      throw error;
    }
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
  async toggle(imageId: string, userId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase가 설정되지 않았습니다. 좋아요 기능을 사용할 수 없습니다.');
      return false;
    }

    // userId가 없으면 임시 ID 사용 (서버 사이드용)
    const finalUserId = userId || 'temp-user-' + Date.now();

    try {
      // 기존 좋아요 확인
      const { data: existing, error: selectError } = await supabase
        .from('likes')
        .select('id')
        .eq('image_id', imageId)
        .eq('user_id', finalUserId)
        .maybeSingle();

      if (selectError) {
        console.error('좋아요 조회 실패:', selectError);
        throw selectError;
      }

      if (existing) {
        // 좋아요 제거
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existing.id);
        
        if (deleteError) {
          console.error('좋아요 삭제 실패:', deleteError);
          throw deleteError;
        }
        return false;
      } else {
        // 좋아요 추가
        const { error: insertError } = await supabase
          .from('likes')
          .insert({ image_id: imageId, user_id: finalUserId });
        
        if (insertError) {
          console.error('좋아요 추가 실패:', insertError);
          throw insertError;
        }
        return true;
      }
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      throw error;
    }
  },

  async getCount(imageId: string): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('image_id', imageId);
      
      if (error) {
        console.error('좋아요 카운트 조회 실패:', error);
        throw error;
      }
      return count || 0;
    } catch (error) {
      console.error('좋아요 카운트 조회 실패:', error);
      return 0;
    }
  },

  async isLiked(imageId: string, userId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const finalUserId = userId || 'temp-user-' + Date.now();

    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('image_id', imageId)
        .eq('user_id', finalUserId)
        .maybeSingle();
      
      if (error) {
        console.error('좋아요 상태 조회 실패:', error);
        return false;
      }
      return !!data;
    } catch (error) {
      console.error('좋아요 상태 조회 실패:', error);
      return false;
    }
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
  },

  // 관리자용 함수들
  async getAll(limit = 50, offset = 0): Promise<Comment[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase가 설정되지 않았습니다. 빈 댓글 목록을 반환합니다.');
      return [];
    }
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        images!inner(title, thumbnail_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  },

  async getRecent(limit = 10): Promise<Comment[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase가 설정되지 않았습니다. 빈 댓글 목록을 반환합니다.');
      return [];
    }
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        images!inner(title, thumbnail_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  async getTotalCount(): Promise<number> {
    if (!isSupabaseConfigured()) {
      return 0;
    }
    
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  }
};

// 사이트 설정 관련 함수들
export const siteSettingsService = {
  async get(key: string): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase가 설정되지 않았습니다. 기본값을 반환합니다.');
      return null;
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      console.error('사이트 설정 조회 실패:', error);
      return null;
    }
    
    return data?.value || null;
  },

  async set(key: string, value: string, description?: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase가 설정되지 않았습니다. 설정을 저장할 수 없습니다.');
      return;
    }

    try {
      console.log('사이트 설정 저장 시도:', { key, value, description });
      
      // 먼저 기존 레코드가 있는지 확인
      const { data: existing, error: selectError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

      if (selectError) {
        console.error('사이트 설정 조회 실패:', selectError);
        throw selectError;
      }

      console.log('기존 레코드 확인:', existing);

      if (existing) {
        // 기존 레코드 업데이트
        console.log('기존 레코드 업데이트 시도');
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({ 
            value, 
            description,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);
        
        if (updateError) {
          console.error('사이트 설정 업데이트 실패:', updateError);
          throw updateError;
        }
        console.log('사이트 설정 업데이트 성공');
      } else {
        // 새 레코드 삽입
        console.log('새 레코드 삽입 시도');
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert({ 
            key, 
            value, 
            description
          });
        
        if (insertError) {
          console.error('사이트 설정 삽입 실패:', insertError);
          throw insertError;
        }
        console.log('사이트 설정 삽입 성공');
      }
    } catch (error) {
      console.error('사이트 설정 저장 실패:', error);
      throw error;
    }
  },

  async getAll(): Promise<{ [key: string]: string }> {
    if (!isSupabaseConfigured()) {
      return {};
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value');
    
    if (error) {
      console.error('사이트 설정 전체 조회 실패:', error);
      return {};
    }
    
    const settings: { [key: string]: string } = {};
    data?.forEach(item => {
      settings[item.key] = item.value;
    });
    
    return settings;
  }
};